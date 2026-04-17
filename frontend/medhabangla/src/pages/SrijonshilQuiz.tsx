import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, RefreshCcw, Sparkles, Trophy } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import "../styles/quiz-premium.css";

interface SrijonshilPart {
  label: string;
  question: string;
  max_marks: number;
  model_answer?: string;
}

interface SrijonshilQuestionSet {
  id: number;
  subject: string;
  class_level: number;
  chapter: string;
  difficulty: "easy" | "medium" | "hard";
  uddipok: string;
  questions: SrijonshilPart[];
  provider_used: string;
  is_submitted: boolean;
  created_at: string;
  updated_at: string;
}

interface EvaluationPart {
  label: string;
  marks: number;
  max_marks: number;
  feedback: string;
}

interface EvaluationResult {
  parts: EvaluationPart[];
  total_marks: number;
  overall_feedback: string;
  source: string;
}

interface StartResponse {
  source: "cached" | "ai" | "fallback";
  question_set: SrijonshilQuestionSet;
  generation_warning?: string;
}

const SrijonshilQuiz: React.FC = () => {
  const location = useLocation();
  const { subject, subjectName, classLevel, chapter, difficulty } =
    (location.state as {
      subject?: string;
      subjectName?: string;
      classLevel?: number;
      chapter?: string;
      difficulty?: "easy" | "medium" | "hard";
    }) || {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionSet, setQuestionSet] = useState<SrijonshilQuestionSet | null>(
    null,
  );
  const [answers, setAnswers] = useState<string[]>(["", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [generationWarning, setGenerationWarning] = useState<string>("");

  const hasRequiredParams = Boolean(subject && classLevel && chapter);

  useEffect(() => {
    if (!hasRequiredParams) {
      setError("Missing Srijonshil setup. Please start from Srijonshil selection page.");
      setLoading(false);
      return;
    }

    void fetchQuestionSet(true);
  }, []);

  const fetchQuestionSet = async (reuseLatest: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/quizzes/srijonshil/start/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          subject,
          class_level: classLevel,
          chapter,
          difficulty: difficulty || "medium",
          reuse_latest: reuseLatest,
        }),
      });

      const data = (await response.json()) as StartResponse | { error?: string };

      if (!response.ok || !("question_set" in data)) {
        throw new Error((data as { error?: string }).error || "Failed to generate Srijonshil question set");
      }

      setQuestionSet(data.question_set);
      setGenerationWarning(data.generation_warning || "");
      setResult(null);
      setAnswers(["", "", "", ""]);
    } catch (requestError) {
      console.error("Srijonshil start failed:", requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load Srijonshil question set",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers((previous) => {
      const next = [...previous];
      next[index] = value;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!questionSet) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/quizzes/srijonshil/submit/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          question_set_id: questionSet.id,
          answers,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit Srijonshil answers");
      }

      setResult(data.evaluation as EvaluationResult);
      if (data.question_set) {
        setQuestionSet(data.question_set as SrijonshilQuestionSet);
      }
    } catch (submitError) {
      console.error("Srijonshil submit failed:", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to submit Srijonshil answers",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const totalWords = useMemo(
    () => answers.reduce((sum, answer) => sum + answer.trim().split(/\s+/).filter(Boolean).length, 0),
    [answers],
  );

  if (loading) {
    return (
      <div className="quiz-premium-page min-h-screen">
        <div className="quiz-premium-container max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className="quiz-glass-panel p-12 text-center">
            <div className="mx-auto h-12 w-12 rounded-full border-2 border-teal-200 border-t-teal-600 animate-spin" />
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Preparing your board-style Srijonshil set...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-premium-page min-h-screen">
      <div className="quiz-premium-container max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <header className="quiz-glass-panel p-5 sm:p-7 mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-teal-700/80 dark:text-cyan-200/80">
                Srijonshil Exam Mode
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                {subjectName || subject} • Chapter: {chapter}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2">
                One Uddipok + 4 board-style parts (ক, খ, গ, ঘ). Write answers in Bangla for best evaluation.
              </p>
            </div>

            <div className="quiz-level-card min-w-[220px]">
              <div className="flex items-center justify-between mb-2">
                <span className="quiz-level-label inline-flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Class {questionSet?.class_level || classLevel}
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {String(questionSet?.difficulty || difficulty || "medium").toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                AI Provider: {questionSet?.provider_used || "auto"}
              </p>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                Total words written: {totalWords}
              </p>
            </div>
          </div>
        </header>

        {generationWarning && (
          <div className="quiz-glass-panel p-4 mb-5 border border-amber-300/70 dark:border-amber-500/60">
            <p className="text-sm text-amber-900 dark:text-amber-200">
              Note: {generationWarning}
            </p>
          </div>
        )}

        {error && (
          <div className="quiz-glass-panel p-4 mb-5 border border-red-300/70 dark:border-red-500/60">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {questionSet && (
          <section className="quiz-glass-panel p-5 sm:p-7 mb-5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              উদ্দীপক
            </h2>
            <div className="rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-teal-200/60 dark:border-cyan-500/30 p-4 sm:p-5">
              <p className="text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                {questionSet.uddipok}
              </p>
            </div>

            <div className="mt-6 space-y-5">
              {questionSet.questions.map((part, index) => {
                const partResult = result?.parts?.[index];

                return (
                  <article
                    key={part.label}
                    className="rounded-2xl border border-teal-200/70 dark:border-cyan-500/30 bg-white/70 dark:bg-slate-900/40 p-4 sm:p-5">
                    <div className="flex flex-wrap gap-2 items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {part.label}) {part.question}
                      </h3>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal-100 text-teal-800 dark:bg-cyan-500/20 dark:text-cyan-200">
                        Marks: {part.max_marks}
                      </span>
                    </div>

                    <textarea
                      value={answers[index]}
                      onChange={(event) => handleAnswerChange(index, event.target.value)}
                      disabled={Boolean(result)}
                      rows={index >= 2 ? 7 : 5}
                      className="quiz-modal-input min-h-[132px] resize-y"
                      placeholder="বাংলায় বিস্তারিত উত্তর লিখো..."
                    />

                    {partResult && (
                      <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 p-3">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Score: {partResult.marks}/{partResult.max_marks}
                        </p>
                        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                          Feedback: {partResult.feedback}
                        </p>
                        {part.model_answer && (
                          <p className="mt-2 text-sm text-teal-800 dark:text-cyan-200">
                            Model answer hint: {part.model_answer}
                          </p>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-3 justify-between items-center">
              <div className="quiz-level-chip">
                <Sparkles className="h-4 w-4" />
                {result
                  ? "Evaluation completed. Review feedback and regenerate for a fresh set."
                  : "Submit once to get section-wise marks and feedback."}
              </div>

              <div className="flex flex-wrap gap-3">
                {!result ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={`quiz-primary-action ${submitting ? "opacity-70 cursor-not-allowed" : ""}`}>
                    {submitting ? "Evaluating..." : "Submit Srijonshil"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      void fetchQuestionSet(false);
                    }}
                    className="quiz-primary-action">
                    Generate New Set
                    <RefreshCcw className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {result && (
          <section className="quiz-glass-panel p-5 sm:p-7 mb-5">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Final Result: {result.total_marks}/10
            </h2>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              Evaluation source: {result.source}
            </p>
            <p className="mt-3 text-base text-slate-800 dark:text-slate-200">
              {result.overall_feedback}
            </p>
          </section>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/quiz/srijonshil/select" className="quiz-secondary-action inline-flex">
            <ArrowLeft className="h-4 w-4" />
            Back to Srijonshil Setup
          </Link>
          <Link to="/quiz/select" className="quiz-secondary-action inline-flex">
            <ArrowLeft className="h-4 w-4" />
            Back to Quiz Modes
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SrijonshilQuiz;
