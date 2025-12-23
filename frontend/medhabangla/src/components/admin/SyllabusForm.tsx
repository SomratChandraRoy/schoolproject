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
        chapter_number: item?.chapter_number || '1',
        chapter_description: item?.chapter_description || '',
        page_range: item?.page_range || '',
        estimated_hours: item?.estimated_hours || '1.0',
    });

    const [syllabusPdf, setSyllabusPdf] = useState<File | null>(null);
    const [syllabusImage, setSyllabusImage] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Create FormData for file upload
        const submitData = new FormData();
        submitData.append('class_level', formData.class_level);
        submitData.append('subject', formData.subject);
        submitData.append('chapter_title', formData.chapter_title);
        submitData.append('chapter_number', formData.chapter_number);
        submitData.append('chapter_description', formData.chapter_description);
        submitData.append('page_range', formData.page_range);
        submitData.append('estimated_hours', formData.estimated_hours);

        if (syllabusPdf) {
            submitData.append('syllabus_pdf', syllabusPdf);
        }
        if (syllabusImage) {
            submitData.append('syllabus_image', syllabusImage);
        }

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
                        Chapter Number *
                    </label>
                    <input
                        type="number"
                        min="1"
                        required
                        value={formData.chapter_number}
                        onChange={(e) => setFormData({ ...formData, chapter_number: e.target.value })}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Syllabus PDF
                    </label>
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setSyllabusPdf(e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200"
                    />
                    {item?.syllabus_pdf && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Current: {item.syllabus_pdf.split('/').pop()}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Syllabus Image
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setSyllabusImage(e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200"
                    />
                    {item?.syllabus_image && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Current: {item.syllabus_image.split('/').pop()}
                        </p>
                    )}
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    📄 You can upload syllabus content as PDF or image format (or both).
                </p>
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
