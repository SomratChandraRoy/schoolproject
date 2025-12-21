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
import Profile from './pages/Profile';
import Notes from './pages/Notes';
import AdminDashboard from './pages/AdminDashboard';
import AuthCallback from './pages/AuthCallback';

// Import components
import AIChat from './components/AIChat';
import { DarkModeProvider } from './contexts/DarkModeContext';

function App() {
  return (
    <DarkModeProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/quiz/select" element={<QuizSelection />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/books" element={<Books />} />
            <Route path="/games" element={<Games />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>
          <AIChat />
        </div>
      </Router>
    </DarkModeProvider>
  );
}

export default App;