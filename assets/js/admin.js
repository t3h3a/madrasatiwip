import {
    auth,
    db,
    ADMIN_EMAIL,
    ADMIN_UID,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    collection,
    addDoc,
    deleteDoc,
    doc,
    orderBy,
    query,
    onSnapshot,
    updateDoc,
    setDoc,
    getDoc
} from "./firebase-config.js";

const loginForm = document.getElementById("adminLoginForm");
const emailInput = document.getElementById("adminEmail");
const passInput = document.getElementById("adminPassword");
const logoutBtn = document.getElementById("adminLogout");
const uploadBtn = document.getElementById("addPostBtn");
const titleInput = document.getElementById("postTitle");
const fileInput = document.getElementById("postImage");
const selectedList = document.getElementById("selectedImages");
const postsWrap = document.getElementById("adminPosts");
const loginCard = document.getElementById("adminLoginCard");
const panelCard = document.getElementById("adminPanelCard");
const statusEl = document.getElementById("adminStatus");
const headingInput = document.getElementById("galleryHeading");
const introInput = document.getElementById("galleryIntro");
const saveHeroBtn = document.getElementById("saveHeroBtn");
const postGroupTitleInput = document.getElementById("postGroupTitle");
const postGroupIntroInput = document.getElementById("postGroupIntro");
const slotGrid = document.getElementById("slotGrid");
const saveSlotsBtn = document.getElementById("saveSlotsBtn");
const slotsStatus = document.getElementById("slotsStatus");
const slotGroupTitleInput = document.getElementById("slotGroupTitle");
const slotGroupIntroInput = document.getElementById("slotGroupIntro");
const tabButtons = document.querySelectorAll("[data-admin-tab]");
const tabPanels = document.querySelectorAll(".tab-panel");
const videoTitleInput = document.getElementById("videoTitle");
const videoDescriptionInput = document.getElementById("videoDescription");
const videoUrlInput = document.getElementById("videoUrl");
const videoFileInput = document.getElementById("videoFile");
const videoThumbInput = document.getElementById("videoThumb");
const videoPublishSelect = document.getElementById("videoPublish");
const saveVideoBtn = document.getElementById("saveVideoBtn");
const videoStatusEl = document.getElementById("videoStatus");
const adminVideosWrap = document.getElementById("adminVideos");
const SLOT_COUNT = 11;
let slotState = Array.from({ length: SLOT_COUNT }, () => ({ image: "", title: "", caption: "" }));
let unsubscribeGallery = null;
let unsubscribeVideos = null;
const FALLBACK_EMAIL = "btecmaad@gmail.com";
const FALLBACK_PASS = "123456789102008";

function clearLoginInputs() {
    if (emailInput) emailInput.value = "";
    if (passInput) passInput.value = "";
}

// Cloudinary preset as configured in the provided screenshot
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dzrwjhqzu/image/upload";
const CLOUDINARY_PRESET = "gallery_app";
const CLOUDINARY_FOLDER = "app_gallery";
const CLOUDINARY_VIDEO_URL = "https://api.cloudinary.com/v1_1/dzrwjhqzu/video/upload";
const CLOUDINARY_VIDEO_PRESET = "app_videos";
const CLOUDINARY_VIDEO_FOLDER = "app_videos";

function setStatus(text, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = text || "";
    statusEl.className = isError ? "status error" : "status";
    if (text) statusEl.classList.add("show");
}

function setSlotsStatus(text, isError = false) {
    if (!slotsStatus) return;
    slotsStatus.textContent = text || "";
    slotsStatus.className = isError ? "status error" : "status";
    if (text) slotsStatus.classList.add("show");
}

function setVideoStatus(text, isError = false) {
    if (!videoStatusEl) return;
    videoStatusEl.textContent = text || "";
    videoStatusEl.className = isError ? "status error" : "status";
    if (text) videoStatusEl.classList.add("show");
}

