import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Brain,
  CheckCircle2,
  Cloud,
  CloudOff,
  Download,
  FolderOpen,
  Heart,
  Palette,
  Pencil,
  RefreshCw,
  Rocket,
  Save,
  Search,
  Smile,
  Sparkles,
  Star,
  Trash2,
  Upload,
  Wand2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Note, useLocalNotes } from "../hooks/useLocalNotes";

type SaveMode = "offline" | "online" | "both";
type Mood = "happy" | "calm" | "focus";

const MOOD_THEMES: Record<
  Mood,
  {
    label: string;
    subtitle: string;
    wrapper: string;
    chip: string;
    burst: string[];
  }
> = {
  happy: {
    label: "Happy",
    subtitle: "Playful and bright",
    wrapper:
      "from-yellow-50 via-rose-50 to-orange-100 dark:from-yellow-950/40 dark:via-rose-950/20 dark:to-orange-950/40",
    chip: "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-100",
    burst: ["🌟", "🎉", "💛", "🧸", "✨"],
  },
  calm: {
    label: "Calm",
    subtitle: "Soft and peaceful",
    wrapper:
      "from-cyan-50 via-sky-50 to-blue-100 dark:from-cyan-950/30 dark:via-blue-950/20 dark:to-slate-950/40",
    chip: "bg-cyan-100 text-cyan-900 dark:bg-cyan-900/40 dark:text-cyan-100",
    burst: ["💙", "☁️", "🌈", "✨", "🫧"],
  },
  focus: {
    label: "Focus",
    subtitle: "Sharp and premium",
    wrapper:
      "from-emerald-50 via-teal-50 to-indigo-100 dark:from-emerald-950/30 dark:via-slate-950/20 dark:to-indigo-950/40",
    chip: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100",
    burst: ["⚡", "🚀", "💎", "✨", "🌠"],
  },
};

const KID_TEMPLATES = [
  {
    emoji: "🧠",
    title: "I learned",
    content: "Today I learned:\n-\n-\n-\nIt was: fun / easy / hard",
  },
  {
    emoji: "📘",
    title: "Story note",
    content: "My story:\nOnce upon a time...\n\nThe end.",
  },
  {
    emoji: "➕",
    title: "Math magic",
    content: "Math idea:\n- Formula:\n- Example:\n- My answer:",
  },
  {
    emoji: "❤️",
    title: "Feeling note",
    content: "I feel:\nBecause:\nI can do this next:",
  },
];

