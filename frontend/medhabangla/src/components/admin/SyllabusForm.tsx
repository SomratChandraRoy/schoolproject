import React, { useState } from 'react';

interface SyllabusFormProps {
    item: any;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
}

const SyllabusForm: React.FC<SyllabusFormProps> = ({ item, onSubmit, onCancel, loading }) => {
    const [formData, setFormData] = useState({
        class_level: item?.class_level || '',
        subject: item?.subject || '',
        chapter_title: item?.chapter_title || '',
        chapter_description: item?.chapter_description || '',
        page_range: item?.page_range || '',
        estimated_hours: item?.estimated_hours || '1.0',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const submitData = {
            ...formData,
            class_level: parseInt(formData.class_level),
            estimated_hours: parseFloat(formData.estimated_hours),
        };
        await onSubmit(submitData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Class Level *
                    </label>
                    <select
                        required
                        value={formData.class_level}
                        onChange={(e) => setFormData({ ...formData, class_level: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">Select Class</option>
                        {[6, 7, 8, 9, 10, 11, 12].map(cls => (
                            <option key={cls} value={cls}>Class {cls}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Subject *
                    </label>
                    <select
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">Select Subject</option>
                        <option value="math">Mathematics</option>
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Page Range
                    </label>
                    <input
                        type="text"
                        value={formData.page_range}
                        onChange={(e) => setFormData({ ...formData, page_range: e.target.value })}
                        placeholder="e.g., 10-25"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Estimated Hours *
                    </label>
                    <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        required
                        value={formData.estimated_hours}
                        onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Chapter Title *
                </label>
                <input
                    type="text"
                    required
                    value={formData.chapter_title}
                    onChange={(e) => setFormData({ ...formData, chapter_title: e.target.value })}
                    placeholder="e.g., Motion and Forces"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Chapter Description
                </label>
                <textarea
                    rows={4}
                    value={formData.chapter_description}
                    onChange={(e) => setFormData({ ...formData, chapter_description: e.target.value })}
                    placeholder="Brief description of the chapter content..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {loading ? 'Saving...' : item ? 'Update Chapter' : 'Create Chapter'}
                </button>
            </div>
        </form>
    );
};

export default SyllabusForm;
