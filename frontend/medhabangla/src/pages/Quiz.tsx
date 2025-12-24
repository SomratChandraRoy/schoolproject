import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AILearningModal from '../components/AILearningModal';
import QuizResultsLoading from '../components/QuizResultsLoading';

const Quiz: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [mistakes, setMistakes] = useState<{ [key: number]: boolean }>({});
  const [quizData, setQuizData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiRemediation, setAiRemediation] = useState<string | null>(null);
  const [loadingRemediation, setLoadingRemediation] = useState(false);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        // Get parameters from location state
        const { subjects, difficulty, classLevel, questionTypes } = location.state || {};

        if (!subjects || subjects.length === 0) {
          console.error('No subjects selected');
          alert('Please select at least one subject');
          setLoading(false);
          return;
        }

        // Get auth token
        const token = localStorage.getItem('token');

        if (!token) {
          console.error('No auth token found');
          alert('Please login first');
          setLoading(false);
          return;
        }

        // Use the first selected subject code
        const selectedSubject = subjects[0];

        console.log('Fetching quiz for:', { subject: selectedSubject, difficulty, classLevel, questionTypes });

        // Build query parameters
        let queryParams = `subject=${selectedSubject}&class_level=${classLevel}`;

        // Add question types filter if specified
        if (questionTypes && questionTypes.length > 0) {
          queryParams += `&question_types=${questionTypes.join(',')}`;
        }

        console.log('API URL:', `/api/quizzes/?${queryParams}`);

        // Fetch quiz data from backend
        const response = await fetch(`/api/quizzes/?${queryParams}`, {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Response status:', response.status);

        if (response.ok) {
          const data = await response.json();

          console.log('Fetched quiz data:', data);

          // Handle paginated response from Django REST Framework
          // The API returns: { count, next, previous, results: [...] }
          let questions = data.results || data;

          // Additional validation: Filter out MCQ questions without proper options
          questions = questions.filter((q: any) => {
            if (q.question_type === 'mcq') {
              // Check if options is a valid object with at least 2 options
              if (!q.options || typeof q.options !== 'object') {
                console.warn(`Question ${q.id} has invalid options:`, q.options);
                return false;
              }
              const optionKeys = Object.keys(q.options);
              if (optionKeys.length < 2) {
                console.warn(`Question ${q.id} has too few options:`, optionKeys.length);
                return false;
              }
              return true;
            }
            return true; // Keep non-MCQ questions
          });

          // Filter by question types on frontend as additional validation
          if (questionTypes && questionTypes.length > 0) {
            questions = questions.filter((q: any) => questionTypes.includes(q.question_type));
          }

          console.log('Number of questions after filtering:', questions.length);

          if (!questions || questions.length === 0) {
            console.error('No valid questions found for this subject');

            // Show helpful message based on source
            const source = data.source || 'database';
            const message = source === 'ai_generated'
              ? `AI generated questions for ${selectedSubject} in Class ${classLevel}, but they need validation. Please contact support.`
              : `No questions available for ${selectedSubject} in Class ${classLevel}. AI is generating questions for you...`;

            alert(message);
            setQuizData(null);
            setLoading(false);
            return;
          }

          // Get subject name from the first question
          const subjectName = questions[0]?.subject || selectedSubject;

          // Show message if AI generated
          if (data.source === 'ai_generated' || data.source === 'mixed') {
            console.log('✨ AI generated questions included in this quiz');
          }

          // Transform data to match expected format
          const transformedData = {
            title: `${subjectName} Quiz - ${difficulty || 'All Levels'}`,
            subject: subjectName,
            difficulty: difficulty || 'All Levels',
            classLevel: classLevel || 9,
            questions: questions.map((quiz: any) => ({
              id: quiz.id,
              text: quiz.question_text,
              type: quiz.question_type || 'mcq',
              options: quiz.options || {},
              correctAnswer: quiz.correct_answer
            }))
          };

          console.log('Transformed quiz data:', transformedData);
          console.log('Total questions loaded:', transformedData.questions.length);

          setQuizData(transformedData);
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch quiz data:', response.status, errorText);
          alert(`Failed to load quiz: ${response.status}. Please try again.`);
          setQuizData(null);
        }
      } catch (error) {
        console.error('Error fetching quiz data:', error);
        alert('Failed to connect to server. Please check your connection and try again.');
        setQuizData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [location.state]);

  // Timer effect
  React.useEffect(() => {
    if (timeLeft <= 0 || quizFinished) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, quizFinished]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion]: answer
    });
    // Don't submit to backend yet - wait until quiz is finished
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    // Show loading screen immediately
    setIsSubmitting(true);

    // Calculate score and mistakes BEFORE setting quizFinished
    const { score, mistakes: newMistakes } = calculateScore();

    // Set the calculated values in state
    setFinalScore(score);
    setMistakes(newMistakes);

    // Submit quiz results to backend for AI analysis
    try {
      const token = localStorage.getItem('token');

      // Call AI analysis endpoint
      const analysisResponse = await fetch('/api/ai/quiz/analyze/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          quiz_data: quizData,
          answers: selectedAnswers
        })
      });

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        console.log('AI Analysis received:', analysisData);

        // Store analysis data for display
        setAiRemediation(analysisData.ai_analysis);
      }

      // Also submit individual attempts for tracking
      const attemptPromises = quizData.questions.map(async (question: any, index: number) => {
        const userAnswer = selectedAnswers[index] || '';

        return fetch('/api/quizzes/attempt/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
          },
          body: JSON.stringify({
            quiz_id: question.id,
            selected_answer: userAnswer
          })
        });
      });

      await Promise.all(attemptPromises);

      // Update user points
      const userResponse = await fetch('/api/accounts/profile/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error submitting quiz results:', error);
    } finally {
      // Add a minimum delay to show the loading animation (at least 1.5 seconds)
      setTimeout(() => {
        setIsSubmitting(false);
        // Set quiz finished AFTER all async operations complete
        // This prevents infinite re-render loop
        setQuizFinished(true);
      }, 1500);
    }
  };

  const handleExitQuiz = async () => {
    if (window.confirm('Are you sure you want to exit? Your progress will be analyzed.')) {
      // Submit current progress before exiting
      await handleSubmitQuiz();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const calculateScore = () => {
    let correct = 0;
    const newMistakes: { [key: number]: boolean } = {};

    // Make sure we're checking all questions that were answered
    Object.keys(selectedAnswers).forEach((key) => {
      const index = parseInt(key);
      if (index < quizData.questions.length) {
        const isCorrect = selectedAnswers[index] === quizData.questions[index].correctAnswer;
        if (isCorrect) {
          correct++;
        } else {
          newMistakes[index] = true;
        }
      }
    });

    const score = quizData.questions.length > 0 ? Math.round((correct / quizData.questions.length) * 100) : 0;
    console.log('Calculated score:', score, 'Correct:', correct, 'Total:', quizData.questions.length);

    // Return both score and mistakes without setting state
    return { score, mistakes: newMistakes };
  };

  const handleImproveWithAI = async () => {
    // Open modal immediately
    setShowAIModal(true);
    setLoadingRemediation(true);
    setAiRemediation(null);

    // Collect wrong answers for AI personalized learning
    const wrongAnswers = Object.keys(mistakes).map(index => {
      const idx = parseInt(index);
      return {
        question: quizData.questions[idx].text,
        userAnswer: selectedAnswers[idx],
        correctAnswer: quizData.questions[idx].correctAnswer,
        options: quizData.questions[idx].options || []
      };
    });

    if (wrongAnswers.length === 0) {
      setAiRemediation('অসাধারণ! আপনি সব প্রশ্নের সঠিক উত্তর দিয়েছেন। কোনো শিক্ষা পরিকল্পনার প্রয়োজন নেই। চালিয়ে যান!');
      setLoadingRemediation(false);
      return;
    }

    // Send to backend for AI personalized learning
    try {
      const token = localStorage.getItem('token');

      console.log('Sending learning request:', {
        wrong_answers_count: wrongAnswers.length,
        subject: quizData.subject,
        class_level: quizData.classLevel
      });

      const response = await fetch('/api/ai/quiz/learn/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          wrong_answers: wrongAnswers,
          subject: quizData.subject,
          class_level: quizData.classLevel
        })
      });

      console.log('Learning response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Learning plan received:', data);
        setAiRemediation(data.learning_plan);
      } else {
        // Get error details from response
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Learning API error:', errorData);
        throw new Error(errorData.error || 'Failed to get personalized learning plan');
      }
    } catch (error) {
      console.error('AI Learning Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setAiRemediation(`দুঃখিত, আপনার ব্যক্তিগত শিক্ষা পরিকল্পনা তৈরি করতে সমস্যা হয়েছে।\n\nত্রুটি: ${errorMessage}\n\nঅনুগ্রহ করে আবার চেষ্টা করুন বা পরে চেষ্টা করুন।`);
    } finally {
      setLoadingRemediation(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading quiz questions...</p>
        </div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400">Failed to load quiz data</p>
          <Link
            to="/quiz/select"
            className="mt-4 inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  const currentQ = quizData.questions[currentQuestion];

  if (quizFinished) {
    console.log('Quiz finished, displaying results...');
    console.log('Selected answers:', selectedAnswers);
    console.log('Quiz data:', quizData);
    console.log('Final score:', finalScore);
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-8 sm:p-10">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Quiz Completed!</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                  {quizData.title}
                </p>

                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-blue-100 dark:bg-blue-900 mb-6">
                  <span className="text-4xl font-bold text-blue-600 dark:text-blue-300">{finalScore}%</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Questions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{quizData.questions.length}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Correct</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {Object.keys(selectedAnswers).filter(key => {
                        const index = parseInt(key);
                        return index < quizData.questions.length && selectedAnswers[index] === quizData.questions[index].correctAnswer;
                      }).length}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Incorrect</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {Object.keys(selectedAnswers).filter(key => {
                        const index = parseInt(key);
                        return index < quizData.questions.length && selectedAnswers[index] !== quizData.questions[index].correctAnswer;
                      }).length}
                    </p>
                  </div>
                </div>

                {/* Detailed Results */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Detailed Results</h3>
                  <div className="space-y-4">
                    {quizData.questions.map((question: any, index: number) => {
                      const userAnswer = selectedAnswers[index];
                      const isCorrect = userAnswer === question.correctAnswer;
                      const wasAnswered = selectedAnswers.hasOwnProperty(index);

                      return (
                        <div key={question.id} className={`p-4 rounded-lg ${isCorrect ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">Question {index + 1}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                              {wasAnswered ? (isCorrect ? 'Correct' : 'Incorrect') : 'Unanswered'}
                            </span>
                          </div>
                          <p className="text-gray-800 dark:text-gray-200 mb-2">{question.text}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Your Answer:</p>
                              <p className={`font-medium ${isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                                {wasAnswered ? userAnswer : 'Not answered'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Correct Answer:</p>
                              <p className="font-medium text-green-700 dark:text-green-300">{question.correctAnswer}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                  <button
                    onClick={() => {
                      setCurrentQuestion(0);
                      setSelectedAnswers({});
                      setQuizFinished(false);
                      setTimeLeft(300);
                      setAiRemediation(null);
                      setFinalScore(0);
                      setMistakes({});
                      setShowAIModal(false);
                    }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                  >
                    Retake Quiz
                  </button>
                  <Link
                    to="/dashboard"
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition text-center"
                  >
                    Back to Dashboard
                  </Link>
                  {Object.keys(mistakes).length > 0 && (
                    <button
                      onClick={handleImproveWithAI}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium rounded-lg transition shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        📚 Learn from Mistakes
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Learning Modal */}
        <AILearningModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          learningPlan={aiRemediation || ''}
          isLoading={loadingRemediation}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Quiz Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{quizData.title}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {quizData.subject} • Class {quizData.classLevel} • {quizData.difficulty}
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                  <svg className="mr-1.5 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>

            <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${((currentQuestion + 1) / quizData.questions.length) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span>Question {currentQuestion + 1} of {quizData.questions.length}</span>
              <span>{Math.round(((currentQuestion + 1) / quizData.questions.length) * 100)}% Complete</span>
            </div>
          </div>

          {/* Question Area */}
          <div className="px-6 py-8 sm:p-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {currentQ.text}
            </h2>

            {currentQ.type === 'mcq' && (
              <div className="space-y-4">
                {currentQ.options && typeof currentQ.options === 'object' && Object.keys(currentQ.options).length > 0 ? (
                  Object.entries(currentQ.options).map(([key, value]: [string, any]) => (
                    <div
                      key={key}
                      onClick={() => handleAnswerSelect(value)}
                      className={`p-4 border rounded-lg cursor-pointer transition ${selectedAnswers[currentQuestion] === value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                    >
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${selectedAnswers[currentQuestion] === value
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-400 dark:border-gray-500'
                          }`}>
                          {selectedAnswers[currentQuestion] === value && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                          )}
                        </div>
                        <span className="text-gray-900 dark:text-white font-medium mr-2">{key}.</span>
                        <span className="text-gray-900 dark:text-white">{value}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-red-500 dark:text-red-400 p-4 border border-red-300 rounded-lg">
                    No options available for this question. Please contact support.
                  </div>
                )}
              </div>
            )}

            {currentQ.type === 'short' && (
              <div>
                <textarea
                  value={selectedAnswers[currentQuestion] || ''}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Type your answer here..."
                />
              </div>
            )}

            {currentQ.type === 'long' && (
              <div>
                <textarea
                  value={selectedAnswers[currentQuestion] || ''}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Type your detailed answer here..."
                />
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              {currentQuestion > 0 && (
                <button
                  onClick={handlePreviousQuestion}
                  className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Previous
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExitQuiz}
                className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Exit Quiz
              </button>
              {currentQuestion < quizData.questions.length - 1 ? (
                <button
                  onClick={handleNextQuestion}
                  disabled={!selectedAnswers[currentQuestion]}
                  className={`px-5 py-2 rounded-md shadow-sm text-sm font-medium text-white ${selectedAnswers[currentQuestion]
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                    }`}
                >
                  Next Question
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={!selectedAnswers[currentQuestion]}
                  className={`px-5 py-2 rounded-md shadow-sm text-sm font-medium text-white ${selectedAnswers[currentQuestion]
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-400 cursor-not-allowed'
                    }`}
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results Loading Screen */}
      <QuizResultsLoading isVisible={isSubmitting} />
    </div>
  );
};

export default Quiz;