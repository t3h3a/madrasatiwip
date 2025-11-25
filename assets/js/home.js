/* ===========================
   1) تشغيل قائمة الموبايل
=========================== */
const navToggle = document.getElementById("navToggle");
const mainNav = document.querySelector(".main-nav");

if (navToggle) {
    navToggle.addEventListener("click", () => {
        mainNav.classList.toggle("show");
    });
}

/* ===========================
   2) تشغيل سلايدر الخلفية
   (صورتين يتبدلوا كل 5 ثواني)
=========================== */
let sliderIndex = 0;
const slides = document.querySelectorAll(".hero-slider .slide");

function switchHeroBackground() {
    if (slides.length === 0) return;
    
    slides.forEach((slide, i) => {
        if (i === sliderIndex) {
            slide.classList.add("active");
        } else {
            slide.classList.remove("active");
        }
    });

    sliderIndex = (sliderIndex + 1) % slides.length;
}

// تشغيل السلايدر كل 5 ثواني
if (slides.length > 0) {
    setInterval(switchHeroBackground, 5000);
}

/* ===========================
   3) سكرول سلس عند الضغط
=========================== */
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", function (e) {
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
            e.preventDefault();
            window.scrollTo({
                top: target.offsetTop - 90,
                behavior: "smooth"
            });
        }
    });
});


/* ===========================
   4) زر إنجازات الطلاب ➜ الذهاب للمعرض
=========================== */
const studentsBtn = document.getElementById("studentsBtn");

if (studentsBtn) {
    studentsBtn.addEventListener("click", () => {
        window.location.href = "gallery.html";
    });
}
