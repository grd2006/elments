import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDPNjSIgIGq_TR7b8PEhyDcLNFD53q33j8",
  authDomain: "spill-the-tea-istg.firebaseapp.com",
  databaseURL: "https://spill-the-tea-istg-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "spill-the-tea-istg",
  storageBucket: "spill-the-tea-istg.firebasestorage.app",
  messagingSenderId: "268910514236",
  appId: "1:268910514236:web:8d5eca8a8cb719a1907339",
  measurementId: "G-DMWPJ7HTNH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);