const API_URL = "https://script.google.com/macros/s/AKfycbzrZ9KEhDa0GD_aahb-2BbTGi8e46NZwYz-xRs5KBl_WVnSRuyn1aWuVKjziwvwgDvK7Q/exec";

// Auth Check
if (!localStorage.getItem("userEmail") || !localStorage.getItem("userId")) {
    window.location.replace("index.html");
}

let userBalance = 0; let userBanks = []; let userHistoryArray = []; let isFetching = false;

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("displayEmail").innerText = localStorage.getItem("userEmail");
    loadAppData(); 
    setInterval(loadAppData, 3000);
});

function confirmLogout() {
    if(confirm("Xác nhận đăng xuất?")) { localStorage.clear(); window.location.replace("index.html"); }
}

function showToast(msg) {
    const t = document.getElementById("toastMsg"); t.innerText = msg; t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2000);
}

function copyText(text) { navigator.clipboard.writeText(text).then(() => { showToast("Đã sao chép!"); }); }
function formatInput(input) { let val = input.value.replace(/\D/g, ''); input.value = val ? new Intl.NumberFormat('vi-VN').format(val) : ''; }
function setAmount(id, val) { document.getElementById(id).value = new Intl.NumberFormat('vi-VN').format(val); if(id === 'loto-amount') calcLoto(); }

function navigate(viewId) {
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    if(document.getElementById('nav-'+viewId)) {
        document.getElementById('nav-'+viewId).classList.add('active');
    } else if (viewId.includes('history') || viewId === 'add' || viewId === 'withdraw' || viewId === 'bank' || viewId === 'pwd') {
        document.getElementById('nav-profile').classList.add('active');
    }

    if(viewId === 'detail') {
        document.getElementById('main-header').style.display = 'none';
        document.getElementById('main-nav').style.display = 'none';
        document.body.style.backgroundImage = 'radial-gradient(circle at 50% -20%, rgba(245, 158, 11, 0.15), transparent 70%)';
    } else {
        document.getElementById('main-header').style.display = 'flex';
        document.getElementById('main-nav').style.display = 'flex';
        document.body.style.backgroundImage = 'none';
    }

    document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + viewId).classList.add('active');
    document.querySelectorAll('.sys-msg').forEach(m => m.innerText = '');
    window.scrollTo(0,0);
    
    if(viewId === 'loto') calcLoto();
    if(viewId === 'history-deposit') renderHistoryByType('Nạp tiền', 'historyList-deposit');
    if(viewId === 'history-withdraw') renderHistoryByType('Rút tiền', 'historyList-withdraw');
    if(viewId === 'history-bet') renderHistoryByType('Đặt cược', 'historyList-bet');
}

async function loadAppData() {
    if(isFetching) return; isFetching = true;
    try {
        const res = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "get_data", userId: localStorage.getItem("userId") }) });
        const result = await res.json();
        if (result.status === "success") {
            userBalance = result.balance || 0; userBanks = result.banks || []; userHistoryArray = result.history || [];
            const balFmt = new Intl.NumberFormat('vi-VN').format(userBalance);
            document.getElementById("topBalance").innerText = balFmt + ' ₫';
            document.getElementById("displayBalanceBig").innerText = balFmt;
            renderBankList(); populateBankDropdown();
            if(document.getElementById('view-history-deposit').classList.contains('active')) renderHistoryByType('Nạp tiền', 'historyList-deposit');
            if(document.getElementById('view-history-withdraw').classList.contains('active')) renderHistoryByType('Rút tiền', 'historyList-withdraw');
            if(document.getElementById('view-history-bet').classList.contains('active')) renderHistoryByType('Đặt cược', 'historyList-bet');
        }
    } catch (e) {} isFetching = false;
}

