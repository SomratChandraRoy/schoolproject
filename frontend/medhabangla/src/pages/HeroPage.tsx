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

const HeroPage: React.FC = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [bgColor, setBgColor] = useState("#f9f9f7");
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [activeMaskUps, setActiveMaskUps] = useState<Set<string>>(new Set());
  const heroRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  // Scroll tracking for parallax and color transitions
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);

      // Section color transitions based on scroll position
      const featuresSection = document.getElementById("features");
      const philosophySection = document.getElementById("philosophy");

      if (featuresSection && philosophySection) {
        const featuresRect = featuresSection.getBoundingClientRect();
        const philosophyRect = philosophySection.getBoundingClientRect();

        if (philosophyRect.top < window.innerHeight / 2) {
          setBgColor("#002a18");
        } else if (featuresRect.top < window.innerHeight / 2) {
          setBgColor("#eeeeec");
        } else {
          setBgColor("#f9f9f7");
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll indicator animation
  useEffect(() => {
    const bar = scrollIndicatorRef.current;
    if (!bar) return;

    let position = 0;
    let direction = 1;
    const animate = () => {
      position += direction * 2;
      if (position >= 100 || position <= 0) direction *= -1;
      bar.style.transform = `translateY(${position}%)`;
      requestAnimationFrame(animate);
    };

    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, []);

  // Initialize Intersection Observer for mask-up animations
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-mask-id");
            if (id) {
              setActiveMaskUps((prev) => new Set(prev).add(id));
              entry.target.classList.add("active");
            }
          }
        });
      },
      { threshold: 0.1 },
    );

    document.querySelectorAll("[data-mask-id]").forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const features: Feature[] = [
    {
      id: "read-books",
      icon: "auto_stories",
      title: "Read Books",
      description:
        "Access our pristine digital library of classic and contemporary texts.",
      link: "/books",
      action: "Explore Library",
    },
    {
      id: "take-notes",
      icon: "edit_note",
      title: "Take Notes",
      description:
        "An elegant markdown editor for your observations and research papers.",
      link: "/notes",
      action: "Open Notebook",
    },
    {
      id: "quizzes",
      icon: "quiz",
      title: "Quizzes",
      description:
        "Rigorous assessments designed to challenge and solidify knowledge.",
      link: "/quiz",
      action: "Start Challenge",
    },
    {
      id: "video-calls",
      icon: "video_call",
      title: "Video Calls",
      description:
        "Secure, high-definition rooms for scholarly seminars and tutoring.",
      link: "/video-call",
      action: "Join Room",
    },
    {
      id: "games",
      icon: "extension",
      title: "Games",
      description:
        "Cognitive simulations that transform complex concepts into play.",
      link: "/games",
      action: "Enter Arena",
    },
  ];

  return (
    <div
      className="min-h-screen bg-white overflow-x-hidden scroll-smooth grain-bg"
      style={{
        backgroundColor: bgColor,
        transition: "background-color 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
      }}
      ref={heroRef}>
      {/* Custom Styles */}
      <style>{`
        :root {
          --expo-ease: cubic-bezier(0.2, 0.8, 0.2, 1);
          --bg-transition: background-color 1.2s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .material-symbols-outlined {
          font-variation-settings: "FILL" 0, "wght" 300, "GRAD" 0, "opsz" 24;
          display: inline-block;
        }

        .editorial-shadow {
          box-shadow: 0 40px 100px rgba(11, 66, 42, 0.12);
        }

        .grain-bg::before {
          content: "";
          position: fixed;
          top: -150%;
          left: -150%;
          width: 300%;
          height: 300%;
          background-image: url(https://lh3.googleusercontent.com/aida-public/AB6AXuACvKQ5wF2ELbI6F4HDPS7T9XFlRzD8Sv6ZxokRcFPYdQ9WH8BsTnKNa_vMTU3pxdqsCSZPqf2UPTBduhZtN1njxLIp3vTiiFzS_kEqVLH7VjHOrpzUwFrJQhlLETrfn_ngGxlHqOqvepuiRafWuNK-8f6NwSKiMl9YJm2mEe3EIV15ScJ-7VbI9FIrK8TMcRd_iK3tRjHLU-qHijlrFhjsYkFWdo1FseTxh2vzpEF2bW5Ch-33_XHEtm9HrvTdy3XOltkwNaHyhRA);
          opacity: 0.05;
          pointer-events: none;
          z-index: 9999;
          animation: grain 8s steps(10) infinite;
        }

        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -10%); }
          20% { transform: translate(-15%, 5%); }
          30% { transform: translate(7%, -25%); }
          40% { transform: translate(-5%, 25%); }
          50% { transform: translate(-15%, 10%); }
          60% { transform: translate(15%, 0%); }
          70% { transform: translate(0%, 15%); }
          80% { transform: translate(3%, 35%); }
          90% { transform: translate(-10%, 10%); }
        }

        .reveal-mask {
          clip-path: inset(0 0 100% 0);
        }

        .mask-up {
          overflow: hidden;
          display: block;
        }

        .mask-up-inner {
          display: block;
          transform: translateY(110%);
          transition: transform 1.8s var(--expo-ease);
        }

        .mask-up.active .mask-up-inner {
          transform: translateY(0);
        }

        .reveal-el {
          opacity: 0;
          transform: translateY(1rem);
          animation: revealIn 1.5s var(--expo-ease) forwards;
        }

        @keyframes revealIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .premium-divider {
          height: 1px;
          width: 100%;
          background: linear-gradient(90deg, transparent, #775a19 50%, transparent);
          opacity: 0.2;
        }

        .premium-hover {
          transition: all 0.6s var(--expo-ease);
        }

        .premium-hover:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.08);
        }

        .depth-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 140%;
          height: 140%;
          background: radial-gradient(circle, rgba(119, 90, 25, 0.15) 0%, transparent 70%);
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: -1;
          mix-blend-mode: soft-light;
        }

        .magnetic-wrap {
          display: inline-flex;
          transition: transform 0.3s var(--expo-ease);
        }

        .magnetic-btn {
          will-change: transform;
        }

        .staircase-progress {
          display: flex;
          gap: 4px;
        }

        .staircase-step {
          width: 12px;
          height: 12px;
          background-color: #775a19;
          clip-path: polygon(0% 100%, 100% 100%, 100% 0%);
        }

        #hero-premium-image {
          will-change: transform, filter, opacity;
          filter: blur(20px);
          opacity: 0;
          transform: scale(0.95);
          animation: heroImageLoad 2.5s var(--expo-ease) forwards 0.3s;
        }

        @keyframes heroImageLoad {
          to {
            filter: blur(0px);
            opacity: 1;
            transform: scale(1);
          }
        }

        .scroll-indicator-bar {
          will-change: transform;
        }

        .philosophy-img {
          will-change: transform;
        }

        .feature-card {
          animation: featureCardReveal 1.8s var(--expo-ease) both;
        }

        .feature-card:nth-child(1) { animation-delay: 0s; }
        .feature-card:nth-child(2) { animation-delay: 0.1s; }
        .feature-card:nth-child(3) { animation-delay: 0.2s; }
        .feature-card:nth-child(4) { animation-delay: 0.3s; }
        .feature-card:nth-child(5) { animation-delay: 0.4s; }

        @keyframes featureCardReveal {
          from {
            clip-path: inset(0 0 100% 0);
            transform: translateY(50px);
            opacity: 0;
          }
          to {
            clip-path: inset(0 0 0% 0);
            transform: translateY(0);
            opacity: 1;
          }
        }

        .quote-box {
          animation: quoteBoxSlide 1s var(--expo-ease) forwards;
        }

        @keyframes quoteBoxSlide {
          from {
            transform: translateX(50px) translateY(50px);
            opacity: 0;
          }
          to {
            transform: translateX(0) translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      {/* Logo Navigation */}
      <nav className="fixed top-8 left-8 z-[100] mix-blend-difference">
        <Link
          to="/"
          className="group flex items-center gap-3 pointer-events-auto cursor-pointer">
          <div className="transition-transform duration-1000 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-110">
            <img
              alt="SOPAN Logo"
              className="h-12 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAq5niX8vWEVfbZMFErHO2h_tUY35HT1_k-gCeg1_UTTRaGTvA3c0V0vzvuArA4934lKziGeBnJK2dYg80Gqnf_N1m_yoK96SAXIztaSZVLPr2vyMiTV9mqcSeCU10sE3gvd15QpK0PPAgN-7eMCU2FuLMi97lK2c8dz2lQZTDHhihTSbvGvSe4DshYpXeu4MQOeDIDpJOn1TEaGLE3TmDELi6WhkB0CVIdLzwld0HaYP6tin79s40IPeAAlvtpM7Rk9mhaBkOmAho"
            />
          </div>
          <div className="h-[1px] w-0 group-hover:w-8 bg-white transition-all duration-1000 ease-[cubic-bezier(0.2,0.8,0.2,1)] origin-left"></div>
        </Link>
      </nav>

      {/* Hero Section */}
      <header
        className="relative min-h-[1024px] flex flex-col items-center justify-center overflow-hidden pt-20"
        id="hero">
        <div className="max-w-7xl mx-auto px-8 flex flex-col items-center text-center relative z-10">
          {/* Badge */}
          <div className="mask-up mb-8" data-mask-id="badge">
            <div className="reveal-el inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ffdea3] text-[#261900] text-[10px] font-bold tracking-[0.2em] uppercase">
              <span className="material-symbols-outlined text-sm">school</span>
              <span>The Modern Scholar</span>
            </div>
          </div>

          {/* Main Heading */}
          <h1
            className="font-headline text-6xl md:text-[9rem] font-bold text-[#002a18] mb-12 leading-[0.9] tracking-tighter max-w-6xl"
            id="hero-title">
            <span className="mask-up block" data-mask-id="title-1">
              <span className="mask-up-inner">Elevate Your</span>
            </span>
            <span className="mask-up block" data-mask-id="title-2">
              <span className="mask-up-inner text-[#775a19]">Learning</span>
            </span>
            <span className="mask-up block" data-mask-id="title-3">
              <span className="mask-up-inner">Journey</span>
            </span>
          </h1>

          {/* Subtitle */}
          <div className="mask-up max-w-2xl mb-24" data-mask-id="subtitle">
            <p className="reveal-el font-body text-lg text-[#414943] leading-relaxed">
              Bangladesh's Premier Academic Ecosystem for Students. Crafting a
              digital institution rooted in excellence and modern scholarship.
            </p>
          </div>

          {/* Premium Hero Image */}
          <div
            className="relative w-full max-w-6xl mt-12 mb-24 perspective-1000"
            id="hero-visual-wrapper">
            <div className="depth-glow" id="hero-glow"></div>
            <div
              className="relative w-full overflow-hidden rounded-2xl editorial-shadow"
              id="hero-image-container"
              style={{
                transform: `translateY(${scrollPosition * 0.3}px) scale(${1 + scrollPosition * 0.0001})`,
              }}>
              <img
                alt="SOPAN Academic Excellence"
                className="w-full h-full object-cover"
                id="hero-premium-image"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPoFTOqLW7UPpA8SiyRHP3oXar6kOVQYAAnH66eIUDMOnDtGn450bLDyxgf6HZDbILbJ0fraoa2SDWyAAgoFNXgR5Ms4WuRUeQG90PzXFvxUvwpUsT97mSMkOKrSY80DucHqWYlPx8l1xSU7zv_mttTMDG_HgXQErv0NdNAFCC6HGhpQLW63HZC2YIOMhbmQXVY72wdeyo5-Snqss6Jq5P2WY7mOc-bSsEwYFKmPGuk8kWxowB7pMm6IWIf_9SmDrxjB17iobsYLw"
                onLoad={() => setIsImageLoaded(true)}
              />
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 scroll-indicator">
          <span className="text-[10px] uppercase tracking-[0.5em] text-[#775a19] font-bold">
            Scroll
          </span>
          <div className="relative w-[1px] h-16 bg-[#c0c9c1]/30 overflow-hidden">
            <div
              className="absolute top-0 left-0 w-full h-1/2 bg-[#775a19] scroll-indicator-bar"
              ref={scrollIndicatorRef}></div>
          </div>
        </div>
      </header>

      <div className="premium-divider"></div>

      {/* Features Section */}
      <section
        className="py-48 bg-[#eeeeec] transition-colors duration-1000 relative section-connector"
        id="features">
        <div className="max-w-7xl mx-auto px-8">
          <div
            className="flex flex-col md:flex-row justify-between items-end mb-24 gap-6 section-header reveal-mask"
            style={{ animation: "featureCardReveal 1.8s var(--expo-ease)" }}>
            <div className="max-w-xl">
              <h2
                className="font-headline text-5xl md:text-7xl font-bold text-[#002a18] mb-8 tracking-tighter mask-up active"
                data-mask-id="features-title">
                <span className="mask-up-inner">
                  Curated Tools for Distinction
                </span>
              </h2>
              <p className="text-[#414943] font-body text-lg leading-relaxed opacity-70">
                We reject cluttered interfaces. Each feature is an intentional
                instrument designed for the serious academic pursuer.
              </p>
            </div>
            <div className="magnetic-wrap">
              <div
                className="flex items-center gap-2 text-[#775a19] font-semibold uppercase tracking-widest text-[10px] mb-4 cursor-pointer hover:gap-4 transition-all group magnetic-btn"
                id="methodology-link">
                View Methodology
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {features.map((feature, idx) => (
              <Link
                key={feature.id}
                to={feature.link}
                className="feature-card reveal-mask premium-hover group bg-[#ffffff] p-10 rounded-lg border border-transparent hover:border-[#775a19] flex flex-col h-full min-h-[360px] cursor-pointer"
                style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="w-12 h-12 bg-[#f4f4f2] rounded-lg flex items-center justify-center text-[#002a18] mb-8 group-hover:bg-[#ffdea3] transition-colors">
                  <span className="material-symbols-outlined">
                    {feature.icon}
                  </span>
                </div>
                <h3 className="font-headline text-2xl font-bold text-[#002a18] mb-4">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#414943] leading-relaxed opacity-80">
                  {feature.description}
                </p>
                <div className="mt-auto pt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-bold text-[#775a19] tracking-[0.3em] uppercase">
                    {feature.action}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="premium-divider"></div>

      {/* Philosophy Section */}
      <section
        className="py-48 bg-[#002a18] transition-colors duration-1000 overflow-hidden relative section-connector"
        id="philosophy">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-12 gap-24 items-center">
          {/* Image Column */}
          <div
            className="md:col-span-7 relative philosophy-image-wrap reveal-mask"
            style={{
              transform: `translateY(${scrollPosition * -0.15}px)`,
              transition: "transform 0.3s ease-out",
            }}>
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#e9c176]/10 rounded-full blur-[120px]"></div>
            <div className="relative bg-[#ffffff] p-4 rounded-xl border border-[#c0c9c1]/20 editorial-shadow overflow-hidden group">
              <img
                alt="Deep Learning"
                className="philosophy-img rounded-lg w-full h-[650px] object-cover scale-110"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWIK_aw70Qv7x8nRXnW_8uWfUOVlSPPo0KmhEjc0vnIrYERerZ5ncGOMDl-2b5DK-W0vDY-miixJ2n86mDqkfU1F2PnH-wDovvtpEa3wzLOWQoEXj1qLJkfypoJTvBQROX9CAj72CrMh2zleZayntzIid6ELbdVi5E0w-6jWObyO7-zgjoSp0s6K5-pfnj-SO9XCNElkuJgpMf_i-T88PWA0ngWs5Lf61xI9X0MLiOlYK-cEovVFGGYzNhzaAQkzaziM9FnBPus00"
                style={{
                  transform: `scale(${1.1 + scrollPosition * 0.0005})`,
                  transition: "transform 0.3s ease-out",
                }}
              />
              <div className="absolute inset-0 bg-[#002a18]/20 mix-blend-multiply transition-opacity duration-1000 group-hover:opacity-0"></div>
              <div className="quote-box absolute -bottom-8 -right-8 bg-[#002a18] p-12 rounded-lg shadow-2xl max-w-xs">
                <p className="font-headline italic text-[#f9f9f7] text-xl mb-6">
                  "The foundation of every state is the education of its youth."
                </p>
                <p className="text-[#f9f9f7]/60 text-[10px] uppercase tracking-[0.4em]">
                  Diogenes of Sinope
                </p>
              </div>
            </div>
          </div>

          {/* Content Column */}
          <div className="md:col-span-5 philosophy-content">
            <div className="staircase-progress mb-12">
              <div className="staircase-step w-4 h-4"></div>
              <div className="staircase-step w-4 h-4"></div>
              <div className="staircase-step w-4 h-4"></div>
              <div className="staircase-step w-4 h-4"></div>
            </div>

            <h2
              className="font-headline text-5xl md:text-6xl font-bold text-[#f9f9f7] mb-10 tracking-tighter leading-tight mask-up active"
              data-mask-id="philosophy-title">
              <span className="mask-up-inner">
                Built on the SOPAN Philosophy
              </span>
            </h2>

            <div className="space-y-12">
              {[
                {
                  num: "01",
                  title: "Structural Integrity",
                  desc: "Every learning path is meticulously architected to ensure cumulative mastery.",
                },
                {
                  num: "02",
                  title: "Peer Accountability",
                  desc: "Learn alongside high-achievers in a private, curated ecosystem of merit.",
                },
                {
                  num: "03",
                  title: "Global Standard",
                  desc: "Bringing Ivy-League pedagogical frameworks to the digital landscape of Bangladesh.",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex gap-6 reveal-phil-step opacity-0"
                  style={{
                    animation: `revealIn 1.5s var(--expo-ease) forwards ${idx * 0.2 + 0.3}s`,
                  }}>
                  <span className="text-[#775a19] font-headline text-3xl">
                    {item.num}
                  </span>
                  <div>
                    <h4 className="font-bold text-xl text-[#f9f9f7] mb-2">
                      {item.title}
                    </h4>
                    <p className="text-[#f1f1ef] text-base leading-relaxed opacity-70">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="magnetic-wrap mt-16">
              <Link
                to="/register"
                className="magnetic-btn px-10 py-4 bg-[#002a18] text-[#f9f9f7] rounded-lg font-semibold flex items-center gap-4 group transition-all duration-1000 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:bg-[#0b422a] hover:px-12 border border-[#775a19]">
                <span className="text-sm">Join the Institution</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-2 transition-transform">
                  arrow_right_alt
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-[#c0c9c1]/20 bg-[#eeeeec] relative z-10">
        <div className="w-full py-24 px-8 flex flex-col items-center text-center max-w-7xl mx-auto">
          <div className="mb-12">
            <span className="text-4xl font-headline font-bold text-[#002a18] mb-4 block tracking-tighter">
              SOPAN
            </span>
            <p className="text-[10px] uppercase tracking-[0.5em] text-[#414943]/60">
              Excellence in Modern Scholarship
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-12 mb-16">
            <Link
              to="#"
              className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#414943] hover:text-[#775a19] transition-colors">
              Academic Integrity
            </Link>
            <Link
              to="#"
              className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#414943] hover:text-[#775a19] transition-colors">
              Privacy Policy
            </Link>
            <Link
              to="#"
              className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#414943] hover:text-[#775a19] transition-colors">
              Institutional Access
            </Link>
            <Link
              to="#"
              className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#414943] hover:text-[#775a19] transition-colors">
              Support
            </Link>
          </div>

          <div className="text-[10px] text-[#414943]/40">
            © 2024 SOPAN Digital Institution. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HeroPage;
