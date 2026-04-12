import React from "react";

interface DarkModeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
}

const DarkModeContext = React.createContext<DarkModeContextType | undefined>(
  undefined,
);

export const DarkModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = React.useState<"light" | "dark" | "system">(
    () => {
      // Check localStorage first
      const saved = localStorage.getItem("theme") as
        | "light"
        | "dark"
        | "system";
      if (saved) {
        return saved;
      }
      // Default to 'light' (white theme) as requested
      return "light";
    },
  );

  const [darkMode, setDarkMode] = React.useState<boolean>(false);

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    let isDark = false;
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      isDark = systemTheme === "dark";
    } else {
      root.classList.add(theme);
      isDark = theme === "dark";
    }

    setDarkMode(isDark);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // System preference listener
  React.useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        const systemTheme = mediaQuery.matches ? "dark" : "light";
        root.classList.add(systemTheme);
        setDarkMode(systemTheme === "dark");
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  const toggleDarkMode = () => {
    setThemeState(darkMode ? "light" : "dark");
  };

  const setTheme = (newTheme: "light" | "dark" | "system") => {
    setThemeState(newTheme);
  };

  return (
    <DarkModeContext.Provider
      value={{ darkMode, toggleDarkMode, theme, setTheme }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => {
  const context = React.useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error("useDarkMode must be used within a DarkModeProvider");
  }
  return context;
};