const NotesFileSystem: React.FC = () => {
  const {
    notes,
    onlineNotes,
    loading,
    error,
    isSyncing,
    lastSyncedAt,
    storageType,
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
  } = useLocalNotes();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isAdding, setIsAdding] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [draft, setDraft] = useState({ title: "", content: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [saveMode, setSaveMode] = useState<SaveMode>("both");
  const [mood, setMood] = useState<Mood>("happy");
  const [kidMode, setKidMode] = useState(true);
  const [aiTopic, setAiTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiEditing, setIsAiEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showBurst, setShowBurst] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  const activeTheme = MOOD_THEMES[mood];
  const shouldSyncOnline = isOnline && saveMode !== "offline";

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      return;
    }

    fetchOnlineNotes().catch((syncError) => {
      console.error("Error loading online notes:", syncError);
    });
  }, [isOnline]);

  useEffect(() => {
    if (!statusMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setStatusMessage(null);
    }, 2800);

    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return notes;
    }

    return notes.filter((note) => {
      return (
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
      );
    });
  }, [notes, searchQuery]);

  const safeOnlineNotes = useMemo(() => {
    return Array.isArray(onlineNotes) ? onlineNotes : [];
  }, [onlineNotes]);

  const cloudOnlyCount = useMemo(() => {
    return safeOnlineNotes.filter((cloudItem) => {
      return !notes.some((note) => note.cloudId === cloudItem.id);
    }).length;
  }, [safeOnlineNotes, notes]);

  const formatDate = (dateValue: string) => {
    const date = new Date(dateValue);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const triggerBurst = () => {
    setBurstKey((previous) => previous + 1);
    setShowBurst(true);
    window.setTimeout(() => {
      setShowBurst(false);
    }, 1100);
  };

  const resetComposer = () => {
    setDraft({ title: "", content: "" });
    setIsAdding(false);
    setEditingNote(null);
  };

  const openNewNote = () => {
    setEditingNote(null);
    setDraft({ title: "", content: "" });
    setIsAdding(true);
  };

  const openEdit = (note: Note) => {
    setEditingNote(note);
    setDraft({ title: note.title, content: note.content });
    setIsAdding(true);
    setSelectedNote(null);
  };

  const applyTemplate = (template: (typeof KID_TEMPLATES)[number]) => {
    setDraft({
      title: `${template.emoji} ${template.title}`,
      content: template.content,
    });
    setIsAdding(true);
    setEditingNote(null);
  };

  const handleAddNote = async () => {
    if (!draft.title.trim() || !draft.content.trim()) {
      return;
    }

    try {
      await addNote(
        {
          title: draft.title.trim(),
          content: draft.content.trim(),
          source: shouldSyncOnline ? "both" : "device",
        },
        { syncOnline: shouldSyncOnline },
      );
      resetComposer();
      triggerBurst();
      setStatusMessage(
        shouldSyncOnline
          ? "Magic saved to device + cloud"
          : "Magic saved on your device",
      );
    } catch (saveError) {
      console.error("Add note error:", saveError);
      alert("Could not save the note. Please try again.");
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote || !draft.title.trim() || !draft.content.trim()) {
      return;
    }

    try {
      await updateNote(
        editingNote.id,
        {
          title: draft.title.trim(),
          content: draft.content.trim(),
        },
        { syncOnline: shouldSyncOnline },
      );
      resetComposer();
      triggerBurst();
      setStatusMessage("Note updated");
    } catch (updateError) {
      console.error("Update note error:", updateError);
      alert("Could not update this note. Please try again.");
    }
  };

  const handleDeleteNote = async (note: Note) => {
    const confirmed = window.confirm("Delete this note?");
    if (!confirmed) {
      return;
    }

    try {
      await deleteNote(note.id, { syncOnline: shouldSyncOnline });
      setSelectedNote(null);
      setStatusMessage("Note deleted");
    } catch (deleteError) {
      console.error("Delete note error:", deleteError);
      alert("Could not delete this note. Please try again.");
    }
  };

  const handleSyncNow = async () => {
    try {
      const result = await syncWithCloud();
      setStatusMessage(
        `Sync done: ${result.uploaded} uploaded, ${result.downloaded} downloaded, ${result.merged} merged`,
      );
      triggerBurst();
    } catch (syncError: any) {
      console.error("Sync error:", syncError);
      alert(syncError?.message || "Could not sync with cloud right now.");
    }
  };

  const handleGenerateAI = async () => {
    const topic = aiTopic.trim();
    if (!topic) {
      alert("Type a topic first.");
      return;
    }

    setIsGenerating(true);
    try {
      await generateAINotes(topic);
      setAiTopic("");
      triggerBurst();
      setStatusMessage("AI note is ready");
    } catch (aiError: any) {
      console.error("AI generate error:", aiError);
      alert(aiError?.message || "Could not generate AI notes right now.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiRewrite = async (
    note: Note,
    style: "kid" | "premium" | "summary",
  ) => {
    setIsAiEditing(true);
    try {
      const aiContent = await aiRewriteNote(note.content, style);
      await updateNote(
        note.id,
        {
          content: aiContent,
          title:
            style === "premium"
              ? `${note.title} ✨`
              : style === "kid"
                ? `${note.title} 🧸`
                : note.title,
        },
        { syncOnline: shouldSyncOnline },
      );

      if (selectedNote?.id === note.id) {
        setSelectedNote({
          ...note,
          content: aiContent,
          title:
            style === "premium"
              ? `${note.title} ✨`
              : style === "kid"
                ? `${note.title} 🧸`
                : note.title,
        });
      }

      triggerBurst();
      setStatusMessage("AI magic applied");
    } catch (aiError: any) {
      console.error("AI rewrite error:", aiError);
      alert(aiError?.message || "Could not rewrite this note with AI.");
    } finally {
      setIsAiEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-blue-500" />
          <p className="text-slate-700 dark:text-slate-200">
            Loading magic notes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${activeTheme.wrapper}`}>
      <AnimatePresence>
        {showBurst && (
          <div className="pointer-events-none fixed inset-0 z-50">
            {activeTheme.burst.map((emoji, index) => (
              <motion.span
                key={`${burstKey}-${emoji}-${index}`}
                className="absolute left-1/2 top-1/2 text-4xl"
                initial={{ opacity: 0, y: 20, x: 0, scale: 0.8 }}
                animate={{
                  opacity: [0, 1, 0],
                  y: -200,
                  x: (index - 2) * 70,
                  scale: [0.8, 1.2, 0.7],
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.05, delay: index * 0.04 }}>
                {emoji}
              </motion.span>
            ))}
          </div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/40 bg-white/70 p-5 shadow-xl backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
                <Sparkles className="h-8 w-8 text-amber-500" />
                Magic Notes
              </h1>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 sm:text-base">
                Easy enough for a little kid. Powerful enough for serious study.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs sm:text-sm">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {isOnline ? (
                    <Wifi className="h-4 w-4" />
                  ) : (
                    <WifiOff className="h-4 w-4" />
                  )}
                  {isOnline ? "Online" : "Offline"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {storageType === "filesystem" ? (
                    <FolderOpen className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {storageType === "filesystem"
                    ? "Folder storage"
                    : "Browser storage"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <Cloud className="h-4 w-4" />
                  Cloud notes: {safeOnlineNotes.length}
                </span>
                {!!cloudOnlyCount && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                    <Upload className="h-4 w-4" />
                    {cloudOnlyCount} cloud-only waiting to import
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={refreshNotes}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button
                onClick={selectFolder}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                <FolderOpen className="h-4 w-4" />
                Folder
              </button>
              <button
                onClick={downloadAllNotes}
                disabled={notes.length === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                <Download className="h-4 w-4" />
                Download all
              </button>
              <button
                onClick={handleSyncNow}
                disabled={isSyncing || !isOnline}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                {isOnline ? (
                  <Cloud className="h-4 w-4" />
                ) : (
                  <CloudOff className="h-4 w-4" />
                )}
                {isSyncing ? "Syncing..." : "Sync cloud"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            <div className="rounded-2xl bg-white/80 p-4 dark:bg-slate-800/80">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Save mode
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs font-bold sm:text-sm">
                {(
                  [
                    ["offline", "Device"],
                    ["online", "Cloud"],
                    ["both", "Both"],
                  ] as Array<[SaveMode, string]>
                ).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setSaveMode(value)}
                    className={`rounded-xl px-2 py-2 transition ${
                      saveMode === value
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white/80 p-4 dark:bg-slate-800/80">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Theme mood
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs font-bold sm:text-sm">
                {(
                  [
                    ["happy", Smile],
                    ["calm", Heart],
                    ["focus", Rocket],
                  ] as Array<
                    [Mood, React.ComponentType<{ className?: string }>]
                  >
                ).map(([value, Icon]) => (
                  <button
                    key={value}
                    onClick={() => {
                      setMood(value);
                      triggerBurst();
                    }}
                    className={`inline-flex items-center justify-center gap-1 rounded-xl px-2 py-2 transition ${
                      mood === value
                        ? `${activeTheme.chip} ring-1 ring-slate-300 dark:ring-slate-600`
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                    }`}>
                    <Icon className="h-4 w-4" />
                    {MOOD_THEMES[value].label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {activeTheme.subtitle}
              </p>
            </div>

            <div className="rounded-2xl bg-white/80 p-4 dark:bg-slate-800/80">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                AI helper
              </p>
              <div className="flex gap-2">
                <input
                  value={aiTopic}
                  onChange={(event) => setAiTopic(event.target.value)}
                  placeholder={
                    kidMode
                      ? "Example: Sun, Cat, ABC"
                      : "Type a topic for AI notes"
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                />
                <button
                  onClick={handleGenerateAI}
                  disabled={!isOnline || isGenerating}
                  className="inline-flex items-center gap-1 rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">
                  <Bot className="h-4 w-4" />
                  {isGenerating ? "..." : "Go"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <button
              onClick={() => setKidMode((previous) => !previous)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
              {kidMode ? (
                <Brain className="h-4 w-4" />
              ) : (
                <Palette className="h-4 w-4" />
              )}
              {kidMode ? "Kid mode: ON" : "Kid mode: OFF"}
            </button>

            {lastSyncedAt && (
              <span className="rounded-full bg-white px-3 py-1.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Last sync: {formatDate(lastSyncedAt)}
              </span>
            )}

            {statusMessage && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
                {statusMessage}
              </span>
            )}
          </div>

          <div className="mt-4 relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={
                kidMode
                  ? "Find your note by a word"
                  : "Search title or note content"
              }
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </motion.div>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-200">
            {error}
          </div>
        )}

        {(isAdding || editingNote) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 rounded-3xl border border-white/40 bg-white/80 p-5 shadow-xl dark:border-slate-700/60 dark:bg-slate-900/80 sm:p-6">
            <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">
              {editingNote ? "Edit note" : "Create a new note"}
            </h2>
            <div className="space-y-3">
              <input
                value={draft.title}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    title: event.target.value,
                  }))
                }
                placeholder={kidMode ? "Give your note a happy name" : "Title"}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
              <textarea
                value={draft.content}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    content: event.target.value,
                  }))
                }
                rows={kidMode ? 8 : 12}
                placeholder={
                  kidMode
                    ? "Write with tiny steps. Example: I learned about stars."
                    : "Write your notes in plain text or markdown"
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  onClick={resetComposer}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                  Cancel
                </button>
                <button
                  onClick={editingNote ? handleUpdateNote : handleAddNote}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                  <Save className="h-4 w-4" />
                  {editingNote ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {!isAdding && !editingNote && (
          <div className="mt-5 rounded-3xl border border-white/40 bg-white/80 p-5 shadow-xl dark:border-slate-700/60 dark:bg-slate-900/80 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Quick start
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Tap a template and start writing in one click.
                </p>
              </div>
              <button
                onClick={openNewNote}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                <Pencil className="h-4 w-4" />
                New note
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {KID_TEMPLATES.map((template) => (
                <button
                  key={template.title}
                  onClick={() => applyTemplate(template)}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
                  <div className="text-2xl">{template.emoji}</div>
                  <p className="mt-2 font-bold text-slate-900 dark:text-white">
                    {template.title}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          {filteredNotes.length === 0 ? (
            <div className="rounded-3xl border border-white/40 bg-white/80 px-6 py-12 text-center shadow-xl dark:border-slate-700/60 dark:bg-slate-900/80">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {searchQuery ? "No matching notes" : "Your note world is empty"}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {searchQuery
                  ? "Try another keyword."
                  : "Create your first note and watch the page sparkle."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence>
                {filteredNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="rounded-3xl border border-white/40 bg-white/85 p-5 shadow-lg transition hover:shadow-xl dark:border-slate-700/60 dark:bg-slate-900/85">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-lg font-bold text-slate-900 dark:text-white">
                        {note.title}
                      </h3>
                      <button
                        onClick={() => downloadNote(note)}
                        title="Download"
                        className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="line-clamp-4 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
                      {note.content}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {formatDate(note.updatedAt)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 ${
                          note.source === "both"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                            : note.source === "cloud"
                              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                        }`}>
                        {note.source === "both"
                          ? "Device + Cloud"
                          : note.source === "cloud"
                            ? "Cloud"
                            : "Device"}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedNote(note)}
                        className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700">
                        Open
                      </button>
                      <button
                        onClick={() => openEdit(note)}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note)}
                        className="rounded-xl border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 dark:border-rose-700 dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-rose-900/20">
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setSelectedNote(null)}>
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-white/40 bg-white dark:border-slate-700 dark:bg-slate-900"
              onClick={(event) => event.stopPropagation()}>
              <div className="border-b border-slate-200 p-5 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedNote.title}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Updated {formatDate(selectedNote.updatedAt)}
                </p>
              </div>

              <div className="max-h-[52vh] overflow-y-auto p-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">
                  {selectedNote.content}
                </p>
              </div>

              <div className="border-t border-slate-200 p-4 dark:border-slate-700">
                <div className="mb-3 grid gap-2 sm:grid-cols-3">
                  <button
                    onClick={() => handleAiRewrite(selectedNote, "kid")}
                    disabled={isAiEditing || !isOnline}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-fuchsia-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-50">
                    <Wand2 className="h-4 w-4" />
                    AI kid style
                  </button>
                  <button
                    onClick={() => handleAiRewrite(selectedNote, "premium")}
                    disabled={isAiEditing || !isOnline}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
                    <Star className="h-4 w-4" />
                    AI premium style
                  </button>
                  <button
                    onClick={() => handleAiRewrite(selectedNote, "summary")}
                    disabled={isAiEditing || !isOnline}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50">
                    <Bot className="h-4 w-4" />
                    AI summary
                  </button>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    onClick={() => downloadNote(selectedNote)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                  <button
                    onClick={() => openEdit(selectedNote)}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700">
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteNote(selectedNote)}
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotesFileSystem;
