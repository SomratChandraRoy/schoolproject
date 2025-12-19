import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PDFViewer from '../components/PDFViewer';

const Books: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<any>(null);

  // Mock book data
  const books = [
    {
      id: 1,
      title: "Mathematics Class 9",
      author: "Dr. Md. Abu Yusuf",
      classLevel: 9,
      category: "textbook",
      language: "en",
      coverColor: "bg-blue-200",
      description: "Complete mathematics textbook for Class 9 following NCTB curriculum"
    },
    {
      id: 2,
      title: "গণিত বই - নবম শ্রেণি",
      author: "ড. এম এ হালিম",
      classLevel: 9,
      category: "textbook",
      language: "bn",
      coverColor: "bg-green-200",
      description: "জাতীয় পাঠ্যপুস্তক বোর্ড গণিত বই - নবম শ্রেণি"
    },
    {
      id: 3,
      title: "Physics Class 10",
      author: "Prof. Md. Shah Alam",
      classLevel: 10,
      category: "textbook",
      language: "en",
      coverColor: "bg-purple-200",
      description: "Complete physics textbook for Class 10 following NCTB curriculum"
    },
    {
      id: 4,
      title: "বাংলা সাহিত্য - দশম শ্রেণি",
      author: "ড. কাজী আবদুল ওদুদ",
      classLevel: 10,
      category: "textbook",
      language: "bn",
      coverColor: "bg-yellow-200",
      description: "জাতীয় পাঠ্যপুস্তক বোর্ড বাংলা সাহিত্য বই - দশম শ্রেণি"
    },
    {
      id: 5,
      title: "Short Stories Collection",
      author: "Various Authors",
      classLevel: 9,
      category: "story",
      language: "en",
      coverColor: "bg-red-200",
      description: "Collection of inspiring short stories for young readers"
    },
    {
      id: 6,
      title: "গল্পের গল্প",
      author: "বিভিন্ন লেখক",
      classLevel: 9,
      category: "story",
      language: "bn",
      coverColor: "bg-indigo-200",
      description: "তরুণ পাঠকদের জন্য অনুপ্রেরণামূলক গল্পের সংকলন"
    }
  ];

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

  const filteredBooks = books.filter(book => {
    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
    const matchesLanguage = selectedLanguage === 'all' || book.language === selectedLanguage;
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          book.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesLanguage && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Digital Library</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Access NCTB textbooks and educational resources in Bangla and English
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
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
                Category
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
                Language
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
                Class Level
              </label>
              <select
                id="class"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Classes</option>
                {classLevels.map(level => (
                  <option key={level} value={level}>Class {level}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Books Grid */}
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredBooks.map(book => (
              <div key={book.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className={`${book.coverColor} h-48 flex items-center justify-center`}>
                  <div className="text-center p-4">
                    <div className="text-5xl mb-2">📚</div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">{book.title}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">{book.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">by {book.author}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                      Class {book.classLevel}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{book.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {book.category}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {book.language === 'en' ? 'English' : 'বাংলা'}
                      </span>
                    </div>
                    <button 
                      onClick={() => setSelectedBook(book)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Read
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No books found</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {/* Language Toggle Notice */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Language Options</h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  You can switch between English and Bangla versions of textbooks and literature. 
                  Some books are available in both languages, while others may be language-specific.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* PDF Viewer Modal */}
      {selectedBook && (
        <PDFViewer 
          fileUrl={`/pdfs/${selectedBook.id}.pdf`} 
          fileName={selectedBook.title}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </div>
  );
};

export default Books;