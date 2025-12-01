// firebase.js
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCNWAaWbxwx7rHBJFo1Olde9NDr7guPx0Y",
  authDomain: "mynewapp-da23d.firebaseapp.com",
  projectId: "mynewapp-da23d",
  storageBucket: "mynewapp-da23d.firebasestorage.app",
  messagingSenderId: "1086305245560",
  appId: "1:1086305245560:web:5fa6d5335522a20f02d08d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
export default app;