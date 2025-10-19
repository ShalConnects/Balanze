import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { setUserAndProfile } = useAuthStore();

  const handleGoogleOAuthCallback = async (code: string) => {
    try {
      console.log('🔄 Processing Google OAuth callback...');
      
      // Exchange authorization code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: 'https://balanze.cash/auth/callback',
        }),
      });

      const tokenData = await tokenResponse.json();
      console.log('🔑 Token Response:', tokenData);

      if (tokenData.error) {
        throw new Error(tokenData.error_description || 'Failed to exchange code for token');
      }

      // Get user info from Google
      const userResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.access_token}`);
      const userData = await userResponse.json();
      console.log('👤 Google User Data:', userData);

      if (userData.error) {
        throw new Error('Failed to get user information from Google');
      }

      // Create or sign in user with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: `google_${userData.id}_${Date.now()}`, // Temporary password for OAuth users
      });

      if (authError && authError.message.includes('Invalid login credentials')) {
        // User doesn't exist, create account
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: userData.email,
          password: `google_${userData.id}_${Date.now()}`,
          options: {
            data: {
              full_name: userData.name,
              avatar_url: userData.picture,
              provider: 'google'
            }
          }
        });

        if (signUpError) {
          throw new Error('Failed to create account');
        }

        // Set user and profile
        await setUserAndProfile(signUpData.user!, null);
      } else if (authError) {
        throw new Error('Authentication failed');
      } else {
        // Set user and profile
        await setUserAndProfile(authData.user!, null);
      }

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('❌ Google OAuth Error:', err);
      setError('Authentication failed. Please try again.');
      setTimeout(() => navigate('/auth'), 3000);
    }
  };

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔄 AuthCallback Debug Info:');
        console.log('- Current URL:', window.location.href);
        console.log('- URL Search Params:', window.location.search);
        console.log('- URL Hash:', window.location.hash);
        
        // Check for OAuth errors in URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        
        if (error) {
          console.log('❌ OAuth Error:', error);
          setError('Authentication failed. Please try again.');
          setTimeout(() => navigate('/auth'), 3000);
          return;
        }
        
        // Get the current session after OAuth redirect
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        console.log('📥 Session Data:', data);
        console.log('❌ Session Error:', error);
        
        if (error) {

          setError('Authentication failed. Please try again.');
          setTimeout(() => navigate('/auth'), 3000);
          return;
        }

        if (data.session?.user) {
          const user = data.session.user;
          
          // CRITICAL: Check for duplicate emails before allowing OAuth login
          try {
            const { data: emailCheck, error: emailCheckError } = await supabase.rpc('check_email_exists', {
              email_to_check: user.email || ''
            });
            
            if (emailCheckError) {

              setError('Authentication verification failed. Please try again.');
              // Sign out the OAuth user
              await supabase.auth.signOut();
              setTimeout(() => navigate('/auth'), 3000);
              return;
            }
            
            // If email exists, check if it's a different user
            if (emailCheck === true) {
              // Get the existing user with this email
              const { data: existingUsers, error: fetchError } = await supabase
                .rpc('get_user_by_email', { email_to_check: user.email || '' });
              
              if (fetchError) {

                setError('Authentication verification failed. Please try again.');
                await supabase.auth.signOut();
                setTimeout(() => navigate('/auth'), 3000);
                return;
              }
              
              // If the existing user has a different ID, this is a duplicate
              if (existingUsers && existingUsers !== user.id) {

                setError('This email is already registered with a different account. Please sign in using your original login method (email/password).');
                
                // Sign out the OAuth user
                await supabase.auth.signOut();
                setTimeout(() => navigate('/auth'), 5000);
                return;
              }
            }
            
            // OAuth email check passed, proceeding with login
          } catch (emailVerificationError) {

            setError('Authentication verification failed. Please try again.');
            await supabase.auth.signOut();
            setTimeout(() => navigate('/auth'), 3000);
            return;
          }
          
          // Set user and profile in auth store
          await setUserAndProfile(user, null);
          
          // Redirect to dashboard
          navigate('/dashboard');
        } else {
          // Check if this is a password reset callback
          const urlParams = new URLSearchParams(window.location.search);
          const accessToken = urlParams.get('access_token');
          const refreshToken = urlParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            // This is a password reset callback, redirect to reset password page
            navigate('/auth/reset-password');
          } else {
            setError('Login was cancelled or failed.');
            setTimeout(() => navigate('/auth'), 3000);
          }
        }
      } catch (err) {

        setError('An unexpected error occurred.');
        setTimeout(() => navigate('/auth'), 3000);
      }
    };

    handleCallback();
  }, [navigate, setUserAndProfile]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {error ? (
            <>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Login Failed</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting to login page...</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Completing Login</h2>
              <p className="text-gray-600 dark:text-gray-400">Please wait while we complete your authentication...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback; 

