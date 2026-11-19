import { auth, onAuthStateChanged, $ , setNotice } from "./app.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
const form = $("#login-form");
onAuthStateChanged(auth, user => { if (user) location.replace("./scanner.html"); });
form.addEventListener("submit", async event => {
  event.preventDefault();
  const button = form.querySelector("button");
  button.disabled = true; button.textContent = "Memeriksa akun…";
  try {
    await signInWithEmailAndPassword(auth, $("#email").value.trim(), $("#password").value);
    location.replace("./scanner.html");
  } catch (error) {
    const messages = { "auth/invalid-credential":"Email atau password tidak sesuai.", "auth/too-many-requests":"Terlalu banyak percobaan. Coba beberapa saat lagi.", "auth/network-request-failed":"Koneksi internet bermasalah." };
    setNotice($("#login-message"), messages[error.code] || "Login gagal. Periksa akun dan konfigurasi Firebase.", "error");
    button.disabled = false; button.textContent = "Masuk ke Dashboard";
  }
});
