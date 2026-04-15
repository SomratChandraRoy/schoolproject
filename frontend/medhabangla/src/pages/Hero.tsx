import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";

interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
  link: string;
  action: string;
}

const Hero: React.FC = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const features: Feature[] = [
    {
      id: "read-books",
      icon: "📚",
      title: "Read Books",
      description:
        "Access our digital library of classic and contemporary texts.",
      link: "/books",
      action: "Explore Library",
    },
    {
      id: "take-notes",
      icon: "📝",
      title: "Take Notes",
      description:
        "An elegant markdown editor for your observations and research.",
      link: "/notes",
      action: "Open Notebook",
    },
    {
      id: "quizzes",
      icon: "🧠",
      title: "Quizzes",
      description:
        "Rigorous assessments designed to challenge and solidify knowledge.",
      link: "/quiz",
      action: "Start Challenge",
    },
    {
      id: "video-calls",
      icon: "📹",
      title: "Video Calls",
      description:
        "Secure, high-definition rooms for scholarly seminars and tutoring.",
      link: "/video-call",
      action: "Join Session",
    },
    {
      id: "games",
      icon: "🎮",
      title: "Mind Games",
      description:
        "Gamified learning experiences to boost cognitive abilities.",
      link: "/games",
      action: "Play Now",
    },
  ];

  // Scroll listener for parallax effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Animations handled via CSS utility classes (Tailwind)
  // Optional: Add GSAP animations or react-spring if advanced animations needed

  return (
    <div
      className="min-h-screen bg-white dark:bg-gray-900 scroll-smooth overflow-x-hidden"
      ref={heroRef}>
      {/* Fixed Logo Navigation */}
      <nav className="fixed top-8 left-8 z-50 mix-blend-difference">
        <Link
          to="/"
          className="group flex items-center gap-3 pointer-events-auto cursor-pointer">
          <div className="transition-transform duration-1000 ease-out group-hover:scale-110">
            <img
              alt="SOPNA Logo"
              className="h-12 w-auto object-contain drop-shadow-lg"
              src="/logo.png"
            />
          </div>
          <div className="h-[1px] w-0 group-hover:w-8 bg-gray-800 dark:bg-white transition-all duration-1000 origin-left"></div>
        </Link>
      </nav>

      {/* Main Hero Section */}
      <header
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900"
        id="hero">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-purple-100 dark:bg-purple-900/20 rounded-full blur-3xl opacity-30 translate-y-1/2 -translate-x-1/2"></div>
        </div>

        {/* Content Container */}
        <div className="max-w-7xl mx-auto px-8 flex flex-col items-center text-center relative z-10">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 text-sm font-semibold tracking-wide">
            <span>🎓</span>
            <span>The Modern Scholar</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">
            <span className="mask-up-inner inline-block bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent transform translate-y-[110%]">
              Elevate Your
            </span>
            <br />
            <span className="mask-up-inner inline-block text-gray-800 dark:text-gray-100 transform translate-y-[110%]">
              Learning Journey
            </span>
          </h1>

          {/* Subtitle */}
          <p className="reveal-el text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mb-12 leading-relaxed font-light opacity-0 translate-y-4">
            Bangladesh's Premier Academic Ecosystem for Students. Crafting a
            digital institution rooted in excellence and modern scholarship.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link
              to="/dashboard"
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative flex items-center gap-2">
                🚀 Get Started
              </span>
            </Link>

            <Link
              to="/register"
              className="group relative px-8 py-4 border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-semibold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300">
              <span className="relative flex items-center gap-2">
                📚 Join Community
              </span>
            </Link>
          </div>

          {/* Premium Hero Image */}
          <div className="relative w-full max-w-6xl mb-16">
            <div
              className="relative w-full overflow-hidden rounded-2xl shadow-2xl"
              id="hero-image-container">
              {/* Image Loading Placeholder */}
              {!isImageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 animate-pulse"></div>
              )}

              <img
                alt="SOPNA Academic Excellence"
                id="hero-premium-image"
                className="w-full h-auto object-cover transition-all duration-500 filter blur-sm opacity-0"
                src="/hero.png"
                onLoad={() => setIsImageLoaded(true)}
                loading="lazy"
                style={{
                  transform: `translateY(${scrollPosition * 0.5}px)`,
                }}
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
            </div>

            {/* Depth Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-b from-blue-400/10 to-transparent blur-3xl -z-10"></div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mb-16">
            <div className="backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-lg p-4 border border-white/20">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                50K+
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Active Students
              </div>
            </div>
            <div className="backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-lg p-4 border border-white/20">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                1000+
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Quiz Topics
              </div>
            </div>
            <div className="backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-lg p-4 border border-white/20">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                AI
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Powered
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-3 animate-bounce">
          <span className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-semibold">
            Scroll
          </span>
          <div className="relative w-[1px] h-12 bg-gray-300 dark:bg-gray-600 overflow-hidden">
            <div className="scroll-indicator-bar absolute top-0 left-0 w-full h-1/2 bg-blue-600"></div>
          </div>
        </div>
      </header>

      {/* Premium Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>

      {/* Features Section */}
      <section className="py-24 md:py-32 bg-white dark:bg-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-8">
          {/* Section Header */}
          <div className="mb-16 text-center md:text-left">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
              Curated Tools for Distinction
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
              We reject cluttered interfaces. Each feature is an intentional
              instrument designed for the serious academic pursuer.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {features.map((feature) => (
              <Link
                key={feature.id}
                to={feature.link}
                className="feature-card group relative bg-gray-50 dark:bg-gray-700 rounded-xl p-8 border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 hover:shadow-lg hover:-translate-y-2 flex flex-col h-full">
                {/* Icon */}
                <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 flex-grow leading-relaxed">
                  {feature.description}
                </p>

                {/* Action Text - visible on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-widest uppercase">
                    {feature.action} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-900 dark:to-purple-900">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Join thousands of Bangladeshi students who are already elevating
            their academic journey with SOPNA.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg">
              Sign Up Now
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-all duration-300">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <p className="mb-4">
            &copy; {new Date().getFullYear()} SOPNA. Bangladesh's Premier
            Academic Ecosystem.
          </p>
          <p className="text-sm text-gray-500">
            Elevating education through technology and innovation.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Hero;
