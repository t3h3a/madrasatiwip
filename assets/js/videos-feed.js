import { db, collection, query, orderBy, onSnapshot } from "./firebase-config.js";

const listEl = document.getElementById("videosList");
const statusEl = document.getElementById("videosStatus");

function setStatus(text) {
    if (statusEl) statusEl.textContent = text || "";
}

function createCard(data) {
    const card = document.createElement("div");
    card.className = "video-card";
    card.dataset.video = data.videoUrl || "";

    const thumb = document.createElement("div");
    thumb.className = "video-thumb";

    if (data.thumbnail) {
        const img = document.createElement("img");
        img.src = data.thumbnail;
        img.alt = data.title || "";
        thumb.appendChild(img);
    } else if (data.videoUrl) {
        const vid = document.createElement("video");
        vid.src = data.videoUrl;
        vid.muted = true;
        vid.loop = true;
        vid.playsInline = true;
        vid.autoplay = true;
        thumb.appendChild(vid);
    }

    const body = document.createElement("div");
    const h3 = document.createElement("h3");
    h3.textContent = data.title || "فيديو توعوي";
    body.appendChild(h3);

    if (data.description) {
        const p = document.createElement("p");
        p.textContent = data.description;
        body.appendChild(p);
    }

    card.appendChild(thumb);
    card.appendChild(body);
    return card;
}

function renderVideos(snapshot) {
    if (!listEl) return;
    listEl.innerHTML = "";
    if (snapshot.empty) {
        setStatus("لا توجد فيديوهات حالياً.");
        return;
    }
    setStatus("");
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const card = createCard({
            title: data.title,
            description: data.description,
            videoUrl: data.videoUrl,
            thumbnail: data.thumbnail
        });
        listEl.appendChild(card);
    });
    if (window.setupVideoCards) {
        window.setupVideoCards();
    }
}

function startVideosFeed() {
    if (!listEl) return;
    setStatus("...جاري تحميل الفيديوهات");
    const q = query(collection(db, "videos"), orderBy("createdAt", "desc"));
    onSnapshot(q, renderVideos, (err) => {
        console.error(err);
        setStatus("تعذر تحميل الفيديوهات.");
    });
}

document.addEventListener("DOMContentLoaded", startVideosFeed);
