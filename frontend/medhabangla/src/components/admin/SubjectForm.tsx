import React, { useState } from 'react';

interface SubjectFormProps {
    item: any;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
}

const SubjectForm: React.FC<SubjectFormProps> = ({ item, onSubmit, onCancel, loading }) => {
    const [formData, setFormData] = useState({
        name: item?.name || '',
        bengali_title: item?.bengali_title || '',
        subject_code: item?.subject_code || '',
        class_level: item?.class_level || '',
        stream: item?.stream || '',
        is_compulsory: item?.is_compulsory ?? true,
        icon: item?.icon || '📚',
        color: item?.color || 'bg-blue-100',
        description: item?.description || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const submitData = {
            ...formData,
            class_level: parseInt(formData.class_level),
        };
        await onSubmit(submitData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Subject Name *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Physics"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bengali Title *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.bengali_title}
                        onChange={(e) => setFormData({ ...formData, bengali_title: e.target.value })}
                        placeholder="e.g., পদার্থবিজ্ঞান"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Subject Code *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.subject_code}
                        onChange={(e) => setFormData({ ...formData, subject_code: e.target.value })}
                        placeholder="e.g., physics"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>

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
                        Stream
                    </label>
                    <select
                        value={formData.stream}
                        onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">None (Compulsory)</option>
                        <option value="Science">Science</option>
                        <option value="Humanities">Humanities</option>
                        <option value="Business">Business</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Icon
                    </label>
                    <input
                        type="text"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        placeholder="e.g., ⚛️"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Color Class
                    </label>
                    <select
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="bg-blue-100">Blue</option>
                        <option value="bg-green-100">Green</option>
                        <option value="bg-purple-100">Purple</option>
                        <option value="bg-red-100">Red</option>
                        <option value="bg-yellow-100">Yellow</option>
                        <option value="bg-pink-100">Pink</option>
                        <option value="bg-indigo-100">Indigo</option>
                        <option value="bg-teal-100">Teal</option>
                    </select>
                </div>

                <div>
                    <label className="flex items-center space-x-2 mt-6">
                        <input
                            type="checkbox"
                            checked={formData.is_compulsory}
                            onChange={(e) => setFormData({ ...formData, is_compulsory: e.target.checked })}
                            className="rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Compulsory Subject</span>
                    </label>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                </label>
                <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    {loading ? 'Saving...' : item ? 'Update Subject' : 'Create Subject'}
                </button>
            </div>
        </form>
    );
};

export default SubjectForm;
