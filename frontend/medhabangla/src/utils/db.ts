/**
 * IndexedDB Database Configuration using Dexie
 * Provides offline storage for notes, quizzes, and cached data
 */

import Dexie, { Table } from "dexie";

// Define interfaces for database tables
export interface Note {
  id?: number;
  serverId?: number;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
  userId?: number;
}

export interface CachedQuiz {
  id: number;
  subject: string;
  classTarget: number;
  difficulty: string;
  questionText: string;
  questionType: string;
  options: Record<string, string>;
  correctAnswer: string;
  explanation: string;
  cachedAt: Date;
}

export interface QuizAttempt {
  id?: number;
  quizId: number;
  selectedAnswer: string;
  isCorrect: boolean;
  attemptedAt: Date;
  synced: boolean;
}

export interface StudySession {
  id?: number;
  serverId?: number;
  subject: string;
  duration: number;
  date: Date;
  synced: boolean;
}

export interface CachedBook {
  id: number;
  title: string;
  author: string;
  classLevel: number;
  category: string;
  language: string;
  coverImage?: string;
  cachedAt: Date;
}

export interface Bookmark {
  id?: number;
  serverId?: number;
  bookId: number;
  pageNumber: number;
  createdAt: Date;
  synced: boolean;
}

export interface AppSettings {
  key: string;
  value: any;
  updatedAt: Date;
}

// Define the database
export class SopanDB extends Dexie {
  notes!: Table<Note, number>;
  cachedQuizzes!: Table<CachedQuiz, number>;
  quizAttempts!: Table<QuizAttempt, number>;
  studySessions!: Table<StudySession, number>;
  cachedBooks!: Table<CachedBook, number>;
  bookmarks!: Table<Bookmark, number>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super("SopanDB");

    this.version(1).stores({
      notes: "++id, serverId, title, createdAt, updatedAt, synced, userId",
      cachedQuizzes: "id, subject, classTarget, difficulty, cachedAt",
      quizAttempts: "++id, quizId, attemptedAt, synced",
      studySessions: "++id, serverId, subject, date, synced",
      cachedBooks: "id, title, classLevel, category, cachedAt",
      bookmarks: "++id, serverId, bookId, synced",
      settings: "key, updatedAt",
    });
  }
}

// Create database instance
export const db = new SopanDB();

// Helper functions for common operations

/**
 * Save a note offline
 */
export async function saveNoteOffline(note: Omit<Note, "id">): Promise<number> {
  return await db.notes.add(note);
}

/**
 * Get all notes
 */
export async function getAllNotes(): Promise<Note[]> {
  return await db.notes.orderBy("updatedAt").reverse().toArray();
}

/**
 * Get unsynced notes
 */
export async function getUnsyncedNotes(): Promise<Note[]> {
  return await db.notes.where("synced").equals(0).toArray();
}

/**
 * Update note
 */
export async function updateNote(
  id: number,
  updates: Partial<Note>,
): Promise<number> {
  return await db.notes.update(id, {
    ...updates,
    updatedAt: new Date(),
  });
}

/**
 * Delete note
 */
export async function deleteNote(id: number): Promise<void> {
  await db.notes.delete(id);
}

/**
 * Mark note as synced
 */
export async function markNoteSynced(
  id: number,
  serverId: number,
): Promise<void> {
  await db.notes.update(id, {
    serverId,
    synced: true,
  });
}

/**
 * Cache quiz for offline access
 */
export async function cacheQuiz(quiz: CachedQuiz): Promise<number> {
  return await db.cachedQuizzes.put(quiz);
}

/**
 * Get cached quizzes
 */
export async function getCachedQuizzes(
  subject?: string,
  classTarget?: number,
): Promise<CachedQuiz[]> {
  let query = db.cachedQuizzes.orderBy("cachedAt").reverse();

  if (subject) {
    query = query.filter((q) => q.subject === subject);
  }

  if (classTarget) {
    query = query.filter((q) => q.classTarget === classTarget);
  }

  return await query.toArray();
}

/**
 * Save quiz attempt offline
 */
export async function saveQuizAttemptOffline(
  attempt: Omit<QuizAttempt, "id">,
): Promise<number> {
  return await db.quizAttempts.add(attempt);
}

/**
 * Get unsynced quiz attempts
 */
export async function getUnsyncedQuizAttempts(): Promise<QuizAttempt[]> {
  return await db.quizAttempts.where("synced").equals(0).toArray();
}

/**
 * Mark quiz attempt as synced
 */
export async function markQuizAttemptSynced(id: number): Promise<void> {
  await db.quizAttempts.update(id, { synced: true });
}

/**
 * Save study session offline
 */
export async function saveStudySessionOffline(
  session: Omit<StudySession, "id">,
): Promise<number> {
  return await db.studySessions.add(session);
}

/**
 * Get unsynced study sessions
 */
export async function getUnsyncedStudySessions(): Promise<StudySession[]> {
  return await db.studySessions.where("synced").equals(0).toArray();
}

/**
 * Mark study session as synced
 */
export async function markStudySessionSynced(
  id: number,
  serverId: number,
): Promise<void> {
  await db.studySessions.update(id, {
    serverId,
    synced: true,
  });
}

/**
 * Cache book for offline access
 */
export async function cacheBook(book: CachedBook): Promise<number> {
  return await db.cachedBooks.put(book);
}

/**
 * Get cached books
 */
export async function getCachedBooks(
  classLevel?: number,
): Promise<CachedBook[]> {
  let query = db.cachedBooks.orderBy("cachedAt").reverse();

  if (classLevel) {
    query = query.filter((b) => b.classLevel === classLevel);
  }

  return await query.toArray();
}