async function adminLogin(e) {
    e?.preventDefault();
    const email = emailInput?.value?.trim();
    const pass = passInput?.value || "";
    if (!email || !pass) {
        setStatus("أدخل البريد وكلمة المرور", true);
        return;
    }
    try {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        const userEmail = cred?.user?.email || "";
        const isAdminUser = (userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) || (cred?.user?.uid === ADMIN_UID);
        if (!isAdminUser) {
            await signOut(auth);
            setStatus("هذا الحساب ليس مخولاً كأدمن", true);
        }
    } catch (err) {
        if (err?.code === "auth/user-not-found" && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            try {
                await createUserWithEmailAndPassword(auth, email, pass);
                setStatus("تم إنشاء حساب الأدمن، أعد المحاولة");
                return;
            } catch (createErr) {
                console.error(createErr);
                setStatus("تعذر إنشاء حساب الأدمن", true);
                return;
            }
        }
        // fallback محلي إذا فشل Firebase والبيانات مطابقة
        if (email.toLowerCase() === FALLBACK_EMAIL.toLowerCase() && pass === FALLBACK_PASS) {
            localStorage.setItem("fakeAdmin", "true");
            togglePanel(true);
            setStatus("");
            return;
        }
        console.error(err);
        setStatus(err?.message || "تعذر تسجيل الدخول", true);
    }
}

async function logoutAdmin() {
    try {
        await signOut(auth);
        clearFormState();
        clearLoginInputs();
        setStatus("تم تسجيل الخروج");
    } catch (err) {
        console.error(err);
        setStatus("تعذر تسجيل الخروج", true);
    }
    localStorage.removeItem("fakeAdmin");
}

async function uploadPost() {
    const title = titleInput?.value?.trim() || "";
    const groupTitle = postGroupTitleInput?.value?.trim() || title || "معرض جديد";
    const groupIntro = postGroupIntroInput?.value?.trim() || "";
    const files = fileInput?.files ? Array.from(fileInput.files) : [];
    if (!files.length) {
        setStatus("اختر صورة واحدة على الأقل", true);
        return;
    }
    if (!groupTitle) {
        setStatus("أدخل عنوان المعرض", true);
        return;
    }
    const captions = Array.from(document.querySelectorAll(".image-caption")).map(input => input.value.trim());
    setStatus("...جاري الرفع");
    try {
        const uploadedImages = [];
        for (const [idx, file] of files.entries()) {
            const imageUrl = await uploadToCloudinary(file);
            uploadedImages.push({
                url: imageUrl,
                caption: captions[idx] || ""
            });
        }
        const groupId = `post-${Date.now()}`;

        await addDoc(collection(db, "gallery"), {
            title: title || "منشور بدون عنوان",
            images: uploadedImages,
            createdAt: Date.now(),
            createdBy: auth.currentUser?.email || "",
            groupId,
            groupTitle,
            groupIntro
        });

        clearFormState();
        if (postGroupTitleInput) postGroupTitleInput.value = "";
        if (postGroupIntroInput) postGroupIntroInput.value = "";
        setStatus("تمت إضافة المنشور مع الصور");
    } catch (err) {
        console.error(err);
        setStatus("تعذر رفع المنشور", true);
    }
}

async function saveHeroText() {
    const heading = headingInput?.value?.trim() || "معرض الإنجازات";
    const intro = introInput?.value?.trim() || "";
    setStatus("...حفظ العنوان والوصف");
    try {
        await setDoc(doc(db, "config", "gallery"), { heading, intro }, { merge: true });
        setStatus("تم حفظ العنوان/الوصف");
    } catch (err) {
        console.error(err);
        setStatus("تعذر حفظ العنوان/الوصف", true);
    }
}

async function loadHeroText() {
    try {
        const snap = await getDoc(doc(db, "config", "gallery"));
        if (snap.exists()) {
            const data = snap.data();
            if (headingInput && data.heading) headingInput.value = data.heading;
            if (introInput && data.intro) introInput.value = data.intro;
        }
    } catch (err) {
        console.error(err);
    }
}

function buildSlotsForm() {
    if (!slotGrid) return;
    slotGrid.innerHTML = "";
    for (let i = 0; i < SLOT_COUNT; i++) {
        const card = document.createElement("div");
        card.className = "slot-card";
        card.innerHTML = `
            <div class="slot-preview" data-slot-preview="${i}">صورة ${i + 1}</div>
            <input type="file" accept="image/*" data-slot-file="${i}">
            <input type="text" placeholder="عنوان البطاقة" data-slot-title="${i}">
            <textarea rows="2" placeholder="وصف مختصر" data-slot-caption="${i}"></textarea>
        `;
        slotGrid.appendChild(card);
    }
}

