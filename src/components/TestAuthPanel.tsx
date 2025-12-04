import React, { useState, useEffect } from 'react';
import { testAuth } from '../lib/testAuth';
import { useAuthStore } from '../store/authStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { LW } from './Dashboard/LW';

const TestAuthPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState('');
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [customEmail, setCustomEmail] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [customName, setCustomName] = useState('');
  const { setUserAndProfile } = useAuthStore();
  const [showLW, setShowLW] = useState(false);

  // Check current session on mount
  useEffect(() => {
    const checkCurrentSession = async () => {
      const session = await testAuth.getCurrentSession();
      if (session?.user) {
        setCurrentUser(session.user.email || 'Unknown');
      }
    };
    checkCurrentSession();
  }, []);

  const handleSetupTestUsers = async () => {
    setStatus('Setting up test users...');
    try {
      await testAuth.setupTestUsers();
      setStatus('Test users created! Check your email for confirmation links.');
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  const handleLoginAs = async (userType: 'admin' | 'user' | 'premium') => {
    setStatus(`Logging in as ${userType}...`);
    try {
      const result = await testAuth.loginAsTestUser(userType);
      if (result.success && result.user) {
        // Update auth store with the user
        setUserAndProfile(result.user, {
          id: result.user.id,
          fullName: result.user.user_metadata?.fullName || 'Test User',
          local_currency: 'USD',
          selected_currencies: ['USD', 'EUR']
        });
        
        // Update current user display
        setCurrentUser(result.user.email || 'Unknown');
        
        // Load all user data
        try {
          await useFinanceStore.getState().fetchAllData();
          setStatus(`Logged in as ${userType} successfully! Data loaded. Session will persist on refresh.`);
        } catch (dataError) {

          setStatus(`Logged in as ${userType} but failed to load data.`);
        }
      } else {
        setStatus(`Login failed: ${result.error ? JSON.stringify(result.error) : 'Unknown error'}. Try setting up users first.`);
      }
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  const handleCreateCustomUser = async () => {
    if (!customEmail || !customPassword || !customName) {
      setStatus('Please fill in all fields');
      return;
    }

    setStatus('Creating custom test user...');
    try {
      const result = await testAuth.createCustomTestUser(customEmail, customPassword, customName);
      if (result.success) {
        setStatus(`Custom user created! Check ${customEmail} for confirmation.`);
        setCustomEmail('');
        setCustomPassword('');
        setCustomName('');
      } else {
        setStatus(`Error: ${result.error ? JSON.stringify(result.error) : 'Unknown error'}`);
      }
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  const handleCreatePremiumUser = async () => {
    setStatus('Creating premium test user...');
    try {
      // Only create the premium user
      const premiumUser = testAuth.getTestUserCredentials().premium;
      const result = await testAuth.createCustomTestUser(
        premiumUser.email,
        premiumUser.password,
        premiumUser.fullName,
        { plan: 'premium', status: 'active', validUntil: null }
      );
      if (result.success && result.user) {
        setStatus('Premium test user created! Check your email for confirmation link.');
      } else if (
        result.error &&
        typeof result.error === 'object' &&
        'message' in result.error &&
        typeof result.error.message === 'string' &&
        result.error.message.includes('already registered')
      ) {
        setStatus('Premium test user already exists.');
      } else if (result.error) {
        setStatus(`Error: ${typeof result.error === 'object' && 'message' in result.error && typeof result.error.message === 'string' ? result.error.message : String(result.error)}`);
      } else {
        setStatus('Unknown result creating premium test user.');
      }
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  const handleLogout = async () => {
    setStatus('Logging out...');
    try {
      await testAuth.logoutTestUser();
      setUserAndProfile(null, null);
      setCurrentUser(null);
      setStatus('Logged out successfully!');
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  const credentials = testAuth.getTestUserCredentials();

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 hover:bg-red-600"
      >
        🧪 Test Auth {currentUser && `(${currentUser.split('@')[0]})`}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-sm z-50 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">🧪 Test Authentication</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {currentUser && (
        <div className="mb-4 p-2 bg-green-100 text-green-800 rounded text-sm">
          Currently logged in as: {currentUser}
        </div>
      )}

      {status && (
        <div className="mb-4 p-2 bg-blue-100 text-blue-800 rounded text-sm">
          {status}
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={handleSetupTestUsers}
          className="w-full bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600"
        >
          Setup Test Users
        </button>
        <button
          onClick={handleCreatePremiumUser}
          className="w-full bg-yellow-500 text-white px-3 py-2 rounded text-sm hover:bg-yellow-600"
        >
          Create Premium Test User
        </button>
        <button
          onClick={() => setShowLW(true)}
          className="w-full bg-pink-500 text-white px-3 py-2 rounded text-sm hover:bg-pink-600"
        >
          Test Last Wish (Free Access)
        </button>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Quick Login:</h4>
          {Object.entries(credentials).map(([type, user]) => (
            <button
              key={type}
              onClick={() => handleLoginAs(type as 'admin' | 'user' | 'premium')}
              className="w-full bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            >
              Login as {type} ({user.email})
            </button>
          ))}
        </div>

        <div className="border-t pt-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Create Custom User:</h4>
          <input
            type="email"
            placeholder="Email"
            value={customEmail}
            onChange={(e) => setCustomEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-sm mb-2"
          />
          <input
            type="password"
            placeholder="Password"
            value={customPassword}
            onChange={(e) => setCustomPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-sm mb-2"
          />
          <input
            type="text"
            placeholder="Full Name"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-sm mb-2"
          />
          <button
            onClick={handleCreateCustomUser}
            className="w-full bg-purple-500 text-white px-3 py-2 rounded text-sm hover:bg-purple-600"
          >
            Create Custom User
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600"
        >
          Logout
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>✅ Sessions now persist on refresh</p>
        <p>⚠️ Note: Users need email confirmation.</p>
      </div>
      {showLW && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowLW(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <LW forceFreeAccess={true} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TestAuthPanel; 

