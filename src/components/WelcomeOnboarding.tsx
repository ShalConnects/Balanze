import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ArrowRight } from 'lucide-react';
import InteractiveBackground from './InteractiveBackground';
import { useThemeStore } from '../store/themeStore';
import { markAsLaunched } from '../utils/firstLaunch';

const WelcomeOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();

  const handleGetStarted = () => {
    // Mark that user has seen the welcome screen
    markAsLaunched();
    // Navigate to login
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <InteractiveBackground />
      
      <div className="relative z-10 w-full max-w-md px-6 py-8">
        <div className="glassmorphism-card rounded-2xl p-8 text-center space-y-6">
          {/* Logo/Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
              <Wallet className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Welcome Message */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome to Balanze
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Your personal finance manager
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">
              Take control of your finances with powerful tools for tracking expenses, managing accounts, and achieving your financial goals.
            </p>
          </div>

          {/* Get Started Button */}
          <button
            onClick={handleGetStarted}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeOnboarding;

