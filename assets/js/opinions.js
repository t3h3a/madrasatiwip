import { auth } from "./firebase-data.js";
import { ensureProfile, addFeedback, subscribeFeedback, deleteFeedback, getProfile, isAdmin } from "./firebase-data.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const form = document.getElementById("opinionForm");
const textEl = document.getElementById("opinionText");
const statusEl = document.getElementById("opinionStatus");
const listEl = document.getElementById("opinionsList");

let currentUser = null;
let currentProfile = null;
let unsubscribe = null;

function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg || "";
}

function renderOpinions(snapshot) {
    if (!listEl) return;
    listEl.innerHTML = "";
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const item = document.createElement("div");
        item.className = "opinion-item";
        const meta = document.createElement("div");
        meta.className = "opinion-meta";
        meta.innerHTML = `<span>${data.authorName || "مستخدم"}</span><span>${data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : ""}</span>`;
        const text = document.createElement("p");
        text.className = "opinion-text";
        text.textContent = data.text || "";
        item.appendChild(meta);
        item.appendChild(text);

        if (currentProfile && isAdmin(currentProfile)) {
            const delBtn = document.createElement("button");
            delBtn.className = "opinion-delete";
            delBtn.textContent = "حذف";
            delBtn.addEventListener("click", async () => {
                try {
                    await deleteFeedback(docSnap.id);
                } catch (err) {
                    console.error(err);
                    setStatus("تعذر حذف التعليق");
                }
            });
            item.appendChild(delBtn);
        }

        listEl.appendChild(item);
    });
}

function startListening() {
    if (unsubscribe) unsubscribe();
    unsubscribe = subscribeFeedback(renderOpinions);
}

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!currentUser) {
            setStatus("يرجى تسجيل الدخول أولاً.");
            return;
        }
        const text = (textEl?.value || "").trim();
        if (!text) {
            setStatus("النص مطلوب.");
            return;
        }
        setStatus("جاري الإرسال...");
        try {
            await addFeedback(currentUser, text);
            if (textEl) textEl.value = "";
            setStatus("تم الإرسال");
        } catch (err) {
            console.error(err);
            setStatus("تعذر الإرسال");
        }
    });
}

onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        currentProfile = await getProfile(user);
        startListening();
    } else {
        currentProfile = null;
        if (unsubscribe) unsubscribe();
        setStatus("يرجى تسجيل الدخول أولاً.");
        if (listEl) listEl.innerHTML = "";
    }
});
