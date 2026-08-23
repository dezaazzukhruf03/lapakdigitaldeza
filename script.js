// CONFIGURATION & API
const API_URL = "https://script.google.com/macros/s/AKfycbzxGY9MJef2If5Je1L6nW0EEdRCL72nEM7Vdy1EpzY8uLoCWB6rfzdiZiGvNIx2Rm8lyQ/exec";

// DOM ELEMENTS
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

const DEFAULT_RESULT_TEXT = "Hasil url akan muncul disini";

// 1. MODAL GENERATOR LOGIC
function openGenerator(themeValue, themeName) {
    websiteSelect.value = themeValue;
    modal.style.display = "flex";
}

function closeGenerator() {
    modal.style.display = "none";
}

// Close Modal when clicking outside box
window.onclick = function(event) {
    if (event.target === modal) {
        closeGenerator();
    }
}

// 2. CATEGORY FILTER LOGIC
const categoryButtons = document.querySelectorAll(".cat-btn");
const cards = document.querySelectorAll(".card");

categoryButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        categoryButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const selectedCat = btn.getAttribute("data-category");

        cards.forEach(card => {
            if (selectedCat === "all" || card.getAttribute("data-category") === selectedCat) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        });
    });
});

// 3. GENERATOR LOGIC (FUNGSI DARI KODE ASLI KAMU)
generatorForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = guestName.value.trim();

    if (name === "") {
        alert("Silakan masukkan nama tamu.");
        guestName.focus();
        return;
    }

    let baseUrl = "";

    switch (websiteSelect.value) {
        case "ekaarian":
            baseUrl = "https://ekaarian-wedding.vercel.app/";
            break;

        case "putrirama":
            baseUrl = "https://putrirama-wedding.vercel.app/";
            break;

        case "softred001":
            baseUrl = "https://ldd-softred001.vercel.app/";
            break;

        default:
            alert("Website tidak ditemukan.");
            return;
    }

    const encodedName = encodeURIComponent(name);
    const finalUrl = `${baseUrl}?to=${encodedName}`;

    resultUrl.textContent = finalUrl;

    generateBtn.disabled = true;
    generateBtn.textContent = "Berhasil!";
    saveStatus.textContent = "Menyimpan ke data...";

    fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
            nama: name,
            website: websiteSelect.value,
            url: finalUrl
        })
    })
    .then(() => {
        saveStatus.textContent = "Data tersimpan!";
    })
    .catch(() => {
        saveStatus.textContent = "Gagal menyimpan ke Sheet, namun URL tetap dapat digunakan.";
    })
    .finally(() => {
        generateBtn.disabled = false;
        generateBtn.textContent = "Generate Link";
    });
});

// 4. ACTION BUTTONS
copyBtn.addEventListener("click", function () {
    const url = resultUrl.textContent.trim();

    if (url === DEFAULT_RESULT_TEXT) {
        alert("Silakan generate URL terlebih dahulu.");
        return;
    }

    navigator.clipboard.writeText(url).then(() => {
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Tersalin!';
        setTimeout(() => {
            copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy Link';
        }, 1500);
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