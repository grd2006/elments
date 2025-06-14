'use client';
import { auth, database } from '@/app/lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { ref, set } from 'firebase/database';

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
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl mb-6 text-center">Welcome to Elments</h2>
        
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 p-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <img 
            src="https://www.google.com/favicon.ico" 
            alt="Google" 
            className="w-5 h-5"
          />
          Continue with Google
        </button>
      </div>
    </div>
  );
}

export default Auth;