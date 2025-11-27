const authInstance = window.auth || firebase.auth();
const dbInstance = window.db || firebase.firestore();
const storageInstance = window.storage || firebase.storage();

const ADMIN_EMAIL = "popoytydhdt@gmail.com";

const loginSection = document.getElementById("admin-login-section");
const panel = document.getElementById("admin-panel");
const statusEl = document.getElementById("adminStatus");
const postsStatusEl = document.getElementById("adminPostsStatus");
const postsList = document.getElementById("postsList");

let unsubscribePosts = null;
const captionsContainer = document.getElementById("captionsContainer");
const uploadInput = document.getElementById("uploadImage");

function setStatus(el, message, type = "info") {
    if (!el) return;
    el.textContent = message || "";
    el.dataset.type = type;
}

function renderCaptionFields(files) {
    if (!captionsContainer) return;
    captionsContainer.innerHTML = "";
    files.forEach((file, index) => {
        const item = document.createElement("div");
        item.className = "caption-item";
        item.innerHTML = `
            <label>
                صورة ${index + 1}: ${file.name}
                <input type="text" data-caption-index="${index}" placeholder="وصف الصورة ${index + 1}">
            </label>
        `;
        captionsContainer.appendChild(item);
    });
}

if (uploadInput) {
    uploadInput.addEventListener("change", (e) => {
        const files = Array.from(e.target.files || []);
        renderCaptionFields(files);
    });
}

async function adminLogin() {
    const email = document.getElementById("adminEmail")?.value?.trim();
    const password = document.getElementById("adminPassword")?.value || "";
    if (!email || !password) {
        setStatus(statusEl, "يجب إدخال البريد وكلمة المرور", "error");
        return;
    }
    try {
        setStatus(statusEl, "جاري تسجيل الدخول...");
        let cred = null;
        try {
            cred = await authInstance.signInWithEmailAndPassword(email, password);
        } catch (err) {
            // إذا لم يكن المستخدم موجوداً، ننشئه فقط إذا كان بريد الأدمن المسموح به
            if (err?.code === "auth/user-not-found" && email === ADMIN_EMAIL) {
                cred = await authInstance.createUserWithEmailAndPassword(email, password);
            } else {
                throw err;
            }
        }
        if (cred?.user?.email === ADMIN_EMAIL) setStatus(statusEl, "تم تسجيل الدخول كأدمن", "success");
        else {
            await authInstance.signOut();
            setStatus(statusEl, "هذا الحساب ليس أدمن!", "error");
        }
    } catch (err) {
        console.error(err);
        const msg = err?.code === "auth/user-not-found"
            ? "الحساب غير موجود في Firebase Auth"
            : err?.code === "auth/wrong-password"
                ? "كلمة المرور غير صحيحة"
                : "خطأ في تسجيل الدخول";
        setStatus(statusEl, msg, "error");
    }
}

async function uploadPost() {
    const files = Array.from(document.getElementById("uploadImage").files || []);

    if (!files.length) {
        alert("يجب اختيار صورة وكتابة عنوان");
        return;
    }

    try {
        // رفع الصورة إلى Cloudinary
        const uploadedURLs = [];
        const captions = files.map((_, idx) => {
            const input = document.querySelector(`[data-caption-index="${idx}"]`);
            const value = input?.value?.trim();
            return value || `صورة ${idx + 1}`;
        });

        for (const file of files) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", "madrasati_preset");
            formData.append("cloud_name", "dzrwjhqzu");

            const upload = await fetch("https://api.cloudinary.com/v1_1/dzrwjhqzu/image/upload", {
                method: "POST",
                body: formData
            });

            const data = await upload.json();
            if (!data.secure_url) {
                console.error(data);
                alert("خطأ أثناء رفع الصورة إلى Cloudinary");
                return;
            }
            uploadedURLs.push(data.secure_url);
        }

        const createdAt = Date.now();

        // حفظ كل صورة كبطاقة منفصلة مع الوصف الخاص بها
        for (let i = 0; i < uploadedURLs.length; i++) {
            await dbInstance.collection("gallery").add({
                title: captions[i],
                image: uploadedURLs[i],
                createdAt
            });
        }

        alert("تم النشر بنجاح!");

        document.getElementById("uploadImage").value = "";
        if (captionsContainer) captionsContainer.innerHTML = "";

    } catch (err) {
        console.error("Upload error:", err);
        alert("حدث خطأ أثناء نشر المنشور");
    }
}

async function deletePost(docId) {
    if (!confirm("حذف هذا المنشور؟")) return;
    try {
        await dbInstance.collection("gallery").doc(docId).delete();
        setStatus(postsStatusEl, "تم حذف المنشور", "success");
    } catch (err) {
        console.error(err);
        setStatus(postsStatusEl, "تعذر حذف المنشور", "error");
    }
}

function renderPosts(snapshot) {
    if (!postsList) return;
    postsList.innerHTML = "";
    if (snapshot.empty) {
        postsList.innerHTML = `<div class="empty-row">لا توجد منشورات بعد.</div>`;
        return;
    }
    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const created =
            data.createdAt?.toDate
                ? data.createdAt.toDate()
                : typeof data.createdAt === "number"
                    ? new Date(data.createdAt)
                    : null;
        const card = document.createElement("div");
        card.className = "post-row";
        card.innerHTML = `
            <div class="post-thumb" style="background-image:url('${data.image || ""}')"></div>
            <div class="post-info">
                <strong>${data.title || "بدون عنوان"}</strong>
                <span>${created ? created.toLocaleString() : ""}</span>
            </div>
            <button type="button" class="post-delete" data-id="${docSnap.id}">حذف</button>
        `;
        card.querySelector(".post-delete")?.addEventListener("click", () => deletePost(docSnap.id));
        postsList.appendChild(card);
    });
}

function subscribePosts() {
    if (unsubscribePosts) unsubscribePosts();
    unsubscribePosts = dbInstance
        .collection("gallery")
        .orderBy("createdAt", "desc")
        .onSnapshot(renderPosts, (err) => {
            console.error(err);
            setStatus(postsStatusEl, "تعذر تحميل المنشورات", "error");
        });
}

function logoutAdmin() {
    authInstance.signOut();
    const fileInput = document.getElementById("uploadImage");
    if (fileInput) fileInput.value = "";
    if (captionsContainer) captionsContainer.innerHTML = "";
    if (postsStatusEl) setStatus(postsStatusEl, "");
    if (statusEl) setStatus(statusEl, "");
}

authInstance.onAuthStateChanged((user) => {
    if (user && user.email === ADMIN_EMAIL) {
        if (panel) panel.style.display = "block";
        if (loginSection) loginSection.style.display = "none";
        subscribePosts();
    } else {
        if (panel) panel.style.display = "none";
        if (loginSection) loginSection.style.display = "block";
        if (unsubscribePosts) {
            unsubscribePosts();
            unsubscribePosts = null;
        }
        if (postsList) postsList.innerHTML = "";
    }
});

// expose for inline handlers
window.adminLogin = adminLogin;
window.uploadPost = uploadPost;
window.logoutAdmin = logoutAdmin;
window.deletePost = deletePost;
