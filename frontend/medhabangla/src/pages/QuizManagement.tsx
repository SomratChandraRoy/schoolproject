import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

interface Quiz {
    id: number;
    subject: string;
    class_target: number;
    difficulty: string;
    question_text: string;
    question_type: string;
    options: any;
    correct_answer: string;
    explanation: string;
}

// Subject options matching backend model
const SUBJECT_OPTIONS = [
    { value: 'math', label: 'Mathematics' },
    { value: 'higher_math', label: 'Higher Mathematics' },
    { value: 'physics', label: 'Physics' },
    { value: 'chemistry', label: 'Chemistry' },
    { value: 'biology', label: 'Biology' },
    { value: 'science', label: 'General Science' },
    { value: 'bangla_1st', label: 'Bangla 1st Paper' },
    { value: 'bangla_2nd', label: 'Bangla 2nd Paper' },
    { value: 'english_1st', label: 'English 1st Paper' },
    { value: 'english_2nd', label: 'English 2nd Paper' },
    { value: 'ict', label: 'ICT' },
    { value: 'bangladesh_global', label: 'Bangladesh & Global Studies' },
    { value: 'history', label: 'History' },
    { value: 'geography', label: 'Geography' },
    { value: 'civics', label: 'Civics' },
    { value: 'accounting', label: 'Accounting' },
    { value: 'finance', label: 'Finance & Banking' },
    { value: 'business', label: 'Business Entrepreneurship' },
    { value: 'economics', label: 'Economics' },
    { value: 'general_science', label: 'General Science' }
];

// Get subject label from value
const getSubjectLabel = (value: string): string => {
    const subject = SUBJECT_OPTIONS.find(s => s.value === value);
    return subject ? subject.label : value;
};

