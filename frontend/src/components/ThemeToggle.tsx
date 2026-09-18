'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
      aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-300" />
          <span className="text-xs font-medium hidden sm:inline">Claro</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-indigo-600 animate-in spin-in-180 duration-300" />
          <span className="text-xs font-medium hidden sm:inline">Escuro</span>
        </>
      )}
    </button>
  );
};