function hydrateSlotsForm() {
    if (!slotGrid) return;
    slotState.forEach((item, idx) => {
        const preview = slotGrid.querySelector(`[data-slot-preview="${idx}"]`);
        const title = slotGrid.querySelector(`[data-slot-title="${idx}"]`);
        const caption = slotGrid.querySelector(`[data-slot-caption="${idx}"]`);
        if (preview && item.image) {
            preview.style.backgroundImage = `url('${item.image}')`;
            preview.textContent = "";
        }
        if (title) title.value = item.title || "";
        if (caption) caption.value = item.caption || "";
    });
}

// تحديث الحالة والواجهة عند تغيّر أي حقل في بطاقات النشر السريع
function handleSlotInputChange(e) {
    if (!slotGrid) return;
    const target = e.target;

    // تغيير صورة البطاقة
    if (target.matches("[data-slot-file]")) {
        const idx = Number(target.dataset.slotFile);
        const file = target.files?.[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            slotState[idx] = { ...slotState[idx], image: previewUrl };
            const previewEl = slotGrid.querySelector(`[data-slot-preview="${idx}"]`);
            if (previewEl) {
                previewEl.style.backgroundImage = `url('${previewUrl}')`;
                previewEl.textContent = "";
            }
        }
        return;
    }

    // عنوان البطاقة
    if (target.matches("[data-slot-title]")) {
        const idx = Number(target.dataset.slotTitle);
        slotState[idx] = { ...slotState[idx], title: target.value };
        return;
    }

    // وصف البطاقة
    if (target.matches("[data-slot-caption]")) {
        const idx = Number(target.dataset.slotCaption);
        slotState[idx] = { ...slotState[idx], caption: target.value };
        return;
    }
}

async function saveSlots() {
    if (!slotGrid) return;
    setSlotsStatus("...جاري النشر");
    try {
        const groupId = `batch-${Date.now()}`;
        const groupTitle = slotGroupTitleInput?.value?.trim() || "معرض جديد";
        const groupIntro = slotGroupIntroInput?.value?.trim() || "";

        for (let i = 0; i < SLOT_COUNT; i++) {
            const titleEl = slotGrid.querySelector(`[data-slot-title="${i}"]`);
            const captionEl = slotGrid.querySelector(`[data-slot-caption="${i}"]`);
            const fileEl = slotGrid.querySelector(`[data-slot-file="${i}"]`);

            let imageUrl = slotState[i]?.image || "";
            if (fileEl?.files?.length) {
                imageUrl = await uploadToCloudinary(fileEl.files[0]);
            }

            const title = titleEl?.value?.trim() || "";
            const caption = captionEl?.value?.trim() || "";

            if (!imageUrl) continue; // تخطى البطاقة الفارغة

            await addDoc(collection(db, "gallery"), {
                title: title || "منشور بدون عنوان",
                images: [{ url: imageUrl, caption }],
                createdAt: Date.now(),
                createdBy: auth.currentUser?.email || "",
                groupId,
                groupTitle,
                groupIntro
            });
        }

        // بعد النشر، صَفّر الحقول والملفات
        slotState = Array.from({ length: SLOT_COUNT }, () => ({ image: "", title: "", caption: "" }));
        buildSlotsForm();
        if (slotGroupTitleInput) slotGroupTitleInput.value = "";
        if (slotGroupIntroInput) slotGroupIntroInput.value = "";
        setSlotsStatus("تم نشر البطاقات");
    } catch (err) {
        console.error(err);
        setSlotsStatus("تعذر حفظ البطاقات", true);
    }
}

async function deletePost(id) {
    try {
        await deleteDoc(doc(db, "gallery", id));
    } catch (err) {
        console.error(err);
        setStatus("تعذر حذف المنشور", true);
    }
}

