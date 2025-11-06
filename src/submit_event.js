import { supabase } from '/supabaseClient.js';

// --- ELEMEN DOM ---
const form = document.getElementById('submit-event-form');
const submitBtn = document.querySelector('.submit-btn');

let currentUser = null;

/**
 * Memastikan hanya pengguna yang login yang bisa mengakses halaman ini.
 */
async function checkLoginStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert('Anda harus login untuk membuat event.');
        window.location.href = '/login/login.html'; // Path ke folder login Anda
    } else {
        currentUser = user;
    }
    // Fungsi populateOrganizerDetails() DIHAPUS dari sini
}

/**
 * Menangani proses submit form.
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengirim...';

    const formData = new FormData(form);
    const eventImageFile = formData.get('event-image');
    let publicImageUrl = null;

    try {
        // 1. Proses Upload Gambar (jika ada)
        if (eventImageFile && eventImageFile.size > 0) {
            const fileName = `${currentUser.id}-${Date.now()}-${eventImageFile.name}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('posters') // Pastikan bucket 'posters' ada
                .upload(fileName, eventImageFile);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('posters').getPublicUrl(uploadData.path);
            publicImageUrl = urlData.publicUrl;
        }
        
        // 2. Siapkan data untuk dimasukkan ke tabel 'events'
        // DIPERBARUI: Menambahkan organizer_name dan organizer_contact
        const eventData = {
            title: formData.get('event-name'),
            description: formData.get('event-description'),
            event_date: formData.get('event-date'),
            category: formData.get('event-category'),
            location: `${formData.get('venue-name')}, ${formData.get('venue-address')}`,
            image_url: publicImageUrl,
            user_id: currentUser.id,
            
            // BARU: Mengambil data dari form yang diisi manual
            organizer_name: formData.get('organizer-name'),
            organizer_contact: formData.get('organizer-contact')
        };

        // 3. Masukkan data ke database
        const { error: insertError } = await supabase.from('events').insert([eventData]);
        if (insertError) throw insertError;

        alert('Event berhasil diajukan! Event Anda akan direview oleh admin.');
        window.location.href = '/user/dashboard.html'; // Arahkan ke dashboard

    } catch (error) {
        alert(`Terjadi kesalahan: ${error.message}`);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Kirim Pengajuan';
    }
}

// --- INISIALISASI ---
document.addEventListener('DOMContentLoaded', checkLoginStatus);
form.addEventListener('submit', handleFormSubmit);