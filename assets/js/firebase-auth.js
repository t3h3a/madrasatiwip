// Firebase Auth integration (email/password)
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

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
const auth = getAuth(app);

const messages = {
    ar: {
        signedOut: "أنت غير مسجل دخول حالياً",
        signedIn: (email) => `تم تسجيل الدخول كـ ${email}`,
        created: (email) => `تم إنشاء حساب جديد وتسجيل الدخول كـ ${email}`,
        logout: "تم تسجيل الخروج",
        error: "تعذر تسجيل الدخول، تأكد من البريد/كلمة المرور",
        googleError: "تعذر تسجيل الدخول بحساب جوجل"
    },
    en: {
        signedOut: "You are not signed in",
        signedIn: (email) => `Signed in as ${email}`,
        created: (email) => `Account created and signed in as ${email}`,
        logout: "Signed out",
        error: "Could not sign in, check email/password",
        googleError: "Could not sign in with Google"
    }
};

function currentLang() {
    const lang = document.body.dataset.lang || document.documentElement.lang || "ar";
    return lang === "en" ? "en" : "ar";
}

function setStatus(statusEl, key, email) {
    if (!statusEl) return;
    const lang = currentLang();
    const msg = typeof messages[lang][key] === "function"
        ? messages[lang][key](email || "")
        : messages[lang][key];
    statusEl.textContent = msg;
    statusEl.classList.add("show");
}

function wireSettingsAuth() {
    const loginForm = document.getElementById("settingsLogin");
    const logoutBtn = document.getElementById("logoutBtn");
    const statusEl = document.getElementById("settingsStatus");
    const googleMock = document.getElementById("googleMock");

    if (googleMock) {
        googleMock.removeAttribute("disabled");
        googleMock.style.opacity = "1";
        googleMock.style.cursor = "pointer";
    }

    // تنبيه في حال الصفحة ليست عبر https أو localhost
    const isSecureOrigin = window.location.protocol === "https:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (!isSecureOrigin) {
        if (statusEl) {
            statusEl.textContent = currentLang() === "en"
                ? "Run from https:// or localhost: Firebase Auth blocks insecure origins."
                : "شغّل الصفحة عبر https أو localhost؛ مصادقة Firebase لا تعمل على http عادي.";
            statusEl.classList.add("show");
        }
        return;
    }

    setStatus(statusEl, "signedOut");

    onAuthStateChanged(auth, (user) => {
        if (user?.email) {
            setStatus(statusEl, "signedIn", user.email);
        } else {
            setStatus(statusEl, "signedOut");
        }
    });

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const data = new FormData(loginForm);
            const email = data.get("email");
            const password = data.get("password");
            try {
                await signInWithEmailAndPassword(auth, email, password);
                setStatus(statusEl, "signedIn", email);
            } catch (err) {
                // لو الحساب غير موجود نجرب إنشاءه
                try {
                    await createUserWithEmailAndPassword(auth, email, password);
                    setStatus(statusEl, "created", email);
                } catch (err2) {
                    console.error(err2);
                    setStatus(statusEl, "error");
                    statusEl.title = err2?.message || "";
                }
            }
        });
    }

    if (googleMock) {
        googleMock.addEventListener("click", async () => {
            try {
                const provider = new GoogleAuthProvider();
                provider.setCustomParameters({ prompt: "select_account" });
                await signInWithPopup(auth, provider);
            } catch (err) {
                console.error(err);
                // في حال منع النوافذ المنبثقة، نجرب redirect
                if (err?.code === "auth/popup-blocked") {
                    try {
                        const provider = new GoogleAuthProvider();
                        provider.setCustomParameters({ prompt: "select_account" });
                        await signInWithRedirect(auth, provider);
                        return;
                    } catch (err2) {
                        console.error(err2);
                        err = err2;
                    }
                }
                setStatus(statusEl, "googleError");
                statusEl.title = `${err?.code || ""} ${err?.message || ""}`.trim();
            }
        });
    }

    // معالجة نتائج تسجيل الدخول بالتحويل (redirect) إذا وُجدت
    getRedirectResult(auth).then(result => {
        if (result?.user?.email) {
            setStatus(statusEl, "signedIn", result.user.email);
        }
    }).catch(err => {
        console.error(err);
        if (statusEl) {
            setStatus(statusEl, "googleError");
            statusEl.title = `${err?.code || ""} ${err?.message || ""}`.trim();
        }
    });

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try {
                await signOut(auth);
                setStatus(statusEl, "logout");
            } catch (err) {
                console.error(err);
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", wireSettingsAuth);
