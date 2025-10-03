import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import InteractiveBackground from '../components/InteractiveBackground';



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

// Social login button component
const SocialButton: React.FC<{
  provider: 'google';
  onClick: () => void;
  isLoading?: boolean;
}> = ({ onClick, isLoading = false }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className={`flex items-center justify-center w-full px-4 py-3 text-sm font-medium transition-all duration-200 shadow-lg rounded-xl text-gray-700 bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 dark:bg-gray-800/20 dark:border-gray-600/30 dark:text-gray-300 dark:hover:bg-gray-800/30 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'}`}
    >
      {isLoading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-3"></div>
          Connecting...
        </div>
      ) : (
        <>
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </>
      )}
    </button>
  );
};

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'signup' | 'login' | 'forgot-password'>('login');
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');
  
  // Refs for focus management
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const { signIn, signUp, signInWithProvider, resetPassword, isLoading, error, success, clearMessages } = useAuthStore();
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<string | null>(null);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState<boolean | null>(null);
  const [socialLoading, setSocialLoading] = useState<'google' | null>(null);

  // Debug: Log auth store state changes
  useEffect(() => {
    console.log('Auth store state:', { error, success, isLoading });
  }, [error, success, isLoading]);

  // Auto-focus first input on tab switch and clear messages
  useEffect(() => {
    // Clear any existing messages when switching tabs
    clearMessages();
    
    const timer = setTimeout(() => {
      if (activeTab === 'login') {
        emailRef.current?.focus();
      } else if (activeTab === 'signup' && signupStep === 1) {
        emailRef.current?.focus();
      } else if (activeTab === 'forgot-password') {
        emailRef.current?.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [activeTab, signupStep, clearMessages]);

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || email.trim() === '') return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  // Password validation - simplified for login
  const validatePassword = (password: string) => {
    if (!password || password.trim() === '') return 'Password is required';
    return '';
  };

  // Password validation for signup (more strict)
  const validatePasswordSignup = (password: string) => {
    if (!password || password.trim() === '') return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    return '';
  };

  // Name validation
  const validateName = (name: string) => {
    if (!name.trim()) return 'Full name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    return '';
  };


  // Handle continue button for signup step 1
  const handleContinue = () => {
    const error = validateEmail(email);
    setEmailError(error);
    
    if (!error) {
      setSignupStep(2);
      // Focus name field after animation
      setTimeout(() => nameRef.current?.focus(), 300);
    } else {
      emailRef.current?.focus();
    }
  };

  // Handle social login
  const handleSocialLogin = async (provider: 'google') => {
    setSocialLoading(provider);
    try {
      const result = await signInWithProvider(provider);
      
      if (!result.success) {
        console.error('Social login failed:', result.message);
      } else {
        console.log('Social login initiated successfully');
        // The user will be redirected to the OAuth provider
      }
    } catch (error) {
      console.error('Social login exception:', error);
    } finally {
      setSocialLoading(null);
    }
  };

  // Handle signup submission
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailErr = validateEmail(email);
    const passwordErr = validatePasswordSignup(password);
    const nameErr = validateName(fullName);
    
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setNameError(nameErr);
    
    if (emailErr || passwordErr || nameErr) {
      // Focus first error field
      if (emailErr) emailRef.current?.focus();
      else if (nameErr) nameRef.current?.focus();
      else if (passwordErr) passwordRef.current?.focus();
      return;
    }

    try {
      // Use the auth store's signUp method
      const result = await signUp(email, password, fullName);
      
      if (result.success) {
        // Reset form on success
        setEmail('');
        setPassword('');
        setFullName('');
        setSignupStep(1);
        
      }
    } catch (error) {
      console.error('Signup error:', error);
    }
  };

  // Handle login submission
  const handleLogIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get current values directly from the input fields as fallback for Android
    const currentEmail = emailRef.current?.value || email;
    const currentPassword = passwordRef.current?.value || password;
    
    console.log('Login attempt - Email state:', email, 'Input value:', emailRef.current?.value);
    console.log('Login attempt - Password state:', password ? '***' : 'empty', 'Input value:', passwordRef.current?.value ? '***' : 'empty');
    
    // Update state if there's a mismatch (Android issue)
    if (currentEmail !== email) {
      setEmail(currentEmail);
    }
    if (currentPassword !== password) {
      setPassword(currentPassword);
    }
    
    const emailErr = validateEmail(currentEmail);
    const passwordErr = validatePassword(currentPassword);
    
    console.log('Validation results - Email:', emailErr || 'valid', 'Password:', passwordErr || 'valid');
    
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    
    if (emailErr || passwordErr) {
      console.log('Validation failed, stopping submission');
      if (emailErr) emailRef.current?.focus();
      else if (passwordErr) passwordRef.current?.focus();
      return;
    }

    try {
      console.log('Attempting login for:', currentEmail);
      // Use the auth store's signIn method
      const result = await signIn(currentEmail, currentPassword);
      
      if (result.success) {
        console.log('Login successful');
        // The auth store will handle navigation
      }
    } catch (error) {
      console.error('Unexpected login error:', error);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    setForgotPasswordMessage(null);
    setForgotPasswordSuccess(null);
    if (!email) {
      setEmailError('Please enter your email address');
      emailRef.current?.focus();
      return;
    }

    try {
      const result = await resetPassword(email);
      
      if (result.success) {
        setForgotPasswordMessage(result.message || 'Password reset email sent! Check your inbox.');
        setForgotPasswordSuccess(true);
      } else {
        setForgotPasswordMessage(result.message || 'Failed to send reset email.');
        setForgotPasswordSuccess(false);
      }
    } catch (error) {
      setForgotPasswordMessage('An unexpected error occurred.');
      setForgotPasswordSuccess(false);
    }
  };

  // Handle back to login from forgot password
  const handleBackToLogin = () => {
    setActiveTab('login');
    setEmail('');
    setPassword('');
    setEmailError('');
    setPasswordError('');
    setForgotPasswordMessage(null);
    setForgotPasswordSuccess(null);
  };

  // Handle key down for input fields
  const handleKeyDown = (e: React.KeyboardEvent, ref?: React.RefObject<HTMLInputElement>) => {
    if (e.key === 'Enter' && ref) {
      ref.current?.focus();
    } else if (e.key === 'Enter' && activeTab === 'signup' && signupStep === 2) {
      handleSignUp(e as React.FormEvent);
    } else if (e.key === 'Enter' && activeTab === 'login') {
      handleLogIn(e as React.FormEvent);
    }
  };

  // Inline feedback logic
  const getLoginErrorMessage = () => {
    if (error && typeof error === 'string') {
      const errorLower = error.toLowerCase();
      if (errorLower.includes('email not confirmed')) {
        return 'Please confirm your email before logging in.';
      }
      if (errorLower.includes('duplicate_email') || errorLower.includes('already registered')) {
        return 'This email is already registered. Please try logging in instead, or use a different email.';
      }
      if (errorLower.includes('unable to verify email')) {
        return 'Unable to verify email availability. Please check your connection and try again.';
      }
      if (errorLower.includes('already registered with a different account')) {
        return 'This email is linked to a different login method. Please use your original sign-in method.';
      }
    }
    return error;
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Interactive Background */}
      <InteractiveBackground />
      
      <div className="relative z-10 w-full max-w-md">
        {/* Tab Switcher */}
        <div className="relative glassmorphism-container rounded-2xl p-6 mb-6">
          {/* Home Icon - Positioned in center of top border */}
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => navigate('/')}
              className="p-3 bg-white/20 dark:bg-gray-800/20 backdrop-blur-md border border-white/30 dark:border-gray-700/30 transition-all duration-200 rounded-full shadow-lg hover:shadow-xl hover:bg-white/30 dark:hover:bg-gray-800/30"
              title="Go to Home"
            >
              <div className="w-5 h-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{stopColor: '#3B82F6'}} />
                      <stop offset="100%" style={{stopColor: '#8B5CF6'}} />
                    </linearGradient>
                  </defs>
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
            </button>
          </div>
          {/* Header Row with Dark Mode Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Balanze
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage your finances with confidence
              </p>
            </div>
            <button
              onClick={() => useThemeStore.getState().toggleTheme()}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200 border border-white/30 dark:border-gray-700/30 rounded-full hover:bg-white/20 dark:hover:bg-gray-800/20 backdrop-blur-sm"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
          
          <div className="flex bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm rounded-lg p-1 mb-6 border border-white/20 dark:border-gray-700/20">
            <button
              onClick={() => {
                setActiveTab('login');
                setSignupStep(1);
                setEmail('');
                setPassword('');
                setFullName('');
                setEmailError('');
                setPasswordError('');
                setNameError('');
                setForgotPasswordMessage(null);
                setForgotPasswordSuccess(null);
              }}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'login'
                  ? 'bg-white/30 dark:bg-gray-600/30 backdrop-blur-sm text-gray-900 dark:text-white shadow-sm border border-white/20 dark:border-gray-700/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/10 dark:hover:bg-gray-800/10'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => {
                setActiveTab('signup');
                setSignupStep(1);
                setEmail('');
                setPassword('');
                setFullName('');
                setEmailError('');
                setPasswordError('');
                setNameError('');
                setForgotPasswordMessage(null);
                setForgotPasswordSuccess(null);
              }}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'signup'
                  ? 'bg-white/30 dark:bg-gray-600/30 backdrop-blur-sm text-gray-900 dark:text-white shadow-sm border border-white/20 dark:border-gray-700/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/10 dark:hover:bg-gray-800/10'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <SocialButton 
              provider="google" 
              onClick={() => handleSocialLogin('google')} 
              isLoading={socialLoading === 'google'}
            />
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20 dark:border-gray-600/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 py-1 glassmorphism-container rounded-full text-gray-600 dark:text-gray-300 text-xs font-medium backdrop-blur-sm">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Feedback Messages */}
          {activeTab === 'signup' && (success || error) && (
            <div className={`rounded-md p-4 mb-4 border ${success ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {success ? (
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>{success || error}</p>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'login' && error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">{getLoginErrorMessage()}</p>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'login' && (
            <form onSubmit={handleLogIn} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="sr-only">
                  Email address
                </label>
                <input
                  ref={emailRef}
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(validateEmail(e.target.value));
                  }}
                  onBlur={(e) => {
                    setEmailError(validateEmail(e.target.value));
                  }}
                  onKeyDown={e => handleKeyDown(e)}
                  placeholder="Email address"
                  className={`w-full px-4 py-3 glassmorphism-input rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent ${
                    emailError
                      ? 'border-red-300/50 dark:border-red-600/50 bg-red-50/20 dark:bg-red-900/10'
                      : ''
                  }`}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'login-email-error' : undefined}
                />
                {emailError && (
                  <p id="login-email-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                    {emailError}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="login-password" className="sr-only">
                  Password
                </label>
                <div className="relative">
                  <input
                    ref={passwordRef}
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError(validatePassword(e.target.value));
                    }}
                    onBlur={(e) => {
                      setPasswordError(validatePassword(e.target.value));
                    }}
                    onKeyDown={e => handleKeyDown(e)}
                    placeholder="Password"
                    className={`w-full px-4 py-3 pr-12 glassmorphism-input rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent ${
                      passwordError
                        ? 'border-red-300/50 dark:border-red-600/50 bg-red-50/20 dark:bg-red-900/10'
                        : ''
                    }`}
                    aria-invalid={!!passwordError}
                    aria-describedby={passwordError ? 'login-password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p id="login-password-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                    {passwordError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="relative flex items-center">
                    <input
                      id="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500/50 border-white/30 dark:border-gray-600/30 rounded glassmorphism-input appearance-none checked:bg-gradient-primary checked:border-transparent"
                    />
                    {rememberMe && (
                      <svg className="absolute top-0 left-0 h-4 w-4 text-white pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    <label htmlFor="remember-me" className="ml-3 text-sm text-gray-700 dark:text-gray-300 font-medium cursor-pointer">
                      Remember me
                    </label>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('forgot-password')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Forgot password?
                </button>
              </div>
              {forgotPasswordMessage && (
                <div className={`mt-2 text-sm ${forgotPasswordSuccess ? 'text-green-600' : 'text-red-600'}`}>{forgotPasswordMessage}</div>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white glassmorphism-button rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus-ring-gradient"
              >
                <LockClosedIcon className="w-4 h-4 mr-2" />
                Sign In
              </button>
            </form>
          )}

          {/* Signup Form */}
          {activeTab === 'signup' && (
            <div className="space-y-4">
              {/* Step 1: Email Only */}
              {signupStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="signup-email" className="sr-only">
                      Email address
                    </label>
                    <input
                      ref={emailRef}
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => {
                        if (activeTab === 'signup' && signupStep === 1 && e.key === 'Enter') {
                          e.preventDefault();
                          handleContinue();
                        } else {
                          handleKeyDown(e);
                        }
                      }}
                      placeholder="Enter your email"
                      className={`w-full px-4 py-3 glassmorphism-input rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent ${
                        emailError
                          ? 'border-red-300/50 dark:border-red-600/50 bg-red-50/20 dark:bg-red-900/10'
                          : ''
                      }`}
                      aria-invalid={!!emailError}
                      aria-describedby={emailError ? 'signup-email-error' : undefined}
                    />
                    {emailError && (
                      <p id="signup-email-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                        {emailError}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleContinue}
                    className="w-full px-4 py-3 text-sm font-medium text-white glassmorphism-button rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus-ring-gradient"
                  >
                    Continue
                  </button>
                </div>
              )}

              {/* Step 2: Full Form */}
              {signupStep === 2 && (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <label htmlFor="signup-name" className="sr-only">
                      Full name
                    </label>
                    <input
                      ref={nameRef}
                      id="signup-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setNameError(validateName(e.target.value));
                      }}
                      onKeyDown={e => handleKeyDown(e, passwordRef)}
                      placeholder="Full name"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 bg-white/20 dark:bg-gray-700/20 backdrop-blur-md ${
                        nameError
                          ? 'border-red-300/50 dark:border-red-600/50 bg-red-50/20 dark:bg-red-900/10'
                          : 'border-white/30 dark:border-gray-600/30 hover:bg-white/30 dark:hover:bg-gray-700/30'
                      }`}
                      aria-invalid={!!nameError}
                      aria-describedby={nameError ? 'signup-name-error' : undefined}
                    />
                    {nameError && (
                      <p id="signup-name-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                        {nameError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="signup-password" className="sr-only">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        ref={passwordRef}
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setPasswordError(validatePasswordSignup(e.target.value));
                        }}
                        onKeyDown={e => handleKeyDown(e)}
                        placeholder="Create a password"
                        className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 bg-white/20 dark:bg-gray-700/20 backdrop-blur-md ${
                          passwordError
                            ? 'border-red-300/50 dark:border-red-600/50 bg-red-50/20 dark:bg-red-900/10'
                            : 'border-white/30 dark:border-gray-600/30 hover:bg-white/30 dark:hover:bg-gray-700/30'
                        }`}
                        aria-invalid={!!passwordError}
                        aria-describedby={passwordError ? 'signup-password-error' : undefined}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                          {showPassword ? (
                            <EyeSlashIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                          ) : (
                            <EyeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                          )}
                      </button>
                    </div>
                    {passwordError && (
                      <p id="signup-password-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
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

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white glassmorphism-button rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus-ring-gradient"
                  >
                    <LockClosedIcon className="w-4 h-4 mr-2" />
                    Create Account
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Forgot Password Form */}
          {activeTab === 'forgot-password' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Reset Your Password
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="forgot-email" className="sr-only">
                  Email address
                </label>
                <input
                  ref={emailRef}
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(validateEmail(e.target.value));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleForgotPassword();
                    }
                  }}
                  placeholder="Enter your email address"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 bg-white/20 dark:bg-gray-700/20 backdrop-blur-md ${
                    emailError
                      ? 'border-red-300/50 dark:border-red-600/50 bg-red-50/20 dark:bg-red-900/10'
                      : 'border-white/30 dark:border-gray-600/30 hover:bg-white/30 dark:hover:bg-gray-700/30'
                  }`}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'forgot-email-error' : undefined}
                />
                {emailError && (
                  <p id="forgot-email-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                    {emailError}
                  </p>
                )}
              </div>

              {/* Success/Error Message */}
              {forgotPasswordMessage && (
                <div className={`rounded-md p-4 border ${
                  forgotPasswordSuccess 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {forgotPasswordSuccess ? (
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">{forgotPasswordMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isLoading || !email}
                className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-gradient-primary border border-transparent rounded-xl hover:bg-gradient-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus-ring-gradient transition-all duration-200 shadow-xl backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              {/* Back to Login Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  ← Back to Login
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            By continuing, you agree to our{' '}
            <a href="/termsofservice" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacypolicy" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;