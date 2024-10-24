// firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAM6GB4vF_gV3qdVWf1BhCzYlSKbhNHeOo",
  authDomain: "ai-interviewer-f888e.firebaseapp.com",
  projectId: "ai-interviewer-f888e",
  storageBucket: "ai-interviewer-f888e.appspot.com",
  messagingSenderId: "624984358361",
  appId: "1:624984358361:web:538aa02a0dbb692f6d2dc8",
  measurementId: "G-HRSNQG6XF5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
