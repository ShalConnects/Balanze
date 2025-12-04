import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export const CustomSignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Registration successful! Please check your email to confirm your account.');
    }
  };

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div>
        <label
          htmlFor="full_name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Full Name
        </label>
        <input
          id="full_name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="w-full px-3 py-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
        />
      </div>
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
        />
      </div>
      <button
        type="submit"
        className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
      >
        Sign Up
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {message && <p className="text-sm text-green-500">{message}</p>}
    </form>
  );
}; 