function renderHistoryByType(type, containerId) {
    const container = document.getElementById(containerId); if (!container) return; 
    let filtered = userHistoryArray.filter(h => h.type === type);
    if (filtered.length === 0) return container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px; font-size: 14px;">Chưa có lịch sử giao dịch.</div>';
    
    container.innerHTML = "";
    filtered.forEach(item => {
        const amountFmt = new Intl.NumberFormat('vi-VN').format(item.amount);
        let rawSt = item.status ? item.status.toLowerCase() : "";
        let stClass = "pending", stText = item.status || "Chờ xử lý";
        if(rawSt.includes("thành công") || rawSt.includes("hoàn tất") || rawSt.includes("thắng")) stClass = "success";
        else if(rawSt.includes("từ chối") || rawSt.includes("hủy") || rawSt.includes("thất bại") || rawSt.includes("trượt")) stClass = "failed";

        let icon = "fa-exchange-alt", color = "var(--text-muted)";
        if(item.type === "Nạp tiền") { icon = "fa-arrow-down"; color = "#34d399"; }
        if(item.type === "Rút tiền") { icon = "fa-arrow-up"; color = "#f87171"; }
        if(item.type === "Đặt cược") { icon = "fa-dice"; color = "#f59e0b"; }

        let displayId = item.id; if(!displayId.match(/(TXN|IN|OUT|BET)/)) displayId = "#" + displayId;

        container.innerHTML += `
        <div style="background: rgba(255,255,255,0.02); border-radius: 16px; padding: 16px; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; cursor: pointer; margin-bottom: 16px;" onclick="openDetail('${item.id}')">
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <span style="color: ${color}; font-weight: 800; font-size: 14px;"><i class="fas ${icon}"></i> ${item.type}</span>
                <span style="font-size: 11px; color: var(--text-muted);">${displayId} | ${item.time}</span>
                <span style="font-weight:bold; color: #fff; font-size: 13px;">${item.detail}</span>
            </div>
            <div style="text-align: right; display: flex; flex-direction: column; gap: 6px;">
                <span style="font-weight: 900; font-size: 16px; color: var(--text-main);">${amountFmt} ₫</span>
                <span style="font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px; display:inline-block; margin-left:auto; background:var(--status-${stClass}-bg); color:var(--status-${stClass}-text); border:1px solid rgba(255,255,255,0.1)">${stText}</span>
            </div>
        </div>`;
    });
}

function openDetail(txId) {
    const tx = userHistoryArray.find(t => t.id === txId); if(!tx) return;
    let displayId = tx.id; if(!displayId.match(/(TXN|IN|OUT|BET)/)) displayId = "#" + displayId;
    document.getElementById("rc-id").innerText = displayId; document.getElementById("rc-type").innerText = tx.type;
    document.getElementById("rc-detail").innerText = tx.detail; document.getElementById("rc-time").innerText = tx.time; 
    document.getElementById("rc-amount-row").innerText = new Intl.NumberFormat('vi-VN').format(tx.amount) + ' ₫';
    
    const titleEl = document.getElementById("rc-title-status"); const iconWrap = document.getElementById("rc-icon-wrapper");
    let rawSt = tx.status ? tx.status.toLowerCase() : ""; titleEl.innerText = tx.status || "Chờ xử lý";
    
    if(rawSt.includes("thành công") || rawSt.includes("hoàn tất") || rawSt.includes("thắng")) { 
        titleEl.style.color = "#34d399"; iconWrap.style.background = "rgba(52, 211, 153, 0.15)"; iconWrap.style.boxShadow = "0 0 30px rgba(52, 211, 153, 0.4)"; iconWrap.innerHTML = '<i class="fas fa-check" style="font-size:32px; color:#34d399;"></i>'; 
    } else if (rawSt.includes("từ chối") || rawSt.includes("hủy") || rawSt.includes("thất bại") || rawSt.includes("trượt")) { 
        titleEl.style.color = "#f87171"; iconWrap.style.background = "rgba(248, 113, 113, 0.15)"; iconWrap.style.boxShadow = "0 0 30px rgba(248, 113, 113, 0.4)"; iconWrap.innerHTML = '<i class="fas fa-times" style="font-size:32px; color:#f87171;"></i>'; 
    } else { 
        titleEl.style.color = "#fbbf24"; iconWrap.style.background = "rgba(251, 191, 36, 0.15)"; iconWrap.style.boxShadow = "0 0 30px rgba(251, 191, 36, 0.4)"; iconWrap.innerHTML = '<i class="fas fa-clock" style="font-size:32px; color:#fbbf24;"></i>'; 
    }
    navigate('detail');
}

