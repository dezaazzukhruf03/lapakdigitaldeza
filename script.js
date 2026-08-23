// DOM ELEMENTS
const templateGrid = document.getElementById("templateGrid");
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

// INITIAL RENDER
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

document.querySelectorAll(".cat-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentCategory = btn.getAttribute("data-category");
        filterData();
    });
});

// LOGIKA MODAL GENERATOR
function openGenerator(themeId) {
    websiteSelect.innerHTML = "";
    templates.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.id;
        opt.textContent = t.title;
        if(t.id === themeId) opt.selected = true;
        websiteSelect.appendChild(opt);
    });

    modal.style.display = "flex";
}

function closeGenerator() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target === modal) closeGenerator();
};

// SUBMIT FORM GENERATOR
generatorForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = guestName.value.trim();
    if (name === "") {
        alert("Silakan masukkan nama tamu.");
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

    generateBtn.disabled = true;
    generateBtn.textContent = "Berhasil!";
    saveStatus.textContent = "Menyimpan ke Sheet...";

    fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
            nama: name,
            website: websiteSelect.value,
            url: finalUrl
        })
    })
    .then(() => {
        saveStatus.textContent = "Data tersimpan di Sheet!";
    })
    .catch(() => {
        saveStatus.textContent = "Gagal simpan ke Sheet, tapi URL siap digunakan.";
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