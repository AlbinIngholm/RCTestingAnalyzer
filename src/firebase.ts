import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyB692-OmitUl0AphL4wYHjANnsFDhwTtkE",
    authDomain: "rctracker-ca4a0.firebaseapp.com",
    projectId: "rctracker-ca4a0",
    storageBucket: "rctracker-ca4a0.firebasestorage.app",
    messagingSenderId: "499372521323",
    appId: "1:499372521323:web:48f4dbc2ff06120ae13e2e",
    measurementId: "G-SH9GHKWW9B"
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);