import { auth, db, storage } from "./firebase-data.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
    addDoc,
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";

const ADMIN_UID = "aCx24n18eYczQo2DOM7B61iWPsv2";

const titleInput = document.getElementById("titleInput");
const photoInput = document.getElementById("photoInput");
const statusEl = document.getElementById("uploadStatus");
const listEl = document.getElementById("uploadsList");
const emptyEl = document.getElementById("emptyState");
const uidEl = document.getElementById("adminUid");

if (uidEl) uidEl.textContent = ADMIN_UID;

function setStatus(message, type = "info") {
    if (!statusEl) return;
    statusEl.textContent = message || "";
    statusEl.dataset.type = type;
}

async function handleUpload() {
    const file = photoInput?.files?.[0];
    const title = titleInput?.value?.trim();

    if (!file || !title) {
        setStatus("أدخل عنواناً واختر صورة للرفع.", "error");
        return;
    }

    try {
        setStatus("جاري الرفع...", "info");
        const storagePath = `gallery/${Date.now()}-${file.name}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        await addDoc(collection(db, "gallery"), {
            title,
            image: url,
            storagePath,
            createdAt: serverTimestamp()
        });

        setStatus("تم الرفع بنجاح!", "success");
        if (titleInput) titleInput.value = "";
        if (photoInput) photoInput.value = "";
    } catch (err) {
        console.error(err);
        setStatus("تعذر الرفع، حاول مجدداً.", "error");
    }
}

window.upload = handleUpload;

async function handleDelete(docId, storagePath) {
    if (!confirm("حذف هذا الإنجاز نهائياً؟")) return;
    try {
        await deleteDoc(doc(db, "gallery", docId));
        if (storagePath) {
            try {
                await deleteObject(ref(storage, storagePath));
            } catch (err) {
                console.warn("تعذر حذف ملف التخزين:", err);
            }
        }
        setStatus("تم الحذف.", "success");
    } catch (err) {
        console.error(err);
        setStatus("تعذر الحذف.", "error");
    }
}

function renderGallery(snapshot) {
    if (!listEl) return;
    listEl.innerHTML = "";
    const isEmpty = snapshot.empty;
    if (emptyEl) emptyEl.style.display = isEmpty ? "block" : "none";
    if (isEmpty) return;

    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const card = document.createElement("div");
        card.className = "gallery-card";

        const imgDiv = document.createElement("div");
        imgDiv.className = "gallery-img";
        imgDiv.style.backgroundImage = `url('${data.image || ""}')`;
        card.appendChild(imgDiv);

        const info = document.createElement("div");
        info.className = "gallery-info";
        info.innerHTML = `
            <h3>${data.title || "بدون عنوان"}</h3>
            <p>${data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : ""}</p>
        `;
        card.appendChild(info);

        const actions = document.createElement("div");
        actions.className = "admin-actions";
        const delBtn = document.createElement("button");
        delBtn.textContent = "حذف";
        delBtn.addEventListener("click", () => handleDelete(docSnap.id, data.storagePath));
        actions.appendChild(delBtn);
        card.appendChild(actions);

        listEl.appendChild(card);
    });
}

function startListening() {
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    return onSnapshot(q, renderGallery, (err) => {
        console.error(err);
        setStatus("تعذر جلب البيانات.", "error");
    });
}

let unsubscribe = null;

onAuthStateChanged(auth, (user) => {
    if (!user || user.uid !== ADMIN_UID) {
        window.location.href = "/";
        return;
    }
    document.body.classList.add("admin-ready");
    if (unsubscribe) unsubscribe();
    unsubscribe = startListening();
});