/**
 * Save bookmark offline
 */
export async function saveBookmarkOffline(
  bookmark: Omit<Bookmark, "id">,
): Promise<number> {
  return await db.bookmarks.add(bookmark);
}

/**
 * Get bookmarks for a book
 */
export async function getBookmarkForBook(
  bookId: number,
): Promise<Bookmark | undefined> {
  return await db.bookmarks.where("bookId").equals(bookId).first();
}

/**
 * Get unsynced bookmarks
 */
export async function getUnsyncedBookmarks(): Promise<Bookmark[]> {
  return await db.bookmarks.where("synced").equals(0).toArray();
}

/**
 * Mark bookmark as synced
 */
export async function markBookmarkSynced(
  id: number,
  serverId: number,
): Promise<void> {
  await db.bookmarks.update(id, {
    serverId,
    synced: true,
  });
}

/**
 * Save app setting
 */
export async function saveSetting(key: string, value: any): Promise<string> {
  return await db.settings.put({
    key,
    value,
    updatedAt: new Date(),
  });
}

/**
 * Get app setting
 */
export async function getSetting(key: string): Promise<any> {
  const setting = await db.settings.get(key);
  return setting?.value;
}

/**
 * Clear all cached data (useful for logout)
 */
export async function clearAllData(): Promise<void> {
  await db.notes.clear();
  await db.cachedQuizzes.clear();
  await db.quizAttempts.clear();
  await db.studySessions.clear();
  await db.cachedBooks.clear();
  await db.bookmarks.clear();
  await db.settings.clear();
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  try {
    const [
      notesCount,
      unsyncedNotesCount,
      cachedQuizzesCount,
      unsyncedAttemptsCount,
      unsyncedSessionsCount,
      cachedBooksCount,
      unsyncedBookmarksCount,
    ] = await Promise.all([
      db.notes.count(),
      db.notes.filter((n) => !n.synced).count(),
      db.cachedQuizzes.count(),
      db.quizAttempts.filter((a) => !a.synced).count(),
      db.studySessions.filter((s) => !s.synced).count(),
      db.cachedBooks.count(),
      db.bookmarks.filter((b) => !b.synced).count(),
    ]);

    return {
      notes: {
        total: notesCount,
        unsynced: unsyncedNotesCount,
      },
      quizzes: {
        cached: cachedQuizzesCount,
        unsyncedAttempts: unsyncedAttemptsCount,
      },
      studySessions: {
        unsynced: unsyncedSessionsCount,
      },
      books: {
        cached: cachedBooksCount,
        unsyncedBookmarks: unsyncedBookmarksCount,
      },
    };
  } catch (error) {
    console.error("Error getting database stats:", error);
    return {
      notes: { total: 0, unsynced: 0 },
      quizzes: { cached: 0, unsyncedAttempts: 0 },
      studySessions: { unsynced: 0 },
      books: { cached: 0, unsyncedBookmarks: 0 },
    };
  }
}

/**
 * Sync all unsynced data with server
 */
export async function syncAllData(
  apiBaseUrl: string,
  token: string,
): Promise<{
  success: boolean;
  synced: {
    notes: number;
    quizAttempts: number;
    studySessions: number;
    bookmarks: number;
  };
  errors: string[];
}> {
  const errors: string[] = [];
  const synced = {
    notes: 0,
    quizAttempts: 0,
    studySessions: 0,
    bookmarks: 0,
  };

  try {
    // Sync notes
    const unsyncedNotes = await getUnsyncedNotes();
    for (const note of unsyncedNotes) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/accounts/notes/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({
            title: note.title,
            content: note.content,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          await markNoteSynced(note.id!, data.id);
          synced.notes++;
        } else {
          errors.push(`Failed to sync note: ${note.title}`);
        }
      } catch (error) {
        errors.push(`Error syncing note: ${error}`);
      }
    }

    // Sync quiz attempts
    const unsyncedAttempts = await getUnsyncedQuizAttempts();
    for (const attempt of unsyncedAttempts) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/quizzes/attempt/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({
            quiz_id: attempt.quizId,
            selected_answer: attempt.selectedAnswer,
            is_correct: attempt.isCorrect,
          }),
        });

        if (response.ok) {
          await markQuizAttemptSynced(attempt.id!);
          synced.quizAttempts++;
        } else {
          errors.push(`Failed to sync quiz attempt`);
        }
      } catch (error) {
        errors.push(`Error syncing quiz attempt: ${error}`);
      }
    }

    // Sync study sessions
    const unsyncedSessions = await getUnsyncedStudySessions();
    for (const session of unsyncedSessions) {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/accounts/study-sessions/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token}`,
            },
            body: JSON.stringify({
              subject: session.subject,
              duration: session.duration,
              date: session.date,
            }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          await markStudySessionSynced(session.id!, data.id);
          synced.studySessions++;
        } else {
          errors.push(`Failed to sync study session`);
        }
      } catch (error) {
        errors.push(`Error syncing study session: ${error}`);
      }
    }

    // Sync bookmarks
    const unsyncedBookmarks = await getUnsyncedBookmarks();
    for (const bookmark of unsyncedBookmarks) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/books/bookmarks/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({
            book: bookmark.bookId,
            page_number: bookmark.pageNumber,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          await markBookmarkSynced(bookmark.id!, data.id);
          synced.bookmarks++;
        } else {
          errors.push(`Failed to sync bookmark`);
        }
      } catch (error) {
        errors.push(`Error syncing bookmark: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      synced,
      errors,
    };
  } catch (error) {
    errors.push(`Sync error: ${error}`);
    return {
      success: false,
      synced,
      errors,
    };
  }
}
