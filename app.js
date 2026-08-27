const API_URL = "https://script.google.com/macros/s/AKfycbzrZ9KEhDa0GD_aahb-2BbTGi8e46NZwYz-xRs5KBl_WVnSRuyn1aWuVKjziwvwgDvK7Q/exec";
const userEmail = localStorage.getItem("userEmail");
const userId = localStorage.getItem("userId");

if (!userEmail || !userId) {
    if(!window.location.pathname.includes('index.html')) {
        window.location.replace("index.html");
    }
}

let userBalance = 0;
let userBanks = [];
let userHistoryArray = [];
let isFetching = false;
let currentHistoryFilter = 'All';

document.addEventListener("DOMContentLoaded", () => {
    if(document.getElementById("displayEmail")) document.getElementById("displayEmail").innerText = userEmail;
    loadAppData();
    setInterval(loadAppData, 3000);
});

function confirmLogout() {
    if(confirm("Bạn có chắc chắn muốn đăng xuất?")) { localStorage.clear(); window.location.replace("index.html"); }
}

function showToast(msg) {
    let t = document.getElementById("toastMsg");
    if(!t) {
        t = document.createElement("div"); t.id = "toastMsg"; t.className = "toast"; document.body.appendChild(t);
    }
    t.innerText = msg; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 2000);
}

function formatTimeUI(timeStr) {
    if (!timeStr) return "";
    if (typeof timeStr === 'string' && timeStr.includes('/')) return timeStr; 
    try {
        let d = new Date(timeStr); if (isNaN(d.getTime())) return timeStr;
        let hh = String(d.getHours()).padStart(2, '0'); let mm = String(d.getMinutes()).padStart(2, '0'); let ss = String(d.getSeconds()).padStart(2, '0');
        let dd = String(d.getDate()).padStart(2, '0'); let mo = String(d.getMonth() + 1).padStart(2, '0');
        return `${hh}:${mm}:${ss} ${dd}/${mo}/${d.getFullYear()}`;
    } catch(e) { return timeStr; }
}

async function loadAppData() {
    if(isFetching) return;
    isFetching = true;
    try {
        const response = await fetch(API_URL, {
            method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "get_data", userId: userId })
        });
        const result = await response.json();
        
        if (result.status === "success") {
            userBalance = result.balance || 0;
            userBanks = result.banks || [];
            userHistoryArray = result.history || [];
            
            const balFormatted = new Intl.NumberFormat('vi-VN').format(userBalance);
            if(document.getElementById("topBalance")) document.getElementById("topBalance").innerText = balFormatted + ' ₫';
            if(document.getElementById("displayBalanceBig")) document.getElementById("displayBalanceBig").innerText = balFormatted;
            
            if(document.getElementById("historyList")) renderHistory();
            if(document.getElementById("bank-list-container")) renderBankList();
            if(document.getElementById("wd-bank")) populateBankDropdown();
        }
    } catch (error) {}
    isFetching = false;
}

function openDetail(txId) {
    localStorage.setItem("currentDetailId", txId);
    window.location.href = "detail.html";
}

function copyText(text) {
    navigator.clipboard.writeText(text).then(() => { showToast("Đã sao chép!"); });
}
