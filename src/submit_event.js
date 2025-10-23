import { supabase } from '/supabaseClient.js'; // Gunakan path absolut

// --- ELEMEN DOM ---
const form = document.getElementById('submit-event-form');
const submitBtn = document.querySelector('.submit-btn');

let currentUser = null;

// --- FUNGSI-FUNGSI ---

async function checkLoginStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert('Anda harus login untuk membuat event.');
        window.location.href = '/login.html';
    } else {
        currentUser = user;
        populateOrganizerDetails(user);
    }
}

async function populateOrganizerDetails(user) {
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, phone_number')
        .eq('id', user.id)
        .single();
    
    if (profile) {
        document.getElementById('organizer-name').value = profile.full_name || '';
        document.getElementById('organizer-contact').value = profile.phone_number || user.email;
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengirim...';

    const formData = new FormData(form);
    const eventImageFile = formData.get('event-image');
    let publicImageUrl = null;

    if (eventImageFile && eventImageFile.size > 0) {
        const fileName = `${currentUser.id}-${Date.now()}-${eventImageFile.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('posters')
            .upload(fileName, eventImageFile);

        if (uploadError) {
            alert(`Gagal mengupload poster: ${uploadError.message}`);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Kirim Pengajuan';
            return;
        }

        const { data: urlData } = supabase.storage.from('posters').getPublicUrl(uploadData.path);
        publicImageUrl = urlData.publicUrl;
    }
    
    const eventData = {
        title: formData.get('event-name'),
        description: formData.get('event-description'),
        event_date: formData.get('event-date'),
        category: formData.get('event-category'),
        location: `${formData.get('venue-name')}, ${formData.get('venue-address')}`,
        image_url: publicImageUrl,
        user_id: currentUser.id,
    };

    const { error: insertError } = await supabase.from('events').insert([eventData]);

    if (insertError) {
        alert(`Gagal menyimpan event: ${insertError.message}`);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Kirim Pengajuan';
    } else {
        alert('Event berhasil diajukan! Event Anda akan direview oleh admin.');
        window.location.href = '/user/dashboard.html';
    }
}

// --- INISIALISASI ---
document.addEventListener('DOMContentLoaded', checkLoginStatus);
form.addEventListener('submit', handleFormSubmit);