import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";

export const ADMIN_EMAIL = "btecmaad@gmail.com";
export const ADMIN_UID = "vsbwILaUtvdf6OIo3aM3zi89lbO2";

const firebaseConfig = {
    apiKey: "AIzaSyBJDPg-KcDOrQN8VAGM0B7GEg2MgstGZKA",
    authDomain: "madrasati-9fd0b.firebaseapp.com",
    projectId: "madrasati-9fd0b",
    storageBucket: "madrasati-9fd0b.firebasestorage.app",
    messagingSenderId: "351776192308",
    appId: "1:351776192308:web:74985a6c9f1f8d4a339761",
    measurementId: "G-5V737P3M2L"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
