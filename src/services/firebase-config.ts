import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: 'dogs-parks-8f00e.firebaseapp.com',
  projectId: 'dogs-parks-8f00e',
  storageBucket: 'dogs-parks-8f00e.appspot.com',
  messagingSenderId: '259543659292',
  appId: '1:259543659292:web:638272f4add12c797f40d9',
  measurementId: 'G-0E10KB7SNG',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
