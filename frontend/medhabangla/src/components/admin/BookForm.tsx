import React, { useState } from 'react';

interface BookFormProps {
    item: any;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
}

const BookForm: React.FC<BookFormProps> = ({ item, onSubmit, onCancel, loading }) => {
    const [formData, setFormData] = useState({
        title: item?.title || '',
        author: item?.author || '',
        class_level: item?.class_level || '',
        category: item?.category || 'textbook',
        language: item?.language || 'bn',
        description: item?.description || '',
    });

    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [coverImage, setCoverImage] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Create FormData for file upload
        const submitData = new FormData();
        submitData.append('title', formData.title);
        submitData.append('author', formData.author);
        submitData.append('class_level', formData.class_level);
        submitData.append('category', formData.category);
        submitData.append('language', formData.language);
        submitData.append('description', formData.description);

        if (pdfFile) {
            submitData.append('pdf_file', pdfFile);
        }
        if (coverImage) {
            submitData.append('cover_image', coverImage);
        }

        await onSubmit(submitData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Book Title *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Physics Textbook"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Author *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        placeholder="e.g., Dr. Ahmed"
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
                        Category *
                    </label>
                    <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="textbook">Textbook</option>
                        <option value="story">Story</option>
                        <option value="poem">Poem</option>
                        <option value="poetry">Poetry</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Language *
                    </label>
                    <select
                        required
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="bn">Bangla</option>
                        <option value="en">English</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                </label>
                <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the book..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        PDF File {!item && '*'}
                    </label>
                    <input
                        type="file"
                        accept=".pdf"
                        required={!item}
                        onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200"
                    />
                    {item?.pdf_file && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Current: {item.pdf_file.split('/').pop()}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cover Image
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200"
                    />
                    {item?.cover_image && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Current: {item.cover_image.split('/').pop()}
                        </p>
                    )}
                </div>
            </div>

            {!item && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        📚 PDF file is required when creating a new book. Cover image is optional.
                    </p>
                </div>
            )}

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
                    {loading ? 'Saving...' : item ? 'Update Book' : 'Create Book'}
                </button>
            </div>
        </form>
    );
};

export default BookForm;
