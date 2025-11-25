// حارس الدخول: يمنع عرض الموقع بدون تسجيل دخول
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    setPersistence,
    browserLocalPersistence
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

const txt = {
    ar: {
        title: "تسجيل الدخول مطلوب",
        sub: "الرجاء تسجيل الدخول للوصول إلى الموقع.",
        email: "البريد الإلكتروني",
        password: "كلمة المرور",
        login: "تسجيل الدخول",
        google: "تسجيل الدخول مع Google",
        error: "فشل تسجيل الدخول، تحقق من البريد/كلمة المرور",
        logout: "تسجيل الخروج",
        secure: "شغّل الموقع عبر https أو localhost لأن Firebase Auth لا يعمل على http.",
        create: "إنشاء حساب جديد",
        createHint: "ليس لديك حساب؟ أنشئ حساباً جديداً.",
        createTitle: "إنشاء حساب جديد",
        createSub: "سجّل حسابك للوصول إلى المحتوى.",
        loginTitle: "تسجيل الدخول مطلوب",
        loginSub: "الرجاء تسجيل الدخول للوصول إلى الموقع.",
        backToLogin: "تسجيل الدخول",
        backHint: "لديك حساب؟ سجّل دخولك."
    },
    en: {
        title: "Sign-in required",
        sub: "Please sign in to access the site.",
        email: "Email",
        password: "Password",
        login: "Sign in",
        google: "Continue with Google",
        error: "Sign-in failed, check email/password",
        logout: "Sign out",
        secure: "Run the site over https or localhost; Firebase Auth blocks plain http.",
        create: "Create an account",
        createHint: "Don't have an account? Create one.",
        createTitle: "Create a new account",
        createSub: "Register to access the content.",
        loginTitle: "Sign-in required",
        loginSub: "Please sign in to access the site.",
        backToLogin: "Sign in",
        backHint: "Already have an account? Sign in."
    }
};

function currentLang() {
    const lang = document.body.dataset.lang || document.documentElement.lang || "ar";
    return lang === "en" ? "en" : "ar";
}

function injectGate() {
    if (document.getElementById("authGate")) return document.getElementById("authGate");

    const gate = document.createElement("div");
    gate.id = "authGate";
    gate.innerHTML = `
        <div class="auth-backdrop"></div>
        <div class="auth-card">
            <div class="auth-hero">
                <div class="auth-hero-inner">
                    <p class="auth-hero-eyebrow">مدرسة وادي موسى الثانوية</p>
                    <h3 class="auth-hero-title">تعليم حديث ومسار BTEC مميز</h3>
                </div>
            </div>
            <div class="auth-form-wrap">
                <div class="auth-head">
                    <div>
                        <h2 class="auth-brand">مدرستي</h2>
                        <h3 class="auth-title" id="authTitle"></h3>
                        <p class="auth-sub" id="authSub"></p>
                    </div>
                    <img src="assets/images/school-logo.png" alt="logo" class="auth-logo">
                </div>
                <form id="authForm" class="auth-form">
                    <label>
                        <span id="authEmailLabel"></span>
                        <input type="email" name="email" required placeholder="Email">
                    </label>
                    <label>
                        <span id="authPassLabel"></span>
                        <input type="password" name="password" required placeholder="Password">
                    </label>
                    <button type="submit" class="auth-primary" id="authLoginBtn"></button>
                </form>
                <div class="auth-create">
                    <span id="authCreateHint"></span>
                    <button type="button" id="authCreateToggle"></button>
                </div>
                <div class="auth-extra">
                    <button type="button" id="authResetBtn">هل نسيت كلمة المرور؟</button>
                </div>
                <div class="auth-create back-link">
                    <span id="authBackHint"></span>
                    <button type="button" id="authLoginToggle"></button>
                </div>
                <div class="auth-message" id="authMessage"></div>
            </div>
        </div>
    `;
    document.body.appendChild(gate);
    gate.style.display = "none";
    return gate;
}

function setGateTexts() {
    const lang = currentLang();
    const t = txt[lang];
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set("authTitle", t.title);
    set("authSub", t.sub);
    set("authEmailLabel", t.email);
    set("authPassLabel", t.password);
    set("authLoginBtn", t.login);
    set("authGoogleText", t.google);
    set("authCreateHint", t.createHint);
    set("authCreateToggle", t.create);
    set("authBackHint", t.backHint);
    set("authLoginToggle", t.backToLogin);
}

function showMessage(msgKey, customText) {
    const el = document.getElementById("authMessage");
    if (!el) return;
    const lang = currentLang();
    el.textContent = customText || txt[lang][msgKey] || msgKey;
    el.classList.add("show");
}

function clearMessage() {
    const el = document.getElementById("authMessage");
    if (el) el.textContent = "";
}

function lockPage() {
    const gate = injectGate();
    if (gate) {
        gate.style.display = "grid";
        document.body.classList.add("auth-locked");
    }
}

function unlockPage() {
    document.body.classList.remove("auth-locked");
    const gate = document.getElementById("authGate");
    if (gate) gate.style.display = "none";
}

function wireProfile(user) {
    const header = document.querySelector(".main-header .header-inner");
    if (!header) return;
    if (document.getElementById("userChip")) return;
    const chip = document.createElement("button");
    chip.id = "userChip";
    chip.className = "user-chip";
    const photo = user?.photoURL;
    chip.innerHTML = photo
        ? `<img src="${photo}" alt="user">`
        : `<span>${(user?.email || "?").charAt(0).toUpperCase()}</span>`;
    chip.title = user?.email || "";
    chip.addEventListener("click", () => signOut(auth));
    // أدخله قبل زر القائمة
    const navToggle = document.getElementById("navToggle");
    if (navToggle?.parentElement) {
        navToggle.parentElement.insertBefore(chip, navToggle);
    } else {
        header.appendChild(chip);
    }
}

function wireGate() {
    injectGate();
    setGateTexts();
    lockPage(); // أظهر شاشة الدخول مباشرة عند فتح الصفحة

    const form = document.getElementById("authForm");
    const createToggle = document.getElementById("authCreateToggle");
    const loginToggle = document.getElementById("authLoginToggle");
    const loginBtn = document.getElementById("authLoginBtn");
    const resetBtn = document.getElementById("authResetBtn");
    let createMode = false;

    const isSecureOrigin = window.location.protocol === "https:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

    setPersistence(auth, browserLocalPersistence).catch(console.error);

    onAuthStateChanged(auth, (user) => {
        if (user) {
            clearMessage();
            unlockPage();
            wireProfile(user);
        } else {
            lockPage();
            if (!isSecureOrigin) {
                showMessage("secure");
            }
        }
    });

    function setMode(create) {
        createMode = create;
        const lang = currentLang();
        const t = txt[lang];
        const titleEl = document.getElementById("authTitle");
        const subEl = document.getElementById("authSub");
        if (titleEl) titleEl.textContent = create ? t.createTitle : t.loginTitle;
        if (subEl) subEl.textContent = create ? t.createSub : t.loginSub;
        if (loginBtn) loginBtn.textContent = create ? t.create : t.login;
        clearMessage();
        const formEl = document.getElementById("authForm");
        if (formEl) formEl.reset();
        const backRow = document.querySelector(".back-link");
        if (backRow) backRow.style.display = create ? "flex" : "none";
        const createRow = document.querySelector(".auth-create:not(.back-link)");
        if (createRow) createRow.style.display = create ? "none" : "flex";
    }

    setMode(false);

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            clearMessage();
            if (!isSecureOrigin) {
                showMessage("secure");
                return;
            }
            const data = new FormData(form);
            const email = data.get("email");
            const password = data.get("password");
            try {
                if (createMode) {
                    await createUserWithEmailAndPassword(auth, email, password);
                } else {
                    await signInWithEmailAndPassword(auth, email, password);
                }
            } catch (err) {
                console.error(err);
                showMessage("error", `${err?.code || ""} ${err?.message || ""}`.trim());
            }
        });
    }

    if (createToggle && loginBtn) {
        createToggle.addEventListener("click", () => setMode(true));
    }

    if (loginToggle) {
        loginToggle.addEventListener("click", () => setMode(false));
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", async () => {
            clearMessage();
            const emailInput = form?.querySelector('input[name="email"]');
            const email = emailInput?.value?.trim();
            if (!email) {
                showMessage("error", "أدخل البريد لإرسال رابط إعادة التعيين.");
                return;
            }
            try {
                await sendPasswordResetEmail(auth, email);
                showMessage("info", "تم إرسال رابط إعادة التعيين إلى بريدك.");
            } catch (err) {
                console.error(err);
                showMessage("error", err?.message || "تعذر إرسال الرابط");
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // حاوية الترجمة المخفية لتجنب مشاكل جوجل ترانسليت
    if (!document.getElementById("google_translate_element")) {
        const holder = document.createElement("div");
        holder.id = "google_translate_element";
        holder.style.display = "none";
        document.body.appendChild(holder);
    }
    // حارس الدخول
    wireGate();
});
