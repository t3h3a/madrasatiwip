import { db } from "./firebase-data.js";
import {
    collection,
    onSnapshot,
    orderBy,
    query
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const gridEl = document.getElementById("galleryGrid");
const emptyEl = document.getElementById("galleryEmpty");
const loaderEl = document.getElementById("galleryLoader");

function setLoading(isLoading) {
    if (loaderEl) loaderEl.style.display = isLoading ? "block" : "none";
}

function renderGallery(snapshot) {
    if (!gridEl) return;
    gridEl.innerHTML = "";
    setLoading(false);
    const isEmpty = snapshot.empty;
    if (emptyEl) emptyEl.style.display = isEmpty ? "block" : "none";
    if (isEmpty) return;

    snapshot.forEach((docSnap) => {
        const item = docSnap.data();
        const card = document.createElement("div");
        card.className = "gallery-card";

        const img = document.createElement("div");
        img.className = "gallery-img";
        img.style.backgroundImage = `url('${item.image || ""}')`;

        const info = document.createElement("div");
        info.className = "gallery-info";
        info.innerHTML = `
            <h3>${item.title || "بدون عنوان"}</h3>
            <p>${item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : ""}</p>
        `;

        card.appendChild(img);
        card.appendChild(info);
        gridEl.appendChild(card);
    });
}

function renderError() {
    setLoading(false);
    if (emptyEl) {
        emptyEl.style.display = "block";
        emptyEl.textContent = "تعذر تحميل المعرض، حاول تحديث الصفحة.";
    }
}

function init() {
    if (!gridEl) return;
    setLoading(true);
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    onSnapshot(q, renderGallery, renderError);
}

init();
