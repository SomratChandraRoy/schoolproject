import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import EnhancedPDFViewer from '../components/EnhancedPDFViewer';

interface Book {
  id: number;
  title: string;
  author: string;
  class_level: number;
  category: string;
  language: string;
  description: string;
  pdf_file: string;
  cover_image: string;
  uploaded_at: string;
}

const Books: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Get user's class level
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userClassLevel = user?.class_level;

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/books/books/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();

        // Handle both paginated and non-paginated responses
        if (Array.isArray(data)) {
          // Non-paginated response
          setBooks(data);
        } else if (data.results && Array.isArray(data.results)) {
          // Paginated response
          setBooks(data.results);
        } else {
          // Unexpected format
          console.error('Unexpected API response format:', data);
          setBooks([]);
        }

        setError(null);
      } else {
        setError('Failed to load books');
      }
    } catch (err) {
      console.error('Error fetching books:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'textbook', name: 'Textbooks' },
    { id: 'story', name: 'Stories' },
    { id: 'poem', name: 'Poems' },
    { id: 'poetry', name: 'Poetry' }
  ];

  const languages = [
    { id: 'all', name: 'All Languages' },
    { id: 'en', name: 'English' },
    { id: 'bn', name: 'বাংলা' }
  ];

  const classLevels = Array.from({ length: 7 }, (_, i) => i + 6); // Classes 6-12

  // Ensure books is always an array before filtering
  const booksArray = Array.isArray(books) ? books : [];

  const filteredBooks = booksArray.filter(book => {
    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
    const matchesLanguage = selectedLanguage === 'all' || book.language === selectedLanguage;
    const matchesClass = selectedClass === 'all' || book.class_level === parseInt(selectedClass);
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesLanguage && matchesClass && matchesSearch;
  });

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'textbook': 'bg-blue-200 dark:bg-blue-800',
      'story': 'bg-green-200 dark:bg-green-800',
      'poem': 'bg-purple-200 dark:bg-purple-800',
      'poetry': 'bg-pink-200 dark:bg-pink-800'
    };
    return colors[category] || 'bg-gray-200 dark:bg-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading books...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Books</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
            <button
              onClick={fetchBooks}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
      <Navbar />
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">📚 Digital Library</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Access NCTB textbooks and educational resources in Bangla and English
          </p>
          {userClassLevel && (
            <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
              Your Class: {userClassLevel} | Total Books Available: {booksArray.length}
            </p>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                🔍 Search
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Search books..."
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                📖 Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                🌐 Language
              </label>
              <select
                id="language"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {languages.map(language => (
                  <option key={language.id} value={language.id}>{language.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="class" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                🎓 Class Level
              </label>
              <select
                id="class"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Classes</option>
                {classLevels.map(level => (
                  <option key={level} value={level}>Class {level}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Filter: My Class Books */}
          {userClassLevel && (
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setSelectedClass(userClassLevel.toString())}
                className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 rounded-lg font-medium transition-colors"
              >
                📚 Show My Class Books (Class {userClassLevel})
              </button>
              <button
                onClick={() => {
                  setSelectedClass('all');
                  setSelectedCategory('all');
                  setSelectedLanguage('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
              >
                🔄 Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredBooks.length} of {booksArray.length} books
        </div>

        {/* Books Grid */}
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map(book => (
              <div key={book.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                {/* Book Cover */}
                <div className={`${getCategoryColor(book.category)} h-48 flex items-center justify-center relative`}>
                  {book.cover_image ? (
                    <img
                      src={book.cover_image}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <div className="text-5xl mb-2">📚</div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 px-2">{book.title}</h3>
                    </div>
                  )}
                  {/* Class Badge */}
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-lg">
                      Class {book.class_level}
                    </span>
                  </div>
                </div>

                {/* Book Info */}
                <div className="p-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">{book.title}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">by {book.author}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{book.description}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {book.category}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {book.language === 'en' ? 'English' : 'বাংলা'}
                    </span>
                  </div>

                  {/* Action Button */}
                  {book.pdf_file ? (
                    <button
                      onClick={() => setSelectedBook(book)}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      📖 Read Now
                    </button>
                  ) : (
                    <div className="w-full text-center py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-md">
                      PDF not available
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No books found</h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {booksArray.length === 0
                ? 'No books have been added yet. Please check back later.'
                : 'Try adjusting your search or filter criteria'}
            </p>
            {filteredBooks.length === 0 && booksArray.length > 0 && (
              <button
                onClick={() => {
                  setSelectedClass('all');
                  setSelectedCategory('all');
                  setSelectedLanguage('all');
                  setSearchQuery('');
                }}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">About Digital Library</h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <ul className="list-disc list-inside space-y-1">
                  <li>Access NCTB textbooks and educational resources</li>
                  <li>Available in both English and Bangla</li>
                  <li>Books for all classes (6-12)</li>
                  <li>Read online with our built-in PDF viewer</li>
                  <li>Bookmark your progress and continue reading later</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced PDF Viewer Modal with AI Chat */}
      {selectedBook && selectedBook.pdf_file && (
        <EnhancedPDFViewer
          fileUrl={selectedBook.pdf_file}
          fileName={selectedBook.title}
          bookId={selectedBook.id}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </div>
  );
};

export default Books;
