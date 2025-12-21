import React, { useState } from 'react';
import { useOfflineNotes } from '../hooks/useOfflineNotes';
import Navbar from '../components/Navbar';

const Notes: React.FC = () => {
  const { notes, loading, addNote, deleteNote } = useOfflineNotes();
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [isGenerating, setIsGenerating] = useState(false);

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

  const handleDeleteNote = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(id);
      } catch (error) {
        console.error('Error deleting note:', error);
        alert('Failed to delete note. Please try again.');
      }
    }
  };

  const handleGenerateAINotes = async () => {
    const topic = prompt('Enter a topic for your AI-generated notes:');
    if (!topic) return;
    
    setIsGenerating(true);
    
    try {
      // Get auth token
      const token = localStorage.getItem('token');
      
      // Call backend AI endpoint to generate notes
      const response = await fetch('http://localhost:8000/api/ai/chat/message/', {
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
        
        // Add the AI-generated content as a new note
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Offline Notes</h1>
            <div className="flex space-x-2">
              <button
                onClick={handleGenerateAINotes}
                disabled={isGenerating}
                className={`px-4 py-2 font-medium rounded-lg transition ${
                  isGenerating 
                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isGenerating ? 'Generating...' : 'AI Notes'}
              </button>
              <button
                onClick={() => setIsAdding(!isAdding)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
              >
                {isAdding ? 'Cancel' : 'Add Note'}
              </button>
            </div>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Your notes are saved locally and available offline. They will sync with the server when you're online.
          </p>
        </div>

        {isAdding && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create New Note</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={newNote.title}
                  onChange={(e) => setNewNote({...newNote, title: e.target.value})}
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
                  value={newNote.content}
                  onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Note content"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        )}

        {notes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No notes yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Create your first note to save important information for offline access.
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={handleGenerateAINotes}
                disabled={isGenerating}
                className={`px-4 py-2 font-medium rounded-lg transition ${
                  isGenerating 
                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
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
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {notes.map((note) => (
              <div key={note.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{note.title}</h3>
                    <button
                      onClick={() => note.id && handleDeleteNote(note.id)}
                      className="text-gray-400 hover:text-red-500"
                      aria-label="Delete note"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-2 text-gray-600 dark:text-gray-300 whitespace-pre-line">
                    {note.content.length > 150 ? `${note.content.substring(0, 150)}...` : note.content}
                  </p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(note.createdAt)}
                    </span>
                    {note.updatedAt && note.updatedAt.getTime() !== note.createdAt.getTime() && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Edited
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;