import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import React from "react";
import OfflineIndicator from "./components/OfflineIndicator";

// Import page components
import Ollama from "./pages/Ollama";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Quiz from "./pages/Quiz";
import QuizSelection from "./pages/QuizSelection";
import AdaptiveQuiz from "./pages/AdaptiveQuiz";
import Books from "./pages/Books";
import VideoCall from "./pages/VideoCall";
import Games from "./pages/Games";
import GamesHub from "./pages/games/GamesHub";
import MemoryPattern from "./pages/games/MemoryPattern";
import ImageDragger from "./pages/games/ImageDragger";
import MathRush from "./pages/games/MathRush/App";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import NotesFileSystem from "./pages/NotesFileSystem"; // File system notes with local storage
import AdminDashboard from "./pages/AdminDashboard";
import QuizManagement from "./pages/QuizManagement";
import AuthCallback from "./pages/AuthCallback";
import ProfileSetup from "./pages/ProfileSetup";
import Syllabus from "./pages/Syllabus";
import StudyTimer from "./pages/StudyTimer";
import StudyStats from "./pages/StudyStats";
import SuperuserDashboard from "./pages/SuperuserDashboard";
import AdminSettings from "./pages/AdminSettings";
import Chat from "./pages/Chat";
import TldrawPage from "./pages/Tldraw";
import AcademicsDashboard from "./pages/AcademicsDashboard";
import StudyPlan from "./pages/StudyPlan";
import VoiceTutor from "./pages/VoiceTutor";
import DocumentAnalysis from "./pages/DocumentAnalysis";
import Flashcards from "./pages/Flashcards";
import StudentDashboard from "./pages/StudentDashboard";
import OfflineAIPage from "./pages/OfflineAIPage";
import TranslatorPage from "./pages/Translator";
import HeroPage from "./pages/HeroPage";
import ContactAdmin from "./pages/ContactAdmin";
import Plans from "./pages/Plans";
//import pdfd for cheking pdf viewer !
import Pdfd from "./pages/Pdfd";
import NotFound from "./pages/NotFound";

// Import components
import AIChat from "./components/AIChat";
import EnhancedAIChat from "./components/EnhancedAIChat";
import AIVoiceConversation from "./components/AIVoiceConversation";
import PremiumAIChatWithElevenLabsUI from "./components/PremiumAIChatWithElevenLabsUI";
import ProtectedRoute from "./components/ProtectedRoute";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import BanCheck from "./components/BanCheck";
import MacDockNav from "./components/MacDock";
import { DarkModeProvider } from "./contexts/DarkModeContext";
import Footer from "./components/Footer";
import { BlinkUIProvider } from "@blinkdotnew/ui";
import { canAccessChat } from "./utils/roleUtils";

// Import PWA utilities
import {
  registerServiceWorker,
  requestPersistentStorage,
} from "./utils/registerSW";
import { autoInstallForInstalledPWA } from "./services/modelPrefetcher";

