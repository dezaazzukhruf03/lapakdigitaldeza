const urlParams = new URLSearchParams(window.location.search);
const orderCode = urlParams.get("kode");

const stateLookup = document.getElementById("stateLookup");
const stateLoading = document.getElementById("stateLoading");
const stateNotFound = document.getElementById("stateNotFound");
const stateResult = document.getElementById("stateResult");

const STATUS_ORDER = ["menunggu_pembayaran", "dibayar", "data_lengkap", "diproses", "selesai"];

function showState(el) {
    [stateLookup, stateLoading, stateNotFound, stateResult].forEach(s => {
        s.style.display = "none";
    });
    el.style.display = "block";
}

function formatRupiah(num) {
    if (num === null || num === undefined) return "-";
    return `Rp ${Number(num).toLocaleString("id-ID")}`;
}

function formatDate(isoString) {
    if (!isoString) return "-";
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

async function loadStatus(code) {
    showState(stateLoading);

    const { data, error } = await sb.rpc("get_order_status", { p_order_code: code });

    if (error || !data || data.length === 0) {
        console.error("Kode pesanan tidak ditemukan:", error);
        showState(stateNotFound);
        return;
    }

    const order = data[0];

    // Kartu kode pesanan
    document.getElementById("orderCodeDisplay").textContent = order.order_code;

    // Stepper
    const currentIndex = STATUS_ORDER.indexOf(order.status);
    document.querySelectorAll(".status-step").forEach(stepEl => {
        const stepIndex = STATUS_ORDER.indexOf(stepEl.dataset.status);
        stepEl.classList.remove("completed", "active");
        if (stepIndex < currentIndex) {
            stepEl.classList.add("completed");
        } else if (stepIndex === currentIndex) {
            stepEl.classList.add("active");
        }
    });

    // Detail pesanan
    document.getElementById("detailCustomerName").textContent = order.customer_name || "-";
    document.getElementById("detailTemplate").textContent = order.template_title || "-";
    document.getElementById("detailPackage").textContent = order.package_name || "-";
    document.getElementById("detailPrice").textContent = formatRupiah(order.package_price);
    document.getElementById("detailDate").textContent = formatDate(order.created_at);

    // Kalau sudah selesai & ada link undangan jadi
    if (order.status === "selesai" && order.final_site_url) {
        document.getElementById("finalSiteBox").style.display = "block";
        document.getElementById("finalSiteLink").href = order.final_site_url;
    }

    showState(stateResult);
}

if (orderCode) {
    loadStatus(orderCode);
} else {
    showState(stateLookup);
}

// LOOKUP: masukkan kode manual
document.getElementById("lookupBtn").addEventListener("click", () => {
    const code = document.getElementById("lookupCodeInput").value.trim();
    if (!code) {
        alert("Silakan masukkan Kode Pesanan Anda.");
        return;
    }
    window.location.href = `status.html?kode=${encodeURIComponent(code)}`;
});

document.getElementById("lookupCodeInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("lookupBtn").click();
});