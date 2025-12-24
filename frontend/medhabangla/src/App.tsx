import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import * as React from 'react';



// Import page components
import Ollama from './pages/Ollama'
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Quiz from './pages/Quiz';
import QuizSelection from './pages/QuizSelection';
import Books from './pages/Books';
import Games from './pages/Games';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import NotesFileSystem from './pages/NotesFileSystem'; // File system notes with local storage
import AdminDashboard from './pages/AdminDashboard';
import QuizManagement from './pages/QuizManagement';
import AuthCallback from './pages/AuthCallback';
import ProfileSetup from './pages/ProfileSetup';
import Syllabus from './pages/Syllabus';
import StudyTimer from './pages/StudyTimer';
import StudyStats from './pages/StudyStats';
import SuperuserDashboard from './pages/SuperuserDashboard';
import AdminSettings from './pages/AdminSettings';

//import pdfd for cheking pdf viewer ! 
import Pdfd from './pages/Pdfd'
// Import components
import AIChat from './components/AIChat';
import ProtectedRoute from './components/ProtectedRoute';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import BanCheck from './components/BanCheck';
import { DarkModeProvider } from './contexts/DarkModeContext';

// Import PWA utilities
import { registerServiceWorker, requestPersistentStorage } from './utils/registerSW';

function App() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  // Register service worker and request storage permission
  React.useEffect(() => {
    console.log('[App] Initializing PWA features...');

    // Register service worker
    registerServiceWorker();

    // Request persistent storage
    requestPersistentStorage().then((granted) => {
      console.log('[App] Persistent storage:', granted ? 'granted' : 'denied');
    });

    // Log PWA installation status
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    console.log('[App] PWA installed:', isInstalled);

    // Check if service worker is supported
    if ('serviceWorker' in navigator) {
      console.log('[App] Service Worker API is supported');
    } else {
      console.warn('[App] Service Worker API is NOT supported');
    }

    // Check manifest
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      console.log('[App] Manifest link found:', manifestLink.getAttribute('href'));
    } else {
      console.warn('[App] Manifest link NOT found in HTML');
    }
  }, []);

  return (
    <DarkModeProvider>
      <Router>
        <div className="App">
          {/* Ban Check Component - runs on every page */}
          <BanCheck />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route path="/ollama" element={<Ollama />} />


            {/* Protected Routes for Authenticated Users */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />

              <Route path="/quiz/select" element={<QuizSelection />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/books" element={<Books />} />
              <Route path="/pdfd" element={<Pdfd />} />

              <Route path="/games" element={<Games />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/notes" element={<NotesFileSystem />} />
              <Route path="/syllabus" element={<Syllabus />} />
              <Route path="/study-timer" element={<StudyTimer />} />
              <Route path="/study-stats" element={<StudyStats />} />
            </Route>

            {/* Protected Routes for Admin */}
            <Route element={<ProtectedRoute isAllowed={!!user && user.is_admin} redirectPath="/dashboard" />}>
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/superuser" element={<SuperuserDashboard />} />
              <Route path="/admin/ai-settings" element={<AdminSettings />} />
            </Route>

            {/* Protected Routes for Teachers and Admins */}
            <Route element={<ProtectedRoute isAllowed={!!user && (user.is_teacher || user.is_admin)} redirectPath="/dashboard" />}>
              <Route path="/quiz/manage" element={<QuizManagement />} />
            </Route>
          </Routes>

          {/* AI Chat Assistant */}
          <AIChat />

          {/* PWA Install Prompt */}
          <PWAInstallPrompt />
        </div>
      </Router>
    </DarkModeProvider>
  );
}

export default App;
