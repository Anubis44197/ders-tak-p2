import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_GOOGLE_AI_API_KEY,
  authDomain: "ders-tak.firebaseapp.com",
  projectId: "ders-tak",
  storageBucket: "ders-tak.firebasestorage.app",
  messagingSenderId: "1017687251305",
  appId: "1:1017687251305:web:8bdbe9daebe6b1366685f8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };