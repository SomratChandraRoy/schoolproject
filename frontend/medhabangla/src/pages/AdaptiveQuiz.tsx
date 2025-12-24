import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

interface Question {
    id: number;
    question_text: string;
    question_type: string;
    options: { [key: string]: string };
    difficulty: string;
    subject: string;
    class_target: number;
}

interface Progress {
    status: string;
    static_completed: number;
    total_static: number;
    completion_percentage: number;
    current_difficulty: string;
    ai_questions_answered: number;
    ai_questions_correct: number;
}

const AdaptiveQuiz: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [questionSource, setQuestionSource] = useState<'static' | 'ai'>('static');
    const [progress, setProgress] = useState<Progress | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string>('');
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [explanation, setExplanation] = useState('');
    const [quizComplete, setQuizComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { subject, classLevel, questionType } = location.state || {};

    useEffect(() => {
        if (!subject || !classLevel) {
            setError('Missing quiz parameters');
            setLoading(false);
            return;
        }
        initializeQuiz();
    }, []);

    const initializeQuiz = async () => {
        try {
            const token = localStorage.getItem('token');

            // Start quiz session
            const startResponse = await fetch('/api/quizzes/adaptive/start/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({
                    subject,
                    class_level: classLevel,
                    question_type: questionType || 'mcq'
                })
            });

            if (!startResponse.ok) {
                throw new Error('Failed to start quiz session');
            }

            const startData = await startResponse.json();
            setProgress(startData.progress);

            // Get first question
            await getNextQuestion();
        } catch (err) {
            console.error('Error initializing quiz:', err);
            setError('Failed to initialize quiz');
        } finally {
            setLoading(false);
        }
    };

    const getNextQuestion = async () => {
        try {
            const token = localStorage.getItem('token');

            const response = await fetch('/api/quizzes/adaptive/next/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({
                    subject,
                    class_level: classLevel,
                    question_type: questionType || 'mcq'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get next question');
            }

            const data = await response.json();

            if (data.message && data.message.includes('completed')) {
                setQuizComplete(true);
                return;
            }

            setCurrentQuestion(data.question);
            setQuestionSource(data.source);
            setProgress(data.progress);
            setSelectedAnswer('');
            setShowResult(false);
        } catch (err) {
            console.error('Error getting next question:', err);
            setError('Failed to load next question');
        }
    };

    const submitAnswer = async () => {
        if (!selectedAnswer || !currentQuestion) return;

        try {
            const token = localStorage.getItem('token');

            const response = await fetch('/api/quizzes/adaptive/submit/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({
                    question_id: currentQuestion.id,
                    answer: selectedAnswer,
                    source: questionSource,
                    subject,
                    class_level: classLevel
                })
            });

            if (!response.ok) {
                throw new Error('Failed to submit answer');
            }

            const data = await response.json();
            setIsCorrect(data.is_correct);
            setCorrectAnswer(data.correct_answer);
            setExplanation(data.explanation);
            setProgress(data.progress);
            setShowResult(true);
        } catch (err) {
            console.error('Error submitting answer:', err);
            setError('Failed to submit answer');
        }
    };

    const handleNext = () => {
        getNextQuestion();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">Loading adaptive quiz...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Navbar />
                <div className="max-w-3xl mx-auto py-12 px-4">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                        <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Error</h2>
                        <p className="text-red-600 dark:text-red-300">{error}</p>
                        <Link
                            to="/quiz/select"
                            className="mt-4 inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                        >
                            Back to Quiz Selection
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (quizComplete) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Navbar />
                <div className="max-w-3xl mx-auto py-12 px-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
                        <div className="text-6xl mb-4">🎉</div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            Quiz Complete!
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                            Great job! You've completed all available questions.
                        </p>
                        {progress && (
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Static Questions</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {progress.static_completed}/{progress.total_static}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">AI Questions</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {progress.ai_questions_correct}/{progress.ai_questions_answered}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex gap-4 justify-center">
                            <Link
                                to="/dashboard"
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                            >
                                Back to Dashboard
                            </Link>
                            <Link
                                to="/quiz/select"
                                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg"
                            >
                                Try Another Quiz
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentQuestion) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-300">No questions available</p>
                </div>
            </div>
        );
    }

    const options = currentQuestion.options;
    const optionKeys = Object.keys(options);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />
            <div className="max-w-3xl mx-auto py-12 px-4">
                {/* Progress Header */}
                {progress && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {subject} - Class {classLevel}
                                </h2>
                                <div className="flex gap-2 mt-2">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${questionSource === 'ai'
                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                        }`}>
                                        {questionSource === 'ai' ? '🤖 AI Question' : '📚 Static Question'}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${progress.current_difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                            progress.current_difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        }`}>
                                        {progress.current_difficulty.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Progress</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {progress.completion_percentage.toFixed(0)}%
                                </p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                            <div
                                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${progress.completion_percentage}%` }}
                            ></div>
                        </div>

                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
                            <span>Static: {progress.static_completed}/{progress.total_static}</span>
                            {progress.ai_questions_answered > 0 && (
                                <span>AI: {progress.ai_questions_correct}/{progress.ai_questions_answered}</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Question Card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        {currentQuestion.question_text}
                    </h3>

                    {/* Options */}
                    <div className="space-y-3 mb-6">
                        {optionKeys.map((key) => (
                            <div
                                key={key}
                                onClick={() => !showResult && setSelectedAnswer(options[key])}
                                className={`p-4 border rounded-lg cursor-pointer transition ${showResult
                                        ? options[key] === correctAnswer
                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                                            : options[key] === selectedAnswer
                                                ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
                                                : 'border-gray-300 dark:border-gray-600'
                                        : selectedAnswer === options[key]
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${showResult
                                            ? options[key] === correctAnswer
                                                ? 'border-green-500 bg-green-500'
                                                : options[key] === selectedAnswer
                                                    ? 'border-red-500 bg-red-500'
                                                    : 'border-gray-400'
                                            : selectedAnswer === options[key]
                                                ? 'border-blue-500 bg-blue-500'
                                                : 'border-gray-400'
                                        }`}>
                                        {showResult && options[key] === correctAnswer && (
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                                            </svg>
                                        )}
                                        {showResult && options[key] === selectedAnswer && options[key] !== correctAnswer && (
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
                                            </svg>
                                        )}
                                        {!showResult && selectedAnswer === options[key] && (
                                            <div className="w-3 h-3 bg-white rounded-full"></div>
                                        )}
                                    </div>
                                    <span className="text-gray-900 dark:text-white">{key}. {options[key]}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Result */}
                    {showResult && (
                        <div className={`p-4 rounded-lg mb-6 ${isCorrect
                                ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                                : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
                            }`}>
                            <p className={`font-semibold mb-2 ${isCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                                }`}>
                                {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                            </p>
                            {explanation && (
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{explanation}</p>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between">
                        <Link
                            to="/quiz/select"
                            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Exit Quiz
                        </Link>
                        {!showResult ? (
                            <button
                                onClick={submitAnswer}
                                disabled={!selectedAnswer}
                                className={`px-6 py-2 rounded-lg text-white ${selectedAnswer
                                        ? 'bg-blue-600 hover:bg-blue-700'
                                        : 'bg-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                Submit Answer
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                            >
                                Next Question →
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdaptiveQuiz;
