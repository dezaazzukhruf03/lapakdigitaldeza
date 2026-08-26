// AMBIL ID TEMPLATE DARI URL (?template=xxxxx)
const urlParams = new URLSearchParams(window.location.search);
const templateId = urlParams.get("template");

// DOM ELEMENTS - state boxes
const stateLoading = document.getElementById("stateLoading");
const stateNotFound = document.getElementById("stateNotFound");
const stateSuccess = document.getElementById("stateSuccess");
const orderForm = document.getElementById("orderForm");

function showState(stateEl) {
    [stateLoading, stateNotFound, stateSuccess, orderForm].forEach(el => {
        el.style.display = "none";
    });
    stateEl.style.display = "block";
}

// MUAT DATA TEMPLATE & PAKET SAAT HALAMAN DIBUKA
let selectedPackageId = null;
let templateBasePrice = 0;

async function loadTemplate() {
    if (!templateId) {
        showState(stateNotFound);
        return;
    }

    const [templateResult, packagesResult] = await Promise.all([
        sb.from("templates").select("*").eq("id", templateId).single(),
        sb.from("packages").select("*").order("display_order")
    ]);

    if (templateResult.error || !templateResult.data) {
        console.error("Template tidak ditemukan:", templateResult.error);
        showState(stateNotFound);
        return;
    }

    if (packagesResult.error || !packagesResult.data || packagesResult.data.length === 0) {
        console.error("Gagal memuat paket:", packagesResult.error);
        document.getElementById("packageOptions").innerHTML = `<p class="loading-text">Paket belum tersedia. Hubungi Admin.</p>`;
        showState(orderForm);
        return;
    }

    document.getElementById("templateTitleDisplay").value = templateResult.data.title;
    templateBasePrice = Number(templateResult.data.price);

    renderPackageOptions(packagesResult.data);
    showState(orderForm);
}

function renderPackageOptions(packages) {
    const container = document.getElementById("packageOptions");
    container.innerHTML = "";

    packages.forEach((pkg, index) => {
        const finalPrice = templateBasePrice + Number(pkg.price_addition || 0);
        const features = Array.isArray(pkg.features) ? pkg.features : [];

        const card = document.createElement("div");
        card.className = "package-card" + (index === 0 ? " selected" : "");
        card.dataset.packageId = pkg.id;
        card.innerHTML = `
            <div class="package-card-header">
                <span class="package-card-name"><i class="fa-solid fa-circle-check" style="opacity:${index === 0 ? 1 : 0}"></i> ${pkg.name}</span>
                <span class="package-card-price">Rp ${finalPrice.toLocaleString("id-ID")}</span>
            </div>
            ${pkg.description ? `<p class="package-card-desc">${pkg.description}</p>` : ""}
            ${features.length > 0 ? `<ul class="package-card-features">${features.map(f => `<li>${f}</li>`).join("")}</ul>` : ""}
        `;
        card.addEventListener("click", () => selectPackage(pkg.id));
        container.appendChild(card);

        if (index === 0) selectedPackageId = pkg.id;
    });
}

function selectPackage(packageId) {
    selectedPackageId = packageId;
    document.querySelectorAll(".package-card").forEach(card => {
        const isSelected = card.dataset.packageId === packageId;
        card.classList.toggle("selected", isSelected);
        const icon = card.querySelector(".package-card-name i");
        if (icon) icon.style.opacity = isSelected ? "1" : "0";
    });
}

loadTemplate();

// DROPDOWN "Isi data siapa dulu?" — sekarang hanya menentukan urutan nama
// di hasil akhir undangan (Lara & Deza vs Deza & Lara), bukan sembunyikan/kunci form
const mempelaiSelect = document.getElementById("mempelaiSelect");

// TOGGLE: RESEPSI SAMA DENGAN AKAD
const resepsiSameAsAkad = document.getElementById("resepsiSameAsAkad");
const resepsiFields = document.getElementById("resepsiFields");
resepsiSameAsAkad.addEventListener("change", () => {
    resepsiFields.style.display = resepsiSameAsAkad.checked ? "none" : "block";
});

// TOGGLE: MUSIK CUSTOM
document.querySelectorAll('input[name="musicChoice"]').forEach(radio => {
    radio.addEventListener("change", () => {
        const musicCustomField = document.getElementById("musicCustomField");
        musicCustomField.style.display = radio.value === "custom" && radio.checked ? "block" : "none";
    });
});

// REKENING HADIAH DIGITAL - dinamis, bisa tambah beberapa
const giftAccountsList = document.getElementById("giftAccountsList");
const addGiftAccountBtn = document.getElementById("addGiftAccountBtn");
let giftAccountCount = 0;

function addGiftAccountRow() {
    giftAccountCount++;
    const rowId = `giftRow${giftAccountCount}`;
    const row = document.createElement("div");
    row.className = "gift-account-row";
    row.id = rowId;
    row.innerHTML = `
        <button type="button" class="remove-row-btn" onclick="document.getElementById('${rowId}').remove()">
            <i class="fa-solid fa-trash"></i>
        </button>
        <div class="form-group">
            <label>Nama Bank / E-Wallet</label>
            <input type="text" class="gift-bank-name" maxlength="50" placeholder="Contoh: BCA / DANA">
        </div>
        <div class="form-group">
            <label>Nomor Rekening</label>
            <input type="text" class="gift-account-number" maxlength="50">
        </div>
        <div class="form-group">
            <label>Atas Nama</label>
            <input type="text" class="gift-account-holder" maxlength="100">
        </div>
    `;
    giftAccountsList.appendChild(row);
}

