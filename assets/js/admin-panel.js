import { auth, db, storage, ADMIN_EMAIL } from "./firebase-core.js";
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
    collection,
    addDoc,
    orderBy,
    query,
    onSnapshot,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";

const postsList = document.getElementById("adminPosts");
const titleInput = document.getElementById("imageTitle");
const fileInput = document.getElementById("imageFile");
const publishBtn = document.getElementById("publishBtn");
const statusEl = document.getElementById("adminStatus");
const selectedList = document.getElementById("selectedImages");

function setStatus(msg, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    statusEl.className = isError ? "status error" : "status";
    if (msg) statusEl.classList.add("show");
}

async function uploadImage(file) {
    if (!file) throw new Error("no-file");
    const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
    const snap = await uploadBytes(storageRef, file);
    return getDownloadURL(snap.ref);
}

async function uploadImages(files, captions = []) {
    const all = [];
    for (const [idx, file] of files.entries()) {
        const url = await uploadImage(file);
        all.push({
            url,
            caption: captions[idx] || ""
        });
    }
    return all;
}

async function savePostToFirestore(urls, title) {
    const images = Array.isArray(urls) ? urls : [urls].filter(Boolean);
    const normalized = images.map(img => typeof img === "string" ? { url: img, caption: "" } : img);
    const data = {
        title: title || "",
        image: normalized[0]?.url || "",
        images: normalized,
        createdAt: serverTimestamp()
    };
    await addDoc(collection(db, "gallery"), data);
}

function renderPosts(snap) {
    if (!postsList) return;
    postsList.innerHTML = "";
    snap.forEach(docSnap => {
        const data = docSnap.data();
        const images = Array.isArray(data.images) ? data.images : (data.image ? [{ url: data.image, caption: "" }] : []);
        const item = document.createElement("article");
        item.className = "admin-post";
        item.innerHTML = `
            <div class="post-head">
                <div>
                    <p class="eyebrow">${data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : ""}</p>
                    <h3>${data.title || "منشور بدون عنوان"}</h3>
                </div>
                <button class="danger" data-id="${docSnap.id}">حذف</button>
            </div>
            <div class="post-body">
                ${images.length ? `<div class="post-gallery">
                    ${images.map(img => `<figure><img src="${img.url}" alt="${data.title || ""}"><figcaption>${img.caption || ""}</figcaption></figure>`).join("")}
                </div>` : ""}
            </div>
        `;
        postsList.appendChild(item);
    });

    postsList.querySelectorAll("button[data-id]").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;
            try {
                await deleteDoc(doc(db, "gallery", id));
            } catch (err) {
                console.error(err);
                setStatus("تعذر حذف المنشور", true);
            }
        });
    });
}

async function handlePublish() {
    const title = (titleInput?.value || "").trim();
    const files = fileInput?.files ? Array.from(fileInput.files) : [];
    if (!files.length) {
        setStatus("اختر صورة أو أكثر للرفع", true);
        return;
    }
    const captions = Array.from(document.querySelectorAll(".image-caption")).map(input => input.value.trim());
    setStatus("...جاري الرفع");
    try {
        const images = await uploadImages(files, captions);
        await savePostToFirestore(images, title);
        setStatus("تم النشر");
        if (titleInput) titleInput.value = "";
        if (fileInput) fileInput.value = "";
        if (selectedList) selectedList.innerHTML = "";
    } catch (err) {
        console.error(err);
        setStatus("تعذر الرفع أو الحفظ", true);
    }
}

function renderSelectedFiles() {
    if (!selectedList || !fileInput?.files?.length) {
        if (selectedList) selectedList.innerHTML = "";
        return;
    }
    selectedList.innerHTML = "";
    Array.from(fileInput.files).forEach((file, idx) => {
        const row = document.createElement("div");
        row.className = "image-row";
        row.innerHTML = `
            <div class="file-name">${file.name}</div>
            <input type="text" class="image-caption" data-idx="${idx}" placeholder="وصف الصورة (اختياري)">
        `;
        selectedList.appendChild(row);
    });
}

function protectAdminPanel() {
    onAuthStateChanged(auth, (user) => {
        if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
            setStatus("سيتم إغلاق الصفحة للمستخدم غير المصرّح", true);
            setTimeout(() => window.location.href = "settings.html", 800);
            return;
        }
        setStatus("");
        subscribePosts();
    });
}

function subscribePosts() {
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    onSnapshot(q, renderPosts, (err) => {
        console.error(err);
        setStatus("تعذر جلب المنشورات", true);
    });
}

function wireAdminPanel() {
    protectAdminPanel();
    if (publishBtn) publishBtn.addEventListener("click", handlePublish);
    if (fileInput) fileInput.addEventListener("change", renderSelectedFiles);
    const signOutBtn = document.getElementById("adminLogout");
    if (signOutBtn) {
        signOutBtn.addEventListener("click", async () => {
            await signOut(auth);
            window.location.href = "settings.html";
        });
    }
}

document.addEventListener("DOMContentLoaded", wireAdminPanel);
