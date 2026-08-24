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
        const askAdminMessage = encodeURIComponent(`Halo Admin Lapak Digital Deza, saya ingin tanya-tanya dulu soal tema "${item.title}" (${item.price}) sebelum pesan.`);
        const waLink = `https://wa.me/${ADMIN_WA}?text=${askAdminMessage}`;
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
                        <a href="${item.previewUrl}" target="_blank" class="btn-action btn-preview" onclick="trackTemplateEvent('preview_template', '${item.id}', '${item.title}')">
                            <i class="fa-solid fa-eye"></i> Preview
                        </a>
                        <a href="pesan.html?template=${item.id}" class="btn-action btn-use" onclick="trackTemplateEvent('open_order_form', '${item.id}', '${item.title}')">
                            <i class="fa-solid fa-wand-magic-sparkles"></i> Pesan Tema Ini
                        </a>
                    </div>

                    <a href="${waLink}" target="_blank" class="btn-action btn-order-full" onclick="trackTemplateEvent('ask_admin_click', '${item.id}', '${item.title}')">
                        <i class="fa-brands fa-whatsapp"></i> Tanya Dulu ke Admin
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
    const { data, error } = await sb.from("templates").select("*").order("created_at");

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