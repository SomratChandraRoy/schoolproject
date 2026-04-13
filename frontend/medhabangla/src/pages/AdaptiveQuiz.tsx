import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  formatAnswerForDisplay,
  getOptionEntries,
  resolveAnswerKey,
} from "../utils/quizEvaluation";
interface Question {
  id: number;
  question_text: string;
  question_type: string;
  options: Record<string, string> | string[];
  difficulty: string;
  subject: string;
  class_target: number;
}

interface Progress {
  status: string;
  static_completed: number;
  total_static: number;
  completion_percentage: number;
  current_difficulty: string;
  ai_questions_answered: number;
  ai_questions_correct: number;
}

const AdaptiveQuiz: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionSource, setQuestionSource] = useState<"static" | "ai">(
    "static",
  );
  const [progress, setProgress] = useState<Progress | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [quizComplete, setQuizComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { subject, classLevel, questionType, questionTypes } =
    location.state || {};
  const selectedQuestionTypes = (() => {
    const normalized = Array.from(
      new Set(
        (Array.isArray(questionTypes) && questionTypes.length > 0
          ? questionTypes
          : [questionType || "mcq"]
        )
          .map((type) =>
            String(type || "")
              .trim()
              .toLowerCase(),
          )
          .filter((type) => ["mcq", "short", "long"].includes(type)),
      ),
    );

    return normalized.length > 0 ? normalized : ["mcq"];
  })();

  useEffect(() => {
    if (!subject || !classLevel) {
      setError("Missing quiz parameters");
      setLoading(false);
      return;
    }
    initializeQuiz();
  }, []);

  const initializeQuiz = async () => {
    try {
      const token = localStorage.getItem("token");

      // Start quiz session
      const startResponse = await fetch("/api/quizzes/adaptive/start/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          subject,
          class_level: classLevel,
          question_types: selectedQuestionTypes,
          question_type: selectedQuestionTypes[0] || "mcq",
        }),
      });

      if (!startResponse.ok) {
        throw new Error("Failed to start quiz session");
      }

      const startData = await startResponse.json();
      setProgress(startData.progress);

      // Get first question
      await getNextQuestion();
    } catch (err) {
      console.error("Error initializing quiz:", err);
      setError("Failed to initialize quiz");
    } finally {
      setLoading(false);
    }
  };

  const getNextQuestion = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/quizzes/adaptive/next/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          subject,
          class_level: classLevel,
          question_types: selectedQuestionTypes,
          question_type: selectedQuestionTypes[0] || "mcq",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get next question");
      }

      const data = await response.json();

      if (data.message && data.message.includes("completed")) {
        setQuizComplete(true);
        return;
      }

      setCurrentQuestion(data.question);
      setQuestionSource(data.source);
      setProgress(data.progress);
      setSelectedAnswer("");
      setShowResult(false);
    } catch (err) {
      console.error("Error getting next question:", err);
      setError("Failed to load next question");
    }
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/quizzes/adaptive/submit/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          answer: selectedAnswer,
          source: questionSource,
          subject,
          class_level: classLevel,
          question_types: selectedQuestionTypes,
          question_type: selectedQuestionTypes[0] || "mcq",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit answer");
      }

      const data = await response.json();
      setIsCorrect(data.is_correct);
      setCorrectAnswer(data.correct_answer);
      setExplanation(data.explanation);
      setProgress(data.progress);
      setShowResult(true);
    } catch (err) {
      console.error("Error submitting answer:", err);
      setError("Failed to submit answer");
    }
  };

  const handleNext = () => {
    getNextQuestion();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Loading adaptive quiz...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto py-12 px-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">
              Error
            </h2>
            <p className="text-red-600 dark:text-red-300">{error}</p>
            <Link
              to="/quiz/select"
              className="mt-4 inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              Back to Quiz Selection
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (quizComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 text-center border border-sky-100 dark:border-gray-700">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Quiz Complete!
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Great job! You've completed all available questions.
            </p>
            {progress && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Static Questions
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {progress.static_completed}/{progress.total_static}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      AI Questions
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {progress.ai_questions_correct}/
                      {progress.ai_questions_answered}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-4 justify-center">
              <Link
                to="/dashboard"
                className="px-6 py-3 min-h-[48px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                Back to Dashboard
              </Link>
              <Link
                to="/quiz/select"
                className="px-6 py-3 min-h-[48px] bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-xl">
                Try Another Quiz
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">
            No questions available
          </p>
        </div>
      </div>
    );
  }

  // Check if options exist and are valid
  const optionEntries = getOptionEntries(currentQuestion.options);
  const isMCQ = currentQuestion.question_type === "mcq";
  const hasValidOptions = isMCQ && optionEntries.length >= 2;
  const selectedAnswerKey =
    resolveAnswerKey(currentQuestion.options, selectedAnswer) || selectedAnswer;
  const correctAnswerKey = resolveAnswerKey(
    currentQuestion.options,
    correctAnswer,
  );

  // Debug logging
  console.log("[AdaptiveQuiz] Current Question:", currentQuestion);
  console.log("[AdaptiveQuiz] Question Type:", currentQuestion.question_type);
  console.log("[AdaptiveQuiz] Options:", currentQuestion.options);
  console.log(
    "[AdaptiveQuiz] Option Keys:",
    optionEntries.map(([key]) => key),
  );
  console.log("[AdaptiveQuiz] Has Valid Options:", hasValidOptions);

  // Show error if MCQ has no options
  if (isMCQ && !hasValidOptions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto py-12 px-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-200 mb-2">
              Invalid Question
            </h2>
            <p className="text-yellow-600 dark:text-yellow-300 mb-4">
              This MCQ question has no options. This might be an AI generation
              error.
            </p>
            <button
              onClick={handleNext}
              className="px-6 py-2 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              Skip to Next Question
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-6 sm:py-10 px-3 sm:px-4">
        {/* Progress Header */}
        {progress && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-6 mb-6 border border-sky-100 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {subject} - Class {classLevel}
                </h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      questionSource === "ai"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    }`}>
                    {questionSource === "ai"
                      ? "🤖 AI Question"
                      : "📚 Static Question"}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      progress.current_difficulty === "easy"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : progress.current_difficulty === "medium"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}>
                    {progress.current_difficulty.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Progress
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {progress.completion_percentage.toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress.completion_percentage}%` }}></div>
            </div>

            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
              <span>
                Static: {progress.static_completed}/{progress.total_static}
              </span>
              {progress.ai_questions_answered > 0 && (
                <span>
                  AI: {progress.ai_questions_correct}/
                  {progress.ai_questions_answered}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Question Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-5 sm:p-8 border border-sky-100 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {currentQuestion.question_text}
          </h3>

          {/* MCQ Options */}
          {currentQuestion.question_type === "mcq" && (
            <div className="space-y-3 mb-6">
              {optionEntries.map(([optionKey, optionValue]) => (
                <button
                  key={optionKey}
                  type="button"
                  onClick={() => !showResult && setSelectedAnswer(optionKey)}
                  className={`w-full p-4 sm:p-5 border-2 rounded-2xl text-left transition min-h-[56px] ${
                    showResult
                      ? optionKey === correctAnswerKey
                        ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                        : optionKey === selectedAnswerKey
                          ? "border-red-500 bg-red-50 dark:bg-red-900/30"
                          : "border-gray-300 dark:border-gray-600"
                      : selectedAnswerKey === optionKey
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                        : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}>
                  <div className="flex items-center">
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                        showResult
                          ? optionKey === correctAnswerKey
                            ? "border-green-500 bg-green-500"
                            : optionKey === selectedAnswerKey
                              ? "border-red-500 bg-red-500"
                              : "border-gray-400"
                          : selectedAnswerKey === optionKey
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-400"
                      }`}>
                      {showResult && optionKey === correctAnswerKey && (
                        <svg
                          className="w-4 h-4 text-white"
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
                      {showResult &&
                        optionKey === selectedAnswerKey &&
                        optionKey !== correctAnswerKey && (
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="3"
                              d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        )}
                      {!showResult && selectedAnswerKey === optionKey && (
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="text-gray-900 dark:text-white font-semibold mr-2">
                      {optionKey})
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {optionValue}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Short Answer Input */}
          {currentQuestion.question_type === "short" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Answer (Short Answer):
              </label>
              <textarea
                value={selectedAnswer}
                onChange={(e) =>
                  !showResult && setSelectedAnswer(e.target.value)
                }
                rows={4}
                disabled={showResult}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                placeholder="Type your short answer here (2-3 sentences)..."
                maxLength={500}
              />
              <div className="mt-2 flex justify-between items-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  💡 Tip: Write a clear and concise answer
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {selectedAnswer.length}/500 characters
                </p>
              </div>
            </div>
          )}

          {/* Long Answer Input */}
          {currentQuestion.question_type === "long" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Answer (Long Answer):
              </label>
              <textarea
                value={selectedAnswer}
                onChange={(e) =>
                  !showResult && setSelectedAnswer(e.target.value)
                }
                rows={10}
                disabled={showResult}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-y disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                placeholder="Type your detailed answer here. Include all relevant points and explanations..."
                maxLength={2000}
              />
              <div className="mt-2 flex justify-between items-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  💡 Tip: Provide a comprehensive answer with examples and
                  explanations
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {selectedAnswer.length}/2000 characters
                </p>
              </div>
            </div>
          )}

          {/* Result */}
          {showResult && (
            <div
              className={`p-4 rounded-lg mb-6 ${
                isCorrect
                  ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800"
              }`}>
              <p
                className={`font-semibold mb-2 ${
                  isCorrect
                    ? "text-green-800 dark:text-green-200"
                    : "text-red-800 dark:text-red-200"
                }`}>
                {isCorrect ? "✅ Correct!" : "❌ Incorrect"}
              </p>

              {currentQuestion.question_type === "mcq" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Your Answer:
                    </p>
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      {formatAnswerForDisplay(
                        "mcq",
                        currentQuestion.options,
                        selectedAnswer,
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Correct Answer:
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {formatAnswerForDisplay(
                        "mcq",
                        currentQuestion.options,
                        correctAnswer,
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Show model answer for short/long questions */}
              {(currentQuestion.question_type === "short" ||
                currentQuestion.question_type === "long") && (
                <div className="mt-3 space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Your Answer:
                    </p>
                    <div className="p-3 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {selectedAnswer}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Model Answer:
                    </p>
                    <div className="p-3 rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                      <p className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">
                        {correctAnswer}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {explanation && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Explanation:
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    {explanation}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3">
            <Link
              to="/quiz/select"
              className="px-6 py-2 min-h-[48px] border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-center">
              Exit Quiz
            </Link>
            {!showResult ? (
              <button
                onClick={submitAnswer}
                disabled={!selectedAnswer}
                className={`px-6 py-2 min-h-[48px] rounded-xl text-white ${
                  selectedAnswer
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}>
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-2 min-h-[48px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                Next Question →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdaptiveQuiz;
