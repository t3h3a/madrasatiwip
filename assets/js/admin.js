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
    getDoc,
    storage,
    ref,
    uploadBytes,
    getDownloadURL,
    uploadBytesResumable
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
const tabGalleryBtn = document.getElementById("adminTabGallery");
const tabVideosBtn = document.getElementById("adminTabVideos");
const gallerySection = document.getElementById("gallerySection");
const videosSection = document.getElementById("videosSection");
const videoTitleInput = document.getElementById("videoTitle");
const videoDescInput = document.getElementById("videoDesc");
const videoUrlInput = document.getElementById("videoUrl");
const videoFileInput = document.getElementById("videoFile");
const videoThumbInput = document.getElementById("videoThumb");
const addVideoBtn = document.getElementById("addVideoBtn");
const videoStatus = document.getElementById("videoStatus");
const adminVideosList = document.getElementById("adminVideos");
const SLOT_COUNT = 11;
let slotState = Array.from({ length: SLOT_COUNT }, () => ({ image: "", title: "", caption: "" }));
const FALLBACK_EMAIL = "btecmaad@gmail.com";
const FALLBACK_PASS = "123456789102008";
let unsubscribeVideos = null;
let isUploadingVideo = false;

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

async function uploadToStorageFile(file, folder = "uploads", onProgress = null) {
    const storageRef = ref(storage, `${folder}/${Date.now()}-${file.name}`);
    const task = uploadBytesResumable(storageRef, file);
    return new Promise((resolve, reject) => {
        task.on("state_changed", (snap) => {
            if (onProgress) {
                const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                onProgress(Math.min(100, Math.max(0, pct)));
            }
        }, reject, async () => {
            const url = await getDownloadURL(task.snapshot.ref);
            resolve(url);
        });
    });
}

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
    if (!videoStatus) return;
    videoStatus.textContent = text || "";
    videoStatus.className = isError ? "status error" : "status";
    if (text) videoStatus.classList.add("show");
}

function setVideoLoading(state) {
    isUploadingVideo = state;
    if (addVideoBtn) addVideoBtn.disabled = state;
    if (addVideoBtn) addVideoBtn.classList.toggle("is-loading", state);
}

