import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { useDarkMode } from "../contexts/DarkModeContext";

interface DockApp {
  id: string;
  name: string;
  icon: React.ReactNode | string;
  path?: string;
  badge?: number;
  onClick?: (e?: React.MouseEvent) => void;
  isButton?: boolean;
  isProfile?: boolean;
}

interface MacOSDockProps {
  apps: DockApp[];
  openApps?: string[];
  className?: string;
}

const MacOSDock: React.FC<MacOSDockProps> = ({
  apps,
  openApps = [],
  className = "",
}) => {
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [currentScales, setCurrentScales] = useState<number[]>(
    apps.map(() => 1),
  );
  const [currentPositions, setCurrentPositions] = useState<number[]>([]);
  const [transitioningPath, setTransitioningPath] = useState<string | null>(
    null,
  );
  const [emphasizedIconId, setEmphasizedIconId] = useState<string | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<(HTMLElement | null)[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const routeTransitionTimerRef = useRef<number | null>(null);
  const iconEmphasisTimerRef = useRef<number | null>(null);
  const lastMouseMoveTime = useRef<number>(0);
  const location = useLocation();
  const navigate = useNavigate();

  const resolveDockMotionTarget = useCallback((path: string | null) => {
    if (!path) {
      return 0;
    }

    if (path.startsWith("/drawing")) {
      return 1;
    }

    if (path.startsWith("/videocall")) {
      return 1;
    }

    

    return 0;
  }, []);

  const routeDockMotionTarget = resolveDockMotionTarget(location.pathname);
  const transitioningDockMotionTarget =
    resolveDockMotionTarget(transitioningPath);
  const resolvedDockMotionTarget =
    transitioningDockMotionTarget !== 0
      ? transitioningDockMotionTarget
      : routeDockMotionTarget;

  const [dockMotionProgress, setDockMotionProgress] = useState(
    resolvedDockMotionTarget,
  );
  const dockMotionProgressRef = useRef(resolvedDockMotionTarget);

  const getResponsiveConfig = useCallback(() => {
    if (typeof window === "undefined") {
      return { baseIconSize: 64, maxScale: 1.6, effectWidth: 240 };
    }
    const smallerDimension = Math.min(window.innerWidth, window.innerHeight);
    if (smallerDimension < 480) {
      return {
        baseIconSize: Math.max(40, smallerDimension * 0.08),
        maxScale: 1.4,
        effectWidth: smallerDimension * 0.4,
      };
    }
    if (smallerDimension < 768) {
      return {
        baseIconSize: Math.max(48, smallerDimension * 0.07),
        maxScale: 1.5,
        effectWidth: smallerDimension * 0.35,
      };
    }
    if (smallerDimension < 1024) {
      return {
        baseIconSize: Math.max(56, smallerDimension * 0.06),
        maxScale: 1.6,
        effectWidth: smallerDimension * 0.3,
      };
    }
    return {
      baseIconSize: Math.max(64, Math.min(80, smallerDimension * 0.05)),
      maxScale: 1.8,
      effectWidth: 300,
    };
  }, []);

  const [config, setConfig] = useState(getResponsiveConfig);
  const { baseIconSize, maxScale, effectWidth } = config;
  const minScale = 1.0;
  const baseSpacing = Math.max(4, baseIconSize * 0.08);

  useEffect(() => {
    dockMotionProgressRef.current = dockMotionProgress;
  }, [dockMotionProgress]);

  useEffect(() => {
    const target = resolvedDockMotionTarget;
    const start = dockMotionProgressRef.current;
    if (Math.abs(target - start) < 0.001) {
      setDockMotionProgress(target);
      return;
    }

    let frameId = 0;
    let startTime: number | null = null;
    const duration = 1450;

    const easeInOutCubic = (t: number) => {
      if (t < 0.5) {
        return 4 * t * t * t;
      }
      return 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animate = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const elapsed = Math.min((timestamp - startTime) / duration, 1);
      const eased = easeInOutCubic(elapsed);
      const next = start + (target - start) * eased;
      setDockMotionProgress(next);

      if (elapsed < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [resolvedDockMotionTarget]);

  useEffect(() => {
    return () => {
      if (routeTransitionTimerRef.current !== null) {
        window.clearTimeout(routeTransitionTimerRef.current);
      }
      if (iconEmphasisTimerRef.current !== null) {
        window.clearTimeout(iconEmphasisTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setConfig(getResponsiveConfig());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [getResponsiveConfig]);

  const calculateTargetMagnification = useCallback(
    (mousePosition: number | null) => {
      if (mousePosition === null) {
        return apps.map(() => minScale);
      }
      return apps.map((_, index) => {
        const normalIconCenter =
          index * (baseIconSize + baseSpacing) + baseIconSize / 2;
        const minX = mousePosition - effectWidth / 2;
        const maxX = mousePosition + effectWidth / 2;
        if (normalIconCenter < minX || normalIconCenter > maxX) {
          return minScale;
        }
        const theta = ((normalIconCenter - minX) / effectWidth) * 2 * Math.PI;
        const cappedTheta = Math.min(Math.max(theta, 0), 2 * Math.PI);
        const scaleFactor = (1 - Math.cos(cappedTheta)) / 2;
        return minScale + scaleFactor * (maxScale - minScale);
      });
    },
    [apps, baseIconSize, baseSpacing, effectWidth, maxScale, minScale],
  );

  const calculatePositions = useCallback(
    (scales: number[]) => {
      let currentX = 0;
      return scales.map((scale) => {
        const scaledWidth = baseIconSize * scale;
        const centerX = currentX + scaledWidth / 2;
        currentX += scaledWidth + baseSpacing;
        return centerX;
      });
    },
    [baseIconSize, baseSpacing],
  );

  useEffect(() => {
    const initialScales = apps.map(() => minScale);
    const initialPositions = calculatePositions(initialScales);
    setCurrentScales(initialScales);
    setCurrentPositions(initialPositions);
  }, [apps, calculatePositions, minScale, config]);

  const animateToTarget = useCallback(() => {
    const targetScales = calculateTargetMagnification(mouseX);
    const targetPositions = calculatePositions(targetScales);
    const lerpFactor = mouseX !== null ? 0.2 : 0.12;

    setCurrentScales((prevScales) => {
      return prevScales.map((currentScale, index) => {
        const diff = targetScales[index] - currentScale;
        return currentScale + diff * lerpFactor;
      });
    });

    setCurrentPositions((prevPositions) => {
      return prevPositions.map((currentPos, index) => {
        const diff = targetPositions[index] - currentPos;
        return currentPos + diff * lerpFactor;
      });
    });

    const scalesNeedUpdate = currentScales.some(
      (scale, index) => Math.abs(scale - targetScales[index]) > 0.002,
    );
    const positionsNeedUpdate = currentPositions.some(
      (pos, index) => Math.abs(pos - targetPositions[index]) > 0.1,
    );

    if (scalesNeedUpdate || positionsNeedUpdate || mouseX !== null) {
      animationFrameRef.current = requestAnimationFrame(animateToTarget);
    }
  }, [
    mouseX,
    calculateTargetMagnification,
    calculatePositions,
    currentScales,
    currentPositions,
  ]);

  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animateToTarget);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animateToTarget]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const now = performance.now();
      if (now - lastMouseMoveTime.current < 16) {
        return;
      }
      lastMouseMoveTime.current = now;
      if (dockRef.current) {
        const rect = dockRef.current.getBoundingClientRect();
        const padding = Math.max(8, baseIconSize * 0.12);
        const useVerticalAxis = Math.abs(dockMotionProgressRef.current) > 0.55;
        const pointerAxis = useVerticalAxis
          ? e.clientY - rect.top - padding
          : e.clientX - rect.left - padding;
        setMouseX(pointerAxis);
      }
    },
    [baseIconSize],
  );

  const handleMouseLeave = useCallback(() => {
    setMouseX(null);
  }, []);

  const createBounceAnimation = (element: HTMLElement) => {
    const bounceHeight = Math.max(-8, -baseIconSize * 0.15);
    element.style.transition = "transform 0.2s ease-out";
    element.style.transform = `translateY(${bounceHeight}px)`;

    setTimeout(() => {
      element.style.transform = "translateY(0px)";
    }, 200);
  };

  const handleAppClick = (
    e: React.MouseEvent | undefined,
    index: number,
    app: DockApp,
    onClick?: (e?: React.MouseEvent) => void,
  ) => {
    if (iconRefs.current[index]) {
      if (typeof window !== "undefined" && (window as any).gsap) {
        const gsap = (window as any).gsap;
        const bounceHeight =
          currentScales[index] > 1.3
            ? -baseIconSize * 0.2
            : -baseIconSize * 0.15;

        gsap.to(iconRefs.current[index], {
          y: bounceHeight,
          duration: 0.2,
          ease: "power2.out",
          yoyo: true,
          repeat: 1,
          transformOrigin: "bottom center",
        });
      } else {
        createBounceAnimation(iconRefs.current[index]!);
      }
    }

    if (onClick) {
      onClick(e);
      return;
    }

    if (!app.path || app.path === "#") {
      return;
    }

    const shouldTriggerPremiumTransition =
      app.path === "/drawing" ||
      app.path === "/videocall" ||
      app.path === "/chat";
    if (!shouldTriggerPremiumTransition) {
      return;
    }

    if (app.path === location.pathname) {
      return;
    }

    e?.preventDefault();
    setTransitioningPath(app.path);
    setEmphasizedIconId(app.id);

    if (iconEmphasisTimerRef.current !== null) {
      window.clearTimeout(iconEmphasisTimerRef.current);
    }
    iconEmphasisTimerRef.current = window.setTimeout(() => {
      setEmphasizedIconId((prev) => (prev === app.id ? null : prev));
      iconEmphasisTimerRef.current = null;
    }, 900);

    if (routeTransitionTimerRef.current !== null) {
      window.clearTimeout(routeTransitionTimerRef.current);
    }
    routeTransitionTimerRef.current = window.setTimeout(() => {
      navigate(app.path as string);
      setTransitioningPath(null);
      routeTransitionTimerRef.current = null;
    }, 260);
  };

  const compactShift = baseIconSize < 50;
  const motionIntensity = Math.abs(dockMotionProgress);
  const straightSnapStrength = Math.min(
    1,
    Math.max(0, (motionIntensity - 0.8) / 0.2),
  );
  const horizontalOffset = compactShift ? 44 : 46;
  const neutralTopPercent = compactShift ? 88 : 91;
  const activeDockPath = transitioningPath || location.pathname;
  const isDrawingDockTarget = activeDockPath.startsWith("/drawing");
  const sideTopPercent = isDrawingDockTarget ? (compactShift ? 60 : 57) : 50;
  const targetLeftPercent = 50 + dockMotionProgress * horizontalOffset;
  const straightLeftPercent = compactShift ? 96.8 : 97.2;
  const leftPercent =
    targetLeftPercent +
    (straightLeftPercent - targetLeftPercent) * straightSnapStrength;
  const topPercent =
    neutralTopPercent + (sideTopPercent - neutralTopPercent) * motionIntensity;
  const dockLift = motionIntensity * -2;
  const dockYaw = dockMotionProgress * (2.4 * (1 - straightSnapStrength));
  const dockTwist = dockMotionProgress * (94 - 4 * straightSnapStrength);
  const shadowBoost = motionIntensity * 0.15;

  const contentWidth =
    currentPositions.length > 0
      ? Math.max(
          ...currentPositions.map(
            (pos, index) => pos + (baseIconSize * currentScales[index]) / 2,
          ),
        )
      : apps.length * (baseIconSize + baseSpacing) - baseSpacing;
  const padding = Math.max(8, baseIconSize * 0.12);

  return (
    <div
      className={cn("backdrop-blur-md fixed z-[12010]", className)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      ref={dockRef}
      role="navigation"
      style={{
        top: `${topPercent}%`,
        left: `${leftPercent}%`,
        transform: `translate(-50%, -50%) translateY(${dockLift}px) rotateZ(${dockTwist}deg) rotateY(${dockYaw}deg)`,
        width: `${contentWidth + padding * 2}px`,
        background: "rgba(45, 45, 45, 0.75)",
        borderRadius: `${Math.max(12, baseIconSize * 0.4)}px`,
        border: "1px solid rgba(255, 255, 255, 0.15)",
        boxShadow: `
          0 ${Math.max(4, baseIconSize * 0.1)}px ${Math.max(16, baseIconSize * 0.4)}px rgba(0, 0, 0, ${0.4 + shadowBoost}),
          0 ${Math.max(2, baseIconSize * 0.05)}px ${Math.max(8, baseIconSize * 0.2)}px rgba(0, 0, 0, ${0.3 + shadowBoost * 0.4}),
          inset 0 1px 0 rgba(255, 255, 255, 0.15),
          inset 0 -1px 0 rgba(0, 0, 0, 0.2)
        `,
        padding: `${padding}px`,
        filter: `saturate(${1 + motionIntensity * 0.05})`,
      }}>
      <div
        className="relative"
        style={{
          height: `${baseIconSize}px`,
          width: "100%",
        }}>
        {apps.map((app, index) => {
          const scale = currentScales[index];
          const position = currentPositions[index] || 0;
          const scaledSize = baseIconSize * scale;
          const isActive = app.path
            ? location.pathname.startsWith(app.path)
            : false;

          const centerIndex = (apps.length - 1) / 2;
          const centerDenominator = Math.max(centerIndex, 1);
          const iconCurvePosition = (index - centerIndex) / centerDenominator;
          const iconMotionIntensity = Math.abs(dockMotionProgress);
          const iconCounterTwist =
            dockTwist * (1.12 - 0.12 * straightSnapStrength);
          const iconRotationByDock =
            dockMotionProgress * 6 * (1 - straightSnapStrength) +
            iconCurvePosition *
              iconMotionIntensity *
              11 *
              (1 - straightSnapStrength);
          const isEmotionIcon =
            app.path === "/drawing" ||
            app.path === "/videocall" ||
            app.path === "/chat";
          const iconRouteBoost =
            isEmotionIcon &&
            (location.pathname === app.path || transitioningPath === app.path)
              ? dockMotionProgress * 8 * (1 - straightSnapStrength)
              : 0;
          const emphasizedDirection =
            app.path === "/drawing"
              ? 1
              : app.path === "/videocall"
                ? 1
                : app.path === "/chat"
                  ? 1
                  : dockMotionProgress;
          const iconClickBoost =
            emphasizedIconId === app.id
              ? emphasizedDirection * 10 * (1 - straightSnapStrength)
              : 0;
          const iconRotation =
            iconRotationByDock +
            iconRouteBoost +
            iconClickBoost -
            iconCounterTwist;
          const iconLift =
            iconMotionIntensity * -Math.max(1, baseIconSize * 0.025);

          const iconContent =
            typeof app.icon === "string" ? (
              <img
                alt={app.name}
                className="object-contain w-full h-full p-1"
                src={app.icon}
                style={{
                  filter: `drop-shadow(0 ${scale > 1.2 ? Math.max(2, baseIconSize * 0.05) : Math.max(1, baseIconSize * 0.03)}px ${scale > 1.2 ? Math.max(4, baseIconSize * 0.1) : Math.max(2, baseIconSize * 0.06)}px rgba(0,0,0,${0.2 + (scale - 1) * 0.15}))`,
                }}
              />
            ) : (
              <div className="text-white w-full h-full flex items-center justify-center p-2">
                {app.icon}
              </div>
            );

          const innerWrapper = (
            <>
              <div
                className="relative z-10 w-full h-full flex items-center justify-center"
                style={{
                  transform: `translateY(${iconLift}px) rotate(${iconRotation}deg)`,
                  transition: "transform 900ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}>
                {iconContent}
              </div>
              {app.badge && app.badge > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1.5 flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br from-red-500 via-red-600 to-pink-600 rounded-full shadow-2xl border border-white/60 z-20">
                  {app.badge > 99 ? "99+" : app.badge}
                </div>
              )}
              <div
                className="absolute -top-12 px-3 py-1.5 bg-black/80 backdrop-blur-xl text-white text-xs font-semibold rounded-lg shadow-xl pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 1000,
                }}>
                {app.name}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/80 rotate-45" />
              </div>
            </>
          );

          const wrapperStyle = {
            left: `${position - scaledSize / 2}px`,
            bottom: "0px",
            width: `${scaledSize}px`,
            height: `${scaledSize}px`,
            transformOrigin: "bottom center",
            zIndex: Math.round(scale * 10),
          };

          const wrapperClass =
            "absolute cursor-pointer flex flex-col items-center justify-end group focus:outline-none";

          const wrapper = app.isButton ? (
            <button
              key={app.id}
              className={wrapperClass}
              onClick={(e) => handleAppClick(e, index, app, app.onClick)}
              ref={(el) => {
                iconRefs.current[index] = el;
              }}
              style={wrapperStyle}
              title={app.name}>
              {innerWrapper}
            </button>
          ) : (
            <Link
              key={app.id}
              to={app.path || "#"}
              className={wrapperClass}
              onClick={(e) => handleAppClick(e, index, app)}
              ref={(el) => {
                iconRefs.current[index] = el;
              }}
              style={wrapperStyle}
              title={app.name}>
              {innerWrapper}
            </Link>
          );

          return (
            <div key={app.id} className="contents">
              {wrapper}
              {(isActive || openApps.includes(app.id)) && (
                <div
                  className="absolute animate-pulse"
                  style={{
                    bottom: `${Math.max(-3, -baseIconSize * 0.06)}px`,
                    left: `${position}px`,
                    transform: "translateX(-50%)",
                    width: `${Math.max(4, baseIconSize * 0.08)}px`,
                    height: `${Math.max(4, baseIconSize * 0.08)}px`,
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.8) 100%)",
                    boxShadow:
                      "0 0 8px rgba(255, 255, 255, 0.8), 0 0 12px rgba(255, 255, 255, 0.4)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MacDockNav: React.FC<{ unreadCount?: number }> = ({
  unreadCount = 0,
}) => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useDarkMode();

  // Profile menu state
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("profilePicture");
    setShowProfileMenu(false);
    navigate("/login");
  };

  const handleProfileClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowProfileMenu((prev) => !prev);
  };

  const dockApps: DockApp[] = [
    {
      id: "dashboard",
      name: "Dashboard",
      path: "/dashboard",
      icon: "/logo.png",
    },
    {
      id: "quizzes",
      name: "Quizzes",
      path: "/quiz/select",
      icon: "/quiz.png",
    },
    {
      id: "books",
      name: "Books",
      path: "/books",
      icon: "/book.png",
    },
    {
      id: "videocall",
      name: "Video Call",
      path: "/videocall",
      icon: "/videcall.png",
    },
    {
      id: "games",
      name: "Games",
      path: "/games",
      icon: "/games.png",
    },
    {
      id: "drawing",
      name: "Drawing",
      path: "/drawing",
      icon: "/drawing.png",
    },
    {
      id: "notes",
      name: "Notes",
      path: "/notes",
      icon: "/notes.png",
    },
  ];

  if (user && user.is_member) {
    dockApps.push({
      id: "chat",
      name: "Chat",
      path: "/chat",
      icon: "/chat.png",
      badge: unreadCount,
    });
  }

  const hasChatDockIcon = dockApps.some(
    (app) => app.id === "chat" && app.icon === "/chat.png",
  );

  if (user && !hasChatDockIcon) {
    dockApps.push({
      id: "profile",
      name: "Profile",
      icon: "/profile.png",
      isButton: true,
      onClick: handleProfileClick,
      isProfile: true,
    });
  } else {
    dockApps.push({
      id: "login",
      name: "Login",
      path: "/login",
      icon: "/login.png",
    });
  }

  return (
    <div className="relative z-[12000]">
      {showProfileMenu && user && (
        <div
          ref={profileMenuRef}
          className="fixed bottom-24 right-4 sm:left-1/2 sm:-translate-x-1/2 bg-gray-900/95 backdrop-blur-3xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-2xl p-3 w-56 text-white z-[110] animate-in fade-in slide-in-from-bottom-4">
          <div className="px-3 py-2 mb-2 border-b border-white/10">
            <p className="font-semibold text-base truncate bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {user.email}
            </p>
          </div>
          <div className="space-y-1.5 focus:outline-none">
            <button
              onClick={() => {
                setShowProfileMenu(false);
                navigate("/profile");
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition-all flex items-center justify-between group">
              <span>View Profile</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400">
                →
              </span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all flex items-center justify-between">
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
      <MacOSDock apps={dockApps} openApps={[]} />
    </div>
  );
};

export default MacDockNav;
export { MacOSDock, type DockApp, type MacOSDockProps };
