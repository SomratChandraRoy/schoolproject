import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface FeatureItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  link: string;
  action: string;
}

const FEATURES: FeatureItem[] = [
  {
    id: "books",
    icon: "📚",
    title: "Digital Library",
    description:
      "Access syllabus books, reference material, and curated reading lists.",
    link: "/books",
    action: "Open Library",
  },
  {
    id: "quiz",
    icon: "🧠",
    title: "Smart Quiz Arena",
    description:
      "Adaptive quiz paths that respond to your pace and mastery level.",
    link: "/quiz",
    action: "Start Quiz",
  },
  {
    id: "notes",
    icon: "✍️",
    title: "Notes Studio",
    description:
      "Capture class notes with structure, revision cues, and quick lookup.",
    link: "/notes",
    action: "Write Notes",
  },
  {
    id: "games",
    icon: "🎮",
    title: "Mind Games",
    description:
      "Boost memory and concentration through skill-based learning games.",
    link: "/games",
    action: "Play Now",
  },
  {
    id: "voice",
    icon: "🎤",
    title: "Voice Tutor",
    description:
      "Practice speaking and get AI-guided explanations in a natural flow.",
    link: "/voice-tutor",
    action: "Talk to AI",
  },
];

const HeroPage: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;

      ticking = true;
      window.requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        ticking = false;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const id = entry.target.getAttribute("data-reveal-id");
          if (!id) return;

          setRevealed((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
          });
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    const nodes = document.querySelectorAll<HTMLElement>("[data-reveal-id]");
    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);

  const heroImageTranslate = Math.min(scrollY * 0.22, 100);
  const heroGlowShift = Math.min(scrollY * 0.15, 80);

  const revealClass = (id: string, baseClass: string = "reveal-block") =>
    `${baseClass} ${revealed.has(id) ? "reveal-active" : ""}`;

  return (
    <div className="hero-premium-shell bg-[#f5f6f8] text-[#11231c] min-h-screen overflow-x-hidden">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700;9..144,800&family=Manrope:wght@400;500;600;700&display=swap");

        .hero-premium-shell {
          --ease-premium: cubic-bezier(0.2, 0.8, 0.2, 1);
          --line-soft: rgba(17, 35, 28, 0.16);
          --ink-soft: rgba(17, 35, 28, 0.75);
          font-family: "Manrope", "Segoe UI", sans-serif;
          background-image:
            radial-gradient(circle at 15% 20%, rgba(30, 102, 78, 0.18), transparent 42%),
            radial-gradient(circle at 84% 30%, rgba(189, 133, 44, 0.2), transparent 45%),
            linear-gradient(180deg, #f5f6f8 0%, #eef1f4 58%, #e8ecef 100%);
        }

        .hero-premium-shell::before {
          content: "";
          position: fixed;
          inset: -100% -100%;
          background-image: radial-gradient(rgba(17, 35, 28, 0.14) 0.35px, transparent 0.35px);
          background-size: 3px 3px;
          opacity: 0.06;
          pointer-events: none;
          z-index: 0;
        }

        .headline-font {
          font-family: "Fraunces", Georgia, serif;
          letter-spacing: -0.03em;
        }

        .reveal-block {
          opacity: 0;
          transform: translateY(34px) scale(0.985);
          filter: blur(8px);
          transition:
            opacity 0.95s var(--ease-premium),
            transform 0.95s var(--ease-premium),
            filter 0.95s var(--ease-premium);
        }

        .reveal-active {
          opacity: 1;
          transform: translateY(0) scale(1);
          filter: blur(0);
        }

        .reveal-left {
          transform: translateX(-28px) scale(0.985);
        }

        .reveal-right {
          transform: translateX(28px) scale(0.985);
        }

        .reveal-left.reveal-active,
        .reveal-right.reveal-active {
          transform: translateX(0) scale(1);
        }

        .hero-card-glow {
          position: absolute;
          inset: -16% -10%;
          border-radius: 30px;
          background: radial-gradient(circle, rgba(40, 127, 97, 0.28), rgba(189, 133, 44, 0.08) 42%, transparent 68%);
          filter: blur(28px);
          pointer-events: none;
          z-index: -1;
          animation: pulse-glow 4.2s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%,
          100% { opacity: 0.42; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(1.05); }
        }

        .emotion-float {
          animation: float-y 5.2s ease-in-out infinite;
        }

        .emotion-float-delayed {
          animation: float-y 6.1s ease-in-out infinite 0.9s;
        }

        @keyframes float-y {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .premium-feature {
          border: 1px solid rgba(17, 35, 28, 0.1);
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.92), rgba(247, 250, 251, 0.88));
          box-shadow: 0 20px 45px rgba(13, 35, 27, 0.07);
          transition: transform 0.45s var(--ease-premium), box-shadow 0.45s var(--ease-premium), border-color 0.45s var(--ease-premium);
        }

        .premium-feature:hover {
          transform: translateY(-8px);
          border-color: rgba(189, 133, 44, 0.42);
          box-shadow: 0 28px 50px rgba(13, 35, 27, 0.14);
        }

        .scroll-cue-dot {
          animation: cue-drop 1.9s ease-in-out infinite;
        }

        @keyframes cue-drop {
          0% { transform: translateY(0); opacity: 0.2; }
          50% { transform: translateY(9px); opacity: 1; }
          100% { transform: translateY(0); opacity: 0.2; }
        }
      `}</style>

      <nav className="fixed top-6 left-6 z-40">
        <Link
          to="/"
          className="group inline-flex items-center gap-3 rounded-full border border-white/40 bg-white/75 px-4 py-2 backdrop-blur-md shadow-lg transition-all duration-500 hover:shadow-xl hover:-translate-y-0.5">
          <img src="/logo.png" alt="SOPNA Logo" className="h-10 w-auto" />
          <span className="text-xs font-semibold tracking-[0.24em] text-[#234536] uppercase group-hover:text-[#1a3328]">
            SOPNA
          </span>
        </Link>
      </nav>

      <header className="relative z-10 min-h-screen px-6 pt-28 pb-20 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div
              data-reveal-id="badge"
              className={revealClass(
                "badge",
                "inline-flex items-center gap-2 rounded-full border border-[#234536]/20 bg-white/75 px-4 py-2 text-[11px] font-semibold tracking-[0.14em] uppercase text-[#234536]",
              )}>
              <span>Premium Learning Atmosphere</span>
            </div>

            <h1
              data-reveal-id="title"
              className={revealClass(
                "title",
                "headline-font mt-7 text-5xl leading-[0.95] text-[#102820] sm:text-6xl lg:text-7xl",
              )}>
              Build Focus.
              <br />
              Feel Momentum.
              <br />
              Learn Like A Pro.
            </h1>

            <p
              data-reveal-id="subtitle"
              className={revealClass(
                "subtitle",
                "mt-7 max-w-xl text-base leading-7 text-[color:var(--ink-soft)] md:text-lg",
              )}>
              A modern Bangladeshi academic platform crafted for deep practice,
              emotional motivation, and measurable progress from day one.
            </p>

            <div
              data-reveal-id="cta"
              className={revealClass(
                "cta",
                "mt-9 flex flex-wrap items-center gap-4",
              )}>
              <Link
                to="/register"
                className="rounded-xl bg-[#173d2f] px-6 py-3 text-sm font-semibold tracking-wide text-white shadow-lg transition-all duration-300 hover:bg-[#0f2f23] hover:-translate-y-0.5">
                Start Your Journey
              </Link>
              <Link
                to="/quiz/select"
                className="rounded-xl border border-[#173d2f]/20 bg-white/80 px-6 py-3 text-sm font-semibold tracking-wide text-[#173d2f] transition-all duration-300 hover:border-[#bd852c] hover:text-[#8f5f17] hover:-translate-y-0.5">
                Explore Smart Quiz
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-3" aria-hidden>
              <span className="emotion-float rounded-full border border-[#173d2f]/15 bg-white/70 px-4 py-2 text-xs text-[#173d2f] shadow-sm">
                Calm Focus
              </span>
              <span className="emotion-float-delayed rounded-full border border-[#bd852c]/20 bg-[#fff8ec] px-4 py-2 text-xs text-[#8f5f17] shadow-sm">
                Confident Energy
              </span>
              <span className="emotion-float rounded-full border border-[#173d2f]/15 bg-white/70 px-4 py-2 text-xs text-[#173d2f] shadow-sm">
                Daily Growth
              </span>
            </div>
          </div>

          <div
            data-reveal-id="hero-media"
            className={revealClass("hero-media", "relative")}
            style={{ transform: `translateY(${heroImageTranslate}px)` }}>
            <div
              className="hero-card-glow"
              style={{ transform: `translateY(${heroGlowShift}px)` }}
            />

            {!imageLoaded && (
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#d6dee1] via-[#edf2f4] to-[#dce4e8] animate-pulse" />
            )}

            <div className="relative overflow-hidden rounded-3xl border border-white/45 bg-white/70 p-3 shadow-[0_28px_70px_rgba(17,35,28,0.18)] backdrop-blur-sm">
              <img
                src="/hero.png"
                alt="SOPNA learning hero"
                className="h-[480px] w-full rounded-2xl object-cover object-center md:h-[560px]"
                onLoad={() => setImageLoaded(true)}
              />
              <div className="pointer-events-none absolute inset-3 rounded-2xl bg-gradient-to-t from-[#0f241c]/40 via-transparent to-[#0f241c]/10" />
            </div>
          </div>
        </div>

        <div className="mt-16 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-[#173d2f]/70">
            <span className="text-[10px] font-semibold tracking-[0.28em] uppercase">
              Scroll
            </span>
            <div className="h-12 w-6 rounded-full border border-[#173d2f]/25 p-1">
              <div className="scroll-cue-dot h-2 w-2 rounded-full bg-[#173d2f]/75" />
            </div>
          </div>
        </div>
      </header>

      <section
        data-reveal-id="stats"
        className={revealClass(
          "stats",
          "relative z-10 mx-auto mt-4 mb-20 grid max-w-6xl gap-4 px-6 sm:grid-cols-3 md:px-10 lg:px-16",
        )}>
        {[
          { label: "Active Learners", value: "50K+" },
          { label: "Quiz Topics", value: "1000+" },
          { label: "Daily Practice", value: "24/7" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[#173d2f]/12 bg-white/70 px-5 py-6 text-center shadow-[0_12px_28px_rgba(17,35,28,0.08)] backdrop-blur-sm">
            <div className="headline-font text-3xl text-[#173d2f]">
              {stat.value}
            </div>
            <div className="mt-1 text-xs font-semibold tracking-[0.12em] uppercase text-[#173d2f]/65">
              {stat.label}
            </div>
          </div>
        ))}
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 md:px-10 lg:px-16">
        <div
          data-reveal-id="feature-header"
          className={revealClass("feature-header", "mb-10 max-w-3xl")}>
          <h2 className="headline-font text-4xl text-[#102820] sm:text-5xl">
            Premium Tools That Trigger Progress
          </h2>
          <p className="mt-4 text-base leading-7 text-[color:var(--ink-soft)]">
            Every block is designed to keep motivation high while reducing
            friction in your day-to-day study routine.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const revealId = `feature-${feature.id}`;
            const revealDirection =
              index % 2 === 0 ? "reveal-left" : "reveal-right";

            return (
              <Link
                key={feature.id}
                to={feature.link}
                data-reveal-id={revealId}
                className={`${revealClass(revealId, `premium-feature reveal-block ${revealDirection}`)} rounded-2xl p-6`}>
                <div className="text-3xl">{feature.icon}</div>
                <h3 className="mt-4 headline-font text-2xl text-[#102820]">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#204236]/78">
                  {feature.description}
                </p>
                <div className="mt-6 text-xs font-bold tracking-[0.16em] uppercase text-[#8f5f17]">
                  {feature.action} →
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section
        data-reveal-id="philosophy"
        className={revealClass(
          "philosophy",
          "relative z-10 border-y border-[color:var(--line-soft)] bg-[#132a22] px-6 py-20 text-[#edf4f1] md:px-10 lg:px-16",
        )}>
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="overflow-hidden rounded-3xl border border-white/12 bg-white/5 p-3 shadow-[0_25px_65px_rgba(0,0,0,0.28)]">
            <img
              src="/hero.png"
              alt="Focused learning"
              className="h-[360px] w-full rounded-2xl object-cover object-center md:h-[430px]"
              style={{
                transform: `translateY(${Math.min(scrollY * -0.09, 50)}px)`,
              }}
            />
          </div>

          <div>
            <h3 className="headline-font text-4xl sm:text-5xl">
              SOPNA Learning Philosophy
            </h3>
            <div className="mt-8 space-y-6">
              {[
                "Structure first: clear progression from basics to mastery.",
                "Emotion-driven momentum: visual cues keep students engaged.",
                "Feedback loops: quick quizzes, notes, and tutoring in one ecosystem.",
              ].map((line, index) => {
                const revealId = `pillar-${index}`;

                return (
                  <p
                    key={line}
                    data-reveal-id={revealId}
                    className={revealClass(
                      revealId,
                      "reveal-block text-sm leading-7 text-[#d9e8e2] md:text-base",
                    )}>
                    {line}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section
        data-reveal-id="final-cta"
        className={revealClass(
          "final-cta",
          "relative z-10 mx-auto max-w-7xl px-6 py-20 text-center md:px-10 lg:px-16",
        )}>
        <h3 className="headline-font text-4xl text-[#102820] sm:text-5xl">
          Ready To Feel The Difference?
        </h3>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[color:var(--ink-soft)]">
          Enter a focused environment where design, motivation, and performance
          move together.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to="/register"
            className="rounded-xl bg-[#173d2f] px-7 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:bg-[#0f2f23] hover:-translate-y-0.5">
            Create Account
          </Link>
          <Link
            to="/login"
            className="rounded-xl border border-[#173d2f]/20 bg-white/85 px-7 py-3 text-sm font-semibold text-[#173d2f] transition-all duration-300 hover:border-[#bd852c] hover:text-[#8f5f17] hover:-translate-y-0.5">
            Sign In
          </Link>
        </div>
      </section>

      <footer className="relative z-10 border-t border-[color:var(--line-soft)] bg-white/65 px-6 py-10 text-center backdrop-blur-sm md:px-10 lg:px-16">
        <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#173d2f]/70">
          SOPNA Digital Learning Ecosystem
        </p>
        <p className="mt-2 text-xs text-[#173d2f]/55">
          © {new Date().getFullYear()} SOPNA. Crafted for focused learners.
        </p>
      </footer>
    </div>
  );
};

export default HeroPage;
