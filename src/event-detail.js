import { supabase } from '/supabaseClient.js';

// --- ELEMEN HEADER (Sama seperti home.js) ---
const loggedOutButtons = document.getElementById('logged-out-buttons');
const completeProfileButton = document.getElementById('complete-profile-button');
const userProfileDropdown = document.getElementById('user-profile-dropdown');
const logoutButton = document.getElementById('logout-button');
const userProfileIcon = document.getElementById('user-profile-icon');

// --- ELEMEN HALAMAN DETAIL ---
const pageTitle = document.querySelector('title');
const eventDetailContent = document.getElementById('event-detail-content');
const errorMessage = document.getElementById('error-message');
const eventImage = document.getElementById('event-image');
const eventTags = document.getElementById('event-tags');
const eventTitle = document.getElementById('event-title');
const eventDate = document.getElementById('event-date');
const eventLocation = document.getElementById('event-location');
const eventOrganizer = document.getElementById('event-organizer');
const eventDescription = document.getElementById('event-description');

// --- FUNGSI HEADER (Sama seperti home.js) ---
async function checkUserStatus() {
    const { data: { session } } = await supabase.auth.getSession();
    await updateHeaderUI(session ? session.user : null);
}

async function updateHeaderUI(user) {
    if (loggedOutButtons) loggedOutButtons.style.display = 'none';
    if (completeProfileButton) completeProfileButton.style.display = 'none';
    if (userProfileDropdown) userProfileDropdown.style.display = 'none';

    if (user) {
        const { data: profile, error } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        if (error) console.error("Gagal mengambil profil:", error);

        if (profile && profile.full_name) {
            if (userProfileDropdown) userProfileDropdown.style.display = 'block';
            const initials = getInitials(profile.full_name);
            userProfileIcon.src = `https://placehold.co/40x40/6366f1/ffffff?text=${initials}`;
        } else {
            if (completeProfileButton) completeProfileButton.style.display = 'block';
        }
    } else {
        if (loggedOutButtons) loggedOutButtons.style.display = 'flex';
    }
}

function getInitials(fullName) {
    if (!fullName) return '?';
    const names = fullName.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    const firstInitial = names[0].charAt(0);
    const lastInitial = names[names.length - 1].charAt(0);
    return (firstInitial + lastInitial).toUpperCase();
}
// --- AKHIR FUNGSI HEADER ---


/**
 * Fungsi utama untuk mengambil detail event
 */
async function fetchEventDetails() {
    // 1. Dapatkan ID event dari URL
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');

    if (!eventId) {
        showError("ID event tidak ditemukan di URL.");
        return;
    }

    // 2. Ambil data event dari Supabase
    try {
        const { data: event, error } = await supabase
            .from('events')
            .select('*') // Ambil semua kolom
            .eq('id', eventId)
            .eq('status', 'approved') // Pastikan hanya event yang disetujui
            .single();

        if (error || !event) {
            throw new Error(error ? error.message : "Event tidak ditemukan.");
        }

        // 3. Jika berhasil, tampilkan datanya
        populateEventData(event);
        eventDetailContent.style.display = 'flex'; // Tampilkan konten

    } catch (error) {
        console.error('Error fetching event details:', error);
        showError(error.message);
    }
}

/**
 * Menampilkan data event ke elemen HTML
 */
function populateEventData(event) {
    // Set judul halaman
    pageTitle.textContent = `Detail Event - ${event.title}`;

    // Set gambar (menggunakan logika yang sama dengan home.js)
    if (event.image_url) {
        eventImage.innerHTML = `<img src="${event.image_url}" alt="${event.title}" class="event-image-large">`;
    } else {
        eventImage.innerHTML = `<i class="fas fa-image"></i>`;
    }

    // Set Kategori/Tags
    if (event.category) {
        eventTags.innerHTML = `<span class="tag tag-technology">${event.category}</span>`;
    }

    // Set Info Utama
    eventTitle.textContent = event.title;
    eventDescription.textContent = event.description;
    
    // Format tanggal
    const date = new Date(event.event_date);
    eventDate.textContent = date.toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    eventLocation.textContent = event.location;
    
    // Gunakan nama penyelenggara dari form, jika tidak ada, pakai nama user (fallback)
    eventOrganizer.textContent = event.organizer_name || 'Tidak disebutkan';
}

/**
 * Menampilkan pesan error jika event tidak ditemukan
 */
function showError(message) {
    eventDetailContent.style.display = 'none'; // Sembunyikan konten utama
    errorMessage.style.display = 'block';     // Tampilkan pesan error
    console.error(message);
}

// --- INISIALISASI ---
document.addEventListener('DOMContentLoaded', () => {
    checkUserStatus(); // Jalankan fungsi header
    fetchEventDetails(); // Jalankan fungsi untuk mengambil data event
});

// Listener untuk logout
if (logoutButton) {
    logoutButton.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = '/main/home.html';
    });
}