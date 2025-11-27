// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJDPg-KcDOrQN8VAGM0B7GEg2MgstGZKA",
  authDomain: "madrasati-9fd0b.firebaseapp.com",
  projectId: "madrasati-9fd0b",
  storageBucket: "madrasati-9fd0b.appspot.com",
  messagingSenderId: "351776192308",
  appId: "1:351776192308:web:74985a6c9f1f8d4a339761",
  measurementId: "G-5V737P3M2L"
};

// Initialize Firebase (compat SDK)
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Expose references for other scripts
window.firebaseApp = app;
window.auth = auth;
window.db = db;
window.storage = storage;
