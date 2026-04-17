import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Plus,
  Search,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getCurriculumSubjectsForClass } from "../utils/curriculumSubjects";
import "../styles/quiz-premium.css";

interface Subject {
  id: number;
  name: string;
  bengali_title: string;
  subject_code: string;
  class_level: number;
  stream: string | null;
  is_compulsory: boolean;
  icon: string;
  color: string;
  description: string;
}

interface LevelInfo {
  level: number;
  title: string;
  xp: number;
  next_level_xp: number;
  level_progress_percent: number;
  accuracy: number;
  total_attempts: number;
  correct_attempts: number;
  completion_percentage: number;
  ai_questions_answered: number;
  ai_questions_correct: number;
  recommended_difficulty: "easy" | "medium" | "hard";
}

const QUESTION_TYPES = [
  {
    id: "mcq",
    title: "MCQ",
    subtitle: "Fast objective rounds",
    description: "Quick confidence checks with one-tap choices.",
  },
  {
    id: "short",
    title: "Short",
    subtitle: "Clear concise answers",
    description: "Practice precision with focused written replies.",
  },
  {
    id: "long",
    title: "Long",
    subtitle: "Deep explanation mode",
    description: "Build mastery with structured long-form responses.",
  },
];

const CUSTOM_SUBJECTS_STORAGE_KEY = "sopna-custom-quiz-subjects";

const defaultLevelInfo = (): LevelInfo => ({
  level: 1,
  title: "Rising Starter",
  xp: 0,
  next_level_xp: 120,
  level_progress_percent: 0,
  accuracy: 0,
  total_attempts: 0,
  correct_attempts: 0,
  completion_percentage: 0,
  ai_questions_answered: 0,
  ai_questions_correct: 0,
  recommended_difficulty: "easy",
});

const normalizeSubjectCode = (subjectName: string) => {
  const cleaned = subjectName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_");

  return cleaned || "custom_subject";
};

const mergeSubjects = (baseSubjects: Subject[], extraSubjects: Subject[]) => {
  const map = new Map<string, Subject>();
  [...baseSubjects, ...extraSubjects].forEach((subject) => {
    map.set(subject.subject_code, subject);
  });

  return Array.from(map.values());
};

const focusSearchInput = (input: HTMLInputElement | null) => {
  if (!input) {
    return;
  }

  input.focus();
  const cursorPosition = input.value.length;
  input.setSelectionRange(cursorPosition, cursorPosition);
};

