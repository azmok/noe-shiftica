"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark"); // Default theme is dark

  useEffect(() => {
    // Check initial theme from localStorage on client mount
    try {
      const savedTheme = localStorage.getItem("theme") as Theme | null;
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
        document.documentElement.classList.toggle("dark", savedTheme === "dark");
      } else {
        // Fallback to dark if no theme is saved
        document.documentElement.classList.add("dark");
      }
    } catch (e) {
      console.warn("Failed to access localStorage for theme initialization", e);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem("theme", nextTheme);
    } catch (e) {
      console.warn("Failed to save theme choice to localStorage", e);
    }
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
