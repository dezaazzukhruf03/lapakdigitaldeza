// ===============================
// AMBIL ELEMEN HTML
// ===============================
const invalidState = document.getElementById("invalidState");
const lookupState = document.getElementById("lookupState");
const adminLoginState = document.getElementById("adminLoginState");
const appState = document.getElementById("appState");

const adminLoginForm = document.getElementById("adminLoginForm");
const adminLoginError = document.getElementById("adminLoginError");

const generatorForm = document.getElementById("generatorForm");
const guestName = document.getElementById("guestName");
const websiteSelect = document.getElementById("websiteSelect");
const generateBtn = document.getElementById("generateBtn");
const resultUrl = document.getElementById("resultUrl");
const saveStatus = document.getElementById("saveStatus");
const copyBtn = document.getElementById("copyBtn");
const openBtn = document.getElementById("openBtn");
const resetBtn = document.getElementById("resetBtn");

const websiteFieldNormal = document.getElementById("websiteFieldNormal");
const websiteFieldLocked = document.getElementById("websiteFieldLocked");
const lockedWebsiteText = document.getElementById("lockedWebsiteText");

const messagePreview = document.getElementById("messagePreview");
const copyMessageBtn = document.getElementById("copyMessageBtn");

const DEFAULT_RESULT_TEXT = "Hasil url akan muncul disini";
const DEFAULT_COPY_TEXT = "Copy Link";
const DEFAULT_MESSAGE_TEXT = "Pesan undangan akan muncul disini setelah Generate";
const DEFAULT_COPY_MESSAGE_TEXT = "Copy Pesan";

// currentMode: "admin" | "client" | "invalid"
let currentMode = "invalid";
let lockedOrder = null; // { order_code, couple_display_name, final_site_url }
let adminOrdersList = []; // daftar order untuk dropdown admin

// ===============================
// TEMPLATE PESAN UNDANGAN
// ===============================
function buildInvitationMessage(guestNameValue, coupleName, url) {
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

// ===============================
// TENTUKAN MODE SAAT HALAMAN DIBUKA
// ===============================
async function initMode() {
    const params = new URLSearchParams(window.location.search);
    const isAdminParam = params.get("admin");
    const clientParam = params.get("client");

    if (isAdminParam) {
        // Mode admin: cek dulu apakah sudah login
        const { data: { session } } = await sb.auth.getSession();

        if (session) {
            await enterAdminMode();
        } else {
            currentMode = "invalid";
            lookupState.style.display = "none";
            invalidState.style.display = "none";
            appState.style.display = "none";
            adminLoginState.style.display = "block";
        }
        return;
    }

    if (clientParam) {
        const { data, error } = await sb.rpc("get_order_for_generator", { p_order_code: clientParam });

        if (error || !data || data.length === 0) {
            showInvalid();
            return;
        }

        currentMode = "client";
        lockedOrder = data[0];

        lookupState.style.display = "none";
        invalidState.style.display = "none";
        adminLoginState.style.display = "none";
        appState.style.display = "block";
        websiteFieldNormal.style.display = "none";
        websiteFieldLocked.style.display = "block";
        lockedWebsiteText.textContent = lockedOrder.couple_display_name || lockedOrder.order_code;
        return;
    }

    // Tidak ada parameter sama sekali: tampilkan pintu masuk pelanggan
    showLookup();
}

function showLookup() {
    currentMode = "invalid";
    appState.style.display = "none";
    adminLoginState.style.display = "none";
    invalidState.style.display = "none";
    lookupState.style.display = "block";
}

function showInvalid() {
    currentMode = "invalid";
    appState.style.display = "none";
    adminLoginState.style.display = "none";
    lookupState.style.display = "none";
    invalidState.style.display = "block";
}

async function enterAdminMode() {
    const { data, error } = await sb.rpc("list_orders_for_generator");

    if (error) {
        console.error("Gagal memuat daftar client:", error);
        showInvalid();
        return;
    }

    currentMode = "admin";
    adminOrdersList = data;

    lookupState.style.display = "none";
    invalidState.style.display = "none";
    adminLoginState.style.display = "none";
    appState.style.display = "block";
    websiteFieldNormal.style.display = "block";
    websiteFieldLocked.style.display = "none";

    websiteSelect.innerHTML = `<option value="" selected disabled>-- Pilih Client --</option>`;
    adminOrdersList.forEach(order => {
        const opt = document.createElement("option");
        opt.value = order.order_code;
        opt.textContent = order.couple_display_name || order.order_code;
        websiteSelect.appendChild(opt);
    });
}

initMode();

// LOOKUP: PELANGGAN MASUKKAN KODE PESANAN SENDIRI
document.getElementById("lookupBtn").addEventListener("click", () => {
    const code = document.getElementById("lookupCodeInput").value.trim();
    if (!code) {
        alert("Silakan masukkan Kode Pesanan Anda.");
        return;
    }
    window.location.href = `generator.html?client=${encodeURIComponent(code)}`;
});

document.getElementById("lookupCodeInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("lookupBtn").click();
});

