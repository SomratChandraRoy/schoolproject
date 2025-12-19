import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Quiz: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: string}>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [mistakes, setMistakes] = useState<{[key: number]: boolean}>({});

  // Mock quiz data
  const quizData = {
    title: "Mathematics Quiz - Algebra Basics",
    subject: "Mathematics",
    difficulty: "Medium",
    classLevel: 9,
    questions: [
      {
        id: 1,
        text: "What is the value of x in the equation 2x + 5 = 15?",
        type: "mcq",
        options: ["x = 5", "x = 10", "x = 7.5", "x = 20"],
        correctAnswer: "x = 5"
      },
      {
        id: 2,
        text: "Simplify the expression: 3(x + 4) - 2x",
        type: "short",
        correctAnswer: "x + 12"
      },
      {
        id: 3,
        text: "Explain the process of solving a quadratic equation using the quadratic formula.",
        type: "long",
        correctAnswer: "The quadratic formula is x = (-b ± √(b²-4ac)) / (2a). First, identify coefficients a, b, and c from the equation ax² + bx + c = 0. Then substitute these values into the formula and simplify."
      }
    ]
  };

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

  const handleSubmitQuiz = () => {
    setQuizFinished(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const calculateScore = () => {
    let correct = 0;
    const newMistakes: {[key: number]: boolean} = {};
    quizData.questions.forEach((question, index) => {
      const isCorrect = selectedAnswers[index] === question.correctAnswer;
      if (isCorrect) {
        correct++;
      } else {
        newMistakes[index] = true;
      }
    });
    setMistakes(newMistakes);
    return Math.round((correct / quizData.questions.length) * 100);
  };

  const handleImproveWithAI = () => {
    // Collect wrong answers for AI remediation
    const wrongAnswers = Object.keys(mistakes).map(index => ({
      question: quizData.questions[parseInt(index)].text,
      userAnswer: selectedAnswers[parseInt(index)],
      correctAnswer: quizData.questions[parseInt(index)].correctAnswer
    }));
    
    // In a real implementation, this would call the backend API
    // For now, we'll simulate the AI response
    console.log('Sending to AI for remediation:', wrongAnswers);
    
    // Simulate AI response
    alert(`AI Remediation Feature would explain:

Conceptual gaps identified in: ${wrongAnswers.length} questions

In Bangla: This feature would explain the concepts in Bangla and provide 3 check-for-understanding points.`);
  };

  const currentQ = quizData.questions[currentQuestion];

  if (quizFinished) {
    const score = calculateScore();
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
                  <span className="text-4xl font-bold text-blue-600 dark:text-blue-300">{score}%</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Questions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{quizData.questions.length}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Correct</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {Object.keys(selectedAnswers).filter(key => 
                        selectedAnswers[parseInt(key)] === quizData.questions[parseInt(key)].correctAnswer
                      ).length}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Incorrect</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {Object.keys(selectedAnswers).filter(key => 
                        selectedAnswers[parseInt(key)] !== quizData.questions[parseInt(key)].correctAnswer
                      ).length}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                  <button 
                    onClick={() => {
                      setCurrentQuestion(0);
                      setSelectedAnswers({});
                      setQuizFinished(false);
                      setTimeLeft(300);
                    }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                  >
                    Retake Quiz
                  </button>
                  <Link 
                    to="/dashboard" 
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition"
                  >
                    Back to Dashboard
                  </Link>
                  <button 
                    onClick={handleImproveWithAI}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
                  >
                    Improve with AI
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
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
                {currentQ.options?.map((option, index) => (
                  <div 
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    className={`p-4 border rounded-lg cursor-pointer transition ${
                      selectedAnswers[currentQuestion] === option
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                        selectedAnswers[currentQuestion] === option
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-400 dark:border-gray-500'
                      }`}>
                        {selectedAnswers[currentQuestion] === option && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                      </div>
                      <span className="text-gray-900 dark:text-white">{option}</span>
                    </div>
                  </div>
                ))}
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
              <Link 
                to="/dashboard" 
                className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Exit Quiz
              </Link>
              {currentQuestion < quizData.questions.length - 1 ? (
                <button
                  onClick={handleNextQuestion}
                  disabled={!selectedAnswers[currentQuestion]}
                  className={`px-5 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
                    selectedAnswers[currentQuestion]
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
                  className={`px-5 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
                    selectedAnswers[currentQuestion]
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
    </div>
  );
};

export default Quiz;