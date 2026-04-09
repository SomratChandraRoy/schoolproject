import React, { useState, useEffect } from 'react';
const Syllabus: React.FC = () => {
  const [syllabusData, setSyllabusData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userClass, setUserClass] = useState<number | null>(null);

  useEffect(() => {
    fetchSyllabusData();
  }, []);

  const fetchSyllabusData = async () => {
    try {
      const token = localStorage.getItem('token');
      let resolvedUserClass: number | null = null;
      
      // Get user class level
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        resolvedUserClass = user.class_level || null;
        setUserClass(resolvedUserClass);
      }
      
      const publicSyllabusUrl = resolvedUserClass ? `/api/books/syllabus/?class_level=${resolvedUserClass}` : '/api/books/syllabus/';
      const privateHeaders: HeadersInit = token ? { 'Authorization': `Token ${token}` } : {};

      // Fetch personalized syllabus when possible, otherwise fall back to public syllabus data
      let response = token
        ? await fetch('/api/books/my-syllabus/', { headers: privateHeaders })
        : await fetch(publicSyllabusUrl);

      if (!response.ok && token) {
        response = await fetch(publicSyllabusUrl);
      }
      
      if (response.ok) {
        const data = await response.json();
        setSyllabusData(data);
      } else {
        throw new Error('Failed to fetch syllabus data');
      }
    } catch (err) {
      setError('Failed to load syllabus data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Group syllabus by subject
  const groupedSyllabus = syllabusData.reduce((acc: any, item: any) => {
    if (!acc[item.subject]) {
      acc[item.subject] = [];
    }
    acc[item.subject].push(item);
    return acc;
  }, {});

  const subjectNames: any = {
    'math': 'Mathematics',
    'physics': 'Physics',
    'chemistry': 'Chemistry',
    'biology': 'Biology',
    'english': 'English',
    'bangla': 'Bangla',
    'ict': 'ICT',
    'general_knowledge': 'General Knowledge'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <div className="text-red-500 dark:text-red-400 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Syllabus</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <button
              onClick={fetchSyllabusData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Class {userClass} Syllabus</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Your personalized curriculum for the academic year
          </p>
        </div>

        {syllabusData.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No Syllabus Available</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Syllabus for Class {userClass} is not available yet. Please check back later.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedSyllabus).map(([subject, chapters]: [string, any]) => (
              <div key={subject} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">{subjectNames[subject] || subject}</h2>
                </div>
                <div className="p-6">
                  <div className="flow-root">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {chapters.map((chapter: any, index: number) => (
                        <li key={chapter.id} className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <span className="text-blue-800 dark:text-blue-200 font-medium">{index + 1}</span>
                              </div>
                              <div className="ml-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{chapter.chapter_title}</h3>
                                {chapter.chapter_description && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {chapter.chapter_description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              {chapter.page_range && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                  Pages {chapter.page_range}
                                </span>
                              )}
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                                {chapter.estimated_hours} hrs
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Syllabus;