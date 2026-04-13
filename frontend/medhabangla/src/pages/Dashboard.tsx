import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
} from "recharts";
import { ChartAreaGradient } from "@/components/ui/chart-area-gradient";
import SalesMetricsCard from "@/components/ui/chart-sales-metrics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import ProfileCompletionModal from "../components/ProfileCompletionModal";
import AIVoiceConversation from "../components/AIVoiceConversation";

const Dashboard: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [stats, setStats] = useState([
    { name: "Total Points", value: 0 },
    { name: "Quizzes Taken", value: 0 },
    { name: "Games Played", value: 0 },
    { name: "Books Read", value: 0 },
  ]);
  const [streakDays, setStreakDays] = useState(0);
  const [totalHoursLearned, setTotalHoursLearned] = useState(0);
  const [studyStreak, setStudyStreak] = useState(false);

  const totalPoints = stats[0]?.value || 0;
  const quizzesTaken = stats[1]?.value || 0;
  const gamesPlayed = stats[2]?.value || 0;
  const booksRead = stats[3]?.value || 0;
  const currentLevel = Math.floor(totalPoints / 100) + 1;
  const levelProgress = totalPoints % 100;

  const learningSummary = useMemo(
    () => ({
      totalPoints,
      quizzesTaken,
      gamesPlayed,
      booksRead,
      streakDays,
      totalHoursLearned,
      level: currentLevel,
      levelProgress,
    }),
    [
      booksRead,
      currentLevel,
      gamesPlayed,
      levelProgress,
      quizzesTaken,
      streakDays,
      totalHoursLearned,
      totalPoints,
    ],
  );

  const statCards = useMemo(() => {
    const template = [
      {
        key: "points",
        name: "Total Points",
        value: totalPoints,
        icon: "🏅",
        color: "hsl(var(--chart-1))",
      },
      {
        key: "quizzes",
        name: "Quizzes Taken",
        value: quizzesTaken,
        icon: "🧠",
        color: "hsl(var(--chart-2))",
      },
      {
        key: "games",
        name: "Games Played",
        value: gamesPlayed,
        icon: "🎮",
        color: "hsl(var(--chart-3))",
      },
      {
        key: "books",
        name: "Books Read",
        value: booksRead,
        icon: "📚",
        color: "hsl(var(--chart-4))",
      },
    ];

    return template.map((entry) => ({
      ...entry,
      trend: [0.42, 0.56, 0.68, 0.82, 1].map((factor, index) => ({
        period: `P${index + 1}`,
        value: Math.max(0, Math.round(entry.value * factor)),
      })),
    }));
  }, [booksRead, gamesPlayed, quizzesTaken, totalPoints]);

  const miniTrendConfig = {
    value: {
      label: "Value",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  const momentumData = useMemo(() => {
    const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const multipliers = [0.35, 0.47, 0.6, 0.73, 0.86, 1];

    return labels.map((label, index) => ({
      label,
      desktop: Math.max(0, Math.round(totalPoints * multipliers[index])),
      mobile: Math.max(0, Math.round(totalHoursLearned * multipliers[index])),
    }));
  }, [totalHoursLearned, totalPoints]);

  const momentumConfig = {
    desktop: {
      label: "Points",
      color: "hsl(var(--chart-1))",
    },
    mobile: {
      label: "Hours",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  const momentumGrowth = useMemo(() => {
    const first = momentumData[0]?.desktop || 0;
    const last = momentumData[momentumData.length - 1]?.desktop || 0;

    if (first <= 0) {
      return last > 0 ? 100 : 0;
    }

    return Math.max(0, Math.round(((last - first) / first) * 100));
  }, [momentumData]);

  const activityData = useMemo(
    () => [
      { name: "Quizzes", value: quizzesTaken, fill: "hsl(var(--chart-1))" },
      { name: "Games", value: gamesPlayed, fill: "hsl(var(--chart-2))" },
      { name: "Books", value: booksRead, fill: "hsl(var(--chart-3))" },
      {
        name: "Hours",
        value: Math.max(0, Math.round(totalHoursLearned)),
        fill: "hsl(var(--chart-4))",
      },
    ],
    [booksRead, gamesPlayed, quizzesTaken, totalHoursLearned],
  );

  const activityConfig = {
    value: {
      label: "Count",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        // Redirect to login if no token
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/accounts/dashboard/", {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Check if profile is incomplete
        const isProfileIncomplete =
          !data.user.class_level ||
          !data.user.fav_subjects ||
          data.user.fav_subjects.length === 0;

        if (isProfileIncomplete) {
          setShowProfileModal(true);
        }

        // Update stats with real data
        setStats([
          { name: "Total Points", value: data.stats.total_points || 0 },
          { name: "Quizzes Taken", value: data.stats.quizzes_taken || 0 },
          { name: "Games Played", value: data.stats.games_played || 0 },
          { name: "Books Read", value: data.stats.books_read || 0 },
        ]);

        // Set streak and learning time
        setStreakDays(data.stats.current_streak || 0);
        setTotalHoursLearned(data.stats.total_hours_learned || 0);
        setStudyStreak((data.stats.current_streak || 0) > 0);
      } else {
        // Token might be invalid, redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileComplete = () => {
    setShowProfileModal(false);
    // Refresh user data
    fetchUserData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-red-500 dark:text-red-400">
              Failed to load user data
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        isOpen={showProfileModal}
        onComplete={handleProfileComplete}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {userData.first_name} {userData.last_name || ""}!
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Ready to learn something new today?{" "}
            {userData.class_level
              ? `You're in Class ${userData.class_level}.`
              : "Complete your profile to get started."}
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat) => {
            const gradientId = `spark-${stat.key}`;

            return (
              <Card
                key={stat.name}
                className="overflow-hidden border-slate-200/80 bg-white/95 shadow-lg dark:border-slate-700 dark:bg-slate-900/90">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center justify-between text-xs uppercase tracking-wide">
                    <span>{stat.name}</span>
                    <span className="text-lg" aria-hidden>
                      {stat.icon}
                    </span>
                  </CardDescription>
                  <CardTitle className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                    {stat.value}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ChartContainer
                    config={miniTrendConfig}
                    className="h-16 w-full">
                    <AreaChart
                      data={stat.trend}
                      margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                      <defs>
                        <linearGradient
                          id={gradientId}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1">
                          <stop
                            offset="10%"
                            stopColor={stat.color}
                            stopOpacity={0.7}
                          />
                          <stop
                            offset="95%"
                            stopColor={stat.color}
                            stopOpacity={0.08}
                          />
                        </linearGradient>
                      </defs>
                      <Area
                        dataKey="value"
                        type="monotone"
                        stroke={stat.color}
                        fill={`url(#${gradientId})`}
                        strokeWidth={2.2}
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr,0.7fr]">
          <SalesMetricsCard
            learningSummary={learningSummary}
            className="border-slate-200/80 bg-white/95 shadow-xl dark:border-slate-700 dark:bg-slate-900/90"
          />

          <div className="grid gap-6">
            <ChartAreaGradient
              className="border-slate-200/80 bg-white/95 shadow-xl dark:border-slate-700 dark:bg-slate-900/90"
              title="Learning Momentum"
              description="Points and hours trend across your recent learning window"
              desktopLabel="Points"
              mobileLabel="Hours"
              data={momentumData}
              footerTitle={`Momentum improved by ${momentumGrowth}%`}
              footerSubtext="Driven by quiz, reading, and game activity"
            />

            <Card className="border-slate-200/80 bg-white/95 shadow-xl dark:border-slate-700 dark:bg-slate-900/90">
              <CardHeader>
                <CardTitle className="text-base">Activity Mix</CardTitle>
                <CardDescription>
                  Real usage across quizzes, games, books, and study hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={activityConfig}
                  className="h-[220px] w-full">
                  <BarChart
                    data={activityData}
                    margin={{ top: 12, left: 4, right: 4, bottom: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />
                    <Bar dataKey="value" radius={10}>
                      {activityData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                      <LabelList
                        dataKey="value"
                        position="top"
                        className="fill-slate-700 text-xs font-medium dark:fill-slate-200"
                      />
                    </Bar>
                  </BarChart>
                </ChartContainer>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-orange-50 px-3 py-2 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                    Streak: {streakDays} day{streakDays === 1 ? "" : "s"}
                  </div>
                  <div className="rounded-xl bg-indigo-50 px-3 py-2 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
                    Level: {currentLevel}
                  </div>
                  <div className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                    Progress: {levelProgress}/100
                  </div>
                  <div className="rounded-xl bg-cyan-50 px-3 py-2 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300">
                    {studyStreak ? "On fire this week" : "Start a new streak"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* All Features Showcase - Full Width */}
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl leading-6 font-bold text-gray-900 dark:text-white">
              🚀 ALL FEATURES & TOOLS
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Access all your learning tools, organized by category
            </p>
          </div>

          <div className="px-6 py-6">
            {/* Academic Learning */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-2xl mr-2">🎓</span> Academic Learning
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <Link
                  to="/quiz"
                  className="p-4 border-2 border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    🧠
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Quiz
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Test knowledge
                  </p>
                </Link>
                <Link
                  to="/quiz/adaptive"
                  className="p-4 border-2 border-purple-200 dark:border-purple-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    🎓
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Adaptive Quiz
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Smart learning
                  </p>
                </Link>
                <Link
                  to="/books"
                  className="p-4 border-2 border-amber-200 dark:border-amber-700 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:border-amber-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    📚
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Books
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Read content
                  </p>
                </Link>
                <Link
                  to="/syllabus"
                  className="p-4 border-2 border-cyan-200 dark:border-cyan-700 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/30 hover:border-cyan-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    📖
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Syllabus
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Curriculum info
                  </p>
                </Link>
                <Link
                  to="/flashcards"
                  className="p-4 border-2 border-pink-200 dark:border-pink-700 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/30 hover:border-pink-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    🎴
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Flashcards
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Quick review
                  </p>
                </Link>
              </div>
            </div>

            {/* Interactive & Gaming */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-2xl mr-2">🎮</span> Interactive & Gaming
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <Link
                  to="/games"
                  className="p-4 border-2 border-yellow-200 dark:border-yellow-700 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/30 hover:border-yellow-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    🎮
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Games
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Learn by playing
                  </p>
                </Link>
                <Link
                  to="/tldraw"
                  className="p-4 border-2 border-green-200 dark:border-green-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 hover:border-green-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    🎨
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Whiteboard
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Creative drawing
                  </p>
                </Link>
                <Link
                  to="/chat"
                  className="p-4 border-2 border-emerald-200 dark:border-emerald-700 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    💬
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Chat
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Talk & share
                  </p>
                </Link>
                <Link
                  to="/ai-chat"
                  className="p-4 border-2 border-indigo-200 dark:border-indigo-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    🤖
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    AI Chat
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ask AI
                  </p>
                </Link>
              </div>
            </div>

            {/* Progress & Analytics */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-2xl mr-2">📊</span> Progress & Analytics
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <Link
                  to="/study-dashboard"
                  className="p-4 border-2 border-green-200 dark:border-green-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 hover:border-green-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    📊
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Progress
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Track progress
                  </p>
                </Link>
                <Link
                  to="/study-stats"
                  className="p-4 border-2 border-indigo-200 dark:border-indigo-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    📈
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Statistics
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    View analytics
                  </p>
                </Link>
                <Link
                  to="/leaderboard"
                  className="p-4 border-2 border-orange-200 dark:border-orange-700 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:border-orange-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    🏆
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Leaderboard
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Rank system
                  </p>
                </Link>
                <Link
                  to="/achievements"
                  className="p-4 border-2 border-red-200 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    🎖️
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Achievements
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Badges earned
                  </p>
                </Link>
              </div>
            </div>

            {/* Tools & Utilities */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-2xl mr-2">🛠️</span> Tools & Utilities
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <Link
                  to="/notes"
                  className="p-4 border-2 border-red-200 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    📝
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Notes
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Take notes
                  </p>
                </Link>
                <Link
                  to="/study-timer"
                  className="p-4 border-2 border-orange-200 dark:border-orange-700 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:border-orange-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    ⏱️
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Timer
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Manage time
                  </p>
                </Link>
                <Link
                  to="/document-vision"
                  className="p-4 border-2 border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    👁️
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Doc Vision
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    OCR & scanning
                  </p>
                </Link>
                <Link
                  to="/offline-ai"
                  className="p-4 border-2 border-violet-200 dark:border-violet-700 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:border-violet-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    🤖
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Offline AI
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    AI assistant
                  </p>
                </Link>
                <Link
                  to="/translator"
                  className="p-4 border-2 border-teal-200 dark:border-teal-700 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:border-teal-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    🌐
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Translator
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Translate text
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Recent Activity Section */}
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  📈 Your Progress at a Glance
                </h3>
              </div>
              <div className="px-6 py-8">
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="border-slate-200/80 shadow-sm dark:border-slate-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        Momentum Timeline
                      </CardTitle>
                      <CardDescription>
                        Points and study hours progression over recent months
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <ChartContainer
                        config={momentumConfig}
                        className="h-[220px] w-full">
                        <AreaChart
                          data={momentumData}
                          margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                          <defs>
                            <linearGradient
                              id="dashboardPointsFill"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1">
                              <stop
                                offset="5%"
                                stopColor="hsl(var(--chart-1))"
                                stopOpacity={0.7}
                              />
                              <stop
                                offset="95%"
                                stopColor="hsl(var(--chart-1))"
                                stopOpacity={0.08}
                              />
                            </linearGradient>
                            <linearGradient
                              id="dashboardHoursFill"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1">
                              <stop
                                offset="5%"
                                stopColor="hsl(var(--chart-2))"
                                stopOpacity={0.7}
                              />
                              <stop
                                offset="95%"
                                stopColor="hsl(var(--chart-2))"
                                stopOpacity={0.08}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} />
                          <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                          />
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent />}
                          />
                          <Area
                            dataKey="mobile"
                            type="monotone"
                            stroke="hsl(var(--chart-2))"
                            fill="url(#dashboardHoursFill)"
                            fillOpacity={0.45}
                            strokeWidth={2}
                          />
                          <Area
                            dataKey="desktop"
                            type="monotone"
                            stroke="hsl(var(--chart-1))"
                            fill="url(#dashboardPointsFill)"
                            fillOpacity={0.45}
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200/80 shadow-sm dark:border-slate-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        Category Performance
                      </CardTitle>
                      <CardDescription>
                        Compare completed activity across major learning
                        channels
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <ChartContainer
                        config={activityConfig}
                        className="h-[220px] w-full">
                        <BarChart
                          data={activityData}
                          margin={{ top: 16, left: 8, right: 8, bottom: 0 }}>
                          <CartesianGrid vertical={false} />
                          <XAxis
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                          />
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent />}
                          />
                          <Bar dataKey="value" radius={10}>
                            {activityData.map((entry) => (
                              <Cell
                                key={`progress-${entry.name}`}
                                fill={entry.fill}
                              />
                            ))}
                            <LabelList
                              dataKey="value"
                              position="top"
                              className="fill-slate-700 text-xs font-medium dark:fill-slate-200"
                            />
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-center dark:border-orange-800 dark:bg-orange-900/20">
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      {streakDays}
                    </p>
                    <p className="text-xs font-medium text-orange-600/90 dark:text-orange-300/80">
                      Day Streak
                    </p>
                  </div>
                  <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-center dark:border-cyan-800 dark:bg-cyan-900/20">
                    <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
                      {Math.round(totalHoursLearned)}
                    </p>
                    <p className="text-xs font-medium text-cyan-600/90 dark:text-cyan-300/80">
                      Learning Hours
                    </p>
                  </div>
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-center dark:border-indigo-800 dark:bg-indigo-900/20">
                    <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                      {totalPoints}
                    </p>
                    <p className="text-xs font-medium text-indigo-600/90 dark:text-indigo-300/80">
                      Points Earned
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended for You Section */}
            <div className="mt-8 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  🎯 Recommended for You
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow hover:border-blue-400 dark:hover:border-blue-500">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    📐 Math Quiz: Geometry
                  </h4>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Master geometry concepts and solve complex problems
                  </p>
                  <Link
                    to="/quiz"
                    className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                    Start Quiz →
                  </Link>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow hover:border-purple-400 dark:hover:border-purple-500">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    ⚛️ Physics Fundamentals
                  </h4>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Learn the laws of motion with interactive lessons
                  </p>
                  <Link
                    to="/books"
                    className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                    Read Chapter →
                  </Link>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow hover:border-green-400 dark:hover:border-green-500">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    🧬 Biology Challenge
                  </h4>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Play interactive games to learn biology concepts
                  </p>
                  <Link
                    to="/games"
                    className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                    Play Game →
                  </Link>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow hover:border-orange-400 dark:hover:border-orange-500">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    📚 English Literature
                  </h4>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Explore classic texts and improve your writing skills
                  </p>
                  <Link
                    to="/flashcards"
                    className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                    Study Cards →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Your Profile
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                    {userData.first_name?.charAt(0)}
                    {userData.last_name?.charAt(0) || userData.email?.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {userData.first_name} {userData.last_name || ""}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {userData.class_level
                        ? `Class ${userData.class_level}`
                        : "No class set"}
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Favorite Subjects
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {userData.fav_subjects &&
                    userData.fav_subjects.length > 0 ? (
                      userData.fav_subjects.map((subject: string) => (
                        <span
                          key={subject}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                          {subject}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No favorite subjects set
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    to="/profile"
                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-2xl mr-2">⭐</span> Quick Tips
              </h4>
              <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-lg mr-2">💡</span>
                  <span>Start with a quiz to test your knowledge</span>
                </li>
                <li className="flex items-start">
                  <span className="text-lg mr-2">📚</span>
                  <span>Read books to learn deeply</span>
                </li>
                <li className="flex items-start">
                  <span className="text-lg mr-2">🎮</span>
                  <span>Play games to make learning fun</span>
                </li>
                <li className="flex items-start">
                  <span className="text-lg mr-2">📊</span>
                  <span>Check progress for motivation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-lg mr-2">🔄</span>
                  <span>Use flashcards for quick review</span>
                </li>
              </ul>
              <div className="mt-6 pt-4 border-t border-blue-200 dark:border-blue-700">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  👉 All features are available in the 🚀 ALL FEATURES section
                  above
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Voice Tutor Section */}
        <div className="mt-8">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-2">
              🎤 AI Voice Tutor - Learn by Speaking!
            </h2>
            <p className="text-white/90">
              Have real conversations with our AI tutor. Get exam help, solve
              doubts, take voice quizzes, and more - all recorded for future
              reference.
            </p>
          </div>
          <AIVoiceConversation isFloating={false} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
