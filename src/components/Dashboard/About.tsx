import React from 'react';
import { useAuthStore } from '../../store/authStore';

export const About: React.FC = () => {
  const { user } = useAuthStore();
  if (!user) return <div className="p-8">No user info available.</div>;
  return (
    <div className="max-w-lg mx-auto bg-white rounded-xl shadow p-8 mt-8">
      <h2 className="text-2xl font-bold mb-4">About You</h2>
      <div className="space-y-2">
        <div><span className="font-semibold">Name:</span> {user.fullName}</div>
        <div><span className="font-semibold">Email:</span> {user.email}</div>
        <div><span className="font-semibold">Role:</span> {user.role}</div>
        <div><span className="font-semibold">Plan:</span> {user.subscription.plan}</div>
        <div><span className="font-semibold">Subscription Status:</span> {user.subscription.status}</div>
        <div><span className="font-semibold">Valid Until:</span> {user.subscription.validUntil ? new Date(user.subscription.validUntil).toLocaleDateString() : 'N/A'}</div>
      </div>
    </div>
  );
}; 

