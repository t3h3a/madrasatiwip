import { auth, ADMIN_EMAIL, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "./firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const FALLBACK_EMAIL = "btecmaad@gmail.com";
const FALLBACK_PASS = "123456789102008";

// تخزين آمن يعمل حتى لو كان localStorage غير متاح (بعض متصفحات الهاتف تمنعه)
const memoryStore = {};
const safeStorage = {
    get(key) {
        try {
            return localStorage.getItem(key);
        } catch {
            return memoryStore[key] || null;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch {
            memoryStore[key] = value;
        }
    },
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch {
            delete memoryStore[key];
        }
    }
};

function setStatus(message, isError = false) {
    const statusEl = document.getElementById("adminLoginStatus");
    if (!statusEl) return;
    statusEl.textContent = message || "";
    statusEl.className = isError ? "status error" : "status";
    if (message) statusEl.classList.add("show");
}

async function loginAdmin(email, password) {
    setStatus("...جاري تسجيل الدخول");
    try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const userEmail = cred?.user?.email || "";
        if (userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            window.location.href = "admin-panel.html";
            return;
        }
        await signOut(auth);
        setStatus("هذا الحساب ليس أدمن", true);
    } catch (err) {
        if (err?.code === "auth/user-not-found" && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            try {
                await createUserWithEmailAndPassword(auth, email, password);
                setStatus("تم إنشاء حساب الأدمن، أعد تسجيل الدخول");
                return;
            } catch (createErr) {
                console.error(createErr);
                setStatus("تعذر إنشاء حساب الأدمن", true);
                return;
            }
        }
        if (email.toLowerCase() === FALLBACK_EMAIL.toLowerCase() && password === FALLBACK_PASS) {
            safeStorage.set("fakeAdmin", "true");
            window.location.href = "admin-panel.html";
            return;
        }
        console.error(err);
        setStatus(err?.message || "خطأ في تسجيل الدخول", true);
    }
}

function wireForm() {
    const form = document.getElementById("adminLoginForm");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const email = (formData.get("email") || "").toString().trim();
        const password = (formData.get("password") || "").toString().trim();
        if (!email || !password) {
            setStatus("أدخل البريد وكلمة المرور", true);
            return;
        }
        await loginAdmin(email, password);
    });
}

document.addEventListener("DOMContentLoaded", wireForm);
