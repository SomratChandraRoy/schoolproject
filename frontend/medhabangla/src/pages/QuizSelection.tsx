import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

interface Subject {
    id: number;
    name: string;
    bengali_title: string;
    subject_code: string;
    class_level: number;
    stream: string | null;
    is_compulsory: boolean;
    icon: string;
    color: string;
    description: string;
}

const QuizSelection: React.FC = () => {
    const navigate = useNavigate();
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('medium');
    const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>(['mcq']); // Default to MCQ
    const [userClass, setUserClass] = useState<number>(9);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [userFavSubjects, setUserFavSubjects] = useState<string[]>([]);

    const difficulties = [
        { id: 'easy', name: 'Easy', description: 'Perfect for beginners', color: 'bg-green-500' },
        { id: 'medium', name: 'Medium', description: 'Standard difficulty', color: 'bg-yellow-500' },
        { id: 'hard', name: 'Hard', description: 'Challenge yourself', color: 'bg-red-500' }
    ];

    const questionTypes = [
        {
            id: 'mcq',
            name: 'MCQ',
            bengaliName: 'বহুনির্বাচনী',
            description: 'Multiple choice questions',
            icon: '✓',
            color: 'bg-blue-100 dark:bg-blue-900/30'
        },
        {
            id: 'short',
            name: 'Short Answer',
            bengaliName: 'সংক্ষিপ্ত উত্তর',
            description: 'Brief written answers',
            icon: '✍️',
            color: 'bg-green-100 dark:bg-green-900/30'
        },
        {
            id: 'long',
            name: 'Long Answer',
            bengaliName: 'বিস্তারিত উত্তর',
            description: 'Detailed explanations',
            icon: '📝',
            color: 'bg-purple-100 dark:bg-purple-900/30'
        }
    ];

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            // Get user data from localStorage
            const userStr = localStorage.getItem('user');
            let classLevel = 9;

            if (userStr) {
                const user = JSON.parse(userStr);
                if (user.class_level) {
                    classLevel = user.class_level;
                    setUserClass(classLevel);
                }
                if (user.fav_subjects) {
                    setUserFavSubjects(user.fav_subjects);
                }
            }

            // Fetch subjects from API
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/quizzes/subjects/?class_level=${classLevel}`, {
                headers: {
                    'Authorization': `Token ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSubjects(data.subjects);
            } else {
                console.error('Failed to fetch subjects');
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSubject = (subjectCode: string) => {
        setSelectedSubjects(prev =>
            prev.includes(subjectCode)
                ? prev.filter(code => code !== subjectCode)
                : [...prev, subjectCode]
        );
    };

    const toggleQuestionType = (typeId: string) => {
        setSelectedQuestionTypes(prev =>
            prev.includes(typeId)
                ? prev.filter(id => id !== typeId)
                : [...prev, typeId]
        );
    };

    const handleStartQuiz = () => {
        if (selectedSubjects.length === 0) {
            alert('Please select at least one subject');
            return;
        }

        if (selectedQuestionTypes.length === 0) {
            alert('Please select at least one question type');
            return;
        }

        navigate('/quiz', {
            state: {
                subjects: selectedSubjects,
                difficulty: selectedDifficulty,
                classLevel: userClass,
                questionTypes: selectedQuestionTypes
            }
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        🎯 Start Your Quiz
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Select subjects and difficulty level to begin your personalized quiz experience
                    </p>
                    <div className="mt-4 inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        <span className="font-semibold">Class {userClass}</span>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                📚 Select Subjects
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                Choose one or more subjects for your quiz (showing subjects for Class {userClass})
                            </p>

                            {/* Compulsory Subjects */}
                            {subjects.filter(s => s.is_compulsory).length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                        📌 Compulsory Subjects
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {subjects.filter(s => s.is_compulsory).map(subject => (
                                            <button
                                                key={subject.id}
                                                onClick={() => toggleSubject(subject.subject_code)}
                                                className={`p-6 rounded-lg border-2 transition-all transform hover:scale-105 ${selectedSubjects.includes(subject.subject_code)
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                                    } ${subject.color} dark:${subject.color.replace('100', '900')}`}
                                            >
                                                <div className="text-4xl mb-2">{subject.icon}</div>
                                                <div className="font-semibold text-gray-900 dark:text-white text-sm">
                                                    {subject.name}
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                    {subject.bengali_title}
                                                </div>
                                                {selectedSubjects.includes(subject.subject_code) && (
                                                    <div className="mt-2">
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500 text-white">
                                                            ✓ Selected
                                                        </span>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Stream-based Subjects */}
                            {['Science', 'Humanities', 'Business'].map(stream => {
                                const streamSubjects = subjects.filter(s => s.stream === stream);
                                if (streamSubjects.length === 0) return null;

                                return (
                                    <div key={stream} className="mb-8">
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                            {stream === 'Science' && '🔬 Science Stream'}
                                            {stream === 'Humanities' && '📜 Humanities Stream'}
                                            {stream === 'Business' && '💼 Business Stream'}
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {streamSubjects.map(subject => (
                                                <button
                                                    key={subject.id}
                                                    onClick={() => toggleSubject(subject.subject_code)}
                                                    className={`p-6 rounded-lg border-2 transition-all transform hover:scale-105 ${selectedSubjects.includes(subject.subject_code)
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                                        } ${subject.color} dark:${subject.color.replace('100', '900')}`}
                                                >
                                                    <div className="text-4xl mb-2">{subject.icon}</div>
                                                    <div className="font-semibold text-gray-900 dark:text-white text-sm">
                                                        {subject.name}
                                                    </div>
                                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                        {subject.bengali_title}
                                                    </div>
                                                    {selectedSubjects.includes(subject.subject_code) && (
                                                        <div className="mt-2">
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500 text-white">
                                                                ✓ Selected
                                                            </span>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                🎚️ Select Difficulty
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {difficulties.map(difficulty => (
                                    <button
                                        key={difficulty.id}
                                        onClick={() => setSelectedDifficulty(difficulty.id)}
                                        className={`p-6 rounded-lg border-2 transition-all ${selectedDifficulty === difficulty.id
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                            }`}
                                    >
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                            {difficulty.name}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {difficulty.description}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                📝 Select Question Types
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                Choose one or more question types for your quiz
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {questionTypes.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => toggleQuestionType(type.id)}
                                        className={`p-6 rounded-lg border-2 transition-all transform hover:scale-105 ${selectedQuestionTypes.includes(type.id)
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                            }`}
                                    >
                                        <div className="text-4xl mb-3">{type.icon}</div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                            {type.name}
                                        </h3>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {type.bengaliName}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            {type.description}
                                        </p>
                                        {selectedQuestionTypes.includes(type.id) && (
                                            <div className="mt-3">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500 text-white">
                                                    ✓ Selected
                                                </span>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 text-2xl">💡</div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            <span className="font-semibold">Tip:</span> You can select multiple question types to practice different formats in one quiz!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <div className="flex justify-center space-x-4">
                    <Link
                        to="/dashboard"
                        className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        ← Back
                    </Link>
                    <button
                        onClick={handleStartQuiz}
                        disabled={selectedSubjects.length === 0}
                        className={`px-8 py-3 rounded-lg font-bold text-white transition-all ${selectedSubjects.length === 0
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 shadow-lg'
                            }`}
                    >
                        Start Quiz →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuizSelection;
