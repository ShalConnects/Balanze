import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { markPersistentLogin } from '../utils/authStorage';

function normalizeUserId(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && 'id' in first) {
      return String((first as { id: unknown }).id);
    }
  }
  if (value && typeof value === 'object' && 'id' in value) {
    return String((value as { id: unknown }).id);
  }
  return null;
}

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { setUserAndProfile } = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms));
    };

    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = window.location.hash
          ? new URLSearchParams(window.location.hash.substring(1))
          : null;

        const oauthError =
          urlParams.get('error') ||
          hashParams?.get('error') ||
          hashParams?.get('error_description');

        if (oauthError) {
          console.error('[AUTH_CALLBACK] OAuth Error:', oauthError);
          if (!cancelled) {
            setError('Authentication failed. Please try again.');
            later(() => navigate('/auth'), 3000);
          }
          return;
        }

        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[AUTH_CALLBACK] Session Error:', sessionError);
          if (!cancelled) {
            setError('Authentication failed. Please try again.');
            later(() => navigate('/auth'), 3000);
          }
          return;
        }

        if (data.session?.user) {
          const user = data.session.user;

          try {
            const { data: emailCheck, error: emailCheckError } = await supabase.rpc(
              'check_email_exists',
              { email_to_check: user.email || '' }
            );

            if (emailCheckError) {
              setError('Authentication verification failed. Please try again.');
              await supabase.auth.signOut();
              later(() => navigate('/auth'), 3000);
              return;
            }

            if (emailCheck === true) {
              const { data: existingUsers, error: fetchError } = await supabase.rpc(
                'get_user_by_email',
                { email_to_check: user.email || '' }
              );

              if (fetchError) {
                setError('Authentication verification failed. Please try again.');
                await supabase.auth.signOut();
                later(() => navigate('/auth'), 3000);
                return;
              }

              const existingId = normalizeUserId(existingUsers);
              if (existingId && existingId !== user.id) {
                setError(
                  'This email is already registered with a different account. Please sign in using your original login method (email/password).'
                );
                await supabase.auth.signOut();
                later(() => navigate('/auth'), 5000);
                return;
              }
            }
          } catch {
            setError('Authentication verification failed. Please try again.');
            await supabase.auth.signOut();
            later(() => navigate('/auth'), 3000);
            return;
          }

          if (cancelled) return;
          markPersistentLogin();
          await setUserAndProfile(user, null);
          navigate('/dashboard');
        } else {
          setError('No session found. Please try signing in again.');
          later(() => navigate('/auth'), 3000);
        }
      } catch (err) {
        console.error('[AUTH_CALLBACK] Unexpected error:', err);
        if (!cancelled) {
          setError('An unexpected error occurred. Please try again.');
          later(() => navigate('/auth'), 3000);
        }
      }
    };

    handleCallback();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [navigate, setUserAndProfile]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              Authentication Error
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Redirecting to login page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
