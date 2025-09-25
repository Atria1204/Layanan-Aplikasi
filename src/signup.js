import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://jemojmbnrhyalgcdqruj.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplbW9qbWJucmh5YWxnY2RxcnVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxOTQzNzUsImV4cCI6MjA3Mzc3MDM3NX0.Z2Dl7Lx6RtXI6u_e5qlRt8CENVqBRwFSKKakeoRa45M";
export const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signup-form");
  const signupEmail = document.getElementById("signup-email");
  const signupPassword = document.getElementById("signup-password");
  const signupPassword2 = document.getElementById("signup-password2");
  const signupMessage = document.getElementById("signup-message");
  const passwordMatchMsg = document.getElementById("password-match-msg");

  // === Password strength indicator ===
  const reqLength = document.getElementById("req-length");
  const reqUpper = document.getElementById("req-upper");
  const reqNumber = document.getElementById("req-number");

  signupPassword.addEventListener("input", () => {
    const val = signupPassword.value;
    reqLength.className = val.length >= 6 ? "valid" : "invalid";
    reqUpper.className = /[A-Z]/.test(val) ? "valid" : "invalid";
    reqNumber.className = /\d/.test(val) ? "valid" : "invalid";
  });

  // === Realtime cek password sama ===
  function checkPasswordMatch() {
    if (signupPassword2.value === "") {
      passwordMatchMsg.textContent = "";
      return;
    }
    if (signupPassword.value === signupPassword2.value) {
      passwordMatchMsg.textContent = "✔ Cocok";
      passwordMatchMsg.style.color = "green";
    } else {
      passwordMatchMsg.textContent = "❌ Tidak sama";
      passwordMatchMsg.style.color = "red";
    }
  }

  signupPassword.addEventListener("input", checkPasswordMatch);
  signupPassword2.addEventListener("input", checkPasswordMatch);

  // === Submit signup ===
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = signupEmail.value.trim();
    const password = signupPassword.value.trim();
    const password2 = signupPassword2.value.trim();

    if (password !== password2) {
      signupMessage.textContent = "❌ Password tidak sama.";
      signupMessage.style.color = "red";
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      signupMessage.textContent = "❌ Error: " + error.message;
      signupMessage.style.color = "red";
    } else {
      signupMessage.textContent =
        "✅ Signup berhasil! Silakan cek email Anda untuk verifikasi sebelum login.";
      signupMessage.style.color = "green";
      signupForm.reset();
      passwordMatchMsg.textContent = "";
    }
  });
});