function renderBankList() {
    const container = document.getElementById("bank-list-container"); const formSection = document.getElementById("bank-form-section");
    if(userBanks.length > 0) {
        let bk = userBanks[0];
        container.innerHTML = `<div style="background:var(--bg-surface); border:1px solid var(--brand-primary); padding:16px; border-radius:16px; margin-bottom:16px; border-left: 4px solid var(--brand-primary);"><div style="font-size:16px; font-weight:900; color:var(--brand-primary); margin-bottom:4px;">${bk.bankName}</div><div style="font-family:monospace; font-size:16px; font-weight:bold; color:white;">${bk.accountNumber} - ${bk.accountName}</div><div style="margin-top:12px; font-size:12px; color:#fbbf24;">* Mỗi tài khoản chỉ được liên kết 1 ngân hàng.</div><button onclick="document.getElementById('bank-form-section').style.display='block'" style="margin-top:12px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); padding:8px 12px; border-radius:8px; color:white; cursor:pointer; font-weight:bold; width:100%;">THAY ĐỔI</button></div>`;
        formSection.style.display = "none";
    } else { 
        container.innerHTML = '<div style="color:var(--text-muted); font-size:14px; margin-bottom:16px;">Bạn chưa có ngân hàng.</div>'; formSection.style.display = "block"; 
    }
}

function populateBankDropdown() {
    const select = document.getElementById("wd-bank"); 
    if(userBanks.length === 0) return select.innerHTML = '<option value="">Vui lòng thêm ngân hàng trước</option>';
    select.innerHTML = ''; userBanks.forEach((bk, index) => { select.innerHTML += `<option value="${index}">${bk.bankName} - ${bk.accountNumber}</option>`; });
}

async function submitDeposit() {
    let amountStr = document.getElementById('amount-add').value.replace(/\D/g, ''); let amount = parseInt(amountStr); let msgBox = document.getElementById('msg-add');
    if(!amountStr || amount < 2000) return (msgBox.style.color="#f87171", msgBox.innerText="Nạp tối thiểu 2.000đ!");
    let content = "MB" + Math.floor(100000 + Math.random() * 900000); document.getElementById('btn-add').innerText = 'ĐANG XỬ LÝ...'; document.getElementById('btn-add').disabled = true;
    try {
        const res = await fetch(API_URL, { method: "POST", headers: {"Content-Type":"text/plain"}, body: JSON.stringify({ action: "create_payment", email: localStorage.getItem("userEmail"), userId: localStorage.getItem("userId"), amount: amount, content: content }) });
        const result = await res.json();
        if(result.status === "success") { showToast("Thành công!"); document.getElementById('amount-add').value=''; setTimeout(()=>navigate('history-deposit'), 1000); loadAppData(); } 
        else { msgBox.style.color="#f87171"; msgBox.innerText=result.message; }
    } catch(e) { msgBox.style.color="#f87171"; msgBox.innerText="Lỗi kết nối!"; } finally { document.getElementById('btn-add').innerText='TẠO LỆNH NẠP'; document.getElementById('btn-add').disabled = false; }
}