async function editPost(id, data) {
    const currentTitle = data.title || "منشور بدون عنوان";
    const newTitle = prompt("تعديل عنوان المنشور", currentTitle);
    if (newTitle === null) return;

    const imagesArray = Array.isArray(data.images)
        ? data.images
        : (data.image ? [{ url: data.image, caption: data.caption || "" }] : []);

    const updatedImages = [];
    for (const [idx, img] of imagesArray.entries()) {
        const newCaption = prompt(`وصف الصورة رقم ${idx + 1}`, img.caption || "");
        updatedImages.push({
            url: img.url || img,
            caption: newCaption === null ? (img.caption || "") : newCaption
        });
    }

    try {
        await updateDoc(doc(db, "gallery", id), {
            title: newTitle.trim() || currentTitle,
            images: updatedImages
        });
        setStatus("تم تحديث المنشور");
    } catch (err) {
        console.error(err);
        setStatus("تعذر تعديل المنشور", true);
    }
}

async function uploadVideoToCloudinary(file) {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", CLOUDINARY_VIDEO_PRESET);
    form.append("folder", CLOUDINARY_VIDEO_FOLDER);
    const res = await fetch(CLOUDINARY_VIDEO_URL, { method: "POST", body: form });
    if (!res.ok) throw new Error("video-upload-failed");
    const json = await res.json();
    if (!json.secure_url) throw new Error("no-video-url");
    return json.secure_url;
}

function clearVideoForm() {
    if (videoTitleInput) videoTitleInput.value = "";
    if (videoDescriptionInput) videoDescriptionInput.value = "";
    if (videoUrlInput) videoUrlInput.value = "";
    if (videoFileInput) videoFileInput.value = "";
    if (videoThumbInput) videoThumbInput.value = "";
    if (videoPublishSelect) videoPublishSelect.value = "published";
}

async function saveVideo() {
    const title = videoTitleInput?.value?.trim() || "";
    const description = videoDescriptionInput?.value?.trim() || "";
    const link = videoUrlInput?.value?.trim() || "";
    const videoFile = videoFileInput?.files?.[0];
    const thumbFile = videoThumbInput?.files?.[0];
    const published = (videoPublishSelect?.value || "published") === "published";

    if (!title) {
        setVideoStatus("أدخل عنوان الفيديو", true);
        return;
    }
    if (!link && !videoFile) {
        setVideoStatus("أضف رابطاً أو ارفع ملف فيديو", true);
        return;
    }

    setVideoStatus("...جاري حفظ الفيديو");
    try {
        let finalVideoUrl = link;
        let source = "link";
        if (videoFile) {
            finalVideoUrl = await uploadVideoToCloudinary(videoFile);
            source = "upload";
        }
        let thumbUrl = "";
        if (thumbFile) {
            thumbUrl = await uploadToCloudinary(thumbFile);
        }

        await addDoc(collection(db, "videos"), {
            title,
            description,
            videoUrl: finalVideoUrl,
            thumbnailUrl: thumbUrl,
            published,
            source,
            createdAt: Date.now(),
            createdBy: auth.currentUser?.email || ""
        });

        clearVideoForm();
        setVideoStatus("تم حفظ الفيديو");
    } catch (err) {
        console.error(err);
        setVideoStatus("تعذر حفظ الفيديو", true);
    }
}

async function deleteVideo(id) {
    if (!confirm("تأكيد حذف هذا الفيديو؟")) return;
    try {
        await deleteDoc(doc(db, "videos", id));
    } catch (err) {
        console.error(err);
        setVideoStatus("تعذر حذف الفيديو", true);
    }
}

async function editVideo(id, data) {
    const newTitle = prompt("تعديل عنوان الفيديو", data.title || "فيديو بدون عنوان");
    if (newTitle === null) return;

    const newDescription = prompt("وصف الفيديو", data.description || "");
    if (newDescription === null) return;

    const newUrl = prompt("رابط الفيديو (اتركه كما هو للملف المرفوع)", data.videoUrl || "");
    if (newUrl === null) return;

    const publishInput = prompt("حالة النشر (منشور/مسودة)", data.published === false ? "مسودة" : "منشور");
    const published = (publishInput?.trim()?.toLowerCase() || "منشور") !== "مسودة";

    try {
        await updateDoc(doc(db, "videos", id), {
            title: newTitle.trim() || data.title || "فيديو بدون عنوان",
            description: newDescription.trim(),
            videoUrl: newUrl.trim() || data.videoUrl,
            published
        });
        setVideoStatus("تم تحديث الفيديو");
    } catch (err) {
        console.error(err);
        setVideoStatus("تعذر تعديل الفيديو", true);
    }
}

