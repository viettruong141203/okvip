const API_URL = "https://script.google.com/macros/s/AKfycbzrZ9KEhDa0GD_aahb-2BbTGi8e46NZwYz-xRs5KBl_WVnSRuyn1aWuVKjziwvwgDvK7Q/exec";

function switchForm() {
    document.getElementById("login-form").classList.toggle("active");
    document.getElementById("register-form").classList.toggle("active");
    document.getElementById("login-msg").innerText = "";
    document.getElementById("reg-msg").innerText = "";
    document.querySelectorAll("input").forEach(input => input.value = "");
}

async function sendAuthData(payload, btnElement, msgElement) {
    const originalText = btnElement.innerText;
    btnElement.innerText = "Đang xử lý...";
    btnElement.disabled = true;
    msgElement.innerText = "";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        msgElement.style.color = result.status === "success" ? "#00e676" : "#ff4d4d";
        msgElement.innerText = result.message;
        
        if (result.status === "success" && payload.action === "login") {
            // Lưu thông tin người dùng vào LocalStorage
            localStorage.setItem("userEmail", result.email);
            localStorage.setItem("userId", result.id);
            
            setTimeout(() => {
                window.location.href = "payment.html"; // Chuyển hướng
            }, 1000);
        }

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
        msgElement.innerText = "Lỗi kết nối máy chủ!";
    } finally {
        btnElement.innerText = originalText;
        btnElement.disabled = false;
    }
}

function register() {
    const email = document.getElementById("reg-email").value.trim();
    const pass = document.getElementById("reg-password").value.trim();
    const msgBox = document.getElementById("reg-msg");
    
    if (!email || !pass) return (msgBox.style.color = "#ff4d4d", msgBox.innerText = "Điền đủ thông tin!");
    sendAuthData({ action: "register", email, password: pass }, document.getElementById("reg-btn"), msgBox);
}

function login() {
    const email = document.getElementById("login-email").value.trim();
    const pass = document.getElementById("login-password").value.trim();
    const msgBox = document.getElementById("login-msg");
    
    if (!email || !pass) return (msgBox.style.color = "#ff4d4d", msgBox.innerText = "Điền đủ thông tin!");
    sendAuthData({ action: "login", email, password: pass }, document.getElementById("login-btn"), msgBox);
}