function uploadVideoToCloudinary(file, onProgress = null) {
    return new Promise((resolve, reject) => {
        const form = new FormData();
        form.append("file", file);
        form.append("upload_preset", CLOUDINARY_VIDEO_PRESET);
        form.append("folder", CLOUDINARY_VIDEO_FOLDER);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", CLOUDINARY_VIDEO_URL);
        xhr.upload.onprogress = (e) => {
            if (onProgress && e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                onProgress(pct);
            }
        };
        xhr.onerror = () => reject(new Error("upload-error"));
        xhr.onload = () => {
            try {
                const json = JSON.parse(xhr.responseText || "{}");
                if (!json.secure_url) return reject(new Error("no-url"));
                resolve(json.secure_url);
            } catch (err) {
                reject(err);
            }
        };
        xhr.send(form);
    });
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
            <div class="slot-preview" data-slot-preview="${i}">
                <span class="slot-label">صورة ${i + 1}</span>
                <img alt="معاينة البطاقة ${i + 1}" />
            </div>
            <label>
                <span>اختيار الملف</span>
                <input type="file" accept="image/*" data-slot-file="${i}">
            </label>
            <label>
                <span>عنوان البطاقة</span>
                <input type="text" placeholder="عنوان البطاقة" data-slot-title="${i}">
            </label>
            <label>
                <span>وصف مختصر</span>
                <textarea rows="2" placeholder="وصف مختصر" data-slot-caption="${i}"></textarea>
            </label>
        `;
        slotGrid.appendChild(card);
    }
    attachSlotPreviewHandlers();
}

function attachSlotPreviewHandlers() {
    if (!slotGrid) return;
    slotGrid.querySelectorAll("[data-slot-file]").forEach(input => {
        input.addEventListener("change", (e) => {
            const idx = input.dataset.slotFile;
            const preview = slotGrid.querySelector(`[data-slot-preview="${idx}"]`);
            const imgEl = preview?.querySelector("img");
            if (!preview || !imgEl) return;

            const file = e.target.files?.[0];
            if (!file) {
                preview.classList.remove("has-image");
                imgEl.removeAttribute("src");
                slotState[idx] = { ...(slotState[idx] || {}), image: "" };
                return;
            }
            const reader = new FileReader();
            reader.onload = ev => {
                const src = ev.target?.result || "";
                imgEl.src = src;
                preview.classList.add("has-image");
                slotState[idx] = { ...(slotState[idx] || {}), image: src };
            };
            reader.readAsDataURL(file);
        });
    });
}

function hydrateSlotsForm() {
    if (!slotGrid) return;
    slotState.forEach((item, idx) => {
        const preview = slotGrid.querySelector(`[data-slot-preview="${idx}"]`);
        const title = slotGrid.querySelector(`[data-slot-title="${idx}"]`);
        const caption = slotGrid.querySelector(`[data-slot-caption="${idx}"]`);
        const imgEl = preview?.querySelector("img");
        if (preview && imgEl && item.image) {
            imgEl.src = item.image;
            preview.classList.add("has-image");
        }
        if (title) title.value = item.title || "";
        if (caption) caption.value = item.caption || "";
    });
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

async function addVideo() {
    if (isUploadingVideo) return;
    const title = videoTitleInput?.value?.trim() || "فيديو بدون عنوان";
    const desc = videoDescInput?.value?.trim() || "";
    let videoUrl = videoUrlInput?.value?.trim() || "";
    const videoFile = videoFileInput?.files?.[0];
    const thumbFile = videoThumbInput?.files?.[0];

    if (!videoUrl && !videoFile) {
        setVideoStatus("أضف رابط فيديو أو ارفع ملف فيديو", true);
        return;
    }

    setVideoLoading(true);
    setVideoStatus("...جاري رفع الفيديو");
    let progressTimer = null;
    let lastProgress = 0;
    const clearTimers = () => {
        if (progressTimer) {
            clearTimeout(progressTimer);
            progressTimer = null;
        }
    };

    try {
        if (videoFile) {
            const sizeMB = (videoFile.size / (1024 * 1024)).toFixed(1);
            setVideoStatus(`...جاري رفع الفيديو (~${sizeMB} MB)`);
            progressTimer = setTimeout(() => {
                if (lastProgress === 0) {
                    setVideoStatus("...ما زال الرفع جارٍ (قد يتأخر حسب حجم الملف/الإنترنت)");
                }
            }, 8000);
            videoUrl = await uploadVideoToCloudinary(videoFile, (pct) => {
                lastProgress = pct;
                setVideoStatus(`...جاري الرفع ${pct}%`);
            });
            clearTimers();
            setVideoStatus("تم الرفع، جاري الحفظ...");
        }
        let thumbnail = "";
        if (thumbFile) {
            thumbnail = await uploadToStorageFile(thumbFile, "video-thumbs", (pct) => {
                setVideoStatus(`...رفع الصورة ${pct}%`);
            });
        }

        await addDoc(collection(db, "videos"), {
            title,
            description: desc,
            videoUrl,
            thumbnail,
            createdAt: Date.now(),
            createdBy: auth.currentUser?.email || ""
        });

        if (videoTitleInput) videoTitleInput.value = "";
        if (videoDescInput) videoDescInput.value = "";
        if (videoUrlInput) videoUrlInput.value = "";
        if (videoFileInput) videoFileInput.value = "";
        if (videoThumbInput) videoThumbInput.value = "";
        setVideoStatus("تم نشر الفيديو");
        setVideoLoading(false);
    } catch (err) {
        console.error(err);
        clearTimers();
        setVideoStatus("تعذر نشر الفيديو", true);
        setVideoLoading(false);
    }
}

async function deleteVideo(id) {
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
    const newDesc = prompt("تعديل الوصف", data.description || "");
    if (newDesc === null) return;
    const newUrl = prompt("تعديل رابط الفيديو", data.videoUrl || "");
    if (newUrl === null || !newUrl.trim()) return;

    try {
        await updateDoc(doc(db, "videos", id), {
            title: newTitle.trim() || data.title || "فيديو بدون عنوان",
            description: newDesc.trim(),
            videoUrl: newUrl.trim()
        });
        setVideoStatus("تم تحديث الفيديو");
    } catch (err) {
        console.error(err);
        setVideoStatus("تعذر تعديل الفيديو", true);
    }
}

function renderVideos(snapshot) {
    if (!adminVideosList) return;
    adminVideosList.innerHTML = "";
    if (snapshot.empty) {
        adminVideosList.innerHTML = `<p class="muted">لا يوجد فيديوهات بعد.</p>`;
        return;
    }

    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const createdAt = data.createdAt ? new Date(data.createdAt).toLocaleString() : "";
        const card = document.createElement("article");
        card.className = "admin-post";
        card.innerHTML = `
            <div class="post-head">
                <div>
                    <p class="eyebrow">${createdAt}</p>
                    <h3>${data.title || "فيديو بدون عنوان"}</h3>
                    <p class="muted">${data.description || ""}</p>
                </div>
                <div class="admin-actions">
                    <button data-video-edit="${docSnap.id}">تعديل</button>
                    <button class="danger" data-video-delete="${docSnap.id}">حذف</button>
                </div>
            </div>
            <div class="post-body">
                <div class="video-preview">
                    <div class="video-thumb">
                        ${data.thumbnail ? `<img src="${data.thumbnail}" alt="${data.title || ""}">` : `<i class="fa-solid fa-circle-play" style="font-size:32px; color:#e5e7eb;"></i>`}
                    </div>
                    <div class="video-url">${data.videoUrl || ""}</div>
                </div>
            </div>
        `;
        adminVideosList.appendChild(card);
    });

    adminVideosList.querySelectorAll("[data-video-delete]").forEach(btn => {
        btn.addEventListener("click", () => deleteVideo(btn.dataset.videoDelete));
    });

    adminVideosList.querySelectorAll("[data-video-edit]").forEach(btn => {
        btn.addEventListener("click", () => {
            const snap = snapshot.docs.find(d => d.id === btn.dataset.videoEdit);
            if (snap) editVideo(btn.dataset.videoEdit, snap.data());
        });
    });
}

function subscribeVideos() {
    const q = query(collection(db, "videos"), orderBy("createdAt", "desc"));
    return onSnapshot(q, renderVideos, (err) => {
        console.error(err);
        setVideoStatus("تعذر جلب الفيديوهات", true);
    });
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
    if (loginCard) loginCard.style.display = isAdmin ? "none" : "grid";
    if (panelCard) panelCard.style.display = isAdmin ? "grid" : "none";
}

function switchAdminTab(target = "gallery") {
    const showGallery = target === "gallery";
    if (gallerySection) gallerySection.style.display = showGallery ? "grid" : "none";
    if (videosSection) videosSection.style.display = showGallery ? "none" : "grid";
    if (tabGalleryBtn) tabGalleryBtn.classList.toggle("active", showGallery);
    if (tabVideosBtn) tabVideosBtn.classList.toggle("active", !showGallery);
}

function wireAdminUI() {
    if (loginForm) loginForm.addEventListener("submit", adminLogin);
    if (logoutBtn) logoutBtn.addEventListener("click", logoutAdmin);
    if (uploadBtn) uploadBtn.addEventListener("click", uploadPost);
    if (fileInput) fileInput.addEventListener("change", renderSelectedFiles);
    if (saveHeroBtn) saveHeroBtn.addEventListener("click", saveHeroText);
    if (saveSlotsBtn) saveSlotsBtn.addEventListener("click", saveSlots);
    if (addVideoBtn) addVideoBtn.addEventListener("click", addVideo);
    if (tabGalleryBtn) tabGalleryBtn.addEventListener("click", () => switchAdminTab("gallery"));
    if (tabVideosBtn) tabVideosBtn.addEventListener("click", () => switchAdminTab("videos"));

    let unsubscribePosts = null;
    onAuthStateChanged(auth, (user) => {
        const fakeAdmin = localStorage.getItem("fakeAdmin") === "true";
        const ok = (!!user && (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() || user.uid === ADMIN_UID)) || fakeAdmin;
        togglePanel(ok);
        if (ok) {
            setStatus("");
            loadHeroText();
            buildSlotsForm();
            switchAdminTab("gallery");
            unsubscribePosts = unsubscribePosts || subscribePosts();
            unsubscribeVideos = unsubscribeVideos || subscribeVideos();
        } else {
            if (user && !ok) signOut(auth);
            if (unsubscribePosts) unsubscribePosts();
            if (unsubscribeVideos) unsubscribeVideos();
            unsubscribePosts = null;
            unsubscribeVideos = null;
            if (postsWrap) postsWrap.innerHTML = "";
            if (adminVideosList) adminVideosList.innerHTML = "";
        }
    });
}

document.addEventListener("DOMContentLoaded", wireAdminUI);

export { adminLogin, logoutAdmin, uploadPost, renderPosts, deletePost, subscribePosts };

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