function App() {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const token = localStorage.getItem("token");
  const hasChatAccess = canAccessChat(user);
  const [unreadCount, setUnreadCount] = React.useState(0);

  // Fetch unread count for members
  React.useEffect(() => {
    if (!user || !hasChatAccess || !token) return;

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch("/api/chat/unread-count/", {
          headers: { Authorization: `Token ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.unread_count || 0);
        }
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [user, hasChatAccess, token]);

  // Register service worker and request storage permission
  React.useEffect(() => {
    console.log("[App] Initializing PWA features...");

    // In development, stale service workers can serve old cached assets
    // and cause a blank page. Clean them up and skip registration.
    if (import.meta.env.DEV) {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister().catch(() => undefined);
          });
        });
      }

      if ("caches" in window) {
        caches.keys().then((cacheNames) => {
          cacheNames
            .filter(
              (name) =>
                name.includes("workbox") ||
                name.includes("sopan") ||
                name.includes("app-shell-cache"),
            )
            .forEach((name) => {
              caches.delete(name).catch(() => undefined);
            });
        });
      }

      return;
    }

    // Register service worker
    registerServiceWorker();

    // Request persistent storage
    requestPersistentStorage().then((granted) => {
      console.log("[App] Persistent storage:", granted ? "granted" : "denied");
    });

    // If app is already installed, prefetch offline mini model packs.
    void autoInstallForInstalledPWA();

    // Log PWA installation status
    const isInstalled = window.matchMedia("(display-mode: standalone)").matches;
    console.log("[App] PWA installed:", isInstalled);

    // Check if service worker is supported
    if ("serviceWorker" in navigator) {
      console.log("[App] Service Worker API is supported");
    } else {
      console.warn("[App] Service Worker API is NOT supported");
    }

    // Check manifest
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      console.log(
        "[App] Manifest link found:",
        manifestLink.getAttribute("href"),
      );
    } else {
      console.warn("[App] Manifest link NOT found in HTML");
    }
  }, []);

  return (
    <DarkModeProvider>
      <Router>
        <div className="App flex flex-col min-h-screen bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-gray-100 transition-colors duration-200">
          {/* Ban Check Component - runs on every page */}
          <BanCheck />

          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/hero" element={<HeroPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/contact-admin" element={<ContactAdmin />} />
              <Route path="/profile-setup" element={<ProfileSetup />} />
              <Route path="/ollama" element={<Ollama />} />

              {/* Protected Routes for Authenticated Users */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/quiz/select" element={<QuizSelection />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/quiz/adaptive" element={<AdaptiveQuiz />} />
                <Route path="/books" element={<Books />} />
                <Route path="/pdfd" element={<Pdfd />} />
                <Route path="/videocall" element={<VideoCall />} />
                {/* Legacy games route */}
                <Route path="/games-old" element={<Games />} />
                {/* New games routes */}
                <Route path="/games" element={<GamesHub />} />
                <Route path="/games/image_dragger" element={<ImageDragger />} />
                {/* Legacy placeholder routes */}
                <Route
                  path="/games/memory_matrix"
                  element={<MemoryPattern />}
                />
                <Route
                  path="/games/math_quiz"
                  element={
                    <BlinkUIProvider theme="linear" darkMode="light">
                      <MathRush />
                    </BlinkUIProvider>
                  }
                />
                <Route
                  path="/games/equation_storm"
                  element={<MemoryPattern />}
                />
                <Route path="/games/word_puzzle" element={<MemoryPattern />} />
                <Route
                  path="/games/pattern_matching"
                  element={<MemoryPattern />}
                />
                <Route path="/games/pathfinder" element={<MemoryPattern />} />
                <Route
                  path="/games/infinite_loop"
                  element={<MemoryPattern />}
                />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/notes" element={<NotesFileSystem />} />
                <Route path="/syllabus" element={<Syllabus />} />
                <Route path="/study-timer" element={<StudyTimer />} />
                <Route path="/study-stats" element={<StudyStats />} />
                <Route path="/plans" element={<Plans />} />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute
                      isAllowed={hasChatAccess}
                      redirectPath="/plans">
                      <Chat />
                    </ProtectedRoute>
                  }
                />
                <Route path="/drawing" element={<TldrawPage />} />
                <Route
                  path="/academics"
                  element={<AcademicsDashboard />}
                />{" "}
                <Route path="/study-dashboard" element={<StudentDashboard />} />{" "}
                <Route path="/offline-ai" element={<OfflineAIPage />} />
                <Route path="/translator" element={<TranslatorPage />} />
                <Route path="/study-plan" element={<StudyPlan />} />
                <Route path="/voice-tutor" element={<VoiceTutor />} />
                <Route path="/document-vision" element={<DocumentAnalysis />} />
                <Route path="/flashcards" element={<Flashcards />} />
              </Route>

              {/* Protected Routes for Admin */}
              <Route
                element={
                  <ProtectedRoute
                    isAllowed={!!user && user.is_admin}
                    redirectPath="/dashboard"
                  />
                }>
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/superuser" element={<SuperuserDashboard />} />
                <Route path="/admin/ai-settings" element={<AdminSettings />} />
              </Route>

              {/* Protected Routes for Teachers and Admins */}
              <Route
                element={
                  <ProtectedRoute
                    isAllowed={!!user && (user.is_teacher || user.is_admin)}
                    redirectPath="/dashboard"
                  />
                }>
                <Route path="/quiz/manage" element={<QuizManagement />} />
              </Route>

              {/* 404 Catch-all Route - Must be last */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          <Footer />

          {/* Premium AI Chat with ElevenLabs UI Components */}
          <PremiumAIChatWithElevenLabsUI />

          {/* Enhanced AI Chat Assistant with ElevenLabs-inspired UI */}
          {/* <EnhancedAIChat /> */}

          {/* PWA Install Prompt */}
          <PWAInstallPrompt />

          {/* AI Voice Tutor Widget - Floating on all pages */}
          {/* <AIVoiceConversation isFloating={true} /> */}

          {/* MacDock Navigation */}
          <MacDockNav unreadCount={unreadCount} />
        </div>
        <OfflineIndicator />
      </Router>
    </DarkModeProvider>
  );
}

export default App;
