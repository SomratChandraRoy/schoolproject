import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, RefreshCcw, Search, Sparkles } from 'lucide-react';
import EnhancedPDFViewer from '../components/EnhancedPDFViewer';
import '../styles/books-premium.css';

interface Book {
  id: number;
  title: string;
  author: string;
  class_level: number;
  category: string;
  language: string;
  description: string;
  pdf_file?: string | null;
  cover_image?: string | null;
  pdf_url?: string | null;
  pdf_view_url?: string | null;
  cover_image_url?: string | null;
  drive_download_link?: string | null;
  drive_view_link?: string | null;
  uploaded_at: string;
  resolvedPdfUrl?: string;
  resolvedCoverUrl?: string;
}

const categories = [
  { id: 'all', name: 'All Categories' },
  { id: 'textbook', name: 'Textbooks' },
  { id: 'story', name: 'Stories' },
  { id: 'poem', name: 'Poems' },
  { id: 'poetry', name: 'Poetry' },
];

const languages = [
  { id: 'all', name: 'All Languages' },
  { id: 'en', name: 'English' },
  { id: 'bn', name: 'বাংলা' },
];

const classLevels = Array.from({ length: 7 }, (_, i) => i + 6);

const normalizeUrl = (url?: string | null): string => {
  if (!url) {
    return '';
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (url.startsWith('/')) {
    return `${window.location.origin}${url}`;
  }

  return `${window.location.origin}/${url}`;
};

const normalizeBook = (book: Book): Book => ({
  ...book,
  resolvedPdfUrl: normalizeUrl(
    book.pdf_url || book.drive_download_link || book.pdf_view_url || book.drive_view_link || book.pdf_file,
  ),
  resolvedCoverUrl: normalizeUrl(book.cover_image_url || book.cover_image),
});

const getCategoryLabel = (category: string) => {
  const match = categories.find((item) => item.id === category);
  return match ? match.name : category;
};

const Books: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [expandedBookId, setExpandedBookId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userClassLevel = user?.class_level;

  useEffect(() => {
    void fetchBooks();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setExpandedBookId(null);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};

      if (token) {
        headers.Authorization = `Token ${token}`;
      }

      const response = await fetch('/api/books/books/', { headers });
      if (!response.ok) {
        setError('Failed to load books.');
        return;
      }

      const data = await response.json();
      const rawBooks = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];

      setBooks(rawBooks.map((book: Book) => normalizeBook(book)));
      setError(null);
    } catch (fetchError) {
      console.error('Error fetching books:', fetchError);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const searchHaystack = [book.title, book.author, book.description, book.category]
        .join(' ')
        .toLowerCase();

      const matchesSearch = !searchQuery.trim() || searchHaystack.includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
      const matchesLanguage = selectedLanguage === 'all' || book.language === selectedLanguage;
      const matchesClass = selectedClass === 'all' || book.class_level === Number(selectedClass);

      return matchesSearch && matchesCategory && matchesLanguage && matchesClass;
    });
  }, [books, searchQuery, selectedCategory, selectedLanguage, selectedClass]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedCategory !== 'all' ||
    selectedLanguage !== 'all' ||
    selectedClass !== 'all';

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedLanguage('all');
    setSelectedClass('all');
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="books-premium-page min-h-screen">
        <div className="books-loader-wrap">
          <div className="books-loader-ring" />
          <p className="books-loader-text">Loading your premium library...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="books-premium-page min-h-screen">
        <div className="books-loader-wrap">
          <div className="books-error-panel">
            <p className="books-error-title">Could not load library</p>
            <p className="books-error-text">{error}</p>
            <button type="button" onClick={() => void fetchBooks()} className="books-solid-button">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="books-premium-page min-h-screen">
      <div className="books-premium-shell max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-10">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="books-glass books-hero-panel">
          <div>
            <p className="books-hero-kicker">Digital Library</p>
            <h1 className="books-hero-title">Premium Reading Vault</h1>
            <p className="books-hero-subtitle">
              Cover-first browsing with smooth glass cards. Hover to reveal full details and jump into PDF reading instantly.
            </p>
          </div>
          <div className="books-hero-stats">
            <div className="books-stat-card">
              <span>Total Books</span>
              <strong>{books.length}</strong>
            </div>
            <div className="books-stat-card">
              <span>Matching</span>
              <strong>{filteredBooks.length}</strong>
            </div>
            {userClassLevel && (
              <div className="books-stat-card">
                <span>Your Class</span>
                <strong>{userClassLevel}</strong>
              </div>
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="books-glass books-filter-panel">
          <div className="books-filter-grid">
            <label className="books-filter-cell books-search-cell" htmlFor="books-search-input">
              <Search className="h-4 w-4" />
              <input
                id="books-search-input"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search title, author, topic..."
                className="books-search-input"
              />
            </label>

            <label className="books-filter-cell" htmlFor="books-category-select">
              <span className="books-filter-label">Category</span>
              <select
                id="books-category-select"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="books-filter-select">
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="books-filter-cell" htmlFor="books-language-select">
              <span className="books-filter-label">Language</span>
              <select
                id="books-language-select"
                value={selectedLanguage}
                onChange={(event) => setSelectedLanguage(event.target.value)}
                className="books-filter-select">
                {languages.map((language) => (
                  <option key={language.id} value={language.id}>
                    {language.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="books-filter-cell" htmlFor="books-class-select">
              <span className="books-filter-label">Class</span>
              <select
                id="books-class-select"
                value={selectedClass}
                onChange={(event) => setSelectedClass(event.target.value)}
                className="books-filter-select">
                <option value="all">All Classes</option>
                {classLevels.map((level) => (
                  <option key={level} value={level}>
                    Class {level}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="books-filter-actions">
            {userClassLevel && (
              <button
                type="button"
                onClick={() => setSelectedClass(String(userClassLevel))}
                className="books-soft-button">
                <Sparkles className="h-4 w-4" />
                My Class ({userClassLevel})
              </button>
            )}
            {hasActiveFilters && (
              <button type="button" onClick={resetFilters} className="books-soft-button">
                <RefreshCcw className="h-4 w-4" />
                Reset
              </button>
            )}
          </div>
        </motion.section>

        {filteredBooks.length === 0 ? (
          <div className="books-glass books-empty-state">
            <BookOpen className="h-10 w-10" />
            <h2>No books matched your filters</h2>
            <p>Try different keywords or reset filters to explore the full collection.</p>
            {hasActiveFilters && (
              <button type="button" onClick={resetFilters} className="books-solid-button">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="books-grid mt-7 sm:mt-9">
            {filteredBooks.map((book, index) => {
              const canRead = Boolean(book.resolvedPdfUrl);
              const overlayOpen = isMobile && expandedBookId === book.id;

              return (
                <motion.article
                  key={book.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.24) }}
                  className="books-card group"
                  onClick={() => {
                    if (isMobile) {
                      setExpandedBookId((current) => (current === book.id ? null : book.id));
                    }
                  }}>
                  <div className="books-card-media">
                    {book.resolvedCoverUrl ? (
                      <img src={book.resolvedCoverUrl} alt={book.title} className="books-cover-image" />
                    ) : (
                      <div className="books-cover-fallback">
                        <BookOpen className="h-9 w-9" />
                        <p>No cover yet</p>
                      </div>
                    )}

                    <div className="books-title-pill">{book.title}</div>

                    <div className={`books-card-overlay ${overlayOpen ? 'is-open' : ''}`}>
                      <h3>{book.title}</h3>
                      <p className="books-author-line">By {book.author}</p>

                      <div className="books-meta-row">
                        <span>Class {book.class_level}</span>
                        <span>{book.language === 'bn' ? 'বাংলা' : 'English'}</span>
                        <span>{getCategoryLabel(book.category)}</span>
                      </div>

                      <p className="books-description-text">
                        {book.description || 'AI-ready PDF with premium reading and smart assistant support.'}
                      </p>

                      {canRead ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedBook(book);
                          }}
                          className="books-solid-button w-full justify-center">
                          Open PDF
                        </button>
                      ) : (
                        <div className="books-missing-pill">PDF not uploaded yet</div>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>

      {selectedBook?.resolvedPdfUrl && (
        <EnhancedPDFViewer
          fileUrl={selectedBook.resolvedPdfUrl}
          fileName={selectedBook.title}
          bookId={selectedBook.id}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </div>
  );
};

export default Books;
