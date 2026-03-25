import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: 'AIzaSyBPeT7dQ2Yi5t6-k2uWDjM9kCXoo_OCxPA',
  authDomain: 'hipoteka-web.firebaseapp.com',
  projectId: 'hipoteka-web',
  storageBucket: 'hipoteka-web.firebasestorage.app',
  messagingSenderId: '659966626475',
  appId: '1:659966626475:web:edb4e2939cbc10499c85ee',
  measurementId: 'G-290YEQQBD7'
};

export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
