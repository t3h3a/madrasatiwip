document.addEventListener("DOMContentLoaded", () => {
    // عناصر رئيسية من الصفحة
    const videoCards   = document.querySelectorAll(".video-card");
    const popup        = document.getElementById("videoPopup");
    const popupVideo   = document.getElementById("popupVideo");
    const closePopup   = document.getElementById("closePopup");
    const btnRewind10  = document.getElementById("rewind10");
    const btnForward10 = document.getElementById("forward10");
    const btnPlayPause = document.getElementById("playPause");

    let currentVideoSrc = "";

    // تشغيل الفيديوهات في البطاقات (بدون صوت)
    videoCards.forEach(card => {
        const thumbVideo = card.querySelector(".video-thumb video");
        if (thumbVideo) {
            // تأكد إنه الفيديو muted و loop
            thumbVideo.muted = true;
            thumbVideo.loop = true;
            
            // حاول تشغيل الفيديو
            thumbVideo.play().catch(() => {
                // لو المتصفح منع autoplay، ما مشكلة
            });
        }
    });

    // ============= فتح البوب-أب مع فيديو جديد =============
    function openVideoPopup(src) {
        if (!popup || !popupVideo) return;

        currentVideoSrc = src;

        // نظّف أي فيديو قديم
        popupVideo.pause();
        popupVideo.removeAttribute("src");
        popupVideo.load();

        // افتح البوب أب أولاً
        popup.classList.add("active");
        document.body.style.overflow = "hidden"; // يمنع سكرول الخلفية

        // حط مصدر الفيديو الجديد
        popupVideo.src = src;
        popupVideo.currentTime = 0; // إعادة من البداية
        popupVideo.muted = false; // تفعيل الصوت
        popupVideo.loop = false; // بدون تكرار في النافذة الكبيرة

        // إعادة تحميل الفيديو
        popupVideo.load();

        // انتظر حتى يكون الفيديو جاهز ثم شغّله
        popupVideo.addEventListener("loadeddata", function playVideo() {
            popupVideo.play()
                .then(() => {
                    setPlayIcon("pause");
                })
                .catch((error) => {
                    // لو المتصفح منع autoplay، المستخدم لازم يضغط play
                    setPlayIcon("play");
                });
            // إزالة الـ listener بعد الاستخدام
            popupVideo.removeEventListener("loadeddata", playVideo);
        }, { once: true });
    }

    // ============= إغلاق البوب-أب =============
    function closeVideoPopup() {
        if (!popup || !popupVideo) return;

        // إيقاف وإعادة الفيديو من البداية
        popupVideo.pause();
        popupVideo.currentTime = 0;
        popupVideo.removeAttribute("src");
        popupVideo.load();
        setPlayIcon("play");

        // إغلاق البوب أب
        popup.classList.remove("active");
        document.body.style.overflow = ""; // رجّع سكرول الصفحة

        // إعادة تشغيل الفيديوهات في البطاقات
        videoCards.forEach(card => {
            const thumbVideo = card.querySelector(".video-thumb video");
            if (thumbVideo) {
                thumbVideo.currentTime = 0;
                thumbVideo.muted = true; // تأكد إنه بدون صوت
                thumbVideo.loop = true; // تأكد إنه loop
                thumbVideo.play().catch(() => {
                    // لو المتصفح منع autoplay
                });
            }
        });
    }

    // زر X
    if (closePopup) {
        closePopup.addEventListener("click", closeVideoPopup);
    }

    // كليك على الخلفية (خارج صندوق الفيديو)
    if (popup) {
        popup.addEventListener("click", (e) => {
            if (e.target === popup) {
                closeVideoPopup();
            }
        });
    }

    // زر ESC من الكيبورد
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && popup?.classList.contains("active")) {
            closeVideoPopup();
        }
    });

    // ============= التعامل مع كروت الفيديو =============
    videoCards.forEach(card => {
        // منع النقر على الفيديو نفسه (نضغط على البطاقة فقط)
        const thumbVideo = card.querySelector(".video-thumb video");
        if (thumbVideo) {
            thumbVideo.addEventListener("click", (e) => {
                e.stopPropagation(); // منع انتشار الحدث للبطاقة
            });
        }

        card.addEventListener("click", (e) => {
            // لو ضغط على الفيديو نفسه، ما نعمل شي
            if (e.target.tagName === "VIDEO") {
                return;
            }

            const src = card.dataset.video;
            if (!src) return;

            // إيقاف الفيديو في البطاقة
            if (thumbVideo) {
                thumbVideo.pause();
            }

            // فتح الفيديو في وضع ملء الشاشة
            openVideoPopup(src);
        });
    });

    // ============= أزرار التحكم =============

    // زر رجوع 10 ثواني
    if (btnRewind10) {
        btnRewind10.addEventListener("click", () => {
            if (!popupVideo) return;
            popupVideo.currentTime = Math.max(popupVideo.currentTime - 10, 0);
        });
    }

    // زر تقديم 10 ثواني
    if (btnForward10) {
        btnForward10.addEventListener("click", () => {
            if (!popupVideo) return;
            const duration = popupVideo.duration || popupVideo.currentTime + 10;
            popupVideo.currentTime = Math.min(popupVideo.currentTime + 10, duration);
        });
    }

    // زر تشغيل / إيقاف
    if (btnPlayPause) {
        btnPlayPause.addEventListener("click", () => {
            if (!popupVideo) return;

            if (popupVideo.paused) {
                popupVideo.play()
                    .then(() => setPlayIcon("pause"))
                    .catch(() => {});
            } else {
                popupVideo.pause();
                setPlayIcon("play");
            }
        });
    }

    // لما الفيديو يخلص
    if (popupVideo) {
        popupVideo.addEventListener("ended", () => {
            setPlayIcon("play");
        });
    }

    // تغيير آيقونة زر التشغيل
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
});