const QuizSelection: React.FC = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"subject" | "types">("subject");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>([
    "mcq",
  ]);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectSearch, setSubjectSearch] = useState("");
  const [userClass, setUserClass] = useState<number>(9);
  const [loading, setLoading] = useState(true);

  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectDescription, setNewSubjectDescription] = useState("");
  const [isAddingSubject, setIsAddingSubject] = useState(false);

  const [subjectLevels, setSubjectLevels] = useState<Record<string, LevelInfo>>(
    {},
  );
  const [overallLevel, setOverallLevel] = useState<LevelInfo>(
    defaultLevelInfo(),
  );
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<"easy" | "medium" | "hard">("easy");

  useEffect(() => {
    void fetchSubjects();
  }, []);

  useEffect(() => {
    if (step === "subject" && !showAddSubjectModal) {
      const raf = requestAnimationFrame(() => {
        focusSearchInput(searchInputRef.current);
      });

      const timeout = window.setTimeout(() => {
        focusSearchInput(searchInputRef.current);
      }, 120);

      return () => {
        cancelAnimationFrame(raf);
        window.clearTimeout(timeout);
      };
    }

    return undefined;
  }, [step, showAddSubjectModal]);

  useEffect(() => {
    if (!selectedSubject) {
      setSelectedDifficulty(overallLevel.recommended_difficulty);
      return;
    }

    const nextLevel = subjectLevels[selectedSubject.subject_code];
    if (nextLevel) {
      setSelectedDifficulty(nextLevel.recommended_difficulty);
    }
  }, [selectedSubject, subjectLevels, overallLevel]);

  const parseStoredSubjects = (classLevel: number): Subject[] => {
    try {
      const raw = localStorage.getItem(CUSTOM_SUBJECTS_STORAGE_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .filter((row: Subject) => row.class_level === classLevel)
        .map((row: Subject) => ({
          ...row,
          stream: row.stream || null,
          is_compulsory: Boolean(row.is_compulsory),
          icon: row.icon || "📘",
          color: row.color || "bg-cyan-100",
          description: row.description || "",
        }));
    } catch (error) {
      console.warn("Failed to parse custom subjects from storage:", error);
      return [];
    }
  };

  const storeCustomSubject = (subject: Subject) => {
    let allStored: Subject[] = [];

    try {
      const raw = localStorage.getItem(CUSTOM_SUBJECTS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        allStored = parsed as Subject[];
      }
    } catch (error) {
      console.warn("Failed to read all stored subjects:", error);
    }

    const sameClass = allStored.filter(
      (item) => item.class_level === subject.class_level,
    );
    const otherClasses = allStored.filter(
      (item) => item.class_level !== subject.class_level,
    );

    const mergedClassSubjects = mergeSubjects(sameClass, [subject]);
    localStorage.setItem(
      CUSTOM_SUBJECTS_STORAGE_KEY,
      JSON.stringify([...otherClasses, ...mergedClassSubjects]),
    );
  };

  const fetchSubjects = async () => {
    setLoading(true);

    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const classLevel = Number(user?.class_level || 9);
      setUserClass(classLevel);

      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/quizzes/subjects/?class_level=${classLevel}`,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        },
      );

      const fallbackSubjects: Subject[] = getCurriculumSubjectsForClass(
        classLevel,
      ).map((subject, index) => ({
        id: index + 1,
        name: subject.name,
        bengali_title: subject.bengaliName,
        subject_code: subject.code,
        class_level: classLevel,
        stream: subject.stream || null,
        is_compulsory: subject.isCompulsory,
        icon: "📚",
        color: "bg-sky-100",
        description: "",
      }));

      const localSubjects = parseStoredSubjects(classLevel);

      if (!response.ok) {
        setSubjects(mergeSubjects(fallbackSubjects, localSubjects));
        setOverallLevel(defaultLevelInfo());
        return;
      }

      const data = await response.json();
      const apiSubjects = Array.isArray(data.subjects)
        ? (data.subjects as Subject[])
        : [];

      const mergedSubjects = mergeSubjects(
        apiSubjects.length > 0 ? apiSubjects : fallbackSubjects,
        localSubjects,
      );

      setSubjects(mergedSubjects);

      if (data.overall_level) {
        setOverallLevel(data.overall_level as LevelInfo);
      } else {
        setOverallLevel(defaultLevelInfo());
      }

      if (data.subject_levels && typeof data.subject_levels === "object") {
        setSubjectLevels(data.subject_levels as Record<string, LevelInfo>);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      const userStr = localStorage.getItem("user");
      const fallbackClass = userStr ? Number(JSON.parse(userStr).class_level) : 9;
      const fallbackSubjects = getCurriculumSubjectsForClass(fallbackClass).map(
        (subject, index) => ({
          id: index + 1,
          name: subject.name,
          bengali_title: subject.bengaliName,
          subject_code: subject.code,
          class_level: fallbackClass,
          stream: subject.stream || null,
          is_compulsory: subject.isCompulsory,
          icon: "📚",
          color: "bg-sky-100",
          description: "",
        }),
      );

      setSubjects(
        mergeSubjects(fallbackSubjects, parseStoredSubjects(fallbackClass)),
      );
      setOverallLevel(defaultLevelInfo());
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestionType = (typeId: string) => {
    setSelectedQuestionTypes((previous) => {
      if (previous.includes(typeId)) {
        const next = previous.filter((id) => id !== typeId);
        return next.length > 0 ? next : ["mcq"];
      }

      return [...previous, typeId];
    });
  };

  const handleStartQuiz = () => {
    if (!selectedSubject) {
      alert("Please select a subject first.");
      return;
    }

    if (selectedQuestionTypes.length === 0) {
      alert("Please select at least one question format.");
      return;
    }

    const selectedLevel =
      subjectLevels[selectedSubject.subject_code] || overallLevel || defaultLevelInfo();

    navigate("/quiz", {
      state: {
        subjects: [selectedSubject.subject_code],
        subjectName: selectedSubject.name,
        difficulty: selectedDifficulty,
        classLevel: userClass,
        questionTypes: selectedQuestionTypes,
        levelInfo: selectedLevel,
      },
    });
  };

  const handleCreateSubject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = newSubjectName.trim();
    const trimmedDescription = newSubjectDescription.trim();

    if (!trimmedName) {
      alert("Subject name is required.");
      return;
    }

    setIsAddingSubject(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/quizzes/subjects/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          name: trimmedName,
          description: trimmedDescription,
          class_level: userClass,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const createdSubject = (data.subject || null) as Subject | null;

        if (createdSubject) {
          setSubjects((previous) => mergeSubjects(previous, [createdSubject]));
          setSelectedSubject(createdSubject);
          setSubjectSearch("");

          if (data.level_info) {
            setSubjectLevels((previous) => ({
              ...previous,
              [createdSubject.subject_code]: data.level_info,
            }));
          }
        }
      } else {
        const fallbackSubject: Subject = {
          id: Date.now(),
          name: trimmedName,
          bengali_title: "",
          subject_code: `${normalizeSubjectCode(trimmedName)}_${Date.now()}`,
          class_level: userClass,
          stream: null,
          is_compulsory: false,
          icon: "✨",
          color: "bg-cyan-100",
          description: trimmedDescription,
        };

        setSubjects((previous) => mergeSubjects(previous, [fallbackSubject]));
        setSelectedSubject(fallbackSubject);
        setSubjectSearch("");
        setSubjectLevels((previous) => ({
          ...previous,
          [fallbackSubject.subject_code]: defaultLevelInfo(),
        }));
        storeCustomSubject(fallbackSubject);
      }

      setNewSubjectName("");
      setNewSubjectDescription("");
      setShowAddSubjectModal(false);
    } catch (error) {
      console.error("Failed to create subject:", error);
      alert("Failed to create subject. Please try again.");
    } finally {
      setIsAddingSubject(false);
    }
  };

  const filteredSubjects = useMemo(() => {
    const query = subjectSearch.toLowerCase().trim();
    if (!query) {
      return subjects;
    }

    return subjects.filter((subject) => {
      const haystack = [
        subject.name,
        subject.bengali_title,
        subject.description,
        subject.subject_code,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [subjects, subjectSearch]);

  const selectedLevel = selectedSubject
    ? subjectLevels[selectedSubject.subject_code] || overallLevel
    : overallLevel;

  return (
    <div className="quiz-premium-page min-h-screen">
      <div className="quiz-premium-container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <header className="quiz-glass-panel mb-6 sm:mb-8 p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="hidden sm:block">
              <p className="text-sm uppercase tracking-[0.2em] text-teal-700/80 dark:text-cyan-200/80">
                Quiz Studio
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">
                Premium Practice Flow
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2">
                Search a subject instantly, then launch MCQ, short, and long
                rounds designed for your current level.
              </p>
            </div>

            <div className="quiz-level-card w-full sm:w-[280px]">
              <div className="flex items-center justify-between mb-2">
                <span className="quiz-level-label inline-flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Level {selectedLevel.level}
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Class {userClass}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {selectedLevel.title}
              </p>
              <div className="quiz-level-progress mt-3">
                <span
                  className="quiz-level-progress-bar"
                  style={{
                    width: `${Math.max(6, selectedLevel.level_progress_percent)}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                Accuracy {selectedLevel.accuracy}% • Attempts {selectedLevel.total_attempts}
              </p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="quiz-glass-panel p-12 text-center">
            <div className="mx-auto h-12 w-12 rounded-full border-2 border-teal-200 border-t-teal-600 animate-spin" />
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Loading your quiz setup...
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {step === "subject" ? (
              <motion.section
                key="subject-step"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35 }}
                className="quiz-glass-panel p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="quiz-search-shell flex-1 min-w-0">
                    <Search className="h-5 w-5 text-teal-700/80 dark:text-cyan-200/80" />
                    <input
                      ref={searchInputRef}
                      autoFocus
                      value={subjectSearch}
                      onChange={(event) => setSubjectSearch(event.target.value)}
                      placeholder="Search your subject and start typing..."
                      className="quiz-search-input"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddSubjectModal(true)}
                    className="quiz-plus-button"
                    aria-label="Add subject">
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                  Tap one subject to continue. You can add your own subject from
                  the plus icon.
                </p>

                {filteredSubjects.length === 0 ? (
                  <div className="quiz-empty-state">
                    <BookOpen className="h-8 w-8" />
                    <p className="font-semibold">No subjects matched your search.</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Try a different keyword or add a new subject.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {filteredSubjects.map((subject) => {
                      const selected =
                        selectedSubject?.subject_code === subject.subject_code;

                      return (
                        <button
                          key={subject.subject_code}
                          type="button"
                          onClick={() => {
                            setSelectedSubject(subject);
                          }}
                          className={`quiz-subject-card ${selected ? "is-selected" : ""}`}>
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-2xl leading-none">{subject.icon}</span>
                            {selected && (
                              <span className="quiz-selected-pill">
                                <Check className="h-4 w-4" />
                                Selected
                              </span>
                            )}
                          </div>
                          <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white text-left">
                            {subject.name}
                          </h3>
                          {subject.bengali_title && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-left">
                              {subject.bengali_title}
                            </p>
                          )}
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 text-left line-clamp-2 min-h-[40px]">
                            {subject.description ||
                              "Practice smart with AI-generated questions for this subject."}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}

                <AnimatePresence>
                  {selectedSubject && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setStep("types")}
                        className="quiz-primary-action">
                        Next
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>
            ) : (
              <motion.section
                key="types-step"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35 }}
                className="quiz-glass-panel p-4 sm:p-6">
                <div className="quiz-selected-subject-banner mb-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-teal-700/80 dark:text-cyan-200/80">
                    Selected Subject
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {selectedSubject?.name}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                    Recommended difficulty: {selectedDifficulty.toUpperCase()} •
                    Level {selectedLevel.level}
                  </p>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-3">
                  Choose Question Formats
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                  The subject panel is now hidden. Select one or more quiz modes
                  to continue.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                  {QUESTION_TYPES.map((type) => {
                    const selected = selectedQuestionTypes.includes(type.id);
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => toggleQuestionType(type.id)}
                        className={`quiz-type-card ${selected ? "is-selected" : ""}`}>
                        <div className="flex items-center justify-between">
                          <h4 className="text-xl font-black text-slate-900 dark:text-white">
                            {type.title}
                          </h4>
                          {selected && (
                            <span className="quiz-selected-pill">
                              <Check className="h-4 w-4" />
                              On
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-teal-700 dark:text-cyan-200 mt-2">
                          {type.subtitle}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                          {type.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="quiz-level-chip mt-5">
                  <Sparkles className="h-4 w-4" />
                  AI generation follows your current level and selected subject.
                </div>

                <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 sm:justify-between">
                  <button
                    type="button"
                    onClick={() => setStep("subject")}
                    className="quiz-secondary-action">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={handleStartQuiz}
                    className="quiz-primary-action justify-center">
                    Start Quiz
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        )}

        <div className="mt-6">
          <Link to="/dashboard" className="quiz-secondary-action inline-flex">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {showAddSubjectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="quiz-modal-backdrop"
            onClick={() => setShowAddSubjectModal(false)}>
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="quiz-modal-card"
              onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Add New Subject
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="quiz-icon-action"
                  aria-label="Close popup">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSubject} className="space-y-4">
                <div>
                  <label
                    htmlFor="subject-name"
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Subject Name
                  </label>
                  <input
                    id="subject-name"
                    value={newSubjectName}
                    onChange={(event) => setNewSubjectName(event.target.value)}
                    placeholder="Example: Islamic History"
                    className="quiz-modal-input"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject-description"
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Short Description
                  </label>
                  <textarea
                    id="subject-description"
                    value={newSubjectDescription}
                    onChange={(event) => setNewSubjectDescription(event.target.value)}
                    placeholder="What should this quiz focus on?"
                    className="quiz-modal-input min-h-[108px] resize-none"
                    maxLength={240}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAddingSubject}
                  className={`quiz-primary-action w-full justify-center ${
                    isAddingSubject ? "opacity-70 cursor-not-allowed" : ""
                  }`}>
                  {isAddingSubject ? "Adding Subject..." : "Save Subject"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuizSelection;