async function submitWithdraw() {
    let amountStr = document.getElementById('amount-wd').value.replace(/\D/g, ''); let amount = parseInt(amountStr); let bankIdx = document.getElementById('wd-bank').value; let msgBox = document.getElementById('msg-wd');
    if(userBanks.length === 0 || bankIdx === "") return (msgBox.style.color="#f87171", msgBox.innerText="Vui lòng thêm ngân hàng!");
    if(!amountStr || amount < 100000) return (msgBox.style.color="#f87171", msgBox.innerText="Rút tối thiểu 100.000đ!");
    if(amount > userBalance) return (msgBox.style.color="#f87171", msgBox.innerText="Số dư không đủ!");
    let selectedBank = userBanks[bankIdx]; document.getElementById('btn-wd').innerText = 'ĐANG XỬ LÝ...'; document.getElementById('btn-wd').disabled = true;
    try {
        const res = await fetch(API_URL, { method: "POST", headers: {"Content-Type":"text/plain"}, body: JSON.stringify({ action: "create_withdraw", email: localStorage.getItem("userEmail"), userId: localStorage.getItem("userId"), amount: amount, bankName: selectedBank.bankName, accountNumber: selectedBank.accountNumber, accountName: selectedBank.accountName, content: "Rút tiền" }) });
        const result = await res.json();
        if(result.status === "success") { showToast("Thành công!"); document.getElementById('amount-wd').value=''; setTimeout(()=>navigate('history-withdraw'), 1000); loadAppData(); } 
        else { msgBox.style.color="#f87171"; msgBox.innerText=result.message; }
    } catch(e) { msgBox.style.color="#f87171"; msgBox.innerText="Lỗi kết nối!"; } finally { document.getElementById('btn-wd').innerText='TẠO LỆNH RÚT'; document.getElementById('btn-wd').disabled = false; }
}

async function submitBank() {
    let name = document.getElementById('bk-name').value.trim(); let acc = document.getElementById('bk-acc').value.trim(); let owner = document.getElementById('bk-owner').value.trim().toUpperCase(); let branch = document.getElementById('bk-branch').value.trim(); let msgBox = document.getElementById('msg-bank');
    if(!name || !acc || !owner) return (msgBox.style.color="#f87171", msgBox.innerText="Nhập đủ Tên NH, STK và Tên Chủ TK!");
    document.getElementById('btn-bank').innerText = 'ĐANG XỬ LÝ...'; document.getElementById('btn-bank').disabled = true;
    try {
        const res = await fetch(API_URL, { method: "POST", headers: {"Content-Type":"text/plain"}, body: JSON.stringify({ action: "add_bank", email: localStorage.getItem("userEmail"), userId: localStorage.getItem("userId"), bankName: name, bin: "", accountNumber: acc, accountName: owner, branch: branch }) });
        const result = await res.json();
        if(result.status === "success") { showToast("Cập nhật thành công!"); setTimeout(()=>navigate('profile'), 1000); loadAppData(); } 
        else { msgBox.style.color="#f87171"; msgBox.innerText=result.message; }
    } catch(e) { msgBox.style.color="#f87171"; msgBox.innerText="Lỗi kết nối!"; } finally { document.getElementById('btn-bank').innerText='CẬP NHẬT NGÂN HÀNG'; document.getElementById('btn-bank').disabled = false; }
}

