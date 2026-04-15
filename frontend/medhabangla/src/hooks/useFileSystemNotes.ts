import { useState, useEffect } from "react";

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface FileSystemNotes {
  notes: Note[];
  loading: boolean;
  error: string | null;
  folderSelected: boolean;
  isPWAInstalled: boolean;
  selectFolder: () => Promise<void>;
  addNote: (
    note: Omit<Note, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  refreshNotes: () => Promise<void>;
  generateAINotes: (topic: string) => Promise<void>;
}

const FOLDER_HANDLE_KEY = "sopna_notes_folder_handle";
const NOTES_INDEX_FILE = "notes_index.json";

export const useFileSystemNotes = (): FileSystemNotes => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [folderHandle, setFolderHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [folderSelected, setFolderSelected] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

  // Check if PWA is installed
  useEffect(() => {
    const checkPWAInstalled = () => {
      const isStandalone = window.matchMedia(
        "(display-mode: standalone)",
      ).matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsPWAInstalled(isStandalone || isIOSStandalone);
    };

    checkPWAInstalled();
  }, []);

  // Check if File System Access API is supported
  const isFileSystemSupported = () => {
    // Check if API exists and is not disabled by browser settings
    try {
      return (
        "showDirectoryPicker" in window &&
        typeof (window as any).showDirectoryPicker === "function"
      );
    } catch {
      return false;
    }
  };

  // Load saved folder handle from IndexedDB
  useEffect(() => {
    const loadSavedFolderHandle = async () => {
      if (!isFileSystemSupported()) {
        setError(
          "File System Access API is not supported in this browser. Please use Chrome, Edge, or Opera.",
        );
        setLoading(false);
        return;
      }

      try {
        // Try to get saved folder handle from IndexedDB
        const db = await openDB();
        const transaction = db.transaction(["handles"], "readonly");
        const store = transaction.objectStore("handles");
        const request = store.get(FOLDER_HANDLE_KEY);

        request.onsuccess = async () => {
          const savedHandle = request.result;
          if (savedHandle) {
            try {
              // Verify permission
              const permission = await savedHandle.queryPermission({
                mode: "readwrite",
              });
              if (permission === "granted") {
                setFolderHandle(savedHandle);
                setFolderSelected(true);
                await loadNotesFromFolder(savedHandle);
              } else {
                // Request permission again
                const newPermission = await savedHandle.requestPermission({
                  mode: "readwrite",
                });
                if (newPermission === "granted") {
                  setFolderHandle(savedHandle);
                  setFolderSelected(true);
                  await loadNotesFromFolder(savedHandle);
                } else {
                  setLoading(false);
                }
              }
            } catch (err) {
              console.error("Error verifying folder permission:", err);
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        };

        request.onerror = () => {
          console.error("Error loading saved folder handle");
          setLoading(false);
        };
      } catch (err) {
        console.error("Error accessing IndexedDB:", err);
        setLoading(false);
      }
    };

    loadSavedFolderHandle();
  }, []);

  // Open IndexedDB for storing folder handle
  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("SopnaFileSystem", 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("handles")) {
          db.createObjectStore("handles");
        }
      };
    });
  };

  // Save folder handle to IndexedDB
  const saveFolderHandle = async (handle: FileSystemDirectoryHandle) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(["handles"], "readwrite");
      const store = transaction.objectStore("handles");
      store.put(handle, FOLDER_HANDLE_KEY);
    } catch (err) {
      console.error("Error saving folder handle:", err);
    }
  };

  // Select folder for saving notes
  const selectFolder = async () => {
    if (!isFileSystemSupported()) {
      setError("File System Access API is not supported in this browser.");
      return;
    }

    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: "readwrite",
        startIn: "documents",
      });

      setFolderHandle(handle);
      setFolderSelected(true);
      await saveFolderHandle(handle);
      await loadNotesFromFolder(handle);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error selecting folder:", err);
        setError("Failed to select folder. Please try again.");
      }
    }
  };

  // Load notes from folder
  const loadNotesFromFolder = async (handle: FileSystemDirectoryHandle) => {
    setLoading(true);
    try {
      // Try to read the index file
      const indexFileHandle = await handle.getFileHandle(NOTES_INDEX_FILE, {
        create: true,
      });
      const indexFile = await indexFileHandle.getFile();
      const indexText = await indexFile.text();

      if (indexText.trim()) {
        const loadedNotes = JSON.parse(indexText);
        setNotes(loadedNotes);
      } else {
        setNotes([]);
      }
    } catch (err) {
      console.error("Error loading notes:", err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  // Save notes index to folder
  const saveNotesIndex = async (updatedNotes: Note[]) => {
    if (!folderHandle) return;

    try {
      const indexFileHandle = await folderHandle.getFileHandle(
        NOTES_INDEX_FILE,
        { create: true },
      );
      const writable = await indexFileHandle.createWritable();
      await writable.write(JSON.stringify(updatedNotes, null, 2));
      await writable.close();
    } catch (err) {
      console.error("Error saving notes index:", err);
      throw err;
    }
  };

  // Save individual note file
  const saveNoteFile = async (note: Note) => {
    if (!folderHandle) return;

    try {
      const fileName = `${note.id}.md`;
      const fileHandle = await folderHandle.getFileHandle(fileName, {
        create: true,
      });
      const writable = await fileHandle.createWritable();

      const content = `# ${note.title}\n\nCreated: ${new Date(note.createdAt).toLocaleString()}\nUpdated: ${new Date(note.updatedAt).toLocaleString()}\n\n---\n\n${note.content}`;

      await writable.write(content);
      await writable.close();
    } catch (err) {
      console.error("Error saving note file:", err);
      throw err;
    }
  };

  // Delete note file
  const deleteNoteFile = async (noteId: string) => {
    if (!folderHandle) return;

    try {
      const fileName = `${noteId}.md`;
      await folderHandle.removeEntry(fileName);
    } catch (err) {
      console.error("Error deleting note file:", err);
    }
  };

  // Add new note
  const addNote = async (
    note: Omit<Note, "id" | "createdAt" | "updatedAt">,
  ) => {
    if (!folderHandle) {
      setError("Please select a folder first");
      return;
    }

    const newNote: Note = {
      id: Date.now().toString(),
      ...note,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);

    await saveNoteFile(newNote);
    await saveNotesIndex(updatedNotes);
  };

  // Update note
  const updateNote = async (id: string, updates: Partial<Note>) => {
    if (!folderHandle) return;

    const updatedNotes = notes.map((note) =>
      note.id === id
        ? { ...note, ...updates, updatedAt: new Date().toISOString() }
        : note,
    );

    setNotes(updatedNotes);

    const updatedNote = updatedNotes.find((n) => n.id === id);
    if (updatedNote) {
      await saveNoteFile(updatedNote);
      await saveNotesIndex(updatedNotes);
    }
  };

  // Delete note
  const deleteNote = async (id: string) => {
    if (!folderHandle) return;

    const updatedNotes = notes.filter((note) => note.id !== id);
    setNotes(updatedNotes);

    await deleteNoteFile(id);
    await saveNotesIndex(updatedNotes);
  };

  // Refresh notes
  const refreshNotes = async () => {
    if (folderHandle) {
      await loadNotesFromFolder(folderHandle);
    }
  };

  // Generate AI notes
  const generateAINotes = async (topic: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Please login to use AI features");
      }

      const response = await fetch("/api/ai/chat/message/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          session_id: "notes_" + Date.now(),
          message: `Generate detailed study notes on the topic: ${topic}. Provide structured content with headings, bullet points, and key concepts highlighted. Format in markdown.`,
          message_type: "note_taking",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate AI notes");
      }

      const data = await response.json();
      const aiContent = data.ai_message || "Failed to generate content";

      await addNote({
        title: `AI Notes: ${topic}`,
        content: aiContent,
      });
    } catch (err: any) {
      console.error("Error generating AI notes:", err);
      throw err;
    }
  };

  return {
    notes,
    loading,
    error,
    folderSelected,
    isPWAInstalled,
    selectFolder,
    addNote,
    updateNote,
    deleteNote,
    refreshNotes,
    generateAINotes,
  };
};
