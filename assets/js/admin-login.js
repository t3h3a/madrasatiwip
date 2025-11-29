import {
    auth,
    ADMIN_EMAIL,
    ADMIN_UID,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "./firebase-config.js";

const FALLBACK_EMAIL = "btecmaad@gmail.com";
const FALLBACK_PASS = "123456789102008";

const loginForm = document.getElementById("adminLoginForm");
const loginButton = document.getElementById("adminLoginButton");
const statusEl = document.getElementById("adminLoginStatus");

function setStatus(message = "", isError = false) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = isError ? "status error" : "status";
    if (message) statusEl.classList.add("show");
}

function setLoading(isLoading = false) {
    if (!loginButton) return;
    loginButton.disabled = isLoading;
    loginButton.classList.toggle("is-loading", isLoading);
}

function redirectToPanel() {
    window.location.replace("admin-panel.html");
}

function isAdminUser(user) {
    if (!user) return false;
    const email = (user.email || "").toLowerCase();
    return email === ADMIN_EMAIL.toLowerCase() || user.uid === ADMIN_UID;
}

async function handleFirebaseLogin(email, password) {
    try {
        setStatus("...جاري التحقق");
        const credential = await signInWithEmailAndPassword(auth, email, password);
        if (isAdminUser(credential?.user)) {
            redirectToPanel();
            return true;
        }
        await signOut(auth);
        setStatus("هذا الحساب غير مخول كأدمن", true);
        return false;
    } catch (error) {
        if (error?.code === "auth/user-not-found" && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            try {
                await createUserWithEmailAndPassword(auth, email, password);
                setStatus("تم إنشاء حساب الأدمن، أعد المحاولة");
                return false;
            } catch (createError) {
                console.error(createError);
                setStatus("تعذر إنشاء حساب الأدمن", true);
                return false;
            }
        }
        throw error;
    }
}

async function attemptFallbackOrFail(email, password) {
    if (email.toLowerCase() === FALLBACK_EMAIL.toLowerCase() && password === FALLBACK_PASS) {
        localStorage.setItem("fakeAdmin", "true");
        redirectToPanel();
        return true;
    }
    return false;
}

async function handleSubmit(event) {
    event.preventDefault();
    if (!loginForm) return;
    const data = new FormData(loginForm);
    const email = (data.get("email") || "").toString().trim();
    const password = (data.get("password") || "").toString();

    if (!email || !password) {
        setStatus("أدخل البريد الإلكتروني وكلمة المرور", true);
        return;
    }

    setLoading(true);
    try {
        await handleFirebaseLogin(email, password);
    } catch (error) {
        console.error(error);
        if (await attemptFallbackOrFail(email, password)) {
            return;
        }
        setStatus(error?.message || "خطأ أثناء تسجيل الدخول", true);
    } finally {
        setLoading(false);
    }
}

function ensureAdminRedirect() {
    onAuthStateChanged(auth, (user) => {
        const fakeAdmin = localStorage.getItem("fakeAdmin") === "true";
        if (fakeAdmin || isAdminUser(user)) {
            redirectToPanel();
        }
    });
}

function wireForm() {
    if (!loginForm) return;
    loginForm.addEventListener("submit", handleSubmit);
}

document.addEventListener("DOMContentLoaded", () => {
    wireForm();
    ensureAdminRedirect();
});