function calcLoto() {
    let amount = parseInt(document.getElementById('loto-amount').value.replace(/\D/g, '')) || 0;
    let opt = document.getElementById('loto-type').options[document.getElementById('loto-type').selectedIndex];
    let rate = parseFloat(opt.getAttribute("data-rate")); let cost = parseInt(opt.getAttribute("data-cost")); let xien = opt.getAttribute("data-xien"); 
    let count = document.getElementById('loto-nums').value.split(',').filter(s => s.trim() !== "").length || 1; 
    let totalPay = xien ? amount : (amount * cost * count);
    
    let hintEl = document.getElementById('loto-hint');
    if (xien) hintEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> Xiên ${xien}: Yêu cầu nhập <b>${xien} số</b>.`;
    else if (cost > 1) hintEl.innerHTML = `<i class="fas fa-info-circle"></i> Có <b>${cost} giải</b>.`;
    else hintEl.innerHTML = `<i class="fas fa-info-circle"></i> Đặt cược giải duy nhất.`;

    document.getElementById('loto-total').innerText = new Intl.NumberFormat('vi-VN').format(totalPay) + ' ₫';
    document.getElementById('loto-win').innerText = new Intl.NumberFormat('vi-VN').format(amount * rate) + (count>1 && !xien?' ₫/số':' ₫');
}

async function submitLoto() {
    let amount = parseInt(document.getElementById('loto-amount').value.replace(/\D/g, '')) || 0;
    let nums = document.getElementById('loto-nums').value.trim(); let msgBox = document.getElementById('msg-loto');
    let opt = document.getElementById('loto-type').options[document.getElementById('loto-type').selectedIndex];
    let rate = parseFloat(opt.getAttribute("data-rate")); let cost = parseInt(opt.getAttribute("data-cost")); let xien = opt.getAttribute("data-xien");
    let count = nums.split(',').filter(s => s.trim() !== "").length;

    if(!nums || count === 0) return (msgBox.style.color="#f87171", msgBox.innerText="Vui lòng nhập số!");
    if (xien && count !== parseInt(xien)) return (msgBox.style.color="#f87171", msgBox.innerText=`Lô Xiên ${xien} bắt buộc nhập ${xien} số!`);
    if(amount < 1000) return (msgBox.style.color="#f87171", msgBox.innerText="Cược tối thiểu 1.000đ!");
    let totalPay = xien ? amount : (amount * cost * count);
    if(totalPay > userBalance) return (msgBox.style.color="#f87171", msgBox.innerText=`Số dư không đủ! (Cần ${new Intl.NumberFormat('vi-VN').format(totalPay)}đ)`);

    document.getElementById('btn-loto').innerText = 'ĐANG CHỐT ĐƠN...'; document.getElementById('btn-loto').disabled = true;
    try {
        const res = await fetch(API_URL, { method: "POST", headers: {"Content-Type":"text/plain"}, body: JSON.stringify({ action: "place_bet", email: localStorage.getItem("userEmail"), userId: localStorage.getItem("userId"), gameType: opt.value, rate: xien?rate:(rate/cost), betNumbers: nums, amount: totalPay }) });
        const result = await res.json();
        if(result.status === "success") { showToast("Cược thành công!"); document.getElementById('loto-nums').value=''; document.getElementById('loto-amount').value=''; calcLoto(); setTimeout(()=>navigate('history-bet'), 1500); loadAppData(); } 
        else { msgBox.style.color="#f87171"; msgBox.innerText=result.message; }
    } catch(e) { msgBox.style.color="#f87171"; msgBox.innerText="Lỗi kết nối!"; } finally { document.getElementById('btn-loto').innerText='XÁC NHẬN CƯỢC'; document.getElementById('btn-loto').disabled = false; }
}

async function changePassword() {
    const oldPwd = document.getElementById("old-pwd").value; const newPwd = document.getElementById("new-pwd").value; const confirmPwd = document.getElementById("confirm-pwd").value; const msgBox = document.getElementById("pwd-msg");
    if(!oldPwd || !newPwd || !confirmPwd) return (msgBox.style.color="#f87171", msgBox.innerText="Nhập đủ thông tin!");
    if(newPwd !== confirmPwd) return (msgBox.style.color="#f87171", msgBox.innerText="Mật khẩu không khớp!");
    if(newPwd.length < 6) return (msgBox.style.color="#f87171", msgBox.innerText="Ít nhất 6 ký tự!");
    document.getElementById('pwdBtn').innerText = 'ĐANG XỬ LÝ...'; document.getElementById('pwdBtn').disabled = true;
    try {
        const res = await fetch(API_URL, { method: "POST", headers: {"Content-Type":"text/plain"}, body: JSON.stringify({ action: "change_password", email: localStorage.getItem("userEmail"), userId: localStorage.getItem("userId"), oldPassword: oldPwd, newPassword: newPwd }) });
        const result = await res.json();
        if(result.status === "success") { showToast("Đổi thành công!"); setTimeout(()=>navigate('profile'), 1500); } 
        else { msgBox.style.color="#f87171"; msgBox.innerText=result.message; }
    } catch(e) { msgBox.style.color="#f87171"; msgBox.innerText="Lỗi kết nối!"; } finally { document.getElementById('pwdBtn').innerText='CẬP NHẬT MẬT KHẨU'; document.getElementById('pwdBtn').disabled = false; }
}
