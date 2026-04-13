import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AILearningModal from "../components/AILearningModal";
import QuizResultsLoading from "../components/QuizResultsLoading";
import {
  evaluateQuizAnswer,
  formatAnswerForDisplay,
  getOptionEntries,
} from "../utils/quizEvaluation";

const Quiz: React.FC = () => {
  const QUIZ_CACHE_TTL_MS = 10 * 60 * 1000;
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: string;
  }>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [mistakes, setMistakes] = useState<{ [key: number]: boolean }>({});
  const [quizData, setQuizData] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [aiAnalysisReport, setAiAnalysisReport] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [aiRemediation, setAiRemediation] = useState<string | null>(null);
  const [loadingRemediation, setLoadingRemediation] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMoreQuestions, setLoadingMoreQuestions] = useState(false);
  const [quizProgress, setQuizProgress] = useState<any>(null);
  const [submittedQuestionIds, setSubmittedQuestionIds] = useState<
    Record<string, boolean>
  >({});

  const location = useLocation();
  const selectedQuestionTypes = (() => {
    const state: any = location.state || {};
    const rawTypes =
      Array.isArray(state.questionTypes) && state.questionTypes.length > 0
        ? state.questionTypes
        : [state.questionType || "mcq"];

    const normalized = Array.from(
      new Set(
        rawTypes
          .map((type: any) =>
            String(type || "")
              .trim()
              .toLowerCase(),
          )
          .filter((type: string) => ["mcq", "short", "long"].includes(type)),
      ),
    );

    return normalized.length > 0 ? normalized : ["mcq"];
  })();

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoadError(null);

        const { subjects, difficulty, classLevel } = location.state || {};

        if (!subjects || subjects.length === 0) {
          alert("Please select at least one subject");
          setLoading(false);
          return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
          alert("Please login first");
          setLoading(false);
          return;
        }

        const selectedSubject = subjects[0];
        const cacheKey = `quiz_cache_${selectedSubject}_${classLevel}_${selectedQuestionTypes.join("_")}`;

        const cachedRaw = sessionStorage.getItem(cacheKey);
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw);
            if (
              cached?.timestamp &&
              Date.now() - cached.timestamp < QUIZ_CACHE_TTL_MS &&
              cached?.data
            ) {
              setQuizData(cached.data);
              setLoading(false);
              return;
            }
          } catch (cacheErr) {
            console.warn("Failed to parse quiz cache:", cacheErr);
          }
        }

        let queryParams = `subject=${selectedSubject}&class_level=${classLevel}`;
        queryParams += `&question_types=${selectedQuestionTypes.join(",")}`;

        let response: Response | null = null;
        let data: any = null;

        for (let attempt = 0; attempt < 15; attempt++) {
          response = await fetch(`/api/quizzes/?${queryParams}`, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            break;
          }

          data = await response.json();
          const maybeResults = data?.results || data;
          const hasResults =
            Array.isArray(maybeResults) && maybeResults.length > 0;

          if (hasResults || data?.source !== "generation_started") {
            break;
          }

          await sleep(1500);
        }

        if (!response || !response.ok) {
          const statusCode = response ? response.status : "network";
          setLoadError(
            `Failed to load quiz (${statusCode}). Please try again.`,
          );
          setQuizData(null);
          setLoading(false);
          return;
        }

        if (!data) {
          data = await response.json();
        }

        let questions = data.results || data;

        questions = questions.filter((q: any) => {
          if (q.question_type !== "mcq") {
            return true;
          }

          const entries = getOptionEntries(q.options);
          return entries.length >= 2;
        });

        questions = questions.filter((q: any) =>
          selectedQuestionTypes.includes(q.question_type),
        );

        if (!questions || questions.length === 0) {
          const source = data.source || "database";

          if (source === "generation_started" || source === "empty") {
            setLoadError(
              `Questions are being generated for ${selectedSubject} (Class ${classLevel}). Please retry in a few seconds.`,
            );
          } else if (
            source === "ai_generated" ||
            source === "mixed" ||
            source === "ai_generated_groq"
          ) {
            setLoadError(
              `AI generated questions for ${selectedSubject} in Class ${classLevel}, but they need validation. Please try again.`,
            );
          } else {
            setLoadError(
              `No questions are ready yet for ${selectedSubject} (Class ${classLevel}). Please retry.`,
            );
          }

          setQuizData(null);
          setLoading(false);
          return;
        }

        const subjectName = questions[0]?.subject || selectedSubject;

        if (data.source === "ai_generated") {
          alert(
            `✨ AI Generated Quiz!\n\nAll ${questions.length} questions were generated by AI for ${subjectName} - Class ${classLevel}.`,
          );
        } else if (data.source === "mixed") {
          const aiCount = data.message?.match(/\d+/)?.[0] || "some";
          alert(
            `✨ Enhanced Quiz!\n\nThis quiz includes ${aiCount} AI-generated questions for ${subjectName} - Class ${classLevel}.`,
          );
        }

        const transformedData = {
          title: `${subjectName} Quiz - ${difficulty || "All Levels"}`,
          subject: subjectName,
          difficulty: difficulty || "All Levels",
          classLevel: classLevel || 9,
          questions: questions.map((quiz: any) => ({
            id: quiz.id,
            text: quiz.question_text,
            type: quiz.question_type || "mcq",
            options: quiz.options || {},
            correctAnswer: quiz.correct_answer,
          })),
        };

        setQuizData(transformedData);
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            timestamp: Date.now(),
            data: transformedData,
          }),
        );
      } catch (error) {
        console.error("Error loading quiz:", error);
        setLoadError(
          "Failed to connect to server. Please check your connection and try again.",
        );
        setQuizData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [location.state]);

  useEffect(() => {
    if (timeLeft <= 0 || quizFinished) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, quizFinished]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion]: answer,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    const newMistakes: { [key: number]: boolean } = {};

    Object.keys(selectedAnswers).forEach((key) => {
      const index = parseInt(key, 10);
      if (index >= quizData.questions.length) {
        return;
      }

      const question = quizData.questions[index];
      const isCorrect = evaluateQuizAnswer(
        question.type,
        selectedAnswers[index] || "",
        question.correctAnswer,
        question.options,
      );

      if (isCorrect) {
        correct += 1;
      } else {
        newMistakes[index] = true;
      }
    });

    const score =
      quizData.questions.length > 0
        ? Math.round((correct / quizData.questions.length) * 100)
        : 0;

    return { score, mistakes: newMistakes };
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);

    const { score, mistakes: newMistakes } = calculateScore();
    setFinalScore(score);
    setMistakes(newMistakes);

    let latestProgress = quizProgress;
    const newlySubmittedIds: string[] = [];

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Missing auth token");
      }

      const analysisResponse = await fetch("/api/ai/quiz/analyze/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          quiz_data: quizData,
          answers: selectedAnswers,
        }),
      });

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        setAnalysisResult(analysisData);
        setAiAnalysisReport(String(analysisData?.ai_analysis || ""));

        const analyzedScore = Number(analysisData?.summary?.score_percentage);
        if (Number.isFinite(analyzedScore)) {
          setFinalScore(analyzedScore);
        }

        if (Array.isArray(analysisData?.detailed_results)) {
          const analyzedMistakes: { [key: number]: boolean } = {};
          analysisData.detailed_results.forEach((row: any, index: number) => {
            if (row?.status === "wrong") {
              analyzedMistakes[index] = true;
            }
          });
          setMistakes(analyzedMistakes);
        }
      } else {
        setAnalysisResult(null);
        setAiAnalysisReport("");
      }

      const submissionTargets = quizData.questions
        .map((question: any, index: number) => ({
          question,
          index,
          userAnswer: String(selectedAnswers[index] || "").trim(),
          idKey: String(question.id),
        }))
        .filter(
          ({ userAnswer, idKey }: { userAnswer: string; idKey: string }) =>
            Boolean(userAnswer) && !submittedQuestionIds[idKey],
        );

      const attemptPromises = submissionTargets.map(
        async ({ question, userAnswer, idKey }) => {
          const isAIQuestion =
            typeof question.id === "string" && question.id.startsWith("ai_");

          let endpoint = "/api/quizzes/attempt/";
          let payload: any = {
            quiz_id: question.id,
            selected_answer: userAnswer,
          };

          if (isAIQuestion) {
            const aiQuestionId = Number(
              String(question.id).replace(/^ai_/, ""),
            );
            if (!Number.isFinite(aiQuestionId)) {
              return;
            }

            endpoint = "/api/quizzes/adaptive/submit/";
            payload = {
              question_id: aiQuestionId,
              answer: userAnswer,
              source: "ai",
              subject: quizData.subject,
              class_level: quizData.classLevel,
              question_types: selectedQuestionTypes,
              question_type: selectedQuestionTypes[0] || "mcq",
            };
          }

          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token}`,
            },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.quiz_progress) {
              latestProgress = data.quiz_progress;
            }
            if (data.progress) {
              latestProgress = {
                ...(latestProgress || {}),
                ...data.progress,
                all_static_completed:
                  Number(data.progress.completion_percentage || 0) >= 100,
              };
            }
            newlySubmittedIds.push(idKey);
            return;
          }

          const errorData = await response
            .json()
            .catch(() => ({ error: "Submission failed" }));

          if (errorData?.already_answered) {
            newlySubmittedIds.push(idKey);
            return;
          }

          console.warn("Failed to submit question:", idKey, errorData);
        },
      );

      await Promise.all(attemptPromises);

      if (newlySubmittedIds.length > 0) {
        setSubmittedQuestionIds((prev) => {
          const updated = { ...prev };
          newlySubmittedIds.forEach((questionId) => {
            updated[questionId] = true;
          });
          return updated;
        });
      }

      if (latestProgress) {
        setQuizProgress(latestProgress);
      }

      const userResponse = await fetch("/api/accounts/profile/", {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        localStorage.setItem("user", JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
        setQuizFinished(true);
      }, 1500);
    }
  };

  const handleExitQuiz = async () => {
    if (
      window.confirm(
        "Are you sure you want to exit? Your progress will be analyzed.",
      )
    ) {
      await handleSubmitQuiz();
    }
  };

  const handleImproveWithAI = async () => {
    setShowAIModal(true);
    setLoadingRemediation(true);
    setAiRemediation(null);

    const analyzedWrongAnswers = Array.isArray(analysisResult?.wrong_answers)
      ? analysisResult.wrong_answers
      : [];

    const wrongAnswers =
      analyzedWrongAnswers.length > 0
        ? analyzedWrongAnswers
        : Object.keys(mistakes).map((index) => {
            const idx = parseInt(index, 10);
            const question = quizData.questions[idx];

            return {
              question: question.text,
              userAnswer: formatAnswerForDisplay(
                question.type,
                question.options,
                selectedAnswers[idx] || "",
              ),
              correctAnswer: formatAnswerForDisplay(
                question.type,
                question.options,
                question.correctAnswer,
              ),
              options: getOptionEntries(question.options).map(
                ([key, value]) => `${key}) ${value}`,
              ),
            };
          });

    if (wrongAnswers.length === 0) {
      setAiRemediation(
        "অসাধারণ! আপনি সব প্রশ্নের সঠিক উত্তর দিয়েছেন। কোনো শিক্ষা পরিকল্পনার প্রয়োজন নেই। চালিয়ে যান!",
      );
      setLoadingRemediation(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/ai/quiz/learn/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          wrong_answers: wrongAnswers,
          subject: quizData.subject,
          class_level: quizData.classLevel,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiRemediation(data.learning_plan);
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.error || "Failed to get personalized learning plan",
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setAiRemediation(
        `দুঃখিত, আপনার ব্যক্তিগত শিক্ষা পরিকল্পনা তৈরি করতে সমস্যা হয়েছে।\n\nত্রুটি: ${message}`,
      );
    } finally {
      setLoadingRemediation(false);
    }
  };

  const handleContinueWithMoreQuestions = async () => {
    setLoadingMoreQuestions(true);

    try {
      const token = localStorage.getItem("token");
      const { subjects, classLevel } = (location.state || {}) as any;

      if (!token) {
        throw new Error("Missing auth token");
      }
      if (!subjects || subjects.length === 0) {
        throw new Error("No selected subject found");
      }

      const queryParams = `subject=${subjects[0]}&class_level=${classLevel}&question_types=${selectedQuestionTypes.join(",")}`;
      const response = await fetch(`/api/quizzes/?${queryParams}`, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load more questions (${response.status})`);
      }

      const data = await response.json();
      const source = data?.source;
      let newQuestions = (data?.results || data || []).filter((q: any) =>
        selectedQuestionTypes.includes(q.question_type),
      );

      newQuestions = newQuestions.filter((q: any) => {
        if (q.question_type !== "mcq") {
          return true;
        }
        return getOptionEntries(q.options).length >= 2;
      });

      const existingIds = new Set(
        quizData.questions.map((question: any) => String(question.id)),
      );
      const uniqueQuestions = newQuestions.filter(
        (question: any) => !existingIds.has(String(question.id)),
      );

      if (uniqueQuestions.length === 0) {
        if (source === "generation_started") {
          alert(
            "New questions are being generated now. Please try Continue again in a few seconds.",
          );
        } else {
          alert("No new static questions available right now.");
        }
        return;
      }

      const transformed = uniqueQuestions.map((question: any) => ({
        id: question.id,
        text: question.question_text,
        type: question.question_type,
        options: question.options || {},
        correctAnswer: question.correct_answer,
      }));

      const startIndex = quizData.questions.length;
      setQuizData((prev: any) => ({
        ...prev,
        questions: [...prev.questions, ...transformed],
      }));

      setQuizFinished(false);
      setCurrentQuestion(startIndex);
      alert(`Loaded ${transformed.length} new question(s). Keep going!`);
    } catch (error) {
      console.error(error);
      alert("Failed to load more questions. Please try again.");
    } finally {
      setLoadingMoreQuestions(false);
    }
  };

  const handleContinueWithAI = async () => {
    setLoadingMoreQuestions(true);

    try {
      const token = localStorage.getItem("token");
      const { subjects, classLevel } = (location.state || {}) as any;

      if (!token) {
        throw new Error("Missing auth token");
      }
      if (!subjects || subjects.length === 0) {
        throw new Error("No selected subject found");
      }

      const response = await fetch("/api/quizzes/continue-ai/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          subject: subjects[0],
          class_level: classLevel,
          question_types: selectedQuestionTypes,
          question_type: selectedQuestionTypes[0] || "mcq",
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Failed to load AI questions" }));
        throw new Error(errorData.error || "Failed to load AI questions");
      }

      const data = await response.json();

      const existingIds = new Set(
        quizData.questions.map((question: any) => String(question.id)),
      );

      const aiQuestions = (data.questions || [])
        .filter((question: any) =>
          selectedQuestionTypes.includes(question.question_type),
        )
        .filter((question: any) => !existingIds.has(String(question.id)))
        .map((question: any) => ({
          id: question.id,
          text: question.question_text,
          type: question.question_type,
          options: question.options || {},
          correctAnswer: question.correct_answer,
          source: "ai",
        }));

      if (aiQuestions.length === 0) {
        alert("No new AI questions available yet. Please try again shortly.");
        return;
      }

      const startIndex = quizData.questions.length;
      setQuizData((prev: any) => ({
        ...prev,
        questions: [...prev.questions, ...aiQuestions],
      }));

      setQuizFinished(false);
      setCurrentQuestion(startIndex);
      alert(`✨ ${aiQuestions.length} AI-generated question(s) loaded!`);
    } catch (error) {
      console.error(error);
      alert("Failed to load AI questions. Please try again.");
    } finally {
      setLoadingMoreQuestions(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Loading quiz questions...
          </p>
        </div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400">
            {loadError || "Failed to load quiz data"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 mr-3 inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition">
            Retry
          </button>
          <Link
            to="/quiz/select"
            className="mt-4 inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition">
            Back
          </Link>
        </div>
      </div>
    );
  }

  const currentQ = quizData.questions[currentQuestion] || quizData.questions[0];
  if (!currentQ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">
            No questions available for continuation.
          </p>
          <Link
            to="/quiz/select"
            className="mt-4 inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition">
            Back
          </Link>
        </div>
      </div>
    );
  }
  const currentOptionEntries = getOptionEntries(currentQ.options);

  if (quizFinished) {
    const analyzedDetails = Array.isArray(analysisResult?.detailed_results)
      ? analysisResult.detailed_results
      : [];

    const answeredIndices = Object.keys(selectedAnswers)
      .map((key) => parseInt(key, 10))
      .filter((index) => index < quizData.questions.length);

    const fallbackCorrectCount = answeredIndices.filter((index) => {
      const question = quizData.questions[index];
      return evaluateQuizAnswer(
        question.type,
        selectedAnswers[index] || "",
        question.correctAnswer,
        question.options,
      );
    }).length;

    const summary = analysisResult?.summary || {};
    const correctCount = Number.isFinite(Number(summary.correct))
      ? Number(summary.correct)
      : fallbackCorrectCount;
    const incorrectCount = Number.isFinite(Number(summary.wrong))
      ? Number(summary.wrong)
      : answeredIndices.length - fallbackCorrectCount;
    const unansweredCount = Number.isFinite(Number(summary.unanswered))
      ? Number(summary.unanswered)
      : Math.max(0, quizData.questions.length - answeredIndices.length);
    const displayScore = Number.isFinite(Number(summary.score_percentage))
      ? Number(summary.score_percentage)
      : finalScore;
    const analysisText = aiAnalysisReport || analysisResult?.ai_analysis || "";

    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto py-6 sm:py-8 px-3 sm:px-4">
          <div className="bg-white/95 dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-sky-100 dark:border-gray-700">
            <div className="px-6 py-8 sm:p-10">
              <div className="text-center">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
                  Great Work!
                </h1>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-8">
                  {quizData.title}
                </p>

                <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 mb-6 shadow-md">
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-300">
                    {displayScore}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Questions
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {quizData.questions.length}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Correct
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                      {correctCount}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Incorrect
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                      {incorrectCount}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Unanswered
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {unansweredCount}
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-2xl p-5 mb-8 text-left border border-indigo-100 dark:border-indigo-900">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                      🧠 AI Analysis Report
                    </h3>
                    <button
                      onClick={handleImproveWithAI}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition">
                      ✨ Improvements
                    </button>
                  </div>

                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {analysisText ||
                      "AI analysis is not available right now. You can still review each answer below."}
                  </p>

                  {Number(summary.ai_graded_count || 0) > 0 && (
                    <p className="mt-3 text-xs sm:text-sm text-indigo-700 dark:text-indigo-300">
                      Semantic AI checked {summary.ai_graded_count} open-ended
                      answer(s) for meaning-based grading.
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-8 text-left">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                    Detailed Results
                  </h3>
                  <div className="space-y-4">
                    {quizData.questions.map((question: any, index: number) => {
                      const analyzed = analyzedDetails[index];
                      const wasAnswered = Object.prototype.hasOwnProperty.call(
                        selectedAnswers,
                        index,
                      );
                      const userAnswer = selectedAnswers[index] || "";

                      const fallbackIsCorrect = wasAnswered
                        ? evaluateQuizAnswer(
                            question.type,
                            userAnswer,
                            question.correctAnswer,
                            question.options,
                          )
                        : false;

                      const status = analyzed?.status
                        ? String(analyzed.status)
                        : wasAnswered
                          ? fallbackIsCorrect
                            ? "correct"
                            : "wrong"
                          : "unanswered";
                      const isCorrect = status === "correct";
                      const isUnanswered = status === "unanswered";

                      const userAnswerDisplay = analyzed?.user_answer_display
                        ? String(analyzed.user_answer_display)
                        : wasAnswered
                          ? formatAnswerForDisplay(
                              question.type,
                              question.options,
                              userAnswer,
                            )
                          : "Not answered";

                      const correctAnswerDisplay =
                        analyzed?.correct_answer_display
                          ? String(analyzed.correct_answer_display)
                          : formatAnswerForDisplay(
                              question.type,
                              question.options,
                              question.correctAnswer,
                            );

                      const semanticFeedback = String(
                        analyzed?.semantic_feedback || "",
                      ).trim();
                      const improvementPoints = Array.isArray(
                        analyzed?.improvement_points,
                      )
                        ? analyzed.improvement_points
                            .map((point: any) => String(point || "").trim())
                            .filter((point: string) => Boolean(point))
                        : [];

                      return (
                        <div
                          key={question.id}
                          className={`p-4 rounded-xl border ${
                            isCorrect
                              ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                              : isUnanswered
                                ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
                                : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                          }`}>
                          <div className="flex justify-between items-start mb-2 gap-3">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              Question {index + 1}
                            </h4>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                isCorrect
                                  ? "bg-green-600 text-white"
                                  : isUnanswered
                                    ? "bg-amber-600 text-white"
                                    : "bg-red-600 text-white"
                              }`}>
                              {isCorrect
                                ? "Correct"
                                : isUnanswered
                                  ? "Unanswered"
                                  : "Incorrect"}
                            </span>
                          </div>
                          <p className="text-gray-800 dark:text-gray-200 mb-2">
                            {question.text}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Your Answer
                              </p>
                              <p className="font-medium text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                                {userAnswerDisplay}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {question.type === "mcq"
                                  ? "Correct Answer"
                                  : "Model Answer"}
                              </p>
                              <p className="font-medium text-green-700 dark:text-green-300 whitespace-pre-wrap">
                                {correctAnswerDisplay}
                              </p>
                            </div>
                          </div>

                          {!isCorrect && semanticFeedback && (
                            <div className="mt-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                              <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200 mb-1">
                                AI Feedback
                              </p>
                              <p className="text-sm text-indigo-700 dark:text-indigo-300 whitespace-pre-wrap">
                                {semanticFeedback}
                              </p>
                            </div>
                          )}

                          {!isCorrect && improvementPoints.length > 0 && (
                            <div className="mt-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                              <p className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-2">
                                Improvement Tips
                              </p>
                              <ul className="space-y-1">
                                {improvementPoints.map(
                                  (point: string, tipIndex: number) => (
                                    <li
                                      key={`${question.id}-${tipIndex}`}
                                      className="text-sm text-purple-700 dark:text-purple-300">
                                      • {point}
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
                  <button
                    onClick={handleContinueWithMoreQuestions}
                    disabled={loadingMoreQuestions}
                    className={`px-6 py-3 text-white font-medium rounded-xl transition ${
                      loadingMoreQuestions
                        ? "bg-indigo-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    }`}>
                    {loadingMoreQuestions
                      ? "Loading..."
                      : "Continue with New Questions"}
                  </button>
                  {quizProgress?.all_static_completed && (
                    <button
                      onClick={handleContinueWithAI}
                      disabled={loadingMoreQuestions}
                      className={`px-6 py-3 text-white font-medium rounded-xl transition ${
                        loadingMoreQuestions
                          ? "bg-purple-400 cursor-not-allowed"
                          : "bg-purple-600 hover:bg-purple-700"
                      }`}>
                      {loadingMoreQuestions
                        ? "Loading..."
                        : "Continue with AI Questions"}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setCurrentQuestion(0);
                      setSelectedAnswers({});
                      setQuizFinished(false);
                      setTimeLeft(300);
                      setAiRemediation(null);
                      setAiAnalysisReport("");
                      setAnalysisResult(null);
                      setFinalScore(0);
                      setMistakes({});
                      setShowAIModal(false);
                      setSubmittedQuestionIds({});
                    }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition">
                    Retake Quiz
                  </button>
                  <Link
                    to="/dashboard"
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-xl transition text-center">
                    Back to Dashboard
                  </Link>
                  {Object.keys(mistakes).length > 0 && (
                    <button
                      onClick={handleImproveWithAI}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition">
                      Learn from Mistakes
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <AILearningModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          learningPlan={aiRemediation || ""}
          isLoading={loadingRemediation}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-5 sm:py-6 px-3 sm:px-6">
        <div className="bg-white/95 dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-sky-100 dark:border-gray-700">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {quizData.title}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {quizData.subject} • Class {quizData.classLevel} •{" "}
                  {quizData.difficulty}
                </p>
              </div>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 w-fit">
                ⏱ {formatTime(timeLeft)}
              </div>
            </div>

            <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{
                  width: `${((currentQuestion + 1) / quizData.questions.length) * 100}%`,
                }}></div>
            </div>
            <div className="flex justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span>
                Question {currentQuestion + 1} / {quizData.questions.length}
              </span>
              <span>
                {Math.round(
                  ((currentQuestion + 1) / quizData.questions.length) * 100,
                )}
                %
              </span>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-6 sm:py-8">
            <div className="mb-4">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  currentQ.type === "mcq"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    : currentQ.type === "short"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                }`}>
                {currentQ.type === "mcq" && "📝 Tap the correct choice"}
                {currentQ.type === "short" && "✍️ Write a short answer"}
                {currentQ.type === "long" && "📄 Write a detailed answer"}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-5">
              {currentQ.text}
            </h2>

            {currentQ.type === "mcq" && (
              <div className="space-y-3">
                {currentOptionEntries.length > 0 ? (
                  currentOptionEntries.map(([key, value]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleAnswerSelect(key)}
                      className={`w-full p-4 sm:p-5 border-2 rounded-2xl text-left transition min-h-[56px] ${
                        selectedAnswers[currentQuestion] === key
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                          : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}>
                      <div className="flex items-center">
                        <div
                          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                            selectedAnswers[currentQuestion] === key
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-400 dark:border-gray-500"
                          }`}>
                          {selectedAnswers[currentQuestion] === key && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                d="M5 13l4 4L19 7"></path>
                            </svg>
                          )}
                        </div>
                        <span className="text-gray-900 dark:text-white font-bold mr-2">
                          {key})
                        </span>
                        <span className="text-gray-900 dark:text-white text-base">
                          {value}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-red-500 dark:text-red-400 p-4 border border-red-300 rounded-lg">
                    No options available for this question.
                  </div>
                )}
              </div>
            )}

            {currentQ.type === "short" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Answer
                </label>
                <textarea
                  value={selectedAnswers[currentQuestion] || ""}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
                  placeholder="Type your short answer..."
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  {(selectedAnswers[currentQuestion] || "").length}/500
                  characters
                </p>
              </div>
            )}

            {currentQ.type === "long" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Answer
                </label>
                <textarea
                  value={selectedAnswers[currentQuestion] || ""}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-y"
                  placeholder="Type your detailed answer..."
                  maxLength={2000}
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  {(selectedAnswers[currentQuestion] || "").length}/2000
                  characters
                </p>
              </div>
            )}
          </div>

          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between gap-3">
            <div>
              {currentQuestion > 0 && (
                <button
                  onClick={handlePreviousQuestion}
                  className="w-full sm:w-auto px-5 py-3 min-h-[48px] border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  Previous
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleExitQuiz}
                className="px-5 py-3 min-h-[48px] border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                Exit Quiz
              </button>

              {currentQuestion < quizData.questions.length - 1 ? (
                <button
                  onClick={handleNextQuestion}
                  disabled={
                    !selectedAnswers[currentQuestion] ||
                    !selectedAnswers[currentQuestion].trim()
                  }
                  className={`px-5 py-3 rounded-xl text-sm font-medium text-white ${
                    selectedAnswers[currentQuestion] &&
                    selectedAnswers[currentQuestion].trim()
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-400 cursor-not-allowed"
                  } min-h-[48px]`}>
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={
                    !selectedAnswers[currentQuestion] ||
                    !selectedAnswers[currentQuestion].trim()
                  }
                  className={`px-5 py-3 rounded-xl text-sm font-medium text-white ${
                    selectedAnswers[currentQuestion] &&
                    selectedAnswers[currentQuestion].trim()
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-400 cursor-not-allowed"
                  } min-h-[48px]`}>
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <QuizResultsLoading isVisible={isSubmitting} />
    </div>
  );
};

export default Quiz;
