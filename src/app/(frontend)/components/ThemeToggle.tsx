"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="p-2.5 rounded-full cursor-none transition-colors duration-300 bg-black/5 border border-black/5 hover:bg-black/10 text-slate-600 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 dark:text-slate-400 dark:hover:text-white"
      aria-label="Toggle theme"
    >
      <span className="sr-only">Toggle theme</span>
      <div className="relative w-4 h-4">
        {/* Sun Icon */}
        <motion.div
          initial={{ opacity: theme === "light" ? 1 : 0, rotate: theme === "light" ? 0 : -90 }}
          animate={{ opacity: theme === "light" ? 1 : 0, rotate: theme === "light" ? 0 : -90 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Sun size={16} className="text-yellow-500" />
        </motion.div>

        {/* Moon Icon */}
        <motion.div
          initial={{ opacity: theme === "dark" ? 1 : 0, rotate: theme === "dark" ? 0 : 90 }}
          animate={{ opacity: theme === "dark" ? 1 : 0, rotate: theme === "dark" ? 0 : 90 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Moon size={16} className="text-slate-300" />
        </motion.div>
      </div>
    </motion.button>
  );
}
