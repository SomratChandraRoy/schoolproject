import React, { useState, useEffect } from 'react';
import { useOfflineNotes, Note } from '../hooks/useOfflineNotes';
const NotesEnhanced: React.FC = () => {
    const { notes, loading, addNote, updateNote, deleteNote, syncNotesWithBackend } = useOfflineNotes();
    const [isAdding, setIsAdding] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [newNote, setNewNote] = useState({ title: '', content: '' });
    const [isGenerating, setIsGenerating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showStorageInfo, setShowStorageInfo] = useState(false);
    const [storageEstimate, setStorageEstimate] = useState<{ usage: number; quota: number } | null>(null);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Check online status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Request storage permission and show estimate
    useEffect(() => {
        const requestStoragePermission = async () => {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                try {
                    const estimate = await navigator.storage.estimate();
                    setStorageEstimate({
                        usage: estimate.usage || 0,
                        quota: estimate.quota || 0
                    });

                    // Request persistent storage
                    if ('persist' in navigator.storage) {
                        const isPersisted = await navigator.storage.persist();
                        console.log(`Storage persisted: ${isPersisted}`);
                    }
                } catch (error) {
                    console.error('Error requesting storage:', error);
                }
            }
        };

        requestStoragePermission();
    }, [notes]);

    const handleAddNote = async () => {
        if (!newNote.title.trim() || !newNote.content.trim()) return;

        try {
            await addNote({
                title: newNote.title,
                content: newNote.content
            });
            setNewNote({ title: '', content: '' });
            setIsAdding(false);
        } catch (error) {
            console.error('Error adding note:', error);
            alert('Failed to add note. Please try again.');
        }
    };

    const handleUpdateNote = async () => {
        if (!editingNote || !editingNote.id) return;
        if (!editingNote.title.trim() || !editingNote.content.trim()) return;

        try {
            await updateNote(editingNote.id, {
                title: editingNote.title,
                content: editingNote.content
            });
            setEditingNote(null);
            setSelectedNote(null);
        } catch (error) {
            console.error('Error updating note:', error);
            alert('Failed to update note. Please try again.');
        }
    };

    const handleDeleteNote = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            try {
                await deleteNote(id);
                setSelectedNote(null);
                setEditingNote(null);
            } catch (error) {
                console.error('Error deleting note:', error);
                alert('Failed to delete note. Please try again.');
            }
        }
    };

    const handleSync = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please login to sync notes with the server.');
            return;
        }

        setIsSyncing(true);
        try {
            await syncNotesWithBackend(token);
            alert('Notes synced successfully!');
        } catch (error) {
            console.error('Error syncing notes:', error);
            alert('Failed to sync notes. Please try again.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleGenerateAINotes = async () => {
        const topic = prompt('Enter a topic for your AI-generated notes:');
        if (!topic) return;

        setIsGenerating(true);

        try {
            const token = localStorage.getItem('token');

            const response = await fetch('/api/ai/chat/message/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({
                    message: `Generate detailed study notes on the topic: ${topic}. Provide structured content with headings, bullet points, and key concepts highlighted.`,
                    message_type: 'note_taking'
                })
            });

            if (response.ok) {
                const data = await response.json();
                const aiContent = data.ai_message;

                await addNote({
                    title: `AI Notes: ${topic}`,
                    content: aiContent
                });

                alert('AI notes generated and saved successfully!');
            } else {
                throw new Error('Failed to generate AI notes');
            }
        } catch (error) {
            console.error('AI Note Generation Error:', error);
            alert('Failed to generate AI notes. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const formatDate = (dateString: Date) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                                📝 My Notes
                                {!isOnline && (
                                    <span className="ml-3 px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full">
                                        Offline Mode
                                    </span>
                                )}
                            </h1>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Your notes are saved locally and sync when online. {notes.length} note{notes.length !== 1 ? 's' : ''} saved.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {isOnline && (
                                <button
                                    onClick={handleSync}
                                    disabled={isSyncing}
                                    className={`px-3 sm:px-4 py-2 font-medium rounded-lg transition flex items-center text-sm ${isSyncing
                                            ? 'bg-gray-400 cursor-not-allowed text-white'
                                            : 'bg-green-600 hover:bg-green-700 text-white'
                                        }`}
                                >
                                    {isSyncing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                            Syncing...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Sync
                                        </>
                                    )}
                                </button>
                            )}
                            <button
                                onClick={() => setShowStorageInfo(!showStorageInfo)}
                                className="px-3 sm:px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition text-sm"
                            >
                                💾 Storage
                            </button>
                            <button
                                onClick={handleGenerateAINotes}
                                disabled={isGenerating || !isOnline}
                                className={`px-3 sm:px-4 py-2 font-medium rounded-lg transition text-sm ${isGenerating || !isOnline
                                        ? 'bg-gray-400 cursor-not-allowed text-white'
                                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                                    }`}
                            >
                                {isGenerating ? 'Generating...' : '🤖 AI Notes'}
                            </button>
                            <button
                                onClick={() => setIsAdding(!isAdding)}
                                className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition text-sm"
                            >
                                {isAdding ? 'Cancel' : '+ Add Note'}
                            </button>
                        </div>
                    </div>

                    {/* Storage Info */}
                    {showStorageInfo && storageEstimate && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Storage Information</h3>
                            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                                <p>Used: {formatBytes(storageEstimate.usage)}</p>
                                <p>Available: {formatBytes(storageEstimate.quota)}</p>
                                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mt-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full"
                                        style={{ width: `${(storageEstimate.usage / storageEstimate.quota) * 100}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs">
                                    {((storageEstimate.usage / storageEstimate.quota) * 100).toFixed(2)}% used
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Search Bar */}
                    <div className="mt-4">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search notes..."
                                className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                            <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Add/Edit Note Form */}
                {(isAdding || editingNote) && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            {editingNote ? 'Edit Note' : 'Create New Note'}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    value={editingNote ? editingNote.title : newNote.title}
                                    onChange={(e) => editingNote
                                        ? setEditingNote({ ...editingNote, title: e.target.value })
                                        : setNewNote({ ...newNote, title: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="Note title"
                                />
                            </div>
                            <div>
                                <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Content
                                </label>
                                <textarea
                                    id="content"
                                    value={editingNote ? editingNote.content : newNote.content}
                                    onChange={(e) => editingNote
                                        ? setEditingNote({ ...editingNote, content: e.target.value })
                                        : setNewNote({ ...newNote, content: e.target.value })
                                    }
                                    rows={8}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="Note content"
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setIsAdding(false);
                                        setEditingNote(null);
                                        setNewNote({ title: '', content: '' });
                                    }}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={editingNote ? handleUpdateNote : handleAddNote}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition"
                                >
                                    {editingNote ? 'Update Note' : 'Save Note'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notes Grid */}
                {filteredNotes.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 sm:p-12 text-center">
                        <div className="text-4xl sm:text-6xl mb-4">📝</div>
                        <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">
                            {searchQuery ? 'No notes found' : 'No notes yet'}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6">
                            {searchQuery
                                ? 'Try a different search term'
                                : 'Create your first note to save important information for offline access.'
                            }
                        </p>
                        {!searchQuery && (
                            <div className="flex flex-col sm:flex-row justify-center gap-3">
                                <button
                                    onClick={handleGenerateAINotes}
                                    disabled={isGenerating || !isOnline}
                                    className={`px-4 py-2 font-medium rounded-lg transition ${isGenerating || !isOnline
                                            ? 'bg-gray-400 cursor-not-allowed text-white'
                                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                                        }`}
                                >
                                    {isGenerating ? 'Generating...' : 'Generate AI Notes'}
                                </button>
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                                >
                                    Create Manual Note
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {filteredNotes.map((note) => (
                            <div
                                key={note.id}
                                onClick={() => setSelectedNote(note)}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                            >
                                <div className="p-4 sm:p-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1">
                                            {note.title}
                                        </h3>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line line-clamp-4">
                                        {note.content}
                                    </p>
                                    <div className="mt-4 flex justify-between items-center">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatDate(note.createdAt)}
                                        </span>
                                        {note.updatedAt && note.updatedAt.getTime() !== note.createdAt.getTime() && (
                                            <span className="text-xs text-blue-600 dark:text-blue-400">
                                                Edited
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Note Detail Modal */}
                {selectedNote && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedNote(null)}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex-1 pr-4">
                                    {selectedNote.title}
                                </h2>
                                <button
                                    onClick={() => setSelectedNote(null)}
                                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
                                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {selectedNote.content}
                                </p>
                                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Created: {formatDate(selectedNote.createdAt)}
                                    </p>
                                    {selectedNote.updatedAt && selectedNote.updatedAt.getTime() !== selectedNote.createdAt.getTime() && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Last edited: {formatDate(selectedNote.updatedAt)}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setEditingNote(selectedNote);
                                        setSelectedNote(null);
                                    }}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => selectedNote.id && handleDeleteNote(selectedNote.id)}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotesEnhanced;