addGiftAccountBtn.addEventListener("click", addGiftAccountRow);
addGiftAccountRow(); // Mulai dengan 1 baris kosong

function collectGiftAccounts() {
    const rows = giftAccountsList.querySelectorAll(".gift-account-row");
    const accounts = [];
    rows.forEach(row => {
        const bankName = row.querySelector(".gift-bank-name").value.trim();
        const accountNumber = row.querySelector(".gift-account-number").value.trim();
        const accountHolder = row.querySelector(".gift-account-holder").value.trim();
        if (bankName && accountNumber) {
            accounts.push({
                bank_name: bankName,
                account_number: accountNumber,
                account_holder: accountHolder
            });
        }
    });
    return accounts;
}

// SUBMIT FORM
const submitBtn = document.getElementById("submitBtn");
const formError = document.getElementById("formError");

function showFormError(message) {
    formError.textContent = message;
    formError.style.display = "block";
    formError.scrollIntoView({ behavior: "smooth", block: "center" });
}

orderForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    formError.style.display = "none";

    // Honeypot anti-bot
    const honeypot = document.getElementById("hp_field");
    if (honeypot && honeypot.value.trim() !== "") {
        return;
    }

    const musicChoiceEl = document.querySelector('input[name="musicChoice"]:checked');
    const musicChoice = musicChoiceEl.value === "custom"
        ? document.getElementById("musicCustomInput").value.trim()
        : "Musik bawaan template";

    const resepsiSame = resepsiSameAsAkad.checked;

    const payload = {
        p_template_id: templateId,
        p_package_id: selectedPackageId,
        p_customer_name: document.getElementById("customerName").value.trim(),
        p_customer_phone: document.getElementById("customerPhone").value.trim(),
        p_customer_email: document.getElementById("customerEmail").value.trim(),
        p_name_order: mempelaiSelect.value,
        p_bride_full_name: document.getElementById("brideFullName").value.trim(),
        p_bride_nickname: document.getElementById("brideNickname").value.trim(),
        p_bride_father_name: document.getElementById("brideFatherName").value.trim(),
        p_bride_mother_name: document.getElementById("brideMotherName").value.trim(),
        p_groom_full_name: document.getElementById("groomFullName").value.trim(),
        p_groom_nickname: document.getElementById("groomNickname").value.trim(),
        p_groom_father_name: document.getElementById("groomFatherName").value.trim(),
        p_groom_mother_name: document.getElementById("groomMotherName").value.trim(),
        p_akad_datetime: document.getElementById("akadDatetime").value.trim(),
        p_akad_address: document.getElementById("akadAddress").value.trim(),
        p_resepsi_datetime: resepsiSame
            ? document.getElementById("akadDatetime").value.trim()
            : document.getElementById("resepsiDatetime").value.trim(),
        p_resepsi_address: resepsiSame
            ? document.getElementById("akadAddress").value.trim()
            : document.getElementById("resepsiAddress").value.trim(),
        p_maps_link: document.getElementById("mapsLink").value.trim(),
        p_music_choice: musicChoice,
        p_notes: document.getElementById("notes").value.trim(),
        p_gift_accounts: collectGiftAccounts()
    };

    // Validasi dasar
    if (!selectedPackageId) {
        showFormError("Mohon pilih paket terlebih dahulu.");
        return;
    }
    if (!payload.p_customer_name || !payload.p_customer_phone) {
        showFormError("Mohon lengkapi nama pemesan dan nomor WhatsApp.");
        return;
    }
    if (!payload.p_bride_full_name || !payload.p_bride_nickname) {
        showFormError("Mohon lengkapi data mempelai wanita.");
        return;
    }
    if (!payload.p_groom_full_name || !payload.p_groom_nickname) {
        showFormError("Mohon lengkapi data mempelai pria.");
        return;
    }
    if (!payload.p_akad_datetime || !payload.p_akad_address) {
        showFormError("Mohon lengkapi data acara akad.");
        return;
    }
    if (!resepsiSame && (!payload.p_resepsi_datetime || !payload.p_resepsi_address)) {
        showFormError("Mohon lengkapi data acara resepsi, atau centang \"Sama dengan Akad\".");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Mengirim...";

    const { data: newOrderCode, error } = await sb.rpc("create_order_with_details", payload);

    if (error) {
        console.error("Gagal membuat pesanan:", error);
        showFormError("Gagal mengirim pesanan. Coba lagi, atau hubungi Admin kalau masih gagal.");
        submitBtn.disabled = false;
        submitBtn.textContent = "Pesan Tema Ini";
        return;
    }

    if (typeof gtag === "function") {
        gtag('event', 'order_submitted', { template_id: templateId, order_code: newOrderCode });
    }

    document.getElementById("successOrderCode").textContent = newOrderCode;
    showState(stateSuccess);
});