document.addEventListener("DOMContentLoaded", () => {
    const grid = document.querySelector(".videos-grid");
    const popup = document.getElementById("videoPopup");
    const popupVideo = document.getElementById("popupVideo");
    const popupEmbed = document.getElementById("popupEmbed");
    const closePopup = document.getElementById("closePopup");
    const btnRewind10 = document.getElementById("rewind10");
    const btnForward10 = document.getElementById("forward10");
    const btnPlayPause = document.getElementById("playPause");
    const controls = document.querySelector(".video-controls");

    const VIDEO_EXT = /\.(mp4|webm|ogg)$/i;
    let currentMode = "file"; // file | embed

    function isFileVideo(url) {
        return VIDEO_EXT.test(url || "");
    }

    function toEmbedUrl(url) {
        const yt = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/i);
        if (yt && yt[1]) {
            return `https://www.youtube.com/embed/${yt[1]}?rel=0&autoplay=1`;
        }
        return url;
    }

    function setPlayIcon(mode) {
        if (!btnPlayPause) return;
        const icon = btnPlayPause.querySelector("i");
        if (!icon) return;
        if (mode === "pause") {
            icon.classList.remove("fa-play");
            icon.classList.add("fa-pause");
        } else {
            icon.classList.remove("fa-pause");
            icon.classList.add("fa-play");
        }
    }

    function enableThumbAutoplay() {
        if (!grid) return;
        grid.querySelectorAll(".video-thumb video").forEach(vid => {
            vid.muted = true;
            vid.loop = true;
            vid.playsInline = true;
            vid.play().catch(() => {});
        });
    }

    function openVideoPopup(src, mode) {
        if (!popup) return;
        currentMode = mode;
        document.body.style.overflow = "hidden";
        popup.classList.add("active");

        if (mode === "file") {
            if (popupEmbed) {
                popupEmbed.innerHTML = "";
                popupEmbed.hidden = true;
            }
            if (controls) controls.style.display = "";
            if (popupVideo) {
                popupVideo.hidden = false;
                popupVideo.pause();
                popupVideo.removeAttribute("src");
                popupVideo.load();
                popupVideo.src = src;
                popupVideo.currentTime = 0;
                popupVideo.muted = false;
                popupVideo.loop = false;
                popupVideo.load();
                popupVideo.addEventListener("loadeddata", function playVideo() {
                    popupVideo.play().then(() => setPlayIcon("pause")).catch(() => setPlayIcon("play"));
                    popupVideo.removeEventListener("loadeddata", playVideo);
                }, { once: true });
            }
        } else {
            if (popupVideo) {
                popupVideo.pause();
                popupVideo.hidden = true;
                popupVideo.removeAttribute("src");
                popupVideo.load();
            }
            if (controls) controls.style.display = "none";
            if (popupEmbed) {
                popupEmbed.hidden = false;
                popupEmbed.innerHTML = `<iframe src="${toEmbedUrl(src)}" allowfullscreen allow="autoplay; encrypted-media"></iframe>`;
            }
        }
    }

    function closeVideoPopup() {
        if (!popup) return;
        if (currentMode === "file" && popupVideo) {
            popupVideo.pause();
            popupVideo.currentTime = 0;
            popupVideo.removeAttribute("src");
            popupVideo.load();
        }
        if (currentMode === "embed" && popupEmbed) {
            popupEmbed.innerHTML = "";
            popupEmbed.hidden = true;
        }
        if (controls) controls.style.display = "";
        setPlayIcon("play");
        popup.classList.remove("active");
        document.body.style.overflow = "";
        enableThumbAutoplay();
    }

    function handleCardClick(card) {
        const src = card.dataset.videoSrc || card.dataset.video;
        if (!src) return;
        const mode = card.dataset.videoType === "embed" || !isFileVideo(src) ? "embed" : "file";
        const thumbVideo = card.querySelector(".video-thumb video");
        if (thumbVideo) thumbVideo.pause();
        openVideoPopup(src, mode);
    }

    if (grid) {
        grid.addEventListener("click", (e) => {
            const card = e.target.closest(".video-card");
            if (!card) return;
            if (e.target.tagName === "VIDEO") return;
            handleCardClick(card);
        });
    }

    if (closePopup) closePopup.addEventListener("click", closeVideoPopup);
    if (popup) {
        popup.addEventListener("click", (e) => {
            if (e.target === popup) closeVideoPopup();
        });
    }
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && popup?.classList.contains("active")) {
            closeVideoPopup();
        }
    });

    if (btnRewind10) {
        btnRewind10.addEventListener("click", () => {
            if (!popupVideo || currentMode !== "file") return;
            popupVideo.currentTime = Math.max(popupVideo.currentTime - 10, 0);
        });
    }
    if (btnForward10) {
        btnForward10.addEventListener("click", () => {
            if (!popupVideo || currentMode !== "file") return;
            const duration = popupVideo.duration || popupVideo.currentTime + 10;
            popupVideo.currentTime = Math.min(popupVideo.currentTime + 10, duration);
        });
    }
    if (btnPlayPause) {
        btnPlayPause.addEventListener("click", () => {
            if (!popupVideo || currentMode !== "file") return;
            if (popupVideo.paused) {
                popupVideo.play().then(() => setPlayIcon("pause")).catch(() => {});
            } else {
                popupVideo.pause();
                setPlayIcon("play");
            }
        });
    }
    if (popupVideo) {
        popupVideo.addEventListener("ended", () => setPlayIcon("play"));
    }

    document.addEventListener("videos:rendered", enableThumbAutoplay);
    enableThumbAutoplay();
});
