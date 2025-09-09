'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check for saved theme or default to light mode
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || 
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setIsDarkMode(isDark);
    updateTheme(isDark);
  }, []);

  const updateTheme = (dark: boolean) => {
    if (dark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    updateTheme(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200">
        <div className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2 rounded-lg transition-all duration-200 flex items-center justify-center
        ${isDarkMode 
          ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
        }
      `}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <Sun className="w-5 h-5 transition-transform duration-200 hover:rotate-180" />
      ) : (
        <Moon className="w-5 h-5 transition-transform duration-200 hover:rotate-12" />
      )}
    </button>
  );
}
