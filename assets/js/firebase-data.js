// Firebase data helpers: profiles, roles, feedback
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
    addDoc,
    collection,
    query,
    orderBy,
    onSnapshot,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

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
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

const roles = ["admin", "editor", "user"];

export async function ensureProfile(user) {
    if (!user?.uid) return null;
    const ref = doc(db, "profiles", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        const profile = {
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || "",
            photoURL: user.photoURL || "",
            role: "user",
            createdAt: serverTimestamp()
        };
        await setDoc(ref, profile, { merge: true });
        return profile;
    }
    return snap.data();
}

export async function getProfile(user) {
    if (!user?.uid) return null;
    const snap = await getDoc(doc(db, "profiles", user.uid));
    return snap.exists() ? snap.data() : ensureProfile(user);
}

export async function updateProfile(user, { displayName, file }) {
    if (!user?.uid) throw new Error("no-user");
    const refDoc = doc(db, "profiles", user.uid);
    let photoURL = null;
    if (file) {
        const ext = (file.name || "jpg").split(".").pop();
        const storageRef = ref(storage, `avatars/${user.uid}.${ext}`);
        await uploadBytes(storageRef, file);
        photoURL = await getDownloadURL(storageRef);
    }
    const payload = {};
    if (displayName !== undefined) payload.displayName = displayName;
    if (photoURL) payload.photoURL = photoURL;
    await updateDoc(refDoc, payload);
    return { ...(await getProfile(user)), ...payload };
}

export async function addFeedback(user, text) {
    if (!user?.uid) throw new Error("no-user");
    const profile = await ensureProfile(user);
    const payload = {
        text,
        authorId: user.uid,
        authorName: profile?.displayName || user.email || "مستخدم",
        createdAt: serverTimestamp()
    };
    const ref = collection(db, "feedback");
    return addDoc(ref, payload);
}

export function subscribeFeedback(callback) {
    const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
    return onSnapshot(q, callback);
}

export async function deleteFeedback(feedbackId) {
    await deleteDoc(doc(db, "feedback", feedbackId));
}

export function isPrivileged(profile) {
    return profile?.role === "admin" || profile?.role === "editor";
}

export function isAdmin(profile) {
    return profile?.role === "admin";
}

export { roles };
