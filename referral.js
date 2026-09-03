const urlParams = new URLSearchParams(window.location.search);
const referralCode = urlParams.get("kode");

const stateLoading = document.getElementById("stateLoading");
const stateNotFound = document.getElementById("stateNotFound");
const stateSaldo = document.getElementById("stateSaldo");
const statePromo = document.getElementById("statePromo");

function formatRupiah(num) {
    return `Rp ${Number(num).toLocaleString("id-ID")}`;
}

function formatDate(isoString) {
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function showState(stateEl) {
    [stateLoading, stateNotFound, stateSaldo, statePromo].forEach(el => {
        el.style.display = "none";
    });
    stateEl.style.display = "block";
}

async function loadSaldo() {
    showState(stateLoading);

    const { data, error } = await sb.rpc("get_referral_balance", { p_referral_code: referralCode });

    if (error || !data || data.length === 0) {
        console.error("Kode referral tidak ditemukan:", error);
        showState(stateNotFound);
        return;
    }

    const info = data[0];

    document.getElementById("partnerName").textContent = info.partner_name;
    document.getElementById("partnerTypeBadge").textContent = info.partner_type === "mitra" ? "Mitra Prioritas" : "Referral";
    document.getElementById("totalEarned").textContent = formatRupiah(info.total_earned);
    document.getElementById("totalWithdrawn").textContent = formatRupiah(info.total_withdrawn);
    document.getElementById("availableBalance").textContent = formatRupiah(info.available_balance);

    const transactionsList = document.getElementById("transactionsList");
    const transactions = info.transactions || [];
    if (transactions.length === 0) {
        transactionsList.innerHTML = `<p class="empty-hint">Belum ada komisi tercatat.</p>`;
    } else {
        transactionsList.innerHTML = transactions.map(t => `
            <div class="history-item">
                <div>
                    <div>${t.note || "Komisi undangan"}</div>
                    <div class="history-item-date">${formatDate(t.created_at)}</div>
                </div>
                <div class="history-item-amount">+${formatRupiah(t.amount)}</div>
            </div>
        `).join("");
    }

    const withdrawalsList = document.getElementById("withdrawalsList");
    const withdrawals = info.withdrawals || [];
    if (withdrawals.length === 0) {
        withdrawalsList.innerHTML = `<p class="empty-hint">Belum ada riwayat pencairan.</p>`;
    } else {
        const methodLabel = { pulsa: "Pulsa/Kuota", ewallet: "E-Wallet", bank: "Transfer Bank" };
        withdrawalsList.innerHTML = withdrawals.map(w => `
            <div class="history-item">
                <div>
                    <div>${methodLabel[w.method] || w.method}</div>
                    <div class="history-item-date">${formatDate(w.requested_at)}</div>
                    ${w.proof_url ? `<a href="${w.proof_url}" target="_blank" class="proof-link"><i class="fa-solid fa-image"></i> Lihat Bukti</a>` : ''}
                </div>
                <div>
                    <span class="history-item-amount">${formatRupiah(w.amount_requested)}</span>
                    <span class="status-pill ${w.status === 'completed' ? 'status-completed' : 'status-pending'}">
                        ${w.status === 'completed' ? 'Selesai' : 'Diproses'}
                    </span>
                </div>
            </div>
        `).join("");
    }

    showState(stateSaldo);
}

if (referralCode) {
    loadSaldo();
} else {
    showState(statePromo);
}

// CEK SALDO DARI KOTAK DI HALAMAN PROMO
document.getElementById("checkSaldoBtn").addEventListener("click", () => {
    const code = document.getElementById("checkSaldoInput").value.trim();
    if (!code) {
        alert("Silakan masukkan kode referral Anda.");
        return;
    }
    window.location.href = `referral.html?kode=${encodeURIComponent(code)}`;
});

document.getElementById("checkSaldoInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("checkSaldoBtn").click();
});

// FORM AJUKAN PENCAIRAN
const withdrawalForm = document.getElementById("withdrawalForm");
if (withdrawalForm) {
    withdrawalForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const errorEl = document.getElementById("withdrawError");
        const successEl = document.getElementById("withdrawSuccess");
        errorEl.style.display = "none";
        successEl.style.display = "none";

        const amount = parseInt(document.getElementById("withdrawAmount").value, 10);
        const method = document.getElementById("withdrawMethod").value;
        const accountInfo = document.getElementById("withdrawAccountInfo").value.trim();

        const minimum = method === "pulsa" ? 5000 : 10000;
        if (!amount || amount < minimum) {
            errorEl.textContent = `Minimal pencairan untuk metode ini adalah ${formatRupiah(minimum)}.`;
            errorEl.style.display = "block";
            return;
        }
        if (!accountInfo) {
            errorEl.textContent = "Mohon isi detail tujuan pencairan.";
            errorEl.style.display = "block";
            return;
        }

        const submitBtn = document.getElementById("withdrawSubmitBtn");
        submitBtn.disabled = true;
        submitBtn.textContent = "Mengirim...";

        const { error } = await sb.rpc("request_withdrawal", {
            p_referral_code: referralCode,
            p_amount: amount,
            p_method: method,
            p_account_info: accountInfo
        });

        submitBtn.disabled = false;
        submitBtn.textContent = "Ajukan Pencairan";

        if (error) {
            console.error("Gagal ajukan pencairan:", error);
            errorEl.textContent = error.message || "Gagal mengajukan pencairan. Coba lagi.";
            errorEl.style.display = "block";
            return;
        }

        successEl.style.display = "block";
        withdrawalForm.reset();
        await loadSaldo(); // refresh saldo & riwayat
    });
}