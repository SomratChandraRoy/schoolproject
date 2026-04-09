import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { useDarkMode } from "../contexts/DarkModeContext";

interface DockApp {
    id: string;
    name: string;
    icon: React.ReactNode;
    path?: string;
    badge?: number;
    onClick?: () => void;
    isButton?: boolean;
}

interface MacOSDockProps {
    apps: DockApp[];
    openApps?: string[];
    className?: string;
}

const MacOSDock: React.FC<MacOSDockProps> = ({ apps, openApps = [], className = "" }) => {
    const [mouseX, setMouseX] = useState<number | null>(null);
    const [currentScales, setCurrentScales] = useState<number[]>(apps.map(() => 1));
    const [currentPositions, setCurrentPositions] = useState<number[]>([]);
    const dockRef = useRef<HTMLDivElement>(null);
    const iconRefs = useRef<(HTMLElement | null)[]>([]);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const lastMouseMoveTime = useRef<number>(0);
    const location = useLocation();

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
                const normalIconCenter = index * (baseIconSize + baseSpacing) + baseIconSize / 2;
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
        [apps, baseIconSize, baseSpacing, effectWidth, maxScale, minScale]
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
        [baseIconSize, baseSpacing]
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
            (scale, index) => Math.abs(scale - targetScales[index]) > 0.002
        );
        const positionsNeedUpdate = currentPositions.some(
            (pos, index) => Math.abs(pos - targetPositions[index]) > 0.1
        );

        if (scalesNeedUpdate || positionsNeedUpdate || mouseX !== null) {
            animationFrameRef.current = requestAnimationFrame(animateToTarget);
        }
    }, [mouseX, calculateTargetMagnification, calculatePositions, currentScales, currentPositions]);

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
                setMouseX(e.clientX - rect.left - padding);
            }
        },
        [baseIconSize]
    );

    const handleMouseLeave = useCallback(() => {
        setMouseX(null);
    }, []);

    const createBounceAnimation = (element: HTMLElement) => {
        const bounceHeight = Math.max(-12, -baseIconSize * 0.2);
        element.style.transition = "transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)";
        element.style.transform = `translateY(${bounceHeight}px)`;
        setTimeout(() => {
            element.style.transform = "translateY(0px)";
        }, 300);
    };

    const handleAppClick = (index: number, onClick?: () => void) => {
        if (iconRefs.current[index]) {
            createBounceAnimation(iconRefs.current[index]!);
        }
        if (onClick) {
            onClick();
        }
    };

    const contentWidth =
        currentPositions.length > 0
            ? Math.max(...currentPositions.map((pos, index) => pos + (baseIconSize * currentScales[index]) / 2))
            : apps.length * (baseIconSize + baseSpacing) - baseSpacing;

    const padding = Math.max(12, baseIconSize * 0.15);

    return (
        <div
            className={cn("backdrop-blur-2xl fixed bottom-6 left-1/2 -translate-x-1/2 z-50", className)}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
            ref={dockRef}
            role="navigation"
            style={{
                width: `${contentWidth + padding * 2}px`,
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
                borderRadius: `${Math.max(16, baseIconSize * 0.45)}px`,
                border: "1px solid rgba(255, 255, 255, 0.2)",
                boxShadow: `
          0 ${Math.max(8, baseIconSize * 0.15)}px ${Math.max(32, baseIconSize * 0.6)}px rgba(0, 0, 0, 0.5),
          0 ${Math.max(4, baseIconSize * 0.08)}px ${Math.max(16, baseIconSize * 0.3)}px rgba(0, 0, 0, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.2),
          inset 0 -1px 0 rgba(0, 0, 0, 0.3)
        `,
                padding: `${padding}px`,
            }}
        >
            <div
                className="relative"
                style={{
                    height: `${baseIconSize}px`,
                    width: "100%",
                }}
            >
                {apps.map((app, index) => {
                    const scale = currentScales[index];
                    const position = currentPositions[index] || 0;
                    const scaledSize = baseIconSize * scale;
                    const isActive = app.path && location.pathname === app.path;

                    const content = (
                        <div
                            className={cn(
                                "w-full h-full rounded-[22%] flex items-center justify-center transition-all duration-300 relative overflow-hidden",
                                isActive
                                    ? "bg-gradient-to-br from-white/40 via-white/30 to-white/20 shadow-2xl"
                                    : "bg-gradient-to-br from-white/20 via-white/15 to-white/10 hover:from-white/30 hover:via-white/25 hover:to-white/15"
                            )}
                            style={{
                                filter: `drop-shadow(0 ${scale > 1.2 ? Math.max(4, baseIconSize * 0.08) : Math.max(2, baseIconSize * 0.04)
                                    }px ${scale > 1.2 ? Math.max(8, baseIconSize * 0.15) : Math.max(4, baseIconSize * 0.08)
                                    }px rgba(0,0,0,${0.3 + (scale - 1) * 0.2}))`,
                            }}
                        >
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />

                            <div className="text-white relative z-10" style={{ width: `${scaledSize * 0.5}px`, height: `${scaledSize * 0.5}px` }}>
                                {app.icon}
                            </div>

                            {/* Badge */}
                            {app.badge && app.badge > 0 && (
                                <div className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-2 flex items-center justify-center text-[11px] font-bold text-white bg-gradient-to-br from-red-500 via-red-600 to-pink-600 rounded-full shadow-2xl border-2 border-white/60 animate-pulse">
                                    {app.badge > 99 ? "99+" : app.badge}
                                </div>
                            )}
                        </div>
                    );

                    const wrapper = app.isButton ? (
                        <button
                            key={app.id}
                            className="absolute cursor-pointer flex flex-col items-center justify-end focus:outline-none"
                            onClick={() => handleAppClick(index, app.onClick)}
                            ref={(el) => {
                                iconRefs.current[index] = el;
                            }}
                            style={{
                                left: `${position - scaledSize / 2}px`,
                                bottom: "0px",
                                width: `${scaledSize}px`,
                                height: `${scaledSize}px`,
                                transformOrigin: "bottom center",
                                zIndex: Math.round(scale * 10),
                            }}
                            title={app.name}
                        >
                            {content}
                        </button>
                    ) : (
                        <Link
                            key={app.id}
                            to={app.path || "#"}
                            className="absolute cursor-pointer flex flex-col items-center justify-end"
                            onClick={() => handleAppClick(index)}
                            ref={(el) => {
                                iconRefs.current[index] = el;
                            }}
                            style={{
                                left: `${position - scaledSize / 2}px`,
                                bottom: "0px",
                                width: `${scaledSize}px`,
                                height: `${scaledSize}px`,
                                transformOrigin: "bottom center",
                                zIndex: Math.round(scale * 10),
                            }}
                            title={app.name}
                        >
                            {content}
                        </Link>
                    );

                    return (
                        <div key={app.id} className="contents">
                            {wrapper}

                            {/* Active Indicator */}
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
                                        background: "radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.8) 100%)",
                                        boxShadow: "0 0 8px rgba(255, 255, 255, 0.8), 0 0 12px rgba(255, 255, 255, 0.4)",
                                    }}
                                />
                            )}

                            {/* Tooltip */}
                            <div
                                className="absolute -top-14 px-4 py-2 bg-gray-900/95 backdrop-blur-xl text-white text-sm font-medium rounded-xl shadow-2xl pointer-events-none whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity duration-200 border border-white/10"
                                style={{
                                    left: `${position}px`,
                                    transform: "translateX(-50%)",
                                    zIndex: 1000,
                                }}
                            >
                                {app.name}
                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900/95 rotate-45 border-r border-b border-white/10" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Main component with navigation items
const MacDockNav: React.FC<{ unreadCount?: number }> = ({ unreadCount = 0 }) => {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const navigate = useNavigate();
    const { darkMode, toggleDarkMode } = useDarkMode();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("profilePicture");
        navigate("/login");
    };

    const dockApps: DockApp[] = [
        {
            id: "dashboard",
            name: "Dashboard",
            path: "/dashboard",
            icon: (
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
        },
        {
            id: "quizzes",
            name: "Quizzes",
            path: "/quiz/select",
            icon: (
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
        },
        {
            id: "books",
            name: "Books",
            path: "/books",
            icon: (
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
        },
        {
            id: "videocall",
            name: "Video Call",
            path: "/videocall",
            icon: (
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            ),
        },
        {
            id: "games",
            name: "Games",
            path: "/games",
            icon: (
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            id: "drawing",
            name: "Drawing",
            path: "/drawing",
            icon: (
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
            ),
        },
        {
            id: "leaderboard",
            name: "Leaderboard",
            path: "/leaderboard",
            icon: (
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
        },
        {
            id: "notes",
            name: "Notes",
            path: "/notes",
            icon: (
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            ),
        },
    ];

    // Add Chat for members
    if (user && user.is_member) {
        dockApps.push({
            id: "chat",
            name: "Chat",
            path: "/chat",
            icon: (
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            ),
            badge: unreadCount,
        });
    }

    // Add Admin for admins
    if (user && user.is_admin) {
        dockApps.push({
            id: "admin",
            name: "Admin",
            path: "/admin-dashboard",
            icon: (
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
        });
    }

    // Add separator (visual only)
    dockApps.push({
        id: "separator",
        name: "",
        icon: <div className="w-0.5 h-full bg-white/30 rounded-full" />,
        isButton: true,
    });

    // Add Dark Mode Toggle
    dockApps.push({
        id: "darkmode",
        name: darkMode ? "Light Mode" : "Dark Mode",
        icon: darkMode ? (
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ) : (
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
        ),
        onClick: toggleDarkMode,
        isButton: true,
    });

    // Add Profile
    if (user) {
        dockApps.push({
            id: "profile",
            name: `${user.first_name} ${user.last_name}`,
            path: "/profile",
            icon: (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {user.first_name?.charAt(0)}{user.last_name?.charAt(0) || user.email?.charAt(0)}
                </div>
            ),
        });
    }

    // Add Logout
    dockApps.push({
        id: "logout",
        name: "Logout",
        icon: (
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
        ),
        onClick: handleLogout,
        isButton: true,
    });

    return <MacOSDock apps={dockApps} openApps={[]} />;
};

export default MacDockNav;
export { MacOSDock, type DockApp, type MacOSDockProps };
