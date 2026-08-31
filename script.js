// ICON UNTUK SETIAP KATEGORI (tambahkan di sini kalau ada kategori baru di tabel templates)
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

// GOOGLE ANALYTICS 4 EVENT HELPER
function trackTemplateEvent(eventName, templateId, templateTitle) {
    if (typeof gtag === "function") {
        gtag('event', eventName, {
            template_id: templateId,
            template_title: templateTitle
        });
    }
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
        const badgeHTML = item.badge ? `<span class="card-badge">${item.badge}</span>` : '';
        const hasPhoto = !!item.previewImageUrl;

        const screenBgStyle = (!hasPhoto && item.colorStart && item.colorEnd)
            ? `style="background: linear-gradient(135deg, ${item.colorStart} 0%, ${item.colorEnd} 100%);"`
            : '';
        const screenBgClass = (!hasPhoto && !(item.colorStart && item.colorEnd)) ? (item.themeClass || '') : '';

        const previewInner = hasPhoto
            ? `<img src="${item.previewImageUrl}" alt="${item.title}" class="phone-screenshot" loading="lazy">`
            : `<div class="phone-screen-fallback ${screenBgClass}" ${screenBgStyle}>
                   <span class="mock-tag">${item.tag}</span>
                   <h4>${item.sampleNames}</h4>
                   <p>${item.sampleDate}</p>
               </div>`;

        const cardHTML = `
            <div class="card" data-category="${item.category}">
                ${badgeHTML}
                <div class="card-preview">
                    <div class="phone-mockup-real">
                        <div class="phone-notch"></div>
                        ${previewInner}
                    </div>
                </div>
                <div class="card-info">
                    <h3>${item.title}</h3>
                    <span class="price-tag">Mulai dari ${item.price}</span>

                    <div class="card-actions-top">
                        <a href="${item.previewUrl}" target="_blank" class="btn-action btn-preview" onclick="trackTemplateEvent('preview_template', '${item.id}', '${item.title}')">
                            <i class="fa-solid fa-eye"></i> Lihat Tema
                        </a>
                        <button type="button" class="btn-action btn-preview" onclick="openDemoModal('${item.id}')">
                            <i class="fa-solid fa-wand-magic-sparkles"></i> Kustom Nama Tamu
                        </button>
                    </div>

                    <a href="pesan.html?template=${item.id}" class="btn-action btn-order-full" onclick="trackTemplateEvent('open_order_form', '${item.id}', '${item.title}')">
                        <i class="fa-solid fa-cart-shopping"></i> Pesan Tema
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

// DATA TEMPLATES — diambil dari Supabase
let templates = [];

async function loadTemplates() {
    const { data, error } = await sb.from("templates").select("*").order("display_order").order("created_at");

    if (error) {
        console.error("Gagal memuat katalog:", error);
        templateGrid.innerHTML = `<p class="loading-text">Gagal memuat katalog. Coba refresh halaman.</p>`;
        return [];
    }

    return data.map(t => ({
        id: t.id,
        title: t.title,
        category: t.category,
        price: `Rp ${Number(t.price).toLocaleString("id-ID")}`,
        themeClass: t.theme_class,
        colorStart: t.color_start,
        colorEnd: t.color_end,
        previewImageUrl: t.preview_image_url,
        tag: t.tag,
        badge: t.badge || "",
        sampleNames: t.sample_names,
        sampleDate: t.sample_date,
        previewUrl: t.preview_url,
        baseUrl: t.base_url
    }));
}

// INITIAL RENDER
async function init() {
    templateGrid.innerHTML = `<p class="loading-text">Memuat katalog...</p>`;
    templates = await loadTemplates();
    renderCategoryBar();
    renderTemplates(templates);
}
init();

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

// NAVBAR MOBILE TOGGLE
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
});

navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
    });
});

// ===============================
// MODAL DEMO: KUSTOM NAMA TAMU
// ===============================
const demoModal = document.getElementById("demoModal");
const demoForm = document.getElementById("demoForm");
const demoGuestName = document.getElementById("demoGuestName");
const demoGenerateBtn = document.getElementById("demoGenerateBtn");
const demoResultUrl = document.getElementById("demoResultUrl");
const demoCopyBtn = document.getElementById("demoCopyBtn");
const demoOpenBtn = document.getElementById("demoOpenBtn");
const demoResetBtn = document.getElementById("demoResetBtn");
const toast = document.getElementById("toast");

const DEMO_DEFAULT_TEXT = "Hasil url akan muncul disini";
const DEMO_DEFAULT_MESSAGE_TEXT = "Pesan undangan akan muncul disini setelah generate";
let demoActiveTemplate = null;

function buildDemoInvitationMessage(guestNameValue, coupleName, url) {
    return `Kepada Yth.
Bapak/Ibu/Saudara/i
*${guestNameValue}*

Assalamu'alaikum Warahmatullahi Wabarakatuh

Tanpa mengurangi rasa hormat, melalui pesan ini kami ingin membagikan kabar bahagia sekaligus mengundang Bapak/Ibu/Saudara/i untuk menjadi bagian dari momen berharga pernikahan kami:

✨ *${coupleName}* ✨

Silakan klik tautan di bawah ini untuk melihat detail lokasi dan rangkaian acara:
🔗 ${url}

NB: Buka menggunakan Google Chrome untuk pengalaman visual terbaik.

Ungkapan terima kasih yang tulus kami sampaikan atas doa restu dan kehadiran Bapak/Ibu/Saudara/i sekalian.

Wassalamu'alaikum Warahmatullahi Wabarakatuh

Terima Kasih,
Hormat kami,
*Keluarga Besar ${coupleName}*`;
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
}

function openDemoModal(templateId) {
    demoActiveTemplate = templates.find(t => t.id === templateId);
    if (!demoActiveTemplate) return;

    demoGuestName.value = "";
    demoResultUrl.textContent = DEMO_DEFAULT_TEXT;
    document.getElementById("demoMessagePreview").textContent = DEMO_DEFAULT_MESSAGE_TEXT;
    demoModal.style.display = "flex";
    demoGuestName.focus();

    trackTemplateEvent('open_demo_modal', demoActiveTemplate.id, demoActiveTemplate.title);
}

function closeDemoModal() {
    demoModal.style.display = "none";
}

window.addEventListener("click", (event) => {
    if (event.target === demoModal) closeDemoModal();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && demoModal.style.display === "flex") {
        closeDemoModal();
    }
});

demoForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Honeypot anti-bot
    const honeypot = document.getElementById("demo_hp_field");
    if (honeypot && honeypot.value.trim() !== "") return;

    const name = demoGuestName.value.trim();
    if (name === "") {
        alert("Silakan masukkan nama tamu.");
        demoGuestName.focus();
        return;
    }
    if (!demoActiveTemplate) return;

    const baseUrl = demoActiveTemplate.baseUrl;
    const finalUrl = `${baseUrl}${baseUrl.endsWith("/") ? "" : "/"}?to=${encodeURIComponent(name)}`;
    demoResultUrl.textContent = finalUrl;

    const coupleName = demoActiveTemplate.sampleNames || demoActiveTemplate.title;
    document.getElementById("demoMessagePreview").textContent = buildDemoInvitationMessage(name, coupleName, finalUrl);

    trackTemplateEvent('generate_demo_link', demoActiveTemplate.id, demoActiveTemplate.title);

    // Simpan sebagai data demo (opsional, buat lihat tema mana yang paling sering dicoba)
    sb.from("generated_links").insert({
        template_id: demoActiveTemplate.id,
        guest_name: name,
        generated_url: finalUrl
    }).then(() => {}).catch((err) => console.error("Gagal simpan demo:", err));
});

demoCopyBtn.addEventListener("click", function () {
    const url = demoResultUrl.textContent.trim();
    if (url === DEMO_DEFAULT_TEXT) {
        alert("Silakan klik \"Lihat Contoh\" terlebih dahulu.");
        return;
    }
    navigator.clipboard.writeText(url).then(() => showToast("Link berhasil disalin!"));
});

demoOpenBtn.addEventListener("click", function () {
    const url = demoResultUrl.textContent.trim();
    if (url === DEMO_DEFAULT_TEXT) {
        alert("Silakan klik \"Lihat Contoh\" terlebih dahulu.");
        return;
    }
    window.open(url, "_blank");
});

demoResetBtn.addEventListener("click", function () {
    demoGuestName.value = "";
    demoResultUrl.textContent = DEMO_DEFAULT_TEXT;
    document.getElementById("demoMessagePreview").textContent = DEMO_DEFAULT_MESSAGE_TEXT;
});

document.getElementById("demoCopyMessageBtn").addEventListener("click", function () {
    const message = document.getElementById("demoMessagePreview").textContent.trim();
    if (message === DEMO_DEFAULT_MESSAGE_TEXT) {
        alert("Silakan klik \"Lihat Contoh\" terlebih dahulu.");
        return;
    }
    navigator.clipboard.writeText(message).then(() => showToast("Pesan berhasil disalin!"));
});