function renderAdminVideos(snapshot) {
    if (!adminVideosWrap) return;
    adminVideosWrap.innerHTML = "";
    if (snapshot.empty) {
        const empty = document.createElement("p");
        empty.className = "eyebrow";
        empty.textContent = "لا يوجد فيديوهات بعد.";
        adminVideosWrap.appendChild(empty);
        return;
    }

    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const createdAt = data.createdAt ? new Date(data.createdAt).toLocaleString() : "";
        const published = data.published !== false;
        const card = document.createElement("article");
        card.className = "video-admin-card";
        card.innerHTML = `
            <div class="video-admin-head">
                <div>
                    <p class="eyebrow">${createdAt}</p>
                    <h3>${data.title || "فيديو بدون عنوان"}</h3>
                    <div class="video-admin-meta">
                        <span class="pill ${published ? "published" : "draft"}">${published ? "منشور" : "مسودة"}</span>
                        <span class="pill">${data.source === "upload" ? "ملف مرفوع" : "رابط خارجي"}</span>
                    </div>
                </div>
                <div class="admin-actions">
                    <button data-action="edit-video" data-id="${docSnap.id}">تعديل</button>
                    <button class="danger" data-action="delete-video" data-id="${docSnap.id}">حذف</button>
                </div>
            </div>
            ${data.description ? `<p>${data.description}</p>` : ""}
            ${data.videoUrl ? `<p class="eyebrow" style="word-break: break-all;">${data.videoUrl}</p>` : ""}
        `;
        adminVideosWrap.appendChild(card);
    });

    adminVideosWrap.querySelectorAll("button[data-action=\"delete-video\"]").forEach(btn => {
        btn.addEventListener("click", () => deleteVideo(btn.dataset.id));
    });
    adminVideosWrap.querySelectorAll("button[data-action=\"edit-video\"]").forEach(btn => {
        btn.addEventListener("click", () => {
            const snap = snapshot.docs.find(d => d.id === btn.dataset.id);
            if (snap) editVideo(btn.dataset.id, snap.data());
        });
    });
}

function renderPosts(snapshot) {
    if (!postsWrap) return;
    postsWrap.innerHTML = "";
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const createdAt = data.createdAt ? new Date(data.createdAt).toLocaleString() : "";
        const images = Array.isArray(data.images)
            ? data.images
            : (data.image ? [{ url: data.image, caption: data.caption || "" }] : []);
        const card = document.createElement("article");
        card.className = "admin-post";
        card.innerHTML = `
            <div class="post-head">
                <div>
                    <p class="eyebrow">${createdAt}</p>
                    <h3>${data.title || "منشور بدون عنوان"}</h3>
                </div>
                <div class="admin-actions">
                    <button data-action="edit" data-id="${docSnap.id}">تعديل</button>
                    <button class="danger" data-action="delete" data-id="${docSnap.id}">حذف</button>
                </div>
            </div>
            <div class="post-body">
                ${images.length ? `
                    <div class="post-gallery">
                        ${images.map(img => `
                            <figure>
                                <img src="${img.url || img}" alt="${data.title || ""}">
                                <figcaption>${img.caption || ""}</figcaption>
                            </figure>
                        `).join("")}
                    </div>
                ` : ""}
            </div>
        `;
        postsWrap.appendChild(card);
    });

    postsWrap.querySelectorAll("button[data-action=\"delete\"]").forEach(btn => {
        btn.addEventListener("click", () => deletePost(btn.dataset.id));
    });

    postsWrap.querySelectorAll("button[data-action=\"edit\"]").forEach(btn => {
        btn.addEventListener("click", () => {
            const snap = snapshot.docs.find(d => d.id === btn.dataset.id);
            if (snap) editPost(btn.dataset.id, snap.data());
        });
    });
}

