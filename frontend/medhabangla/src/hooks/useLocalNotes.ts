import { useState, useEffect } from "react";

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  cloudId?: number;
  source?: "device" | "cloud" | "both";
}

export interface CloudNote {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface SaveOptions {
  syncOnline?: boolean;
}

interface SyncResult {
  uploaded: number;
  downloaded: number;
  merged: number;
}

interface LocalNotes {
  notes: Note[];
  onlineNotes: CloudNote[];
  loading: boolean;
  error: string | null;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  storageType: "filesystem" | "indexeddb";
  isPWAInstalled: boolean;
  selectFolder: () => Promise<void>;
  addNote: (
    note: Omit<Note, "id" | "createdAt" | "updatedAt">,
    options?: SaveOptions,
  ) => Promise<Note>;
  updateNote: (
    id: string,
    updates: Partial<Note>,
    options?: SaveOptions,
  ) => Promise<Note | null>;
  deleteNote: (id: string, options?: SaveOptions) => Promise<void>;
  refreshNotes: () => Promise<void>;
  fetchOnlineNotes: () => Promise<void>;
  syncWithCloud: () => Promise<SyncResult>;
  generateAINotes: (topic: string) => Promise<void>;
  aiRewriteNote: (
    content: string,
    style: "kid" | "premium" | "summary",
  ) => Promise<string>;
  downloadNote: (note: Note) => void;
  downloadAllNotes: () => void;
}

const FOLDER_HANDLE_KEY = "sopan_notes_folder_handle";
const NOTES_INDEX_FILE = "notes_index.json";
const INDEXEDDB_NOTES_STORE = "notes";

export const useLocalNotes = (): LocalNotes => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [onlineNotes, setOnlineNotes] = useState<CloudNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [folderHandle, setFolderHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [storageType, setStorageType] = useState<"filesystem" | "indexeddb">(
    "indexeddb",
  );
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

  const sortByUpdatedAt = (items: Note[]): Note[] =>
    [...items].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

  const normalizeLocalNote = (raw: Partial<Note>): Note => ({
    id: raw.id || Date.now().toString(),
    title: raw.title || "Untitled",
    content: raw.content || "",
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
    cloudId: raw.cloudId,
    source: raw.source || (raw.cloudId ? "both" : "device"),
  });

  const getToken = () => localStorage.getItem("token");

  const normalizeCloudNotes = (payload: unknown): CloudNote[] => {
    if (Array.isArray(payload)) {
      return payload as CloudNote[];
    }

    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      const response = payload as Record<string, unknown>;

      if (Array.isArray(response.results)) {
        return response.results as CloudNote[];
      }

      if (Array.isArray(response.notes)) {
        return response.notes as CloudNote[];
      }

      if (Array.isArray(response.data)) {
        return response.data as CloudNote[];
      }
    }

    return [];
  };

