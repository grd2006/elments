"use client";
import React from 'react';
import { auth } from './lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import Auth from '@/components/Auth';
import Chat from '@/components/Chat';

export default function Home() {
  const [user] = useAuthState(auth);

  if (!user) {
    return <Auth />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <h1 className="text-3xl font-bold text-white">Elements</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-xl border border-white/20">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="text-white">
                  <div className="text-sm font-medium">{user.displayName || 'User'}</div>
                  <div className="text-xs text-gray-400">{user.email}</div>
                </div>
              </div>
              
              <button 
                onClick={() => auth.signOut()}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition-all duration-200 hover:shadow-lg"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chat Component */}
        <Chat />
    </main>
  );
}