const QuizManagement: React.FC = () => {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);
    const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);

    // Filter state
    const [filters, setFilters] = useState({
        subject: 'all',
        class_target: 'all',
        question_type: 'all'
    });

    // Form state
    const [formData, setFormData] = useState({
        subject: 'math',
        class_target: 9,
        difficulty: 'medium',
        question_text: '',
        question_type: 'mcq',
        options: {} as Record<string, string>,
        correct_answer: '',
        explanation: ''
    });

    // AI Generation state
    const [aiParams, setAiParams] = useState({
        subject: 'math',
        class_level: 9,
        difficulty: 'medium',
        question_type: 'mcq',
        quantity: 1  // Number of questions to generate
    });
    const [aiLoading, setAiLoading] = useState(false);
    const [aiProgress, setAiProgress] = useState({ current: 0, total: 0 });

    useEffect(() => {
        fetchQuizzes();
    }, []);

    useEffect(() => {
        // Apply filters
        console.log('Applying filters:', filters);
        console.log('Total quizzes before filter:', quizzes.length);

        let filtered = quizzes;

        if (filters.subject !== 'all') {
            filtered = filtered.filter(q => q.subject === filters.subject);
            console.log('After subject filter:', filtered.length);
        }

        if (filters.class_target !== 'all') {
            filtered = filtered.filter(q => q.class_target === parseInt(filters.class_target));
            console.log('After class filter:', filtered.length);
        }

        if (filters.question_type !== 'all') {
            filtered = filtered.filter(q => q.question_type === filters.question_type);
            console.log('After type filter:', filtered.length);
        }

        console.log('Final filtered quizzes:', filtered.length);
        setFilteredQuizzes(filtered);
    }, [quizzes, filters]);

    const fetchQuizzes = async () => {
        try {
            const token = localStorage.getItem('token');

            // Build query params to fetch ALL questions (override default class filter)
            // Send empty class_level to prevent backend from filtering by user's class
            const params = new URLSearchParams();
            params.append('class_level', ''); // Empty to get all classes

            console.log('Fetching all quizzes...');

            const response = await fetch(`/api/quizzes/?${params.toString()}`, {
                headers: {
                    'Authorization': `Token ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                // Handle paginated response
                const questions = data.results || data;
                setQuizzes(Array.isArray(questions) ? questions : []);
                console.log('Fetched quizzes:', questions.length, 'questions');
            } else {
                console.error('Failed to fetch quizzes');
                setQuizzes([]);
            }
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            setQuizzes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateQuiz = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');

            // Prepare data - ensure options is properly formatted
            const submitData = {
                ...formData,
                options: formData.question_type === 'mcq' ? formData.options : {}
            };

            console.log('Creating quiz with data:', submitData);

            const response = await fetch('/api/quizzes/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify(submitData)
            });

            if (response.ok) {
                const createdQuiz = await response.json();
                console.log('Quiz created successfully:', createdQuiz);
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
                alert('Quiz question created successfully!');
            } else {
                const error = await response.json();
                console.error('Failed to create quiz:', error);
                alert(`Failed to create quiz: ${JSON.stringify(error)}`);
            }
        } catch (error) {
            console.error('Error creating quiz:', error);
            alert('Error creating quiz. Please try again.');
        }
    };

    const handleUpdateQuiz = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingQuiz) return;

        try {
            const token = localStorage.getItem('token');

            // Prepare data - ensure options is properly formatted
            const submitData = {
                ...formData,
                options: formData.question_type === 'mcq' ? formData.options : {}
            };

            console.log('Updating quiz with data:', submitData);

            const response = await fetch(`/api/quizzes/${editingQuiz.id}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify(submitData)
            });

            if (response.ok) {
                const updatedQuiz = await response.json();
                console.log('Quiz updated successfully:', updatedQuiz);
                setShowEditModal(false);
                setEditingQuiz(null);
                fetchQuizzes();
                alert('Quiz question updated successfully!');
            } else {
                const error = await response.json();
                console.error('Failed to update quiz:', error);
                alert(`Failed to update quiz: ${JSON.stringify(error)}`);
            }
        } catch (error) {
            console.error('Error updating quiz:', error);
            alert('Error updating quiz. Please try again.');
        }
    };

    const handleEditClick = (quiz: Quiz) => {
        setEditingQuiz(quiz);

        // Parse options if they're in array format from backend
        let optionsObj: Record<string, string> = {};
        if (Array.isArray(quiz.options)) {
            // Convert array like ["A) text", "B) text"] to object
            quiz.options.forEach((opt: string) => {
                const match = opt.match(/^([A-D])\)\s*(.+)$/);
                if (match) {
                    optionsObj[match[1]] = match[2];
                }
            });
        } else if (typeof quiz.options === 'object' && quiz.options !== null) {
            optionsObj = quiz.options;
        }

        console.log('Editing quiz:', quiz);
        console.log('Parsed options:', optionsObj);

        setFormData({
            subject: quiz.subject,
            class_target: quiz.class_target,
            difficulty: quiz.difficulty,
            question_text: quiz.question_text,
            question_type: quiz.question_type,
            options: optionsObj,
            correct_answer: quiz.correct_answer,
            explanation: quiz.explanation || ''
        });
        setShowEditModal(true);
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
                console.log('Quiz deleted successfully');
            } else {
                alert('Failed to delete quiz');
            }
        } catch (error) {
            console.error('Error deleting quiz:', error);
        }
    };

    const handleGenerateAiQuestion = async () => {
        setAiLoading(true);
        setAiProgress({ current: 0, total: aiParams.quantity });

        try {
            const token = localStorage.getItem('token');
            const quantity = aiParams.quantity || 1;

            console.log(`Generating ${quantity} AI question(s) with params:`, aiParams);

            let successCount = 0;
            let failCount = 0;

            // Generate questions one by one
            for (let i = 0; i < quantity; i++) {
                setAiProgress({ current: i + 1, total: quantity });

                try {
                    const response = await fetch('/api/ai/generate-quiz/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Token ${token}`
                        },
                        body: JSON.stringify({
                            subject: aiParams.subject,
                            class_level: aiParams.class_level,
                            difficulty: aiParams.difficulty,
                            question_type: aiParams.question_type
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        console.log(`AI generated question ${i + 1}/${quantity}:`, data);
                        successCount++;
                    } else {
                        const error = await response.json();
                        console.error(`Failed to generate question ${i + 1}:`, error);
                        failCount++;
                    }
                } catch (error) {
                    console.error(`Error generating question ${i + 1}:`, error);
                    failCount++;
                }

                // Small delay between requests to avoid rate limiting
                if (i < quantity - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            // Close modal and refresh list
            setShowAiModal(false);
            fetchQuizzes();

            // Show summary
            if (successCount === quantity) {
                alert(`✅ Successfully generated ${successCount} question(s)!`);
            } else if (successCount > 0) {
                alert(`⚠️ Generated ${successCount} question(s). ${failCount} failed.`);
            } else {
                alert(`❌ Failed to generate questions. Please try again.`);
            }

        } catch (error) {
            console.error('Error in AI generation:', error);
            alert('Error generating questions. Please try again.');
        } finally {
            setAiLoading(false);
            setAiProgress({ current: 0, total: 0 });
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
                            onClick={() => {
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
                                setShowCreateModal(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                        >
                            + Create Quiz
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                            <select
                                value={filters.subject}
                                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                                className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                            >
                                <option value="all">All Subjects</option>
                                {SUBJECT_OPTIONS.map(subject => (
                                    <option key={subject.value} value={subject.value}>{subject.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Class</label>
                            <select
                                value={filters.class_target}
                                onChange={(e) => setFilters({ ...filters, class_target: e.target.value })}
                                className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                            >
                                <option value="all">All Classes</option>
                                {[6, 7, 8, 9, 10, 11, 12].map(c => (
                                    <option key={c} value={c}>Class {c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Question Type</label>
                            <select
                                value={filters.question_type}
                                onChange={(e) => setFilters({ ...filters, question_type: e.target.value })}
                                className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                            >
                                <option value="all">All Types</option>
                                <option value="mcq">MCQ</option>
                                <option value="short">Short Answer</option>
                                <option value="long">Long Answer</option>
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading quizzes...</p>
                    </div>
                ) : filteredQuizzes.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                        <p className="text-gray-500 dark:text-gray-400 text-lg">
                            {quizzes.length === 0 ? 'No quizzes found' : 'No quizzes match the selected filters'}
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                            {quizzes.length === 0 ? 'Create your first quiz or generate one with AI' : 'Try adjusting your filters'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Showing <span className="font-bold">{filteredQuizzes.length}</span> of <span className="font-bold">{quizzes.length}</span> questions
                                </p>
                                {(filters.subject !== 'all' || filters.class_target !== 'all' || filters.question_type !== 'all') && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Active filters:</span>
                                        {filters.subject !== 'all' && (
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                {getSubjectLabel(filters.subject)}
                                            </span>
                                        )}
                                        {filters.class_target !== 'all' && (
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                Class {filters.class_target}
                                            </span>
                                        )}
                                        {filters.question_type !== 'all' && (
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                                {filters.question_type.toUpperCase()}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => setFilters({ subject: 'all', class_target: 'all', question_type: 'all' })}
                                            className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                        >
                                            Clear all
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredQuizzes.map((quiz) => (
                                <li key={quiz.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                                {quiz.question_text.length > 150
                                                    ? quiz.question_text.substring(0, 150) + '...'
                                                    : quiz.question_text}
                                            </h3>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                    {getSubjectLabel(quiz.subject)}
                                                </span>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                    Class {quiz.class_target}
                                                </span>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                                    {quiz.difficulty}
                                                </span>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                                    {quiz.question_type}
                                                </span>
                                            </div>
                                            {quiz.correct_answer && (
                                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <span className="font-medium">Answer:</span> {quiz.correct_answer.substring(0, 100)}
                                                    {quiz.correct_answer.length > 100 && '...'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex space-x-2 ml-4">
                                            <button
                                                onClick={() => handleEditClick(quiz)}
                                                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteQuiz(quiz.id)}
                                                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}


                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-4 dark:text-white">Create New Quiz Question</h2>
                            <form onSubmit={handleCreateQuiz} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium dark:text-gray-300 mb-1">Subject *</label>
                                        <select
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                            required
                                        >
                                            {SUBJECT_OPTIONS.map(subject => (
                                                <option key={subject.value} value={subject.value}>{subject.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium dark:text-gray-300 mb-1">Class *</label>
                                        <select
                                            value={formData.class_target}
                                            onChange={(e) => setFormData({ ...formData, class_target: parseInt(e.target.value) })}
                                            className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                            required
                                        >
                                            {[6, 7, 8, 9, 10, 11, 12].map(c => (
                                                <option key={c} value={c}>Class {c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium dark:text-gray-300 mb-1">Difficulty *</label>
                                        <select
                                            value={formData.difficulty}
                                            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                            className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                            required
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium dark:text-gray-300 mb-1">Question Type *</label>
                                        <select
                                            value={formData.question_type}
                                            onChange={(e) => {
                                                const newType = e.target.value;
                                                setFormData({
                                                    ...formData,
                                                    question_type: newType,
                                                    options: newType === 'mcq' ? { A: '', B: '', C: '', D: '' } : {}
                                                });
                                            }}
                                            className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                            required
                                        >
                                            <option value="mcq">MCQ</option>
                                            <option value="short">Short Answer</option>
                                            <option value="long">Long Answer</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium dark:text-gray-300 mb-1">Question Text *</label>
                                    <textarea
                                        value={formData.question_text}
                                        onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                                        className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                        rows={3}
                                        required
                                        placeholder="Enter the question..."
                                    />
                                </div>

                                {formData.question_type === 'mcq' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium dark:text-gray-300 mb-1">Option A *</label>
                                            <input
                                                type="text"
                                                value={formData.options.A || ''}
                                                onChange={(e) => setFormData({ ...formData, options: { ...formData.options, A: e.target.value } })}
                                                className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium dark:text-gray-300 mb-1">Option B *</label>
                                            <input
                                                type="text"
                                                value={formData.options.B || ''}
                                                onChange={(e) => setFormData({ ...formData, options: { ...formData.options, B: e.target.value } })}
                                                className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium dark:text-gray-300 mb-1">Option C *</label>
                                            <input
                                                type="text"
                                                value={formData.options.C || ''}
                                                onChange={(e) => setFormData({ ...formData, options: { ...formData.options, C: e.target.value } })}
                                                className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium dark:text-gray-300 mb-1">Option D *</label>
                                            <input
                                                type="text"
                                                value={formData.options.D || ''}
                                                onChange={(e) => setFormData({ ...formData, options: { ...formData.options, D: e.target.value } })}
                                                className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium dark:text-gray-300 mb-1">Correct Answer *</label>
                                    <input
                                        type="text"
                                        value={formData.correct_answer}
                                        onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                                        className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                        required
                                        placeholder={formData.question_type === 'mcq' ? 'e.g., A) Option text' : 'Enter the correct answer'}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium dark:text-gray-300 mb-1">Explanation (Optional)</label>
                                    <textarea
                                        value={formData.explanation}
                                        onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                                        className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                        rows={2}
                                        placeholder="Explain why this is the correct answer..."
                                    />
                                </div>

                                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        Create Question
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {showEditModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-4 dark:text-white">Edit Quiz Question</h2>
                            <form onSubmit={handleUpdateQuiz} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium dark:text-gray-300 mb-1">Subject *</label>
                                        <select
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                            required
                                        >
                                            {SUBJECT_OPTIONS.map(subject => (
                                                <option key={subject.value} value={subject.value}>{subject.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium dark:text-gray-300 mb-1">Class *</label>
                                        <select
                                            value={formData.class_target}
                                            onChange={(e) => setFormData({ ...formData, class_target: parseInt(e.target.value) })}
                                            className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                            required
                                        >
                                            {[6, 7, 8, 9, 10, 11, 12].map(c => (
                                                <option key={c} value={c}>Class {c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium dark:text-gray-300 mb-1">Difficulty *</label>
                                        <select
                                            value={formData.difficulty}
                                            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                            className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                            required
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium dark:text-gray-300 mb-1">Question Type *</label>
                                        <select
                                            value={formData.question_type}
                                            onChange={(e) => {
                                                const newType = e.target.value;
                                                setFormData({
                                                    ...formData,
                                                    question_type: newType,
                                                    options: newType === 'mcq' ? { A: '', B: '', C: '', D: '' } : {}
                                                });
                                            }}
                                            className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                            required
                                        >
                                            <option value="mcq">MCQ</option>
                                            <option value="short">Short Answer</option>
                                            <option value="long">Long Answer</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium dark:text-gray-300 mb-1">Question Text *</label>
                                    <textarea
                                        value={formData.question_text}
                                        onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                                        className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                        rows={3}
                                        required
                                        placeholder="Enter the question..."
                                    />
                                </div>

                                {formData.question_type === 'mcq' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium dark:text-gray-300 mb-1">Option A *</label>
                                            <input
                                                type="text"
                                                value={formData.options.A || ''}
                                                onChange={(e) => setFormData({ ...formData, options: { ...formData.options, A: e.target.value } })}
                                                className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium dark:text-gray-300 mb-1">Option B *</label>
                                            <input
                                                type="text"
                                                value={formData.options.B || ''}
                                                onChange={(e) => setFormData({ ...formData, options: { ...formData.options, B: e.target.value } })}
                                                className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium dark:text-gray-300 mb-1">Option C *</label>
                                            <input
                                                type="text"
                                                value={formData.options.C || ''}
                                                onChange={(e) => setFormData({ ...formData, options: { ...formData.options, C: e.target.value } })}
                                                className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium dark:text-gray-300 mb-1">Option D *</label>
                                            <input
                                                type="text"
                                                value={formData.options.D || ''}
                                                onChange={(e) => setFormData({ ...formData, options: { ...formData.options, D: e.target.value } })}
                                                className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium dark:text-gray-300 mb-1">Correct Answer *</label>
                                    <input
                                        type="text"
                                        value={formData.correct_answer}
                                        onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                                        className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                        required
                                        placeholder={formData.question_type === 'mcq' ? 'e.g., A) Option text' : 'Enter the correct answer'}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium dark:text-gray-300 mb-1">Explanation (Optional)</label>
                                    <textarea
                                        value={formData.explanation}
                                        onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                                        className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                        rows={2}
                                        placeholder="Explain why this is the correct answer..."
                                    />
                                </div>

                                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowEditModal(false);
                                            setEditingQuiz(null);
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        Update Question
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* AI Modal */}
                {showAiModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                            <h2 className="text-2xl font-bold mb-4 dark:text-white">✨ Generate with AI</h2>

                            {!aiLoading ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium dark:text-gray-300 mb-1">Subject</label>
                                        <select
                                            value={aiParams.subject}
                                            onChange={(e) => setAiParams({ ...aiParams, subject: e.target.value })}
                                            className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                        >
                                            {SUBJECT_OPTIONS.map(subject => (
                                                <option key={subject.value} value={subject.value}>{subject.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium dark:text-gray-300 mb-1">Class</label>
                                        <select
                                            value={aiParams.class_level}
                                            onChange={(e) => setAiParams({ ...aiParams, class_level: parseInt(e.target.value) })}
                                            className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                        >
                                            {[6, 7, 8, 9, 10, 11, 12].map(c => (
                                                <option key={c} value={c}>Class {c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium dark:text-gray-300 mb-1">Difficulty</label>
                                        <select
                                            value={aiParams.difficulty}
                                            onChange={(e) => setAiParams({ ...aiParams, difficulty: e.target.value })}
                                            className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium dark:text-gray-300 mb-1">Question Type</label>
                                        <select
                                            value={aiParams.question_type}
                                            onChange={(e) => setAiParams({ ...aiParams, question_type: e.target.value })}
                                            className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                        >
                                            <option value="mcq">MCQ</option>
                                            <option value="short">Short Answer</option>
                                            <option value="long">Long Answer</option>
                                        </select>
                                    </div>

                                    {/* Quantity Selector */}
                                    <div>
                                        <label className="block text-sm font-medium dark:text-gray-300 mb-1">
                                            Number of Questions
                                        </label>
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="range"
                                                min="1"
                                                max="10"
                                                value={aiParams.quantity}
                                                onChange={(e) => setAiParams({ ...aiParams, quantity: parseInt(e.target.value) })}
                                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                            />
                                            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400 min-w-[3rem] text-center">
                                                {aiParams.quantity}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Generate 1-10 questions at once
                                        </p>
                                    </div>

                                    <div className="flex justify-end space-x-3 mt-6">
                                        <button
                                            onClick={() => setShowAiModal(false)}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-600"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleGenerateAiQuestion}
                                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center space-x-2"
                                        >
                                            <span>✨</span>
                                            <span>Generate {aiParams.quantity} Question{aiParams.quantity > 1 ? 's' : ''}</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Beautiful Loading Animation */
                                <div className="py-8">
                                    <div className="flex flex-col items-center space-y-6">
                                        {/* Animated AI Icon */}
                                        <div className="relative">
                                            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
                                                <span className="text-4xl">🤖</span>
                                            </div>
                                            <div className="absolute inset-0 w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-ping opacity-20"></div>
                                        </div>

                                        {/* Progress Text */}
                                        <div className="text-center">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                                Generating Questions...
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Question {aiProgress.current} of {aiProgress.total}
                                            </p>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
                                                style={{ width: `${(aiProgress.current / aiProgress.total) * 100}%` }}
                                            ></div>
                                        </div>

                                        {/* Fun Facts */}
                                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 w-full">
                                            <p className="text-sm text-purple-800 dark:text-purple-200 text-center">
                                                💡 <span className="font-medium">Did you know?</span> AI is analyzing curriculum patterns to create the perfect question!
                                            </p>
                                        </div>

                                        {/* Animated Dots */}
                                        <div className="flex space-x-2">
                                            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizManagement;
