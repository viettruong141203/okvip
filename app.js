const API_URL = "https://script.google.com/macros/s/AKfycbzrZ9KEhDa0GD_aahb-2BbTGi8e46NZwYz-xRs5KBl_WVnSRuyn1aWuVKjziwvwgDvK7Q/exec";
const userEmail = localStorage.getItem("userEmail");
const userId = localStorage.getItem("userId");

if (!userEmail || !userId) {
    if(!window.location.pathname.includes('index.html')) window.location.replace("index.html");
}

let userBalance = 0; let userBanks = []; let userHistoryArray = []; let isFetching = false;

document.addEventListener("DOMContentLoaded", () => {
    if(document.getElementById("displayEmail")) document.getElementById("displayEmail").innerText = userEmail;
    loadAppData(); setInterval(loadAppData, 3000);
});

function confirmLogout() {
    if(confirm("Bạn có chắc chắn muốn đăng xuất?")) { localStorage.clear(); window.location.replace("index.html"); }
}

function showToast(msg) {
    let t = document.getElementById("toastMsg");
    if(!t) { t = document.createElement("div"); t.id = "toastMsg"; t.className = "toast"; document.body.appendChild(t); }
    t.innerText = msg; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 2000);
}

async function loadAppData() {
    if(isFetching) return;
    isFetching = true;
    try {
        const response = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "get_data", userId: userId }) });
        const result = await response.json();
        
        if (result.status === "success") {
            userBalance = result.balance || 0; userBanks = result.banks || []; userHistoryArray = result.history || [];
            const balFormatted = new Intl.NumberFormat('vi-VN').format(userBalance);
            if(document.getElementById("topBalance")) document.getElementById("topBalance").innerText = balFormatted + ' ₫';
            if(document.getElementById("displayBalanceBig")) document.getElementById("displayBalanceBig").innerText = balFormatted;
            
            if(document.getElementById("bank-list-container")) renderBankList();
            if(document.getElementById("wd-bank")) populateBankDropdown();

            if(document.getElementById("historyList-deposit")) renderHistoryByType('Nạp tiền', 'historyList-deposit');
            if(document.getElementById("historyList-withdraw")) renderHistoryByType('Rút tiền', 'historyList-withdraw');
            if(document.getElementById("historyList-bet")) renderHistoryByType('Đặt cược', 'historyList-bet');
        }
    } catch (error) {}
    isFetching = false;
}

function renderHistoryByType(type, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return; 
    let filtered = userHistoryArray.filter(h => h.type === type);
    if (filtered.length === 0) return container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px; font-size: 14px;">Chưa có lịch sử giao dịch.</div>';

    container.innerHTML = "";
    filtered.forEach(item => {
        const amountFmt = new Intl.NumberFormat('vi-VN').format(item.amount);
        let rawSt = item.status ? item.status.toLowerCase() : "";
        let stClass = "pending", stText = item.status || "Chờ xử lý";

        if(rawSt.includes("thành công") || rawSt.includes("hoàn tất") || rawSt.includes("thắng") || rawSt.includes("trúng")) stClass = "success";
        else if(rawSt.includes("từ chối") || rawSt.includes("hủy") || rawSt.includes("thất bại") || rawSt.includes("trượt")) stClass = "failed";

        let icon = "fa-exchange-alt", color = "var(--text-muted)";
        if(item.type === "Nạp tiền") { icon = "fa-arrow-down"; color = "#34d399"; }
        if(item.type === "Rút tiền") { icon = "fa-arrow-up"; color = "#f87171"; }
        if(item.type === "Đặt cược") { icon = "fa-dice"; color = "#f59e0b"; }

        let displayId = item.id;
        if(!displayId.includes("TXN") && !displayId.includes("IN") && !displayId.includes("OUT") && !displayId.includes("BET")) displayId = "#" + displayId;

        container.innerHTML += `
        <div style="background: var(--bg-surface); border-radius: 12px; padding: 16px; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; cursor: pointer; margin-bottom: 12px;" onclick="openDetail('${item.id}')">
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <span style="color: ${color}; font-weight: 800; font-size: 14px;"><i class="fas ${icon}"></i> ${item.type}</span>
                <span style="font-size: 11px; color: var(--text-muted);">${displayId} | ${item.time}</span>
                <span style="font-weight:bold; color: #fff; font-size: 13px;">${item.detail}</span>
            </div>
            <div style="text-align: right; display: flex; flex-direction: column; gap: 6px;">
                <span style="font-weight: 900; font-size: 16px; color: var(--text-main);">${amountFmt} ₫</span>
                <span class="badge ${stClass}" style="font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px; display:inline-block; margin-left:auto;">${stText}</span>
            </div>
        </div>`;
    });
}

function openDetail(txId) { localStorage.setItem("currentDetailId", txId); window.location.href = "detail.html"; }
function copyText(text) { navigator.clipboard.writeText(text).then(() => { showToast("Đã sao chép!"); }); }
