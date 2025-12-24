import * as React from 'react';
import { useState } from 'react';
import { useLocalNotes, Note } from '../hooks/useLocalNotes';
import Navbar from '../components/Navbar';

const NotesFileSystem: React.FC = () => {
    const {
        notes,
        loading,
        error,
        storageType,
        isPWAInstalled,
        selectFolder,
        addNote,
        updateNote,
        deleteNote,
        refreshNotes,
        generateAINotes,
        downloadNote,
        downloadAllNotes
    } = useLocalNotes();

    const [isAdding, setIsAdding] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [newNote, setNewNote] = useState({ title: '', content: '' });
    const [isGenerating, setIsGenerating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Check online status
    React.useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleAddNote = async () => {
        if (!newNote.title.trim() || !newNote.content.trim()) return;

        try {
            await addNote({
                title: newNote.title,
                content: newNote.content
            });
            setNewNote({ title: '', content: '' });
            setIsAdding(false);
        } catch (err) {
            alert('Failed to add note. Please try again.');
        }
    };

    const handleUpdateNote = async () => {
        if (!editingNote) return;
        if (!editingNote.title.trim() || !editingNote.content.trim()) return;

        try {
            await updateNote(editingNote.id, {
                title: editingNote.title,
                content: editingNote.content
            });
            setEditingNote(null);
            setSelectedNote(null);
        } catch (err) {
            alert('Failed to update note. Please try again.');
        }
    };

    const handleDeleteNote = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            try {
                await deleteNote(id);
                setSelectedNote(null);
                setEditingNote(null);
            } catch (err) {
                alert('Failed to delete note. Please try again.');
            }
        }
    };

    const handleGenerateAINotes = async () => {
        const topic = prompt('Enter a topic for your AI-generated notes:');
        if (!topic) return;

        setIsGenerating(true);
        try {
            await generateAINotes(topic);
            alert('AI notes generated and saved successfully!');
        } catch (err: any) {
            alert(err.message || 'Failed to generate AI notes. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Show welcome screen for IndexedDB mode (Brave browser)
    if (storageType === 'indexeddb' && notes.length === 0 && !loading && !isAdding) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Navbar />
                <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 sm:p-12">
                        <div className="text-center">
                            <div className="text-6xl mb-6">📝</div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                Browser Storage Mode
                            </h1>

                            {/* Storage Type Badge */}
                            <div className="inline-flex items-center px-4 py-2 rounded-full mb-6 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                                    <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                                    <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                                </svg>
                                Secure Browser Storage
                            </div>

                            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <p className="text-blue-800 dark:text-blue-200 mb-2">
                                    <strong>ℹ️ Your browser's privacy settings are protecting you!</strong>
                                </p>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    Brave browser blocks folder access for privacy. Your notes are safely stored
                                    in your browser's local storage and work completely offline. You can download
                                    notes as Markdown files anytime.
                                </p>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-left">
                                    <h3 className="font-semibold text-green-900 dark:text-green-200 mb-3">
                                        ✨ Features Available:
                                    </h3>
                                    <ul className="space-y-2 text-sm text-green-800 dark:text-green-300">
                                        <li>• 📝 Create, edit, and delete notes</li>
                                        <li>• 🤖 Generate notes using AI</li>
                                        <li>• 💾 All notes saved in browser storage</li>
                                        <li>• 📱 Works completely offline</li>
                                        <li>• 🔍 Search through all your notes</li>
                                        <li>• 📥 Download notes as Markdown files (.md)</li>
                                        <li>• 🔒 Private and secure (never leaves your device)</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-center gap-3">
                                {isOnline && (
                                    <button
                                        onClick={handleGenerateAINotes}
                                        disabled={isGenerating}
                                        className={`px-6 py-3 font-medium rounded-lg transition ${isGenerating
                                            ? 'bg-gray-400 cursor-not-allowed text-white'
                                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                                            }`}
                                    >
                                        {isGenerating ? 'Generating...' : '🤖 Generate AI Notes'}
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                                >
                                    📝 Create Your First Note
                                </button>
                            </div>

                            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                                Your notes are stored locally and never sent to any server
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Navbar />
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-400">Loading notes...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />
            <div className="max-w-7xl mx-auto py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center flex-wrap gap-2">
                                📝 My Notes
                                {!isOnline && (
                                    <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full">
                                        Offline Mode
                                    </span>
                                )}
                                <span className={`px-2 py-1 text-xs rounded-full ${storageType === 'filesystem'
                                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                    : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                    }`}>
                                    {storageType === 'filesystem' ? '💾 Folder Storage' : '🗄️ Browser Storage'}
                                </span>
                            </h1>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                {notes.length} note{notes.length !== 1 ? 's' : ''} saved {storageType === 'filesystem' ? 'to your folder' : 'in browser'}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {storageType === 'filesystem' && (
                                <button
                                    onClick={selectFolder}
                                    className="px-3 sm:px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition text-sm"
                                    title="Change folder location"
                                >
                                    📁 Change Folder
                                </button>
                            )}
                            <button
                                onClick={refreshNotes}
                                className="px-3 sm:px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition text-sm"
                            >
                                🔄 Refresh
                            </button>
                            {notes.length > 0 && (
                                <button
                                    onClick={downloadAllNotes}
                                    className="px-3 sm:px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition text-sm"
                                    title="Download all notes as one file"
                                >
                                    📥 Download All
                                </button>
                            )}
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
                                    Content (Markdown supported)
                                </label>
                                <textarea
                                    id="content"
                                    value={editingNote ? editingNote.content : newNote.content}
                                    onChange={(e) => editingNote
                                        ? setEditingNote({ ...editingNote, content: e.target.value })
                                        : setNewNote({ ...newNote, content: e.target.value })
                                    }
                                    rows={12}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                                    placeholder="Note content (supports markdown formatting)"
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
                                : `Create your first note. All notes are saved ${storageType === 'filesystem' ? 'to your folder' : 'in browser storage'}.`
                            }
                        </p>
                        {!searchQuery && (
                            <div className="flex flex-col sm:flex-row justify-center gap-3">
                                {isOnline && (
                                    <button
                                        onClick={handleGenerateAINotes}
                                        disabled={isGenerating}
                                        className={`px-4 py-2 font-medium rounded-lg transition ${isGenerating
                                            ? 'bg-gray-400 cursor-not-allowed text-white'
                                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                                            }`}
                                    >
                                        {isGenerating ? 'Generating...' : 'Generate AI Notes'}
                                    </button>
                                )}
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
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                <div className="p-4 sm:p-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3
                                            onClick={() => setSelectedNote(note)}
                                            className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                                        >
                                            {note.title}
                                        </h3>
                                        <button
                                            onClick={() => downloadNote(note)}
                                            className="ml-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                            title="Download this note"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line line-clamp-4">
                                        {note.content}
                                    </p>
                                    <div className="mt-4 flex justify-between items-center">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatDate(note.createdAt)}
                                        </span>
                                        {note.updatedAt && note.updatedAt !== note.createdAt && (
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
                                    {selectedNote.updatedAt && selectedNote.updatedAt !== selectedNote.createdAt && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Last edited: {formatDate(selectedNote.updatedAt)}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                                <button
                                    onClick={() => downloadNote(selectedNote)}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition"
                                >
                                    Download
                                </button>
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
                                    onClick={() => handleDeleteNote(selectedNote.id)}
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

export default NotesFileSystem;
