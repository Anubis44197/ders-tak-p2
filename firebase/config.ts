// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getMessaging, isSupported } from 'firebase/messaging';

// Firebase config object with your actual project credentials
const firebaseConfig = {
  apiKey: "AIzaSyCdp11ugWRUUsxEC7tDbD4ojVP1ZFlvJ_8",
  authDomain: "ders-takip-projesi.firebaseapp.com",
  projectId: "ders-takip-projesi", 
  storageBucket: "ders-takip-projesi.appspot.com",
  messagingSenderId: "123456789012", // You may need to update this
  appId: "1:123456789012:web:abcdef123456789012345678", // You may need to update this
  measurementId: "G-XXXXXXXXXX" // Optional
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firebase Cloud Messaging (only if supported)
let messaging: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  });
}

export { messaging };

// Development mode: use emulators
if (process.env.NODE_ENV === 'development') {
  // Check if we should use emulators
  const useEmulator = process.env.VITE_USE_FIREBASE_EMULATOR === 'true';
  
  if (useEmulator) {
    try {
      // Firestore emulator
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('Connected to Firestore emulator');
    } catch (error) {
      console.log('Firestore emulator connection failed or already connected:', error);
    }

    try {
      // Auth emulator  
      connectAuthEmulator(auth, 'http://localhost:9099');
      console.log('Connected to Auth emulator');
    } catch (error) {
      console.log('Auth emulator connection failed or already connected:', error);
    }
  }
}

// Connection status helper
export const checkFirebaseConnection = async (): Promise<boolean> => {
  try {
    // Try to connect to Firestore
    const { doc, getDoc } = await import('firebase/firestore');
    const testDoc = doc(db, 'test', 'connection');
    await getDoc(testDoc);
    return true;
  } catch (error) {
    console.error('Firebase connection failed:', error);
    return false;
  }
};

// Export the app instance
export default app;