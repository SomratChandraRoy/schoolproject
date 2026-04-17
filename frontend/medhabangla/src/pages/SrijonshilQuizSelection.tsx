import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Search,
  Sparkles,
  Trophy,
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
  recommended_difficulty: "easy" | "medium" | "hard";
}

const defaultLevelInfo = (): LevelInfo => ({
  level: 1,
  title: "Rising Starter",
  xp: 0,
  next_level_xp: 120,
  level_progress_percent: 0,
  accuracy: 0,
  total_attempts: 0,
  recommended_difficulty: "medium",
});

const DIFFICULTY_OPTIONS: Array<{
  id: "easy" | "medium" | "hard";
  title: string;
  subtitle: string;
}> = [
  {
    id: "easy",
    title: "Easy",
    subtitle: "বেসিক বোঝাপড়া",
  },
  {
    id: "medium",
    title: "Medium",
    subtitle: "বোর্ড স্ট্যান্ডার্ড",
  },
  {
    id: "hard",
    title: "Hard",
    subtitle: "উচ্চমান বিশ্লেষণ",
  },
];

const mergeSubjects = (...subjectGroups: Subject[][]) => {
  const map = new Map<string, Subject>();

  subjectGroups.forEach((group) => {
    group.forEach((subject) => {
      const existing = map.get(subject.subject_code);
      if (!existing) {
        map.set(subject.subject_code, subject);
        return;
      }

      if (existing.is_compulsory && !subject.is_compulsory) {
        return;
      }

      map.set(subject.subject_code, subject);
    });
  });

  return Array.from(map.values());
};

const SrijonshilQuizSelection: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<"subject" | "chapter">("subject");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    "easy" | "medium" | "hard"
  >("medium");
  const [chapter, setChapter] = useState("");

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectSearch, setSubjectSearch] = useState("");
  const [userClass, setUserClass] = useState<number>(9);
  const [loading, setLoading] = useState(true);

  const [overallLevel, setOverallLevel] = useState<LevelInfo>(
    defaultLevelInfo(),
  );

  useEffect(() => {
    void fetchSubjects();
  }, []);

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

      if (!response.ok) {
        setSubjects(fallbackSubjects);
        setOverallLevel(defaultLevelInfo());
        return;
      }

      const data = await response.json();
      const apiSubjects = Array.isArray(data.subjects)
        ? (data.subjects as Subject[])
        : [];

      setSubjects(mergeSubjects(fallbackSubjects, apiSubjects));

      if (data.overall_level) {
        setOverallLevel(data.overall_level as LevelInfo);
      } else {
        setOverallLevel(defaultLevelInfo());
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

      setSubjects(fallbackSubjects);
      setOverallLevel(defaultLevelInfo());
    } finally {
      setLoading(false);
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

  const handleStartSrijonshil = () => {
    if (!selectedSubject) {
      alert("Please select a subject first.");
      return;
    }

    if (!chapter.trim()) {
      alert("Please enter chapter/topic before starting.");
      return;
    }

    navigate("/quiz/srijonshil", {
      state: {
        subject: selectedSubject.subject_code,
        subjectName: selectedSubject.name,
        classLevel: userClass,
        chapter: chapter.trim(),
        difficulty: selectedDifficulty,
      },
    });
  };

  return (
    <div className="quiz-premium-page min-h-screen">
      <div className="quiz-premium-container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <header className="quiz-glass-panel mb-6 sm:mb-8 p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="block">
              <p className="text-sm uppercase tracking-[0.2em] text-teal-700/80 dark:text-cyan-200/80">
                Srijonshil Studio
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">
                Board Style Srijonshil
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2">
                Quiz start page style, but only for Uddipok + 4-part creative
                board exam questions.
              </p>
            </div>

            <div className="quiz-level-card w-full sm:w-[280px]">
              <div className="flex items-center justify-between mb-2">
                <span className="quiz-level-label inline-flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Level {overallLevel.level}
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Class {userClass}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {overallLevel.title}
              </p>
              <div className="quiz-level-progress mt-3">
                <span
                  className="quiz-level-progress-bar"
                  style={{
                    width: `${Math.max(6, overallLevel.level_progress_percent)}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                Accuracy {overallLevel.accuracy}% • Attempts {overallLevel.total_attempts}
              </p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="quiz-glass-panel p-12 text-center">
            <div className="mx-auto h-12 w-12 rounded-full border-2 border-teal-200 border-t-teal-600 animate-spin" />
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Loading Srijonshil setup...
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
                      value={subjectSearch}
                      onChange={(event) => setSubjectSearch(event.target.value)}
                      placeholder="Search subject for srijonshil exam..."
                      className="quiz-search-input"
                    />
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                  Select one subject. Next step will ask chapter/topic and difficulty.
                </p>

                {filteredSubjects.length === 0 ? (
                  <div className="quiz-empty-state">
                    <BookOpen className="h-8 w-8" />
                    <p className="font-semibold">No subjects matched your search.</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Try a different keyword.
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
                          onClick={() => setSelectedSubject(subject)}
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
                              "উদ্দীপকভিত্তিক সৃজনশীল প্রশ্ন অনুশীলনের জন্য উপযুক্ত বিষয়।"}
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
                        onClick={() => setStep("chapter")}
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
                key="chapter-step"
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
                    Real board format: উদ্দীপক + ক, খ, গ, ঘ
                  </p>
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                    Chapter / Topic
                  </label>
                  <input
                    value={chapter}
                    onChange={(event) => setChapter(event.target.value)}
                    placeholder="Example: গতি, তড়িৎ, ভৌত রাশি"
                    className="quiz-modal-input"
                  />
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-3">
                  Difficulty
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                  {DIFFICULTY_OPTIONS.map((item) => {
                    const selected = selectedDifficulty === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedDifficulty(item.id)}
                        className={`quiz-type-card ${selected ? "is-selected" : ""}`}>
                        <div className="flex items-center justify-between">
                          <h4 className="text-xl font-black text-slate-900 dark:text-white">
                            {item.title}
                          </h4>
                          {selected && (
                            <span className="quiz-selected-pill">
                              <Check className="h-4 w-4" />
                              On
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-teal-700 dark:text-cyan-200 mt-2">
                          {item.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="quiz-level-chip mt-5">
                  <Sparkles className="h-4 w-4" />
                  AI will generate Bangla board-style Srijonshil from your chosen subject and chapter.
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
                    onClick={handleStartSrijonshil}
                    className="quiz-primary-action justify-center">
                    Start Srijonshil
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/quiz/select" className="quiz-secondary-action inline-flex">
            <ArrowLeft className="h-4 w-4" />
            Back to Quiz Modes
          </Link>
          <Link to="/dashboard" className="quiz-secondary-action inline-flex">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SrijonshilQuizSelection;
