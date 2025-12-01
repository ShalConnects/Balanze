import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useThemeStore } from '../store/themeStore';
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import InteractiveBackground from '../components/InteractiveBackground';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { } = useThemeStore();
  
  // Form states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Validation states
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  // Get token from URL - check both query params and hash fragments
  const getAccessToken = () => {
    // Check query params first
    const queryToken = searchParams.get('access_token');
    if (queryToken) return queryToken;
    
    // Check hash fragment as fallback
    const hash = window.location.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1));
      return hashParams.get('access_token');
    }
    
    return null;
  };
  
  const accessToken = getAccessToken();

  // Password strength meter component
  const PasswordStrengthMeter: React.FC<{ password: string }> = ({ password }) => {
    const getStrength = (password: string) => {
      let score = 0;
      if (password.length >= 8) score++;
      if (/[a-z]/.test(password)) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;
      return score;
    };

    const strength = getStrength(password);
    const getColor = () => {
      if (strength <= 2) return 'bg-red-500';
      if (strength <= 3) return 'bg-yellow-500';
      return 'bg-green-500';
    };

    const getText = () => {
      if (strength <= 2) return 'Weak';
      if (strength <= 3) return 'Fair';
      return 'Strong';
    };

    return (
      <div className="mt-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1 w-full rounded-full transition-all duration-300 ${
                  i <= strength ? getColor() : 'bg-gray-200 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
          <span className={`text-xs font-medium ${
            strength <= 2 ? 'text-red-500' : 
            strength <= 3 ? 'text-yellow-500' : 'text-green-500'
          }`}>
            {getText()}
          </span>
        </div>
      </div>
    );
  };

  // Password validation
  const validatePassword = (password: string) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    return '';
  };

  // Confirm password validation
  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== password) return 'Passwords do not match';
    return '';
  };

  // Check if token is valid on component mount
  useEffect(() => {
    const checkToken = async () => {
      if (!accessToken) {
        setError('Invalid password reset link. Please request a new one.');
        setIsValidToken(false);
        return;
      }

      try {
        // For password reset, we need to set the session first to validate the token
        // Get refresh token from URL as well
        const getRefreshToken = () => {
          const queryToken = searchParams.get('refresh_token');
          if (queryToken) return queryToken;
          
          const hash = window.location.hash;
          if (hash) {
            const hashParams = new URLSearchParams(hash.substring(1));
            return hashParams.get('refresh_token');
          }
          return null;
        };
        
        const refreshToken = getRefreshToken();
        
        if (refreshToken) {
          // Set session with both tokens to validate
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error || !data.user) {
            setError('This password reset link has expired or is invalid. Please request a new one.');
            setIsValidToken(false);
          } else {
            // Check if user is in recovery mode (password reset)
            // Supabase sets recovery session when password reset token is valid
            setIsValidToken(true);
          }
        } else {
          // Fallback: try to get user with access token
          const { data, error } = await supabase.auth.getUser(accessToken);
          
          if (error || !data.user) {
            setError('This password reset link has expired or is invalid. Please request a new one.');
            setIsValidToken(false);
          } else {
            setIsValidToken(true);
          }
        }
      } catch (err) {
        setError('This password reset link has expired or is invalid. Please request a new one.');
        setIsValidToken(false);
      }
    };

    checkToken();
  }, [accessToken, searchParams]);

  // Handle password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const passwordErr = validatePassword(password);
    const confirmPasswordErr = validateConfirmPassword(confirmPassword);
    
    setPasswordError(passwordErr);
    setConfirmPasswordError(confirmPasswordErr);
    
    if (passwordErr || confirmPasswordErr) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
      } else {
        setIsSuccess(true);
        // Auto redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordError(validatePassword(value));
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    setConfirmPasswordError(validateConfirmPassword(value));
  };

  if (isValidToken === null) {
    // Loading state while checking token
    return (
      <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        <InteractiveBackground />
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-xl p-8 border border-white/20 dark:border-gray-700/50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Verifying Reset Link
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we verify your password reset link...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isValidToken === false) {
    // Invalid token state
    return (
      <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        <InteractiveBackground />
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-xl p-8 border border-white/20 dark:border-gray-700/50">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Invalid Reset Link
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error}
              </p>
              <button
                onClick={() => navigate('/auth')}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    // Success state
    return (
      <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        <InteractiveBackground />
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-xl p-8 border border-white/20 dark:border-gray-700/50">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Password Reset Successful!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your password has been updated successfully. You can now log in with your new password.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Redirecting to login page...
              </p>
              <button
                onClick={() => navigate('/auth')}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main password reset form
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <InteractiveBackground />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-xl p-6 border border-white/20 dark:border-gray-700/50">
          
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Reset Your Password
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter your new password below
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Password Reset Form */}
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="sr-only">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="New Password"
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm ${
                    passwordError
                      ? 'border-red-300 dark:border-red-600 bg-red-50/80 dark:bg-red-900/20'
                      : 'border-gray-300/50 dark:border-gray-600/50'
                  }`}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? 'new-password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p id="new-password-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {passwordError}
                </p>
              )}
              
              {/* Password strength meter */}
              <PasswordStrengthMeter password={password} />
              
              {/* Password requirements */}
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                8+ characters, upper & lower case, number
              </p>
            </div>

            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  placeholder="Confirm New Password"
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm ${
                    confirmPasswordError
                      ? 'border-red-300 dark:border-red-600 bg-red-50/80 dark:bg-red-900/20'
                      : 'border-gray-300/50 dark:border-gray-600/50'
                  }`}
                  aria-invalid={!!confirmPasswordError}
                  aria-describedby={confirmPasswordError ? 'confirm-password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {confirmPasswordError && (
                <p id="confirm-password-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {confirmPasswordError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 border border-transparent rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="w-4 h-4 mr-2" />
              {isLoading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/auth')}
              className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 