  const cloudRequest = async (path: string, init?: RequestInit) => {
    const token = getToken();
    if (!token) {
      throw new Error("Please login to use cloud notes");
    }

    const response = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
        ...(init?.headers || {}),
      },
    });

    if (!response.ok) {
      let message = "Request failed";
      try {
        const data = await response.json();
        message = data?.error || message;
      } catch {
        message = response.statusText || message;
      }
      throw new Error(message);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  };

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

  useEffect(() => {
    const onOnline = () => {
      fetchOnlineNotes().catch((syncError) => {
        console.error("Error fetching cloud notes on reconnect:", syncError);
      });
    };

    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("online", onOnline);
    };
  }, []);

  // Check if File System Access API is supported
  const isFileSystemSupported = () => {
    try {
      return (
        "showDirectoryPicker" in window &&
        typeof (window as any).showDirectoryPicker === "function"
      );
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
        setStorageType("indexeddb");
        await loadNotesFromIndexedDB();
      }
    };

    initStorage();
  }, []);

  // Open IndexedDB
  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("SopnaNotesDB", 2);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create handles store for folder handles
        if (!db.objectStoreNames.contains("handles")) {
          db.createObjectStore("handles");
        }

        // Create notes store for IndexedDB fallback
        if (!db.objectStoreNames.contains(INDEXEDDB_NOTES_STORE)) {
          db.createObjectStore(INDEXEDDB_NOTES_STORE, { keyPath: "id" });
        }
      };
    });
  };

  // ==================== FILE SYSTEM API METHODS ====================

  const loadSavedFolderHandle = async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction(["handles"], "readonly");
      const store = transaction.objectStore("handles");
      const request = store.get(FOLDER_HANDLE_KEY);

      request.onsuccess = async () => {
        const savedHandle = request.result;
        if (savedHandle) {
          try {
            const permission = await savedHandle.queryPermission({
              mode: "readwrite",
            });
            if (permission === "granted") {
              setFolderHandle(savedHandle);
              setStorageType("filesystem");
              await loadNotesFromFolder(savedHandle);
            } else {
              const newPermission = await savedHandle.requestPermission({
                mode: "readwrite",
              });
              if (newPermission === "granted") {
                setFolderHandle(savedHandle);
                setStorageType("filesystem");
                await loadNotesFromFolder(savedHandle);
              } else {
                setStorageType("indexeddb");
                await loadNotesFromIndexedDB();
              }
            }
          } catch (err) {
            console.error("Error verifying folder permission:", err);
            setStorageType("indexeddb");
            await loadNotesFromIndexedDB();
          }
        } else {
          setStorageType("indexeddb");
          await loadNotesFromIndexedDB();
        }
      };

      request.onerror = () => {
        console.error("Error loading saved folder handle");
        setStorageType("indexeddb");
        loadNotesFromIndexedDB();
      };
    } catch (err) {
      console.error("Error accessing IndexedDB:", err);
      setStorageType("indexeddb");
      await loadNotesFromIndexedDB();
    }
  };

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

  const selectFolder = async () => {
    if (!isFileSystemSupported()) {
      setError(
        "File System Access API is not supported. Using browser storage instead.",
      );
      return;
    }

    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: "readwrite",
        startIn: "documents",
      });

      setFolderHandle(handle);
      setStorageType("filesystem");
      await saveFolderHandle(handle);
      await loadNotesFromFolder(handle);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error selecting folder:", err);
        setError("Failed to select folder. Using browser storage instead.");
        setStorageType("indexeddb");
        await loadNotesFromIndexedDB();
      }
    }
  };

  const loadNotesFromFolder = async (handle: FileSystemDirectoryHandle) => {
    setLoading(true);
    try {
      const indexFileHandle = await handle.getFileHandle(NOTES_INDEX_FILE, {
        create: true,
      });
      const indexFile = await indexFileHandle.getFile();
      const indexText = await indexFile.text();

      if (indexText.trim()) {
        const loadedNotes = JSON.parse(indexText) as Partial<Note>[];
        const normalized = sortByUpdatedAt(loadedNotes.map(normalizeLocalNote));
        setNotes(normalized);
      } else {
        setNotes([]);
      }
    } catch (err) {
      console.error("Error loading notes from folder:", err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

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

  const deleteNoteFile = async (noteId: string) => {
    if (!folderHandle) return;

    try {
      const fileName = `${noteId}.md`;
      await folderHandle.removeEntry(fileName);
    } catch (err) {
      console.error("Error deleting note file:", err);
    }
  };

  // ==================== INDEXEDDB METHODS ====================

  const loadNotesFromIndexedDB = async () => {
    setLoading(true);
    try {
      const db = await openDB();
      const transaction = db.transaction([INDEXEDDB_NOTES_STORE], "readonly");
      const store = transaction.objectStore(INDEXEDDB_NOTES_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const loadedNotes = (request.result || []) as Partial<Note>[];
        const normalized = sortByUpdatedAt(loadedNotes.map(normalizeLocalNote));
        setNotes(normalized);
        setLoading(false);
      };

      request.onerror = () => {
        console.error("Error loading notes from IndexedDB");
        setNotes([]);
        setLoading(false);
      };
    } catch (err) {
      console.error("Error accessing IndexedDB:", err);
      setNotes([]);
      setLoading(false);
    }
  };

  const saveNoteToIndexedDB = async (note: Note) => {
    try {
      const db = await openDB();
      const transaction = db.transaction([INDEXEDDB_NOTES_STORE], "readwrite");
      const store = transaction.objectStore(INDEXEDDB_NOTES_STORE);
      store.put(note);
    } catch (err) {
      console.error("Error saving note to IndexedDB:", err);
      throw err;
    }
  };

  const deleteNoteFromIndexedDB = async (noteId: string) => {
    try {
      const db = await openDB();
      const transaction = db.transaction([INDEXEDDB_NOTES_STORE], "readwrite");
      const store = transaction.objectStore(INDEXEDDB_NOTES_STORE);
      store.delete(noteId);
    } catch (err) {
      console.error("Error deleting note from IndexedDB:", err);
    }
  };

  const saveAllNotesToIndexedDB = async (allNotes: Note[]) => {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(
          [INDEXEDDB_NOTES_STORE],
          "readwrite",
        );
        const store = transaction.objectStore(INDEXEDDB_NOTES_STORE);

        store.clear();
        for (const currentNote of allNotes) {
          store.put(currentNote);
        }

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (err) {
      console.error("Error saving notes batch to IndexedDB:", err);
      throw err;
    }
  };

  const persistNotes = async (updatedNotes: Note[]) => {
    const normalized = sortByUpdatedAt(updatedNotes.map(normalizeLocalNote));
    setNotes(normalized);

    if (storageType === "filesystem" && folderHandle) {
      await saveNotesIndex(normalized);
      for (const currentNote of normalized) {
        await saveNoteFile(currentNote);
      }
      return;
    }

    await saveAllNotesToIndexedDB(normalized);
  };

  const fetchOnlineNotes = async () => {
    if (!navigator.onLine || !getToken()) {
      setOnlineNotes([]);
      return;
    }

    try {
      const data = await cloudRequest("/api/accounts/notes/");
      const normalized = normalizeCloudNotes(data);
      setOnlineNotes(normalized);
    } catch (syncError) {
      console.error("Error loading online notes:", syncError);
      setOnlineNotes([]);
    }
  };

  const createCloudNote = async (title: string, content: string) => {
    const created = (await cloudRequest("/api/accounts/notes/", {
      method: "POST",
      body: JSON.stringify({ title, content }),
    })) as CloudNote;

    return created;
  };

  const updateCloudNote = async (
    cloudId: number,
    payload: { title: string; content: string },
  ) => {
    await cloudRequest(`/api/accounts/notes/${cloudId}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  };

  const removeCloudNote = async (cloudId: number) => {
    await cloudRequest(`/api/accounts/notes/${cloudId}/`, {
      method: "DELETE",
    });
  };

  // ==================== UNIFIED CRUD METHODS ====================

  const addNote = async (
    note: Omit<Note, "id" | "createdAt" | "updatedAt">,
    options?: SaveOptions,
  ) => {
    const newNote: Note = {
      id: Date.now().toString(),
      ...note,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: note.source || "device",
    };

    const updatedNotes = [newNote, ...notes].map(normalizeLocalNote);

    if (storageType === "filesystem" && folderHandle) {
      await saveNoteFile(newNote);
      await saveNotesIndex(sortByUpdatedAt(updatedNotes));
      setNotes(sortByUpdatedAt(updatedNotes));
    } else {
      await saveNoteToIndexedDB(newNote);
      setNotes(sortByUpdatedAt(updatedNotes));
    }

    const syncOnline = !!options?.syncOnline;
    if (syncOnline && navigator.onLine && getToken()) {
      try {
        const created = await createCloudNote(newNote.title, newNote.content);
        const cloudReadyNotes = updatedNotes.map((current) =>
          current.id === newNote.id
            ? {
                ...current,
                cloudId: created.id,
                source: "both" as const,
              }
            : current,
        );
        await persistNotes(cloudReadyNotes);
        setOnlineNotes((previous) => [
          created,
          ...(Array.isArray(previous) ? previous : []),
        ]);
      } catch (syncError) {
        console.error("Cloud save failed for note:", syncError);
        setError("Saved on device, but cloud save failed.");
      }
    }

    return normalizeLocalNote(newNote);
  };

  const updateNote = async (
    id: string,
    updates: Partial<Note>,
    options?: SaveOptions,
  ) => {
    const updatedNotes = notes.map((note) =>
      note.id === id
        ? { ...note, ...updates, updatedAt: new Date().toISOString() }
        : note,
    );

    setNotes(updatedNotes);

    const updatedNote = updatedNotes.find((n) => n.id === id);
    if (updatedNote) {
      if (storageType === "filesystem" && folderHandle) {
        await saveNoteFile(updatedNote);
        await saveNotesIndex(updatedNotes);
      } else {
        await saveNoteToIndexedDB(updatedNote);
      }

      const syncOnline = !!options?.syncOnline;
      if (syncOnline && navigator.onLine && getToken()) {
        try {
          if (updatedNote.cloudId) {
            await updateCloudNote(updatedNote.cloudId, {
              title: updatedNote.title,
              content: updatedNote.content,
            });
          } else {
            const created = await createCloudNote(
              updatedNote.title,
              updatedNote.content,
            );
            const cloudReadyNotes = updatedNotes.map((current) =>
              current.id === updatedNote.id
                ? {
                    ...current,
                    cloudId: created.id,
                    source: "both" as const,
                  }
                : current,
            );
            await persistNotes(cloudReadyNotes);
          }
          await fetchOnlineNotes();
        } catch (syncError) {
          console.error("Cloud update failed for note:", syncError);
          setError("Updated on device, but cloud update failed.");
        }
      }

      return normalizeLocalNote(updatedNote);
    }

    return null;
  };

  const deleteNote = async (id: string, options?: SaveOptions) => {
    const deleting = notes.find((note) => note.id === id);
    const updatedNotes = notes.filter((note) => note.id !== id);
    setNotes(updatedNotes);

    if (storageType === "filesystem" && folderHandle) {
      await deleteNoteFile(id);
      await saveNotesIndex(updatedNotes);
    } else {
      await deleteNoteFromIndexedDB(id);
    }

    const syncOnline = !!options?.syncOnline;
    if (syncOnline && navigator.onLine && getToken() && deleting?.cloudId) {
      try {
        await removeCloudNote(deleting.cloudId);
        await fetchOnlineNotes();
      } catch (syncError) {
        console.error("Cloud delete failed for note:", syncError);
        setError("Deleted on device, but cloud delete failed.");
      }
    }
  };

  const refreshNotes = async () => {
    if (storageType === "filesystem" && folderHandle) {
      await loadNotesFromFolder(folderHandle);
    } else {
      await loadNotesFromIndexedDB();
    }

    await fetchOnlineNotes();
  };

  const syncWithCloud = async (): Promise<SyncResult> => {
    if (!navigator.onLine) {
      throw new Error("You are offline. Reconnect to sync with cloud.");
    }
    if (!getToken()) {
      throw new Error("Please login to sync notes with cloud.");
    }

    setIsSyncing(true);
    setError(null);

    const result: SyncResult = {
      uploaded: 0,
      downloaded: 0,
      merged: 0,
    };

    try {
      let workingNotes = [...notes].map(normalizeLocalNote);

      // Push local notes to cloud
      for (let index = 0; index < workingNotes.length; index += 1) {
        const current = workingNotes[index];
        if (current.cloudId) {
          await updateCloudNote(current.cloudId, {
            title: current.title,
            content: current.content,
          });
          continue;
        }

        const created = await createCloudNote(current.title, current.content);
        workingNotes[index] = {
          ...current,
          cloudId: created.id,
          source: "both",
        };
        result.uploaded += 1;
      }

      // Pull cloud notes and merge
      const cloudResponse = await cloudRequest("/api/accounts/notes/");
      const cloudItems = normalizeCloudNotes(cloudResponse);
      setOnlineNotes(cloudItems);

      for (const cloudNote of cloudItems) {
        const localIndex = workingNotes.findIndex(
          (item) => item.cloudId === cloudNote.id,
        );

        if (localIndex === -1) {
          workingNotes = [
            {
              id: `cloud-${cloudNote.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              cloudId: cloudNote.id,
              title: cloudNote.title,
              content: cloudNote.content,
              createdAt: cloudNote.created_at,
              updatedAt: cloudNote.updated_at,
              source: "cloud",
            },
            ...workingNotes,
          ];
          result.downloaded += 1;
          continue;
        }

        const localUpdated = new Date(
          workingNotes[localIndex].updatedAt,
        ).getTime();
        const cloudUpdated = new Date(cloudNote.updated_at).getTime();

        if (cloudUpdated > localUpdated + 1000) {
          workingNotes[localIndex] = {
            ...workingNotes[localIndex],
            title: cloudNote.title,
            content: cloudNote.content,
            createdAt: cloudNote.created_at,
            updatedAt: cloudNote.updated_at,
            source: "both",
          };
          result.merged += 1;
        } else if (workingNotes[localIndex].source !== "both") {
          workingNotes[localIndex] = {
            ...workingNotes[localIndex],
            source: "both",
          };
        }
      }

      await persistNotes(workingNotes);
      setLastSyncedAt(new Date().toISOString());
      return result;
    } catch (syncError: any) {
      const message = syncError?.message || "Cloud sync failed";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSyncing(false);
    }
  };

  // ==================== DOWNLOAD METHODS ====================

  const downloadNote = (note: Note) => {
    const content = `# ${note.title}\n\nCreated: ${new Date(note.createdAt).toLocaleString()}\nUpdated: ${new Date(note.updatedAt).toLocaleString()}\n\n---\n\n${note.content}`;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title.replace(/[^a-z0-9]/gi, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllNotes = () => {
    const allNotesContent = notes
      .map(
        (note) =>
          `# ${note.title}\n\nCreated: ${new Date(note.createdAt).toLocaleString()}\nUpdated: ${new Date(note.updatedAt).toLocaleString()}\n\n---\n\n${note.content}\n\n${"=".repeat(80)}\n\n`,
      )
      .join("");

    const blob = new Blob([allNotesContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
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
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error(
          "অনুগ্রহ করে লগইন করুন AI ফিচার ব্যবহার করতে (Please login to use AI features)",
        );
      }

      // First create a chat session
      const sessionResponse = await fetch("/api/ai/chat/start/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.error || "Failed to start AI session");
      }

      const sessionData = await sessionResponse.json();
      const sessionId = sessionData.session_id;

      // Now send the message
      const messageResponse = await fetch("/api/ai/chat/message/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: `Generate detailed study notes on the topic: ${topic}. Provide structured content with headings, bullet points, and key concepts highlighted. Format in markdown. Write in Bangla if the topic is in Bangla, otherwise use English.`,
          message_type: "note_taking",
        }),
      });

      if (!messageResponse.ok) {
        const errorData = await messageResponse.json();
        throw new Error(errorData.error || "Failed to generate AI notes");
      }

      const data = await messageResponse.json();
      const aiContent = data.ai_message || "Failed to generate content";

      await addNote(
        {
          title: `AI Notes: ${topic}`,
          content: aiContent,
          source: "device",
        },
        { syncOnline: true },
      );
    } catch (err: any) {
      console.error("Error generating AI notes:", err);
      throw err;
    }
  };

  const aiRewriteNote = async (
    content: string,
    style: "kid" | "premium" | "summary",
  ) => {
    const token = getToken();
    if (!token) {
      throw new Error("Please login to use AI note tools");
    }

    const sessionResponse = await fetch("/api/ai/chat/start/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
    });

    if (!sessionResponse.ok) {
      const errorData = await sessionResponse.json();
      throw new Error(errorData.error || "Failed to start AI session");
    }

    const sessionData = await sessionResponse.json();
    const sessionId = sessionData.session_id;

    const stylePrompt =
      style === "kid"
        ? "Rewrite these notes for a very young learner. Use tiny sentences, fun emojis, and super simple words."
        : style === "premium"
          ? "Rewrite these notes with premium expressive formatting, emotional tone, and emoji highlights while keeping meaning accurate."
          : "Rewrite these notes as a crisp study summary with bullet points and key takeaways.";

    const messageResponse = await fetch("/api/ai/chat/message/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({
        session_id: sessionId,
        message: `${stylePrompt}\n\nOriginal notes:\n${content}`,
        message_type: "note_taking",
      }),
    });

    if (!messageResponse.ok) {
      const errorData = await messageResponse.json();
      throw new Error(errorData.error || "Failed to rewrite with AI");
    }

    const data = await messageResponse.json();
    return data.ai_message || "";
  };

  useEffect(() => {
    if (navigator.onLine) {
      fetchOnlineNotes().catch((syncError) => {
        console.error("Error loading cloud notes:", syncError);
      });
    }
  }, []);

  return {
    notes,
    onlineNotes,
    loading,
    error,
    isSyncing,
    lastSyncedAt,
    storageType,
    isPWAInstalled,
    selectFolder,
    addNote,
    updateNote,
    deleteNote,
    refreshNotes,
    fetchOnlineNotes,
    syncWithCloud,
    generateAINotes,
    aiRewriteNote,
    downloadNote,
    downloadAllNotes,
  };
};