// ===============================
// LOGIN ADMIN
// ===============================
adminLoginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    adminLoginError.textContent = "";

    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;
    const loginBtn = document.getElementById("adminLoginBtn");

    loginBtn.disabled = true;
    loginBtn.textContent = "Memproses...";

    const { error } = await sb.auth.signInWithPassword({ email, password });

    loginBtn.disabled = false;
    loginBtn.textContent = "Login";

    if (error) {
        adminLoginError.textContent = "Email atau password salah.";
        return;
    }

    await enterAdminMode();
});

// ===============================
// SUBMIT FORM GENERATE
// ===============================
generatorForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = guestName.value.trim();
    if (name === "") {
        alert("Silakan masukkan nama tamu.");
        guestName.focus();
        return;
    }

    let orderCode, coupleName, baseUrl;

    if (currentMode === "client") {
        orderCode = lockedOrder.order_code;
        coupleName = lockedOrder.couple_display_name;
        baseUrl = lockedOrder.final_site_url;
    } else if (currentMode === "admin") {
        orderCode = websiteSelect.value;
        if (!orderCode) {
            alert("Silakan pilih client.");
            websiteSelect.focus();
            return;
        }
        const selected = adminOrdersList.find(o => o.order_code === orderCode);
        coupleName = selected.couple_display_name;
        baseUrl = selected.final_site_url;
    } else {
        return;
    }

    if (!baseUrl) {
        alert("Website undangan untuk client ini belum tersedia.");
        return;
    }

    const encodedName = encodeURIComponent(name);
    const finalUrl = `${baseUrl}${baseUrl.endsWith("/") ? "" : "/"}?to=${encodedName}`;

    resultUrl.textContent = finalUrl;
    messagePreview.textContent = buildInvitationMessage(name, coupleName, finalUrl);

    generateBtn.disabled = true;
    generateBtn.textContent = "Berhasil!";
    saveStatus.textContent = "";
    saveStatus.className = "save-status";

    sb.from("generated_links")
        .insert({
            order_code: orderCode,
            guest_name: name,
            generated_url: finalUrl
        })
        .then(({ error }) => {
            if (error) throw error;
            saveStatus.textContent = "Tersimpan!";
            saveStatus.classList.add("save-status--success");
        })
        .catch((err) => {
            console.error("Gagal simpan:", err);
            saveStatus.textContent = "Gagal simpan ke database, tapi URL tetap bisa dipakai.";
            saveStatus.classList.add("save-status--error");
        })
        .finally(() => {
            generateBtn.disabled = false;
            generateBtn.textContent = "Generate";
        });
});

// ===============================
// COPY / BUKA / RESET
// ===============================
copyBtn.addEventListener("click", function () {
    const url = resultUrl.textContent.trim();
    if (url === DEFAULT_RESULT_TEXT) {
        alert("Silakan generate URL terlebih dahulu.");
        return;
    }
    navigator.clipboard.writeText(url).then(() => {
        copyBtn.textContent = "Tersalin!";
        setTimeout(() => { copyBtn.textContent = DEFAULT_COPY_TEXT; }, 1500);
    }).catch(() => alert("Gagal menyalin link."));
});

copyMessageBtn.addEventListener("click", function () {
    const message = messagePreview.textContent.trim();
    if (message === DEFAULT_MESSAGE_TEXT) {
        alert("Silakan generate URL terlebih dahulu.");
        return;
    }
    navigator.clipboard.writeText(message).then(() => {
        copyMessageBtn.textContent = "Tersalin!";
        setTimeout(() => { copyMessageBtn.textContent = DEFAULT_COPY_MESSAGE_TEXT; }, 1500);
    }).catch(() => alert("Gagal menyalin pesan."));
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
    if (currentMode === "admin") {
        websiteSelect.selectedIndex = 0;
    }
    resultUrl.textContent = DEFAULT_RESULT_TEXT;
    messagePreview.textContent = DEFAULT_MESSAGE_TEXT;
    saveStatus.textContent = "";
    saveStatus.className = "save-status";
    copyBtn.textContent = DEFAULT_COPY_TEXT;
    copyMessageBtn.textContent = DEFAULT_COPY_MESSAGE_TEXT;
});