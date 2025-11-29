(() => {
    let popupWired = false;
    let popup = null;
    let popupVideo = null;
    let closePopup = null;
    let btnRewind10 = null;
    let btnForward10 = null;
    let btnPlayPause = null;
    let currentVideoSrc = "";

    function cacheElements() {
        popup = document.getElementById("videoPopup");
        popupVideo = document.getElementById("popupVideo");
        closePopup = document.getElementById("closePopup");
        btnRewind10 = document.getElementById("rewind10");
        btnForward10 = document.getElementById("forward10");
        btnPlayPause = document.getElementById("playPause");
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

    function openVideoPopup(src) {
        if (!popup || !popupVideo || !src) return;
        currentVideoSrc = src;
        popupVideo.pause();
        popupVideo.removeAttribute("src");
        popupVideo.load();

        popup.classList.add("active");
        document.body.style.overflow = "hidden";

        popupVideo.src = src;
        popupVideo.currentTime = 0;
        popupVideo.muted = false;
        popupVideo.loop = false;
        popupVideo.load();

        popupVideo.addEventListener("loadeddata", function playVideo() {
            popupVideo.play()
                .then(() => setPlayIcon("pause"))
                .catch(() => setPlayIcon("play"));
            popupVideo.removeEventListener("loadeddata", playVideo);
        }, { once: true });
    }

    function closeVideoPopup() {
        if (!popup || !popupVideo) return;
        popupVideo.pause();
        popupVideo.currentTime = 0;
        popupVideo.removeAttribute("src");
        popupVideo.load();
        setPlayIcon("play");

        popup.classList.remove("active");
        document.body.style.overflow = "";

        document.querySelectorAll(".video-card").forEach(card => {
            const thumbVideo = card.querySelector(".video-thumb video");
            if (thumbVideo) {
                thumbVideo.currentTime = 0;
                thumbVideo.muted = true;
                thumbVideo.loop = true;
                thumbVideo.play().catch(() => {});
            }
        });
    }

    function wirePopupControls() {
        if (popupWired) return;
        cacheElements();
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
                if (!popupVideo) return;
                popupVideo.currentTime = Math.max(popupVideo.currentTime - 10, 0);
            });
        }
        if (btnForward10) {
            btnForward10.addEventListener("click", () => {
                if (!popupVideo) return;
                const duration = popupVideo.duration || popupVideo.currentTime + 10;
                popupVideo.currentTime = Math.min(popupVideo.currentTime + 10, duration);
            });
        }
        if (btnPlayPause) {
            btnPlayPause.addEventListener("click", () => {
                if (!popupVideo) return;
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
        popupWired = true;
    }

    function wireCard(card) {
        if (!card || card.dataset.wired === "true") return;
        const thumbVideo = card.querySelector(".video-thumb video");
        if (thumbVideo) {
            thumbVideo.muted = true;
            thumbVideo.loop = true;
            thumbVideo.play().catch(() => {});
            thumbVideo.addEventListener("click", (e) => e.stopPropagation());
        }
        card.addEventListener("click", (e) => {
            if (e.target.tagName === "VIDEO") return;
            const src = card.dataset.video;
            if (!src) return;
            if (thumbVideo) thumbVideo.pause();
            openVideoPopup(src);
        });
        card.dataset.wired = "true";
    }

    function setupVideoCards() {
        wirePopupControls();
        document.querySelectorAll(".video-card").forEach(wireCard);
    }

    window.setupVideoCards = setupVideoCards;
    document.addEventListener("DOMContentLoaded", setupVideoCards);
})();
