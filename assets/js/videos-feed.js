import { db } from "./firebase-config.js";
import {
    collection,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const grid = document.querySelector(".videos-grid");
const statusEl = document.getElementById("videosStatus");
const VIDEO_EXT = /\.(mp4|webm|ogg)$/i;

function isFileVideo(url) {
    return VIDEO_EXT.test(url || "");
}

function setStatus(text) {
    if (statusEl) statusEl.textContent = text || "";
}

function buildThumb(data) {
    const wrapper = document.createElement("div");
    wrapper.className = "video-thumb";

    if (data.thumbnailUrl) {
        const img = document.createElement("img");
        img.src = data.thumbnailUrl;
        img.alt = data.title || "صورة الفيديو";
        wrapper.appendChild(img);
        return wrapper;
    }

    if (isFileVideo(data.videoUrl)) {
        const vid = document.createElement("video");
        vid.src = data.videoUrl;
        vid.muted = true;
        vid.loop = true;
        vid.autoplay = true;
        vid.playsInline = true;
        wrapper.appendChild(vid);
        return wrapper;
    }

    wrapper.classList.add("video-thumb-placeholder");
    wrapper.innerHTML = `<span>بدون صورة</span>`;
    return wrapper;
}

function buildCard(data, id) {
    const card = document.createElement("div");
    card.className = "video-card";
    card.dataset.videoSrc = data.videoUrl || "";
    card.dataset.videoType = isFileVideo(data.videoUrl) ? "file" : "embed";
    card.dataset.title = data.title || "";
    card.dataset.description = data.description || "";
    card.dataset.id = id;

    const thumb = buildThumb(data);
    const info = document.createElement("div");
    info.innerHTML = `
        <h3>${data.title || "فيديو بدون عنوان"}</h3>
        ${data.description ? `<p>${data.description}</p>` : ""}
    `;

    card.appendChild(thumb);
    card.appendChild(info);
    return card;
}

function renderVideos(snapshot) {
    if (!grid) return;
    grid.innerHTML = "";
    let hasVideos = false;

    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.published === false) return;
        hasVideos = true;
        grid.appendChild(buildCard(data, docSnap.id));
    });

    if (!hasVideos) {
        setStatus("لا توجد فيديوهات منشورة حالياً.");
    } else {
        setStatus("");
    }

    document.dispatchEvent(new CustomEvent("videos:rendered"));
}

function startVideosFeed() {
    if (!grid) return;
    setStatus("...جاري تحميل الفيديوهات");
    const q = query(collection(db, "videos"), orderBy("createdAt", "desc"));
    onSnapshot(q, renderVideos, (err) => {
        console.error(err);
        setStatus("تعذر تحميل الفيديوهات.");
    });
}

document.addEventListener("DOMContentLoaded", startVideosFeed);
