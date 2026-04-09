import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
const StudyTimer: React.FC = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'study' | 'break'>('study'); // study or break
  const [studySubject, setStudySubject] = useState('');
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Format time for display (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle timer tick
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Timer completed
      setIsActive(false);
      
      if (mode === 'study') {
        // Study session completed, show subject modal
        setShowSubjectModal(true);
      } else {
        // Break completed, start study session
        setMode('study');
        setTimeLeft(25 * 60); // Reset to 25 minutes
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeLeft, mode]);

  // Start/pause timer
  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  // Reset timer
  const resetTimer = () => {
    setIsActive(false);
    setMode('study');
    setTimeLeft(25 * 60);
    setCompletedSessions(0);
  };

  // Switch mode
  const switchMode = () => {
    setIsActive(false);
    if (mode === 'study') {
      setMode('break');
      setTimeLeft(5 * 60); // 5 minutes break
    } else {
      setMode('study');
      setTimeLeft(25 * 60); // 25 minutes study
    }
  };

  // Save study session
  const saveStudySession = async () => {
    if (!studySubject.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/accounts/study-sessions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          subject: studySubject,
          duration: 25 // 25 minutes
        })
      });

      if (response.ok) {
        setCompletedSessions(prev => prev + 1);
        setShowSubjectModal(false);
        setStudySubject('');
        
        // Start break timer
        setMode('break');
        setTimeLeft(5 * 60); // 5 minutes break
        setIsActive(true);
      } else {
        console.error('Failed to save study session');
      }
    } catch (error) {
      console.error('Error saving study session:', error);
    }
  };

  // Skip break
  const skipBreak = () => {
    setIsActive(false);
    setMode('study');
    setTimeLeft(25 * 60);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Study Timer</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Boost your productivity with the Pomodoro Technique
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            {/* Timer Display */}
            <div className="text-center mb-10">
              <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-1 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-full p-8">
                  <div className="text-6xl font-bold text-gray-900 dark:text-white">
                    {formatTime(timeLeft)}
                  </div>
                </div>
              </div>
              
              <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                {mode === 'study' ? 'Focus Time' : 'Break Time'}
              </div>
              <div className="text-lg text-gray-600 dark:text-gray-400">
                Session {completedSessions + 1}
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-4 mb-10">
              <button
                onClick={toggleTimer}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
              >
                {isActive ? 'Pause' : 'Start'}
              </button>
              
              <button
                onClick={resetTimer}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white font-medium rounded-lg transition"
              >
                Reset
              </button>
              
              <button
                onClick={switchMode}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition"
              >
                {mode === 'study' ? 'Take Break' : 'Start Studying'}
              </button>
            </div>

            {/* Progress Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {completedSessions}
                </div>
                <div className="text-gray-700 dark:text-gray-300">Sessions Completed</div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {completedSessions * 25}
                </div>
                <div className="text-gray-700 dark:text-gray-300">Minutes Studied</div>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  {Math.floor((completedSessions * 25) / 60)}
                </div>
                <div className="text-gray-700 dark:text-gray-300">Hours Studied</div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">How It Works</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Study for 25 minutes, then take a 5-minute break</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>After 4 study sessions, take a longer 15-30 minute break</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Track your progress and build consistent study habits</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Great Job!</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You've completed a study session. What subject did you study?
            </p>
            
            <input
              type="text"
              value={studySubject}
              onChange={(e) => setStudySubject(e.target.value)}
              placeholder="e.g., Mathematics, Physics, English"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white mb-6"
            />
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSubjectModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                Skip
              </button>
              <button
                onClick={saveStudySession}
                disabled={!studySubject.trim()}
                className={`px-4 py-2 text-white rounded-lg transition ${
                  studySubject.trim()
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Save Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyTimer;