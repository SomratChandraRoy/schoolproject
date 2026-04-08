import React, { useEffect, useState } from 'react';
import { getCurriculumSubjectsForClass } from '../utils/curriculumSubjects';

interface QuestionGeneratorProps {
    onQuestionGenerated?: (question: any) => void;
}

const QuestionGenerator: React.FC<QuestionGeneratorProps> = ({ onQuestionGenerated }) => {
    const [subject, setSubject] = useState('');
    const [classLevel, setClassLevel] = useState('9');
    const [difficulty, setDifficulty] = useState('medium');
    const [questionType, setQuestionType] = useState('mcq');
    const [loading, setLoading] = useState(false);
    const [generatedQuestion, setGeneratedQuestion] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const subjects = getCurriculumSubjectsForClass(parseInt(classLevel, 10));

    useEffect(() => {
        if (subject && !subjects.some((item) => item.code === subject)) {
            setSubject('');
        }
    }, [classLevel, subject, subjects]);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        setGeneratedQuestion(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch('http://localhost:8000/api/ai/generate-question/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`,
                },
                body: JSON.stringify({
                    subject,
                    class_level: parseInt(classLevel),
                    difficulty,
                    question_type: questionType,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate question');
            }

            const data = await response.json();
            setGeneratedQuestion(data);

            if (onQuestionGenerated) {
                onQuestionGenerated(data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate question');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                AI Question Generator
            </h2>

            <div className="space-y-4">
                {/* Subject Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Subject
                    </label>
                    <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Select a subject</option>
                        {subjects.map((sub) => (
                            <option key={sub.code} value={sub.code}>
                                {sub.bengaliName} ({sub.name})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Class Level */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Class Level
                    </label>
                    <select
                        value={classLevel}
                        onChange={(e) => setClassLevel(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {[6, 7, 8, 9, 10, 11, 12].map((level) => (
                            <option key={level} value={level}>
                                Class {level}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Difficulty */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Difficulty
                    </label>
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                </div>

                {/* Question Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Question Type
                    </label>
                    <select
                        value={questionType}
                        onChange={(e) => setQuestionType(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="mcq">Multiple Choice (MCQ)</option>
                        <option value="short">Short Answer</option>
                        <option value="long">Long Answer</option>
                    </select>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={loading || !subject}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                        </span>
                    ) : (
                        'Generate Question'
                    )}
                </button>

                {/* Error Display */}
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                {/* Generated Question Display */}
                {generatedQuestion && (
                    <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                            Generated Question
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Question:</p>
                                <p className="text-gray-800 dark:text-white">{generatedQuestion.question_text}</p>
                            </div>

                            {generatedQuestion.options && Object.keys(generatedQuestion.options).length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Options:</p>
                                    <div className="space-y-2">
                                        {Object.entries(generatedQuestion.options).map(([key, value]) => (
                                            <div key={key} className="flex items-start">
                                                <span className="font-medium text-gray-700 dark:text-gray-300 mr-2">{key}.</span>
                                                <span className="text-gray-800 dark:text-white">{value as string}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Correct Answer:</p>
                                <p className="text-green-600 dark:text-green-400 font-medium">{generatedQuestion.correct_answer}</p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Explanation:</p>
                                <p className="text-gray-700 dark:text-gray-300">{generatedQuestion.explanation}</p>
                            </div>

                            <div className="pt-4 border-t border-gray-300 dark:border-gray-600">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Subject: {generatedQuestion.subject} | Class: {generatedQuestion.class_target} | Difficulty: {generatedQuestion.difficulty}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestionGenerator;
