// URL Web App Google Apps Script của bạn
const API_URL = "https://script.google.com/macros/s/AKfycbzrZ9KEhDa0GD_aahb-2BbTGi8e46NZwYz-xRs5KBl_WVnSRuyn1aWuVKjziwvwgDvK7Q/exec"; 

// Hàm chuyển đổi giữa form Đăng nhập và Đăng ký
function switchForm() {
    document.getElementById("login-form").classList.toggle("active");
    document.getElementById("register-form").classList.toggle("active");
    
    // Xóa thông báo lỗi cũ khi chuyển form
    document.getElementById("login-msg").innerText = "";
    document.getElementById("reg-msg").innerText = "";
    
    // Xóa dữ liệu đã nhập
    document.querySelectorAll("input").forEach(input => input.value = "");
}

// Hàm gửi dữ liệu chung tới Apps Script
async function sendData(payload, btnElement, msgElement) {
    const originalText = btnElement.innerText;
    btnElement.innerText = "Đang xử lý...";
    btnElement.disabled = true;
    msgElement.innerText = "";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            // Gửi dưới dạng text/plain để tránh lỗi CORS Preflight
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        // Hiển thị màu xanh nếu thành công, màu đỏ nếu lỗi
        msgElement.style.color = result.status === "success" ? "#00e676" : "#ff4d4d";
        msgElement.innerText = result.message;
        
        // Nếu đăng nhập thành công
        if (result.status === "success" && payload.action === "login") {
            setTimeout(() => {
                alert("Đăng nhập thành công! Chào mừng: " + result.user);
                // Có thể thêm code chuyển hướng trang tại đây
                // window.location.href = "du-ong-link-trang-chu-cua-ban";
            }, 1000);
        }

        // Nếu đăng ký thành công, tự động chuyển về form đăng nhập
        if (result.status === "success" && payload.action === "register") {
            setTimeout(() => {
                switchForm();
                document.getElementById("login-email").value = payload.email;
                document.getElementById("login-msg").style.color = "#00e676";
                document.getElementById("login-msg").innerText = "Đăng ký thành công! Hãy đăng nhập.";
            }, 1500);
        }
        
    } catch (error) {
        msgElement.style.color = "#ff4d4d";
        msgElement.innerText = "Lỗi kết nối máy chủ! Vui lòng thử lại.";
        console.error("Lỗi:", error);
    } finally {
        btnElement.innerText = originalText;
        btnElement.disabled = false;
    }
}

// Hàm xử lý Đăng Ký
function register() {
    const email = document.getElementById("reg-email").value.trim();
    const pass = document.getElementById("reg-password").value.trim();
    const msgBox = document.getElementById("reg-msg");
    
    if (!email || !pass) {
        msgBox.style.color = "#ff4d4d";
        msgBox.innerText = "Vui lòng nhập đầy đủ E-mail và mật khẩu!";
        return;
    }
    
    // Payload chỉ có E-mail và Mật khẩu
    const payload = { action: "register", email: email, password: pass };
    sendData(payload, document.getElementById("reg-btn"), msgBox);
}

// Hàm xử lý Đăng Nhập
function login() {
    const email = document.getElementById("login-email").value.trim();
    const pass = document.getElementById("login-password").value.trim();
    const msgBox = document.getElementById("login-msg");
    
    if (!email || !pass) {
        msgBox.style.color = "#ff4d4d";
        msgBox.innerText = "Vui lòng nhập đầy đủ E-mail và mật khẩu!";
        return;
    }
    
    const payload = { action: "login", email: email, password: pass };
    sendData(payload, document.getElementById("login-btn"), msgBox);
}
