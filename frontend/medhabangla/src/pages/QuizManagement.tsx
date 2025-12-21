import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

const QuizManagement: React.FC = () => {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        subject: 'math',
        class_target: 9,
        difficulty: 'medium',
        question_text: '',
        question_type: 'mcq',
        options: {},
        correct_answer: '',
        explanation: ''
    });

    // AI Generation state
    const [aiParams, setAiParams] = useState({
        subject: 'math',
        class_level: 9,
        difficulty: 'medium',
        question_type: 'mcq'
    });
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/quizzes/', {
                headers: {
                    'Authorization': `Token ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setQuizzes(data);
            }
        } catch (error) {
            console.error('Error fetching quizzes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateQuiz = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/quizzes/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                setShowCreateModal(false);
                fetchQuizzes();
                // Reset form
                setFormData({
                    subject: 'math',
                    class_target: 9,
                    difficulty: 'medium',
                    question_text: '',
                    question_type: 'mcq',
                    options: {},
                    correct_answer: '',
                    explanation: ''
                });
            } else {
                alert('Failed to create quiz');
            }
        } catch (error) {
            console.error('Error creating quiz:', error);
        }
    };

    const handleDeleteQuiz = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this quiz?')) return;
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/quizzes/${id}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Token ${token}`
                }
            });
            
            if (response.ok) {
                setQuizzes(quizzes.filter(q => q.id !== id));
            } else {
                alert('Failed to delete quiz');
            }
        } catch (error) {
            console.error('Error deleting quiz:', error);
        }
    };

    const handleGenerateAiQuestion = async () => {
        setAiLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/ai/generate-quiz/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify(aiParams)
            });
            
            if (response.ok) {
                const data = await response.json();
                // Populate form with generated data
                setFormData({
                    ...formData,
                    question_text: data.question,
                    options: data.options || {},
                    correct_answer: data.correct_answer,
                    explanation: data.explanation || '',
                    subject: aiParams.subject,
                    class_target: aiParams.class_level,
                    difficulty: aiParams.difficulty,
                    question_type: aiParams.question_type
                });
                setShowAiModal(false);
                setShowCreateModal(true);
            } else {
                alert('Failed to generate question');
            }
        } catch (error) {
            console.error('Error generating question:', error);
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quiz Management</h1>
                    <div className="space-x-4">
                        <button
                            onClick={() => setShowAiModal(true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
                        >
                            ✨ Generate with AI
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                        >
                            + Create Quiz
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-8">Loading...</div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {quizzes.map((quiz) => (
                                <li key={quiz.id} className="px-6 py-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                            {quiz.question_text.substring(0, 100)}...
                                        </h3>
                                        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            {quiz.subject} • Class {quiz.class_target} • {quiz.difficulty}
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleDeleteQuiz(quiz.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-4 dark:text-white">Create New Quiz Question</h2>
                            <form onSubmit={handleCreateQuiz} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium dark:text-gray-300">Subject</label>
                                        <select
                                            value={formData.subject}
                                            onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                            className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="math">Math</option>
                                            <option value="physics">Physics</option>
                                            <option value="chemistry">Chemistry</option>
                                            <option value="biology">Biology</option>
                                            <option value="english">English</option>
                                            <option value="bangla">Bangla</option>
                                            <option value="ict">ICT</option>
                                            <option value="general_knowledge">General Knowledge</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium dark:text-gray-300">Class</label>
                                        <select
                                            value={formData.class_target}
                                            onChange={(e) => setFormData({...formData, class_target: parseInt(e.target.value)})}
                                            className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            {[6, 7, 8, 9, 10, 11, 12].map(c => (
                                                <option key={c} value={c}>Class {c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium dark:text-gray-300">Question Text</label>
                                    <textarea
                                        value={formData.question_text}
                                        onChange={(e) => setFormData({...formData, question_text: e.target.value})}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        rows={3}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium dark:text-gray-300">Correct Answer</label>
                                    <input
                                        type="text"
                                        value={formData.correct_answer}
                                        onChange={(e) => setFormData({...formData, correct_answer: e.target.value})}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        required
                                    />
                                </div>

                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* AI Modal */}
                {showAiModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                            <h2 className="text-2xl font-bold mb-4 dark:text-white">Generate with AI</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium dark:text-gray-300">Subject</label>
                                    <select
                                        value={aiParams.subject}
                                        onChange={(e) => setAiParams({...aiParams, subject: e.target.value})}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="math">Math</option>
                                        <option value="physics">Physics</option>
                                        <option value="chemistry">Chemistry</option>
                                        <option value="biology">Biology</option>
                                        <option value="english">English</option>
                                        <option value="bangla">Bangla</option>
                                        <option value="ict">ICT</option>
                                        <option value="general_knowledge">General Knowledge</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium dark:text-gray-300">Class</label>
                                    <select
                                        value={aiParams.class_level}
                                        onChange={(e) => setAiParams({...aiParams, class_level: parseInt(e.target.value)})}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        {[6, 7, 8, 9, 10, 11, 12].map(c => (
                                            <option key={c} value={c}>Class {c}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        onClick={() => setShowAiModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleGenerateAiQuestion}
                                        disabled={aiLoading}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                                    >
                                        {aiLoading ? 'Generating...' : 'Generate'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizManagement;
