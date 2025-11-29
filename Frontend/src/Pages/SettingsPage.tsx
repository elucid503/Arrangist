import React, { useState, useEffect } from 'react';
import Navbar, { MobileBottomNav } from '../Components/Navbar';
import { UseAuth } from '../Utils/AuthContext';
import { Moon, Sun } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { User } = UseAuth();
  const [IsDarkMode, SetIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('DarkMode') === 'true' || 
             (!localStorage.getItem('DarkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (IsDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('DarkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('DarkMode', 'false');
    }
  }, [IsDarkMode]);

  const ToggleDarkMode = () => {
    SetIsDarkMode(!IsDarkMode);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      <Navbar />
      <MobileBottomNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <div className="card max-w-2xl">
          <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={User?.Name || ''}
                className="input-field"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={User?.Email || ''}
                className="input-field"
                disabled
              />
            </div>

          </div>
        </div>

        <div className="card max-w-2xl mt-6">
          <h2 className="text-xl font-semibold mb-6">Appearance</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium mb-1">Theme</label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose between light and dark mode
                </p>
              </div>
              <button
                onClick={ToggleDarkMode}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                aria-label="Toggle dark mode"
              >
                {IsDarkMode ? (
                  <>
                    <Sun className="w-5 h-5" />
                    <span className="text-sm font-medium">Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-5 h-5" />
                    <span className="text-sm font-medium">Dark Mode</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