function subscribePosts() {
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    return onSnapshot(q, renderPosts, (err) => {
        console.error(err);
        setStatus("تعذر جلب المنشورات", true);
    });
}

function subscribeAdminVideos() {
    const q = query(collection(db, "videos"), orderBy("createdAt", "desc"));
    return onSnapshot(q, renderAdminVideos, (err) => {
        console.error(err);
        setVideoStatus("تعذر جلب الفيديوهات", true);
    });
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

function clearFormState() {
    if (titleInput) titleInput.value = "";
    if (fileInput) fileInput.value = "";
    if (selectedList) selectedList.innerHTML = "";
}

function togglePanel(isAdmin) {
    if (panelCard) panelCard.style.display = isAdmin ? "grid" : "none";
}

function activateTab(tabId) {
    if (!tabId) return;
    tabButtons.forEach(btn => {
        btn.classList.toggle("active", btn.dataset.adminTab === tabId);
    });
    tabPanels.forEach(panel => {
        panel.classList.toggle("active", panel.id === tabId);
    });
    localStorage.setItem("adminTab", tabId);
}

function initTabs() {
    if (!tabButtons.length || !tabPanels.length) return;
    const saved = localStorage.getItem("adminTab");
    const defaultTab = (saved && document.getElementById(saved)) ? saved : "galleryTab";
    activateTab(defaultTab);
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => activateTab(btn.dataset.adminTab));
    });
}

function wireAdminUI() {
    if (loginForm) loginForm.addEventListener("submit", adminLogin);
    if (logoutBtn) logoutBtn.addEventListener("click", logoutAdmin);
    if (uploadBtn) uploadBtn.addEventListener("click", uploadPost);
    if (fileInput) fileInput.addEventListener("change", renderSelectedFiles);
    if (saveHeroBtn) saveHeroBtn.addEventListener("click", saveHeroText);
    if (saveSlotsBtn) saveSlotsBtn.addEventListener("click", saveSlots);
    if (slotGrid) {
        slotGrid.addEventListener("change", handleSlotInputChange);
        slotGrid.addEventListener("input", handleSlotInputChange);
    }
    if (saveVideoBtn) saveVideoBtn.addEventListener("click", saveVideo);
    initTabs();

    onAuthStateChanged(auth, (user) => {
        const fakeAdmin = localStorage.getItem("fakeAdmin") === "true";
        const ok = (!!user && (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() || user.uid === ADMIN_UID)) || fakeAdmin;
        togglePanel(ok);
        if (ok) {
            setStatus("");
            loadHeroText();
            buildSlotsForm();
            hydrateSlotsForm();
            unsubscribeGallery = unsubscribeGallery || subscribePosts();
            unsubscribeVideos = unsubscribeVideos || subscribeAdminVideos();
        } else {
            if (user && !ok) signOut(auth);
            localStorage.removeItem("fakeAdmin");
            if (unsubscribeGallery) unsubscribeGallery();
            if (unsubscribeVideos) unsubscribeVideos();
            unsubscribeGallery = null;
            unsubscribeVideos = null;
            if (postsWrap) postsWrap.innerHTML = "";
            if (adminVideosWrap) adminVideosWrap.innerHTML = "";
            setStatus("الرجاء تسجيل الدخول من صفحة الأدمن", true);
            setTimeout(() => window.location.href = "admin-login.html", 800);
        }
    });
}

document.addEventListener("DOMContentLoaded", wireAdminUI);

export {
    adminLogin,
    logoutAdmin,
    uploadPost,
    renderPosts,
    deletePost,
    subscribePosts,
    saveVideo,
    subscribeAdminVideos,
    deleteVideo
};

async function uploadToCloudinary(file) {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", CLOUDINARY_PRESET);
    form.append("folder", CLOUDINARY_FOLDER);
    const res = await fetch(CLOUDINARY_URL, { method: "POST", body: form });
    if (!res.ok) throw new Error("upload-failed");
    const json = await res.json();
    if (!json.secure_url) throw new Error("no-url");
    return json.secure_url;
}
