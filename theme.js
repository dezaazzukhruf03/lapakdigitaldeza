// TEMA GELAP/TERANG — bertahan selama sesi kunjungan (sessionStorage),
// otomatis balik terang kalau tab/browser ditutup dan dibuka lagi nanti.
(function () {
    const THEME_KEY = "ldd_theme";

    function applyTheme(theme) {
        if (theme === "dark") {
            document.documentElement.setAttribute("data-theme", "dark");
        } else {
            document.documentElement.removeAttribute("data-theme");
        }
        document.querySelectorAll(".theme-toggle i").forEach(icon => {
            icon.className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
        });
    }

    // Terapkan secepat mungkin (sebelum halaman dirender) supaya tidak "kedip" putih dulu
    const savedTheme = sessionStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
    applyTheme(savedTheme);

    // Pasang tombolnya setelah DOM siap
    document.addEventListener("DOMContentLoaded", function () {
        applyTheme(savedTheme); // pastikan ikon juga ikut benar

        document.querySelectorAll(".theme-toggle").forEach(btn => {
            btn.addEventListener("click", function () {
                const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
                const next = current === "dark" ? "light" : "dark";
                sessionStorage.setItem(THEME_KEY, next);
                applyTheme(next);
            });
        });
    });
})();