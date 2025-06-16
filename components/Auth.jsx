'use client';
import { auth, database } from '@/app/lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { MessageCircle } from 'lucide-react';

function Auth() {
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Save user data in realtime database
      const userRef = ref(database, `users/${result.user.uid}`);
      await set(userRef, {
        id: result.user.uid,
        name: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
        lastSeen: Date.now()
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl w-96">
        {/* Logo/Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg">
            <MessageCircle size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome to Elements</h2>
          <p className="text-gray-400">Connect and chat with your friends</p>
        </div>
        
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl hover:bg-white/20 transition-all duration-200 text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
        >
          <img 
            src="https://www.google.com/favicon.ico" 
            alt="Google" 
            className="w-5 h-5"
          />
          Continue with Google
        </button>

        {/* Additional decorative elements */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Sign in to start chatting with your contacts
          </p>
        </div>
      </div>

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}

export default Auth;