// Menggunakan path absolut untuk keandalan
import { supabase } from '../supabaseClient.js';

// --- ELEMEN DOM ---
const signupForm = document.getElementById('signup-form');
const nameInput = document.getElementById('signup-name');
const universityInput = document.getElementById('signup-university');
const emailInput = document.getElementById('signup-email');
const passwordInput = document.getElementById('signup-password');
const password2Input = document.getElementById('signup-password2');
const signupMessage = document.getElementById('signup-message');
const passwordMatchMsg = document.getElementById('password-match-msg');

// Elemen untuk validasi password
const reqLength = document.getElementById('req-length');
const reqUpper = document.getElementById('req-upper');
const reqNumber = document.getElementById('req-number');

// --- FUNGSI VALIDASI REAL-TIME ---

function validatePassword() {
    const pass = passwordInput.value;
    
    // Cek panjang
    reqLength.className = pass.length >= 6 ? 'valid' : 'invalid';
    // Cek huruf besar
    reqUpper.className = /[A-Z]/.test(pass) ? 'valid' : 'invalid';
    // Cek angka
    reqNumber.className = /[0-9]/.test(pass) ? 'valid' : 'invalid';
}

function checkPasswordMatch() {
    const pass1 = passwordInput.value;
    const pass2 = password2Input.value;

    if (pass2.length === 0) {
        passwordMatchMsg.textContent = '';
        return;
    }
    
    if (pass1 === pass2) {
        passwordMatchMsg.textContent = '✅ Cocok';
        passwordMatchMsg.style.color = 'green';
    } else {
        passwordMatchMsg.textContent = '❌ Tidak Cocok';
        passwordMatchMsg.style.color = 'red';
    }
}

// --- EVENT LISTENERS ---
passwordInput.addEventListener('input', validatePassword);
passwordInput.addEventListener('input', checkPasswordMatch);
password2Input.addEventListener('input', checkPasswordMatch);

signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Ambil semua data dari form
    const fullName = nameInput.value;
    const university = universityInput.value;
    const email = emailInput.value;
    const password = passwordInput.value;
    const password2 = password2Input.value;

    // Final check sebelum submit
    if (password !== password2) {
        signupMessage.textContent = 'Error: Password tidak cocok!';
        signupMessage.style.color = 'red';
        return;
    }
    
    if (reqLength.classList.contains('invalid') || reqUpper.classList.contains('invalid') || reqNumber.classList.contains('invalid')) {
        signupMessage.textContent = 'Error: Password belum memenuhi semua kriteria.';
        signupMessage.style.color = 'red';
        return;
    }

    signupMessage.textContent = 'Mendaftarkan...';
    signupMessage.style.color = '#555';

    // Proses pendaftaran ke Supabase dengan data tambahan
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                full_name: fullName,
                university: university
            }
        }
    });

    if (error) {
        signupMessage.textContent = `Error: ${error.message}`;
        signupMessage.style.color = 'red';
    } else {
        signupMessage.textContent = 'Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.';
        signupMessage.style.color = 'green';
        
        signupForm.reset();
        
        setTimeout(() => {
            window.location.href = '../login/login.html'; // Path absolut ke halaman login
        }, 3000);
    }
});