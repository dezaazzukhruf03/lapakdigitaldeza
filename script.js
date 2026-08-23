// ICON UNTUK SETIAP KATEGORI (tambahkan di sini kalau ada kategori baru di templates.js)
const CATEGORY_META = {
    all: { label: "Semua", icon: "fa-solid fa-border-all" },
    pernikahan: { label: "Pernikahan", icon: "fa-solid fa-heart" },
    khitanan: { label: "Khitanan", icon: "fa-solid fa-child" },
    ulangtahun: { label: "Ulang Tahun", icon: "fa-solid fa-cake-candles" }
};
const DEFAULT_CATEGORY_META = { icon: "fa-solid fa-tag" };

// DOM ELEMENTS
const templateGrid = document.getElementById("templateGrid");
const categoryBar = document.getElementById("kategori");
const noResults = document.getElementById("noResults");
const searchInput = document.getElementById("searchInput");
const modal = document.getElementById("generatorModal");
const generatorForm = document.getElementById("generatorForm");
const guestName = document.getElementById("guestName");
const websiteSelect = document.getElementById("websiteSelect");
const generateBtn = document.getElementById("generateBtn");
const resultUrl = document.getElementById("resultUrl");
const saveStatus = document.getElementById("saveStatus");
const copyBtn = document.getElementById("copyBtn");
const openBtn = document.getElementById("openBtn");
const resetBtn = document.getElementById("resetBtn");
const toast = document.getElementById("toast");

const DEFAULT_RESULT_TEXT = "Hasil url akan muncul disini";

// NAVBAR MOBILE TOGGLE
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
});

// Tutup menu mobile setelah klik salah satu link
navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
    });
});

// TOAST NOTIFICATION FUNCTION
function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// RENDER KARTU DENGAN BADGE
function renderTemplates(data) {
    templateGrid.innerHTML = "";
    
    if (data.length === 0) {
        noResults.style.display = "block";
        return;
    } else {
        noResults.style.display = "none";
    }

    data.forEach(item => {
        const orderMessage = encodeURIComponent(`Halo Admin Lapak Digital Deza, saya berminat untuk memesan tema undangan "${item.title}" (${item.price}). Mohon informasi selanjutnya.`);
        const waLink = `https://wa.me/${ADMIN_WA}?text=${orderMessage}`;
        const badgeHTML = item.badge ? `<span class="card-badge">${item.badge}</span>` : '';

        const cardHTML = `
            <div class="card" data-category="${item.category}">
                ${badgeHTML}
                <div class="card-preview ${item.themeClass}">
                    <div class="phone-mockup">
                        <div class="phone-screen">
                            <span class="mock-tag">${item.tag}</span>
                            <h4>${item.sampleNames}</h4>
                            <p>${item.sampleDate}</p>
                        </div>
                    </div>
                </div>
                <div class="card-info">
                    <h3>${item.title}</h3>
                    <span class="price-tag">${item.price}</span>
                    
                    <div class="card-actions-top">
                        <a href="${item.previewUrl}" target="_blank" class="btn-action btn-preview">
                            <i class="fa-solid fa-eye"></i> Preview
                        </a>
                        <button class="btn-action btn-use" onclick="openGenerator('${item.id}')">
                            <i class="fa-solid fa-wand-magic-sparkles"></i> Buat Link
                        </button>
                    </div>

                    <a href="${waLink}" target="_blank" class="btn-action btn-order-full">
                        <i class="fa-brands fa-whatsapp"></i> Pesan Tema Ini
                    </a>
                </div>
            </div>
        `;
        templateGrid.insertAdjacentHTML("beforeend", cardHTML);
    });
}

// RENDER TOMBOL KATEGORI (hanya kategori yang benar-benar punya template)
function renderCategoryBar() {
    const usedCategories = [...new Set(templates.map(t => t.category))];
    const categoriesToShow = ["all", ...usedCategories];

    categoryBar.innerHTML = "";
    categoriesToShow.forEach(cat => {
        const meta = CATEGORY_META[cat] || {
            label: cat.charAt(0).toUpperCase() + cat.slice(1),
            icon: DEFAULT_CATEGORY_META.icon
        };
        const btn = document.createElement("button");
        btn.className = "cat-btn" + (cat === "all" ? " active" : "");
        btn.setAttribute("data-category", cat);
        btn.innerHTML = `<i class="${meta.icon}"></i> ${meta.label}`;
        btn.addEventListener("click", () => {
            document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentCategory = cat;
            filterData();
        });
        categoryBar.appendChild(btn);
    });
}

// INITIAL RENDER
renderCategoryBar();
renderTemplates(templates);

// SEARCH & FILTER
let currentCategory = "all";

function filterData() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    const filtered = templates.filter(item => {
        const matchCategory = (currentCategory === "all") || (item.category === currentCategory);
        const matchSearch = item.title.toLowerCase().includes(searchTerm) || 
                            item.tag.toLowerCase().includes(searchTerm) ||
                            item.sampleNames.toLowerCase().includes(searchTerm);
        return matchCategory && matchSearch;
    });

    renderTemplates(filtered);
}

searchInput.addEventListener("input", filterData);

// LOGIKA MODAL GENERATOR
function openGenerator(themeId) {
    const selected = templates.find(t => t.id === themeId);
    if (!selected) return;

    // Select dikunci (disabled) ke template yang diklik dari katalog,
    // jadi cukup tampilkan satu opsi ini saja — tidak perlu render semua template.
    websiteSelect.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = selected.id;
    opt.textContent = selected.title;
    opt.selected = true;
    websiteSelect.appendChild(opt);

    // Reset form tiap kali modal dibuka untuk template baru
    guestName.value = "";
    resultUrl.textContent = DEFAULT_RESULT_TEXT;
    saveStatus.textContent = "";
    saveStatus.className = "save-status";
    generateBtn.disabled = false;
    generateBtn.textContent = "Generate Link";

    modal.style.display = "flex";
    guestName.focus();
}

function closeGenerator() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target === modal) closeGenerator();
};

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape" && modal.style.display === "flex") {
        closeGenerator();
    }
});

// ANTI-SPAM: batasi jarak antar submit (mencegah klik berulang / bot sederhana)
const SUBMIT_COOLDOWN_MS = 8000;
let lastSubmitAt = 0;

// SUBMIT FORM GENERATOR
generatorForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Honeypot: field tersembunyi yang hanya akan terisi oleh bot otomatis
    const honeypot = document.getElementById("hp_field");
    if (honeypot && honeypot.value.trim() !== "") {
        // Diam-diam abaikan submit dari bot, jangan kasih tahu bahwa ini terdeteksi
        return;
    }

    const now = Date.now();
    if (now - lastSubmitAt < SUBMIT_COOLDOWN_MS) {
        alert("Mohon tunggu beberapa detik sebelum generate link lagi.");
        return;
    }

    let name = guestName.value.trim();

    // Validasi panjang & bersihkan karakter yang tidak wajar untuk nama tamu
    if (name === "") {
        alert("Silakan masukkan nama tamu.");
        guestName.focus();
        return;
    }
    if (name.length > 60) {
        alert("Nama tamu terlalu panjang (maksimal 60 karakter).");
        guestName.focus();
        return;
    }
    // Hanya izinkan huruf, spasi, dan tanda baca umum pada nama (&, ., ', -)
    if (!/^[\p{L}\s.,'&-]+$/u.test(name)) {
        alert("Nama tamu mengandung karakter yang tidak didukung.");
        guestName.focus();
        return;
    }

    const selectedTemplate = templates.find(t => t.id === websiteSelect.value);
    if (!selectedTemplate) {
        alert("Website tidak ditemukan.");
        return;
    }

    const encodedName = encodeURIComponent(name);
    const finalUrl = `${selectedTemplate.baseUrl}?to=${encodedName}`;

    resultUrl.textContent = finalUrl;
    lastSubmitAt = now;

    generateBtn.disabled = true;
    generateBtn.textContent = "Berhasil!";
    saveStatus.textContent = "Menyimpan ke database...";
    saveStatus.className = "save-status";

    fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
            nama: name,
            website: websiteSelect.value,
            url: finalUrl
        })
    })
    .then(() => {
        // Catatan: banyak deployment Google Apps Script tidak mengirim header CORS,
        // sehingga browser tidak selalu bisa membaca isi response walau request sukses.
        // Karena itu kita tidak mengklaim "100% tersimpan", cukup beri tahu bahwa
        // request sudah terkirim — dan link tetap bisa langsung dipakai.
        saveStatus.textContent = "Link siap digunakan. Data sedang disinkronkan ke database.";
    })
    .catch(() => {
        saveStatus.textContent = "Gagal terhubung ke database, tapi URL tetap siap digunakan.";
        saveStatus.classList.add("save-status-error");
    })
    .finally(() => {
        generateBtn.disabled = false;
        generateBtn.textContent = "Generate Link";
    });
});

// COPY, OPEN, RESET
copyBtn.addEventListener("click", function () {
    const url = resultUrl.textContent.trim();
    if (url === DEFAULT_RESULT_TEXT) {
        alert("Silakan generate URL terlebih dahulu.");
        return;
    }

    navigator.clipboard.writeText(url).then(() => {
        showToast("Link berhasil disalin ke clipboard!");
    });
});

openBtn.addEventListener("click", function () {
    const url = resultUrl.textContent.trim();
    if (url === DEFAULT_RESULT_TEXT) {
        alert("Silakan generate URL terlebih dahulu.");
        return;
    }
    window.open(url, "_blank");
});

resetBtn.addEventListener("click", function () {
    guestName.value = "";
    resultUrl.textContent = DEFAULT_RESULT_TEXT;
    saveStatus.textContent = "";
});