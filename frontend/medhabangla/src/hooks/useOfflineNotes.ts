import { useState, useEffect } from "react";
import Dexie from "dexie";

// Define the Note interface
export interface Note {
  id?: number;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Create Dexie database
class NotesDatabase extends Dexie {
  notes: Dexie.Table<Note, number>;

  constructor() {
    super("SopanNotes");
    this.version(1).stores({
      notes: "++id, title, content, createdAt, updatedAt",
    });
    this.notes = this.table("notes");
  }
}

const db = new NotesDatabase();

// Custom hook for managing offline notes
export const useOfflineNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Load notes from IndexedDB
  useEffect(() => {
    loadNotes();

    // Attempt to sync when the component mounts if we have a token and are online
    const token = localStorage.getItem("token");
    if (navigator.onLine && token) {
      syncNotesWithBackend(token);
    }

    // Add event listener for online status
    const handleOnline = () => {
      const currentToken = localStorage.getItem("token");
      if (currentToken) {
        syncNotesWithBackend(currentToken);
      }
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const loadNotes = async () => {
    try {
      const storedNotes = await db.notes
        .orderBy("createdAt")
        .reverse()
        .toArray();
      setNotes(storedNotes);
      setLoading(false);
    } catch (error) {
      console.error("Error loading notes:", error);
      setLoading(false);
    }
  };

  // Add a new note
  const addNote = async (
    note: Omit<Note, "id" | "createdAt" | "updatedAt">,
  ) => {
    try {
      const newNote = {
        ...note,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const id = await db.notes.add(newNote);
      await loadNotes(); // Refresh the notes list
      return id;
    } catch (error) {
      console.error("Error adding note:", error);
      throw error;
    }
  };

  // Update an existing note
  const updateNote = async (id: number, updates: Partial<Note>) => {
    try {
      await db.notes.update(id, {
        ...updates,
        updatedAt: new Date(),
      });
      await loadNotes(); // Refresh the notes list
    } catch (error) {
      console.error("Error updating note:", error);
      throw error;
    }
  };

  // Delete a note
  const deleteNote = async (id: number) => {
    try {
      await db.notes.delete(id);
      await loadNotes(); // Refresh the notes list
    } catch (error) {
      console.error("Error deleting note:", error);
      throw error;
    }
  };

  // Sync notes with backend (when online)
  const syncNotesWithBackend = async (authToken: string) => {
    try {
      // Get all local notes
      const localNotes = await db.notes.toArray();

      // In a real implementation, you would send these to your backend API
      // For now, we'll just log them
      console.log("Syncing notes with backend:", localNotes);

      const response = await fetch(
        "http://localhost:8000/api/accounts/notes/sync/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${authToken}`,
          },
          body: JSON.stringify({ notes: localNotes }),
        },
      );

      if (response.ok) {
        const syncedNotes = await response.json();
        console.log("Notes synced successfully:", syncedNotes);

        // Update local notes with backend IDs if they were new
        // Ideally we should replace local DB content with backend response to be in sync
        await db.transaction("rw", db.notes, async () => {
          await db.notes.clear();
          await db.notes.bulkAdd(syncedNotes);
        });

        await loadNotes();
      }
    } catch (error) {
      console.error("Error syncing notes with backend:", error);
      // throw error; // Don't throw to avoid breaking UI if offline
    }
  };

  return {
    notes,
    loading,
    addNote,
    updateNote,
    deleteNote,
    refreshNotes: loadNotes,
    syncNotesWithBackend,
  };
};
