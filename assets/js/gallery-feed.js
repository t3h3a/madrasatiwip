import { db, auth, ADMIN_EMAIL, ADMIN_UID } from "./firebase-config.js";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    deleteDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const listEl = document.getElementById("liveGalleryList");
const statusEl = document.getElementById("liveGalleryStatus");
const heroTitleEl = document.getElementById("galleryHeroTitle");
const heroIntroEl = document.getElementById("galleryHeroIntro");

let isAdmin = false;
let lastSnapshot = null;

function setStatus(text) {
    if (statusEl) statusEl.textContent = text || "";
}

function normalizeImages(data) {
    if (Array.isArray(data.images) && data.images.length) {
        return data.images.map(img => ({ url: img.url || img, caption: img.caption || "" }));
    }
    if (data.image) return [{ url: data.image, caption: data.caption || "" }];
    return [];
}

function renderSnapshot(snap) {
    if (!listEl) return;
    lastSnapshot = snap;
    if (snap.empty) {
        setStatus("لا توجد منشورات بعد.");
        listEl.innerHTML = "";
        return;
    }
    setStatus("");
    listEl.innerHTML = "";

    const groups = [];
    const map = new Map();

    snap.forEach(docSnap => {
        const data = docSnap.data();
        const images = normalizeImages(data);
        const createdAt = data.createdAt ? new Date(data.createdAt).toLocaleString() : "";
        const groupId = data.groupId || "legacy";
        const groupTitle = data.groupTitle || "منشورات سابقة";
        const groupIntro = data.groupIntro || "";

        if (!map.has(groupId)) {
            const group = { id: groupId, title: groupTitle, intro: groupIntro, createdAt: data.createdAt || 0, items: [] };
            map.set(groupId, group);
            groups.push(group);
        }
        const group = map.get(groupId);

        images.forEach(img => {
            group.items.push({
                docId: docSnap.id,
                title: data.title || "منشور بدون عنوان",
                caption: img.caption || "",
                image: img.url,
                createdAt
            });
        });
    });

    // ترتيب المجموعات حسب أحدث تاريخ
    groups.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    groups.forEach(group => {
        const section = document.createElement("div");
        section.className = "gallery-group";
        const introText = group.intro || "";
        const subTitle = group.title && group.title !== "منشور بدون عنوان" ? group.title : "";
        section.innerHTML = `
            <div class="group-hero">
                <h3 class="group-hero-title">معرض <span class="accent-word">الإنجازات</span></h3>
                ${subTitle || introText ? `<p class="group-hero-sub">${subTitle ? `<strong>${subTitle}</strong>` : ""}${subTitle && introText ? " — " : ""}${introText}</p>` : ""}
            </div>
            <div class="gallery-grid group-grid"></div>
        `;
        const grid = section.querySelector(".group-grid");

        group.items.forEach(item => {
            const adminControls = isAdmin ? `
                <div class="gallery-admin-actions">
                    <button data-action="edit" data-id="${item.docId}">تعديل</button>
                    <button class="danger" data-action="delete" data-id="${item.docId}">حذف</button>
                </div>
            ` : "";

            const card = document.createElement("div");
            card.className = "gallery-card";
            card.dataset.id = item.docId;
            card.innerHTML = `
                <div class="gallery-img" style="background-image: url('${item.image}');"></div>
                <div class="gallery-info">
                    <div class="gallery-meta-row">
                        <span class="gallery-meta">${item.createdAt}</span>
                    </div>
                    <h3>${item.title}</h3>
                    ${item.caption ? `<p class="gallery-desc">${item.caption}</p>` : ""}
                    ${adminControls}
                </div>
            `;
            grid.appendChild(card);
        });

        listEl.appendChild(section);
    });

    if (isAdmin) {
        listEl.querySelectorAll("button[data-action=\"delete\"]").forEach(btn => {
            btn.addEventListener("click", () => handleDelete(btn.dataset.id));
        });
        listEl.querySelectorAll("button[data-action=\"edit\"]").forEach(btn => {
            btn.addEventListener("click", () => handleEdit(btn.dataset.id));
        });
    }
}

function renderHero(data) {
    if (heroTitleEl && data.heading) {
        heroTitleEl.innerHTML = data.heading;
    }
    if (heroIntroEl && data.intro !== undefined) {
        heroIntroEl.textContent = data.intro || "";
    }
}

function subscribeHero() {
    const heroDoc = doc(db, "config", "gallery");
    onSnapshot(heroDoc, (snap) => {
        if (snap.exists()) renderHero(snap.data());
    });
}

async function handleDelete(id) {
    if (!confirm("تأكيد حذف هذا المنشور؟")) return;
    try {
        await deleteDoc(doc(db, "gallery", id));
    } catch (err) {
        console.error(err);
        setStatus("تعذر حذف المنشور");
    }
}

async function handleEdit(id) {
    if (!lastSnapshot) return;
    const snap = lastSnapshot.docs.find(d => d.id === id);
    if (!snap) return;
    const data = snap.data();
    const images = normalizeImages(data);
    const newTitle = prompt("تعديل عنوان المنشور", data.title || "منشور بدون عنوان");
    if (newTitle === null) return;

    const updatedImages = [];
    for (const [idx, img] of images.entries()) {
        const newCaption = prompt(`وصف الصورة رقم ${idx + 1}`, img.caption || "");
        updatedImages.push({
            url: img.url,
            caption: newCaption === null ? (img.caption || "") : newCaption
        });
    }

    try {
        await updateDoc(doc(db, "gallery", id), {
            title: newTitle.trim() || data.title || "منشور بدون عنوان",
            images: updatedImages
        });
        setStatus("تم تعديل المنشور");
    } catch (err) {
        console.error(err);
        setStatus("تعذر تعديل المنشور");
    }
}

function startFeed() {
    if (!listEl) return;
    setStatus("...جاري التحميل");
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    onSnapshot(q, renderSnapshot, (err) => {
        console.error(err);
        setStatus("تعذر تحميل المعرض.");
    });
    subscribeHero();
}

onAuthStateChanged(auth, (user) => {
    const fakeAdmin = localStorage.getItem("fakeAdmin") === "true";
    isAdmin = (!!user && (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() || user.uid === ADMIN_UID)) || fakeAdmin;
    if (lastSnapshot) renderSnapshot(lastSnapshot);
});

document.addEventListener("DOMContentLoaded", startFeed);
