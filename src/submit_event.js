import { supabase } from '/supabaseClient.js';

// --- ELEMEN DOM ---
const form = document.getElementById('submit-event-form');
const submitBtn = document.querySelector('.submit-btn');

let currentUser = null;
let isEditMode = false;
let eventIdToEdit = null;

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
        
        // Check if we're in edit mode
        const params = new URLSearchParams(window.location.search);
        const editId = params.get('edit');
        if (editId) {
            isEditMode = true;
            eventIdToEdit = editId;
            await loadEventForEdit(editId, user.id);
        }
    }
    // Fungsi populateOrganizerDetails() DIHAPUS dari sini
}

/**
 * Load event data for editing
 */
async function loadEventForEdit(eventId, userId) {
    try {
        const { data: event, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .eq('user_id', userId)
            .single();

        if (error || !event) {
            alert('Event tidak ditemukan atau Anda tidak memiliki akses untuk mengedit event ini.');
            window.location.href = '/user/dashboard.html';
            return;
        }

        // Populate form fields
        form.querySelector('[name="event-name"]').value = event.title || '';
        form.querySelector('[name="event-description"]').value = event.description || '';
        form.querySelector('[name="event-date"]').value = event.event_date ? event.event_date.split('T')[0] : '';
        form.querySelector('[name="event-category"]').value = event.category || '';
        
        // Parse location (format: "venue, address")
        if (event.location) {
            const locationParts = event.location.split(', ');
            if (locationParts.length >= 2) {
                form.querySelector('[name="venue-name"]').value = locationParts[0] || '';
                form.querySelector('[name="venue-address"]').value = locationParts.slice(1).join(', ') || '';
            } else {
                form.querySelector('[name="venue-name"]').value = event.location;
            }
        }
        
        form.querySelector('[name="organizer-name"]').value = event.organizer_name || '';
        form.querySelector('[name="organizer-contact"]').value = event.organizer_contact || '';

        // Update submit button text
        if (submitBtn) {
            submitBtn.textContent = 'Update Event';
        }

        // Update page title if possible
        const pageTitle = document.querySelector('title');
        if (pageTitle) {
            pageTitle.textContent = 'Edit Event - EventsBy';
        }

    } catch (error) {
        console.error('Error loading event for edit:', error);
        alert('Gagal memuat data event.');
    }
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
        } else if (isEditMode && eventIdToEdit) {
            // If editing and no new image, keep the existing image
            const { data: existingEvent } = await supabase
                .from('events')
                .select('image_url')
                .eq('id', eventIdToEdit)
                .single();
            
            if (existingEvent && existingEvent.image_url) {
                publicImageUrl = existingEvent.image_url;
            }
        }
        
        // 2. Siapkan data untuk dimasukkan ke tabel 'events'
        // DIPERBARUI: Menambahkan organizer_name dan organizer_contact
        const eventData = {
            title: formData.get('event-name'),
            description: formData.get('event-description'),
            event_date: formData.get('event-date'),
            category: formData.get('event-category'),
            location: `${formData.get('venue-name')}, ${formData.get('venue-address')}`,
            user_id: currentUser.id,
            
            // BARU: Mengambil data dari form yang diisi manual
            organizer_name: formData.get('organizer-name'),
            organizer_contact: formData.get('organizer-contact')
        };

        // Only include image_url if we have one (new upload or existing)
        if (publicImageUrl) {
            eventData.image_url = publicImageUrl;
        }

        // 3. Masukkan atau update data ke database
        if (isEditMode && eventIdToEdit) {
            // Update existing event
            const { error: updateError } = await supabase
                .from('events')
                .update({
                    ...eventData,
                    status: 'pending' // Reset status to pending after edit
                })
                .eq('id', eventIdToEdit)
                .eq('user_id', currentUser.id); // Ensure user owns the event
            
            if (updateError) throw updateError;
            alert('Event berhasil diupdate! Event Anda akan direview ulang oleh admin.');
        } else {
            // Insert new event
            const { error: insertError } = await supabase.from('events').insert([eventData]);
            if (insertError) throw insertError;
            alert('Event berhasil diajukan! Event Anda akan direview oleh admin.');
        }
        
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