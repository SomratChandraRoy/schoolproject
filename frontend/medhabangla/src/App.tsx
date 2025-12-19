import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import page components
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Quiz from './pages/Quiz';
import Books from './pages/Books';
import Games from './pages/Games';
import Profile from './pages/Profile';
import Notes from './pages/Notes';
import AdminDashboard from './pages/AdminDashboard';

// Import components
import AIChat from './components/AIChat';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/books" element={<Books />} />
          <Route path="/games" element={<Games />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Routes>
        <AIChat />
      </div>
    </Router>
  );
}

export default App;