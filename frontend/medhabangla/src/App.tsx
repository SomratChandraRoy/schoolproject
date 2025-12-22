import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { Fragment } from 'react/jsx-runtime';
// Import page components
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
import Notes from './pages/Notes';
import AdminDashboard from './pages/AdminDashboard';
import QuizManagement from './pages/QuizManagement';
import AuthCallback from './pages/AuthCallback';
import ProfileSetup from './pages/ProfileSetup';
import Syllabus from './pages/Syllabus';
import StudyTimer from './pages/StudyTimer';
import StudyStats from './pages/StudyStats';
import SuperuserDashboard from './pages/SuperuserDashboard';

//import pdfd for cheking pdf viewer ! 
import Pdfd from './pages/Pdfd'
// Import components
import AIChat from './components/AIChat';
import ProtectedRoute from './components/ProtectedRoute';
import { DarkModeProvider } from './contexts/DarkModeContext';

// Lazy load PWA components to prevent blocking
import { lazy, Suspense } from 'react';

const PWAInstallPrompt = lazy(() => import('./components/PWAInstallPrompt').catch(() => ({ default: () => null })));
const OfflineIndicator = lazy(() => import('./components/OfflineIndicator').catch(() => ({ default: () => null })));

function App() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  return (
    <DarkModeProvider>
      <Router>
        <div className="App">
          {/* Offline/Online Indicator - Lazy loaded */}
          <Suspense fallback={null}>
            <OfflineIndicator />
          </Suspense>

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />

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
              <Route path="/notes" element={<Notes />} />
              <Route path="/syllabus" element={<Syllabus />} />
              <Route path="/study-timer" element={<StudyTimer />} />
              <Route path="/study-stats" element={<StudyStats />} />
            </Route>

            {/* Protected Routes for Admin */}
            <Route element={<ProtectedRoute isAllowed={!!user && user.is_admin} redirectPath="/dashboard" />}>
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/superuser" element={<SuperuserDashboard />} />
            </Route>

            {/* Protected Routes for Teachers and Admins */}
            <Route element={<ProtectedRoute isAllowed={!!user && (user.is_teacher || user.is_admin)} redirectPath="/dashboard" />}>
              <Route path="/quiz/manage" element={<QuizManagement />} />
            </Route>
          </Routes>

          {/* AI Chat Assistant */}
          <AIChat />

          {/* PWA Install Prompt - Lazy loaded */}
          <Suspense fallback={null}>
            <PWAInstallPrompt />
          </Suspense>
        </div>
      </Router>
    </DarkModeProvider>
  );
}

export default App;