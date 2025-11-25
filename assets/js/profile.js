// بروفايل محلي بسيط (اسم + صورة + منشورات) مخزن في localStorage
const avatarDisplay = document.getElementById("avatarDisplay");
const avatarEdit = document.getElementById("avatarEdit");
const avatarInput = document.getElementById("avatarInput");
const nameDisplay = document.getElementById("profileNameDisplay");
const subtitleEl = document.getElementById("profileSubtitle");
const nameForm = document.getElementById("nameForm");
const nameInput = document.getElementById("nameInput");
const composerAvatar = document.getElementById("composerAvatar");
const postInput = document.getElementById("postInput");
const postImage = document.getElementById("postImage");
const publishBtn = document.getElementById("publishBtn");
const feedList = document.getElementById("feedList");

const STORAGE_KEY = "madrasati_profile_v1";
const POSTS_KEY = "madrasati_posts_v1";

const defaults = {
    name: "أحمد الطالب",
    subtitle: "تكنولوجيا المعلومات - الصف الحادي عشر",
    avatar: null
};

const samplePosts = [
    {
        author: "أحمد الطالب",
        time: "قبل 3 ساعات",
        text: "انتهيت من مشروع إنترنت الأشياء وربط الحساسات على لوحة ESP32. شاركت الفيديو في الصف وشكر خاص للأستاذ حسن على الدعم.",
        image: null
    },
    {
        author: "أحمد الطالب",
        time: "قبل يوم",
        text: "رفعنا تقرير تقييم BTEC وتم قبول المشروع الأولي.",
        image: null
    }
];

function readProfile() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { ...defaults };
    } catch {
        return { ...defaults };
    }
}

function saveProfile(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function readPosts() {
    try {
        const stored = JSON.parse(localStorage.getItem(POSTS_KEY));
        return Array.isArray(stored) && stored.length ? stored : [...samplePosts];
    } catch {
        return [...samplePosts];
    }
}

function savePosts(posts) {
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

function renderProfile() {
    const profile = readProfile();
    if (nameDisplay) nameDisplay.textContent = profile.name;
    if (composerAvatar) composerAvatar.textContent = profile.name.charAt(0).toUpperCase();
    if (avatarDisplay) {
        if (profile.avatar) {
            avatarDisplay.style.backgroundImage = `url(${profile.avatar})`;
            avatarDisplay.style.backgroundSize = "cover";
            avatarDisplay.style.backgroundPosition = "center";
            avatarDisplay.textContent = "";
        } else {
            avatarDisplay.style.backgroundImage = "";
            avatarDisplay.textContent = profile.name.charAt(0).toUpperCase();
        }
    }
    return profile;
}

function renderPosts() {
    if (!feedList) return;
    const posts = readPosts();
    feedList.innerHTML = posts.map((p, idx) => `
        <article class="card feed-card" data-idx="${idx}">
            <div class="feed-head">
                <div class="feed-user">
                    <div class="feed-avatar">${p.author.charAt(0).toUpperCase()}</div>
                    <div>
                        <h4>${p.author}</h4>
                        <span>${p.time}</span>
                    </div>
                </div>
                <button class="icon-btn remove-btn" data-idx="${idx}" title="حذف"><i class="fa-solid fa-trash"></i></button>
            </div>
            <p class="feed-text">${p.text || ""}</p>
            ${p.image ? `<img src="${p.image}" alt="post image">` : ""}
            <div class="feed-actions">
                <button><i class="fa-regular fa-thumbs-up"></i> إعجاب</button>
                <button><i class="fa-regular fa-comment"></i> تعليق</button>
                <button><i class="fa-solid fa-share"></i> مشاركة</button>
            </div>
        </article>
    `).join("");

    feedList.querySelectorAll(".remove-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = parseInt(btn.dataset.idx, 10);
            const updated = readPosts().filter((_, i) => i !== idx);
            savePosts(updated);
            renderPosts();
        });
    });
}

function handleAvatarChange(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        const profile = readProfile();
        profile.avatar = reader.result;
        saveProfile(profile);
        renderProfile();
    };
    reader.readAsDataURL(file);
}

if (avatarEdit && avatarInput) {
    avatarEdit.addEventListener("click", () => avatarInput.click());
    avatarInput.addEventListener("change", () => {
        const file = avatarInput.files?.[0];
        handleAvatarChange(file);
        avatarInput.value = "";
    });
}

if (nameForm && nameInput) {
    nameForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const profile = readProfile();
        const newName = nameInput.value.trim();
        if (newName) {
            profile.name = newName;
            saveProfile(profile);
            nameInput.value = "";
            renderProfile();
            renderPosts(); // لتحديث الأحرف الأولى للمنشورات الجديدة
        }
    });
}

if (publishBtn && postInput) {
    publishBtn.addEventListener("click", async () => {
        const text = postInput.value.trim();
        const imgFile = postImage?.files?.[0];
        if (!text && !imgFile) return;

        const profile = readProfile();
        const newPost = {
            author: profile.name,
            time: "الآن",
            text,
            image: null
        };

        if (imgFile) {
            const reader = new FileReader();
            reader.onload = () => {
                newPost.image = reader.result;
                const posts = [newPost, ...readPosts()];
                savePosts(posts);
                renderPosts();
            };
            reader.readAsDataURL(imgFile);
        } else {
            const posts = [newPost, ...readPosts()];
            savePosts(posts);
            renderPosts();
        }

        postInput.value = "";
        if (postImage) postImage.value = "";
    });
}

// تحميل الحالة الأولية
renderProfile();
renderPosts();
