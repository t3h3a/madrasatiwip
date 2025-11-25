/* =========================
   نظام الوضع الداكن/الفاتح
========================= */

// تحميل الوضع المحفوظ أو استخدام الوضع الفاتح كافتراضي
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// تبديل الوضع
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// تهيئة الوضع عند تحميل الصفحة
initTheme();

// إضافة مستمع الحدث لزر التبديل
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');
    const themeToggleMobile = document.getElementById('themeToggleMobile');
    [themeToggle, themeToggleMobile].forEach(btn => {
        if (btn) btn.addEventListener('click', toggleTheme);
    });
});

