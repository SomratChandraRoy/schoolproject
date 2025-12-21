import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

interface Subject {
    id: string;
    name: string;
    icon: string;
    color: string;
}

const QuizSelection: React.FC = () => {
    const navigate = useNavigate();
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('medium');
    const [userClass, setUserClass] = useState<number>(9);
    const [userFavSubjects, setUserFavSubjects] = useState<string[]>([]);
    const [aiRecommendedSubjects, setAiRecommendedSubjects] = useState<string[]>([]);

    const subjects: Subject[] = [
        { id: 'physics', name: 'Physics', icon: '⚛️', color: 'bg-purple-100 dark:bg-purple-900' },
        { id: 'chemistry', name: 'Chemistry', icon: '🧪', color: 'bg-green-100 dark:bg-green-900' },
        { id: 'math', name: 'General Math', icon: '📐', color: 'bg-blue-100 dark:bg-blue-900' },
        { id: 'bangla', name: 'Bangla', icon: '📚', color: 'bg-yellow-100 dark:bg-yellow-900' },
        { id: 'english', name: 'English', icon: '🔤', color: 'bg-red-100 dark:bg-red-900' },
        { id: 'biology', name: 'Biology', icon: '🧬', color: 'bg-teal-100 dark:bg-teal-900' },
        { id: 'ict', name: 'ICT', icon: '💻', color: 'bg-indigo-100 dark:bg-indigo-900' },
        { id: 'general_knowledge', name: 'General Knowledge', icon: '🌍', color: 'bg-orange-100 dark:bg-orange-900' }
    ];

    const difficulties = [
        { id: 'easy', name: 'Easy', description: 'Perfect for beginners', color: 'bg-green-500' },
        { id: 'medium', name: 'Medium', description: 'Standard difficulty', color: 'bg-yellow-500' },
        { id: 'hard', name: 'Hard', description: 'Challenge yourself', color: 'bg-red-500' }
    ];

    useEffect(() => {
        // Get user data from localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.class_level) {
                    setUserClass(user.class_level);
                }
                if (user.fav_subjects) {
                    setUserFavSubjects(user.fav_subjects);
                    // Set AI recommended subjects as favorite subjects
                    setAiRecommendedSubjects(user.fav_subjects);
                }
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
    }, []);

    const toggleSubject = (subjectId: string) => {
        setSelectedSubjects(prev =>
            prev.includes(subjectId)
                ? prev.filter(id => id !== subjectId)
                : [...prev, subjectId]
        );
    };

    const handleStartQuiz = () => {
        if (selectedSubjects.length === 0) {
            alert('Please select at least one subject');
            return;
        }

        navigate('/quiz', {
            state: {
                subjects: selectedSubjects,
                difficulty: selectedDifficulty,
                classLevel: userClass
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

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        📚 Select Subjects
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Choose one or more subjects for your quiz
                    </p>

                    {/* AI Recommendations */}
                    {aiRecommendedSubjects.length > 0 && (
                        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center mb-2">
                                <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                </svg>
                                <h3 className="font-semibold text-blue-800 dark:text-blue-200">AI Recommended for You</h3>
                            </div>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                                Based on your interests and performance, we recommend these subjects:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {aiRecommendedSubjects.map(subjectId => {
                                    const subject = subjects.find(s => s.id === subjectId);
                                    return subject ? (
                                        <button
                                            key={subject.id}
                                            onClick={() => toggleSubject(subject.id)}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:hover:bg-blue-900 transition-colors"
                                        >
                                            {subject.name}
                                        </button>
                                    ) : null;
                                })}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {subjects.map(subject => (
                            <button
                                key={subject.id}
                                onClick={() => toggleSubject(subject.id)}
                                className={`p-6 rounded-lg border-2 transition-all transform hover:scale-105 ${selectedSubjects.includes(subject.id)
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                    } ${subject.color}`}
                            >
                                <div className="text-4xl mb-2">{subject.icon}</div>
                                <div className="font-semibold text-gray-900 dark:text-white text-sm">
                                    {subject.name}
                                </div>
                                {selectedSubjects.includes(subject.id) && (
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
