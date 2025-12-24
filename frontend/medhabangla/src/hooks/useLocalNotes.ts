import { useState, useEffect } from 'react';

export interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

interface LocalNotes {
    notes: Note[];
    loading: boolean;
    error: string | null;
    storageType: 'filesystem' | 'indexeddb';
    isPWAInstalled: boolean;
    selectFolder: () => Promise<void>;
    addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
    deleteNote: (id: string) => Promise<void>;
    refreshNotes: () => Promise<void>;
    generateAINotes: (topic: string) => Promise<void>;
    downloadNote: (note: Note) => void;
    downloadAllNotes: () => void;
}

const FOLDER_HANDLE_KEY = 'medhabangla_notes_folder_handle';
const NOTES_INDEX_FILE = 'notes_index.json';
const INDEXEDDB_NOTES_STORE = 'notes';

export const useLocalNotes = (): LocalNotes => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [folderHandle, setFolderHandle] = useState<FileSystemDirectoryHandle | null>(null);
    const [storageType, setStorageType] = useState<'filesystem' | 'indexeddb'>('indexeddb');
    const [isPWAInstalled, setIsPWAInstalled] = useState(false);

    // Check if PWA is installed
    useEffect(() => {
        const checkPWAInstalled = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            const isIOSStandalone = (window.navigator as any).standalone === true;
            setIsPWAInstalled(isStandalone || isIOSStandalone);
        };

        checkPWAInstalled();
    }, []);

    // Check if File System Access API is supported
    const isFileSystemSupported = () => {
        try {
            return 'showDirectoryPicker' in window && typeof (window as any).showDirectoryPicker === 'function';
        } catch {
            return false;
        }
    };

    // Initialize storage
    useEffect(() => {
        const initStorage = async () => {
            if (isFileSystemSupported()) {
                // Try File System API first
                await loadSavedFolderHandle();
            } else {
                // Fall back to IndexedDB
                setStorageType('indexeddb');
                await loadNotesFromIndexedDB();
            }
        };

        initStorage();
    }, []);

    // Open IndexedDB
    const openDB = (): Promise<IDBDatabase> => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('MedhaBanglaNotesDB', 2);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create handles store for folder handles
                if (!db.objectStoreNames.contains('handles')) {
                    db.createObjectStore('handles');
                }

                // Create notes store for IndexedDB fallback
                if (!db.objectStoreNames.contains(INDEXEDDB_NOTES_STORE)) {
                    db.createObjectStore(INDEXEDDB_NOTES_STORE, { keyPath: 'id' });
                }
            };
        });
    };

    // ==================== FILE SYSTEM API METHODS ====================

    const loadSavedFolderHandle = async () => {
        try {
            const db = await openDB();
            const transaction = db.transaction(['handles'], 'readonly');
            const store = transaction.objectStore('handles');
            const request = store.get(FOLDER_HANDLE_KEY);

            request.onsuccess = async () => {
                const savedHandle = request.result;
                if (savedHandle) {
                    try {
                        const permission = await savedHandle.queryPermission({ mode: 'readwrite' });
                        if (permission === 'granted') {
                            setFolderHandle(savedHandle);
                            setStorageType('filesystem');
                            await loadNotesFromFolder(savedHandle);
                        } else {
                            const newPermission = await savedHandle.requestPermission({ mode: 'readwrite' });
                            if (newPermission === 'granted') {
                                setFolderHandle(savedHandle);
                                setStorageType('filesystem');
                                await loadNotesFromFolder(savedHandle);
                            } else {
                                setStorageType('indexeddb');
                                await loadNotesFromIndexedDB();
                            }
                        }
                    } catch (err) {
                        console.error('Error verifying folder permission:', err);
                        setStorageType('indexeddb');
                        await loadNotesFromIndexedDB();
                    }
                } else {
                    setStorageType('indexeddb');
                    await loadNotesFromIndexedDB();
                }
            };

            request.onerror = () => {
                console.error('Error loading saved folder handle');
                setStorageType('indexeddb');
                loadNotesFromIndexedDB();
            };
        } catch (err) {
            console.error('Error accessing IndexedDB:', err);
            setStorageType('indexeddb');
            await loadNotesFromIndexedDB();
        }
    };

    const saveFolderHandle = async (handle: FileSystemDirectoryHandle) => {
        try {
            const db = await openDB();
            const transaction = db.transaction(['handles'], 'readwrite');
            const store = transaction.objectStore('handles');
            store.put(handle, FOLDER_HANDLE_KEY);
        } catch (err) {
            console.error('Error saving folder handle:', err);
        }
    };

    const selectFolder = async () => {
        if (!isFileSystemSupported()) {
            setError('File System Access API is not supported. Using browser storage instead.');
            return;
        }

        try {
            const handle = await (window as any).showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'documents'
            });

            setFolderHandle(handle);
            setStorageType('filesystem');
            await saveFolderHandle(handle);
            await loadNotesFromFolder(handle);
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('Error selecting folder:', err);
                setError('Failed to select folder. Using browser storage instead.');
                setStorageType('indexeddb');
                await loadNotesFromIndexedDB();
            }
        }
    };

    const loadNotesFromFolder = async (handle: FileSystemDirectoryHandle) => {
        setLoading(true);
        try {
            const indexFileHandle = await handle.getFileHandle(NOTES_INDEX_FILE, { create: true });
            const indexFile = await indexFileHandle.getFile();
            const indexText = await indexFile.text();

            if (indexText.trim()) {
                const loadedNotes = JSON.parse(indexText);
                setNotes(loadedNotes);
            } else {
                setNotes([]);
            }
        } catch (err) {
            console.error('Error loading notes from folder:', err);
            setNotes([]);
        } finally {
            setLoading(false);
        }
    };

    const saveNotesIndex = async (updatedNotes: Note[]) => {
        if (!folderHandle) return;

        try {
            const indexFileHandle = await folderHandle.getFileHandle(NOTES_INDEX_FILE, { create: true });
            const writable = await indexFileHandle.createWritable();
            await writable.write(JSON.stringify(updatedNotes, null, 2));
            await writable.close();
        } catch (err) {
            console.error('Error saving notes index:', err);
            throw err;
        }
    };

    const saveNoteFile = async (note: Note) => {
        if (!folderHandle) return;

        try {
            const fileName = `${note.id}.md`;
            const fileHandle = await folderHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();

            const content = `# ${note.title}\n\nCreated: ${new Date(note.createdAt).toLocaleString()}\nUpdated: ${new Date(note.updatedAt).toLocaleString()}\n\n---\n\n${note.content}`;

            await writable.write(content);
            await writable.close();
        } catch (err) {
            console.error('Error saving note file:', err);
            throw err;
        }
    };

    const deleteNoteFile = async (noteId: string) => {
        if (!folderHandle) return;

        try {
            const fileName = `${noteId}.md`;
            await folderHandle.removeEntry(fileName);
        } catch (err) {
            console.error('Error deleting note file:', err);
        }
    };

    // ==================== INDEXEDDB METHODS ====================

    const loadNotesFromIndexedDB = async () => {
        setLoading(true);
        try {
            const db = await openDB();
            const transaction = db.transaction([INDEXEDDB_NOTES_STORE], 'readonly');
            const store = transaction.objectStore(INDEXEDDB_NOTES_STORE);
            const request = store.getAll();

            request.onsuccess = () => {
                const loadedNotes = request.result || [];
                setNotes(loadedNotes.sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                ));
                setLoading(false);
            };

            request.onerror = () => {
                console.error('Error loading notes from IndexedDB');
                setNotes([]);
                setLoading(false);
            };
        } catch (err) {
            console.error('Error accessing IndexedDB:', err);
            setNotes([]);
            setLoading(false);
        }
    };

    const saveNoteToIndexedDB = async (note: Note) => {
        try {
            const db = await openDB();
            const transaction = db.transaction([INDEXEDDB_NOTES_STORE], 'readwrite');
            const store = transaction.objectStore(INDEXEDDB_NOTES_STORE);
            store.put(note);
        } catch (err) {
            console.error('Error saving note to IndexedDB:', err);
            throw err;
        }
    };

    const deleteNoteFromIndexedDB = async (noteId: string) => {
        try {
            const db = await openDB();
            const transaction = db.transaction([INDEXEDDB_NOTES_STORE], 'readwrite');
            const store = transaction.objectStore(INDEXEDDB_NOTES_STORE);
            store.delete(noteId);
        } catch (err) {
            console.error('Error deleting note from IndexedDB:', err);
        }
    };

    // ==================== UNIFIED CRUD METHODS ====================

    const addNote = async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newNote: Note = {
            id: Date.now().toString(),
            ...note,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const updatedNotes = [newNote, ...notes];
        setNotes(updatedNotes);

        if (storageType === 'filesystem' && folderHandle) {
            await saveNoteFile(newNote);
            await saveNotesIndex(updatedNotes);
        } else {
            await saveNoteToIndexedDB(newNote);
        }
    };

    const updateNote = async (id: string, updates: Partial<Note>) => {
        const updatedNotes = notes.map(note =>
            note.id === id
                ? { ...note, ...updates, updatedAt: new Date().toISOString() }
                : note
        );

        setNotes(updatedNotes);

        const updatedNote = updatedNotes.find(n => n.id === id);
        if (updatedNote) {
            if (storageType === 'filesystem' && folderHandle) {
                await saveNoteFile(updatedNote);
                await saveNotesIndex(updatedNotes);
            } else {
                await saveNoteToIndexedDB(updatedNote);
            }
        }
    };

    const deleteNote = async (id: string) => {
        const updatedNotes = notes.filter(note => note.id !== id);
        setNotes(updatedNotes);

        if (storageType === 'filesystem' && folderHandle) {
            await deleteNoteFile(id);
            await saveNotesIndex(updatedNotes);
        } else {
            await deleteNoteFromIndexedDB(id);
        }
    };

    const refreshNotes = async () => {
        if (storageType === 'filesystem' && folderHandle) {
            await loadNotesFromFolder(folderHandle);
        } else {
            await loadNotesFromIndexedDB();
        }
    };

    // ==================== DOWNLOAD METHODS ====================

    const downloadNote = (note: Note) => {
        const content = `# ${note.title}\n\nCreated: ${new Date(note.createdAt).toLocaleString()}\nUpdated: ${new Date(note.updatedAt).toLocaleString()}\n\n---\n\n${note.content}`;
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${note.title.replace(/[^a-z0-9]/gi, '_')}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const downloadAllNotes = () => {
        const allNotesContent = notes.map(note =>
            `# ${note.title}\n\nCreated: ${new Date(note.createdAt).toLocaleString()}\nUpdated: ${new Date(note.updatedAt).toLocaleString()}\n\n---\n\n${note.content}\n\n${'='.repeat(80)}\n\n`
        ).join('');

        const blob = new Blob([allNotesContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `all_notes_${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // ==================== AI GENERATION ====================

    const generateAINotes = async (topic: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('অনুগ্রহ করে লগইন করুন AI ফিচার ব্যবহার করতে (Please login to use AI features)');
            }

            // First create a chat session
            const sessionResponse = await fetch('/api/ai/chat/start/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                }
            });

            if (!sessionResponse.ok) {
                const errorData = await sessionResponse.json();
                throw new Error(errorData.error || 'Failed to start AI session');
            }

            const sessionData = await sessionResponse.json();
            const sessionId = sessionData.session_id;

            // Now send the message
            const messageResponse = await fetch('/api/ai/chat/message/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    message: `Generate detailed study notes on the topic: ${topic}. Provide structured content with headings, bullet points, and key concepts highlighted. Format in markdown. Write in Bangla if the topic is in Bangla, otherwise use English.`,
                    message_type: 'note_taking'
                })
            });

            if (!messageResponse.ok) {
                const errorData = await messageResponse.json();
                throw new Error(errorData.error || 'Failed to generate AI notes');
            }

            const data = await messageResponse.json();
            const aiContent = data.ai_message || 'Failed to generate content';

            await addNote({
                title: `AI Notes: ${topic}`,
                content: aiContent
            });
        } catch (err: any) {
            console.error('Error generating AI notes:', err);
            throw err;
        }
    };

    return {
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
    };
};






