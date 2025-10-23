import { supabase } from '../supabaseClient.js';

const profileForm = document.getElementById('profile-form');
const fullNameInput = document.getElementById('full_name');
const universityInput = document.getElementById('university');
const submitButton = document.getElementById('submit-button');
const errorMessageEl = document.getElementById('error-message');

let currentUser = null;

async function initializePage() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        alert('Anda harus login untuk mengakses halaman ini.');
        window.location.href = '/login.html';
    } else {
        currentUser = user;
    }
}

profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!currentUser) {
        errorMessageEl.textContent = 'Sesi pengguna tidak ditemukan. Silakan muat ulang halaman.';
        return;
    }

    const fullName = fullNameInput.value;
    const university = universityInput.value;

    submitButton.disabled = true;
    submitButton.textContent = 'Menyimpan...';
    errorMessageEl.textContent = '';

    const { error } = await supabase
        .from('profiles')
        .update({ 
            full_name: fullName, 
            university: university 
        })
        .eq('id', currentUser.id);

    if (error) {
        errorMessageEl.textContent = `Gagal menyimpan profil: ${error.message}`;
        submitButton.disabled = false;
        submitButton.textContent = 'Simpan dan Lanjutkan';
    } else {
        alert('Profil berhasil disimpan!');
        window.location.href = '../main/home.html';
    }
});

document.addEventListener('DOMContentLoaded', initializePage);