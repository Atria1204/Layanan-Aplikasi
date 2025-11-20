import { supabase } from '/supabaseClient.js';

// --- DEKLARASI ELEMEN DOM (Akan diisi nanti) ---
let loggedOutButtons, completeProfileButton, userProfileDropdown, logoutButton, userProfileIcon;
let pageTitle, eventDetailContent, errorMessage, eventImage, eventTags, eventTitle;
let eventDate, eventLocation, eventOrganizer, eventDescription;
let registerButton, contactInfo, sidebarOrganizerName, sidebarOrganizerContact;

// --- FUNGSI HEADER ---
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
            if (userProfileIcon) { // Pastikan ikon ada
                const initials = getInitials(profile.full_name);
                userProfileIcon.src = `https://placehold.co/40x40/6366f1/ffffff?text=${initials}`;
            }
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
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');

    if (!eventId) {
        showError("ID event tidak ditemukan di URL.");
        return;
    }

    try {
        const { data: event, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .eq('status', 'approved')
            .single();

        if (error || !event) {
            throw new Error(error ? error.message : "Event tidak ditemukan.");
        }

        populateEventData(event);
        if (eventDetailContent) eventDetailContent.style.display = 'flex'; // Tampilkan konten

    } catch (error) {
        console.error('Error fetching event details:', error);
        showError(error.message);
    }
}

/**
 * Menampilkan data event ke elemen HTML
 */
function populateEventData(event) {
    if (pageTitle) pageTitle.textContent = `Detail Event - ${event.title}`;

    if (eventImage) {
        if (event.image_url) {
            // Hapus class 'event-image-large', biarkan CSS .event-image img yang mengatur ukurannya
            eventImage.innerHTML = `<img src="${event.image_url}" alt="${event.title}">`;
        } else {
            // Placeholder ikon jika tidak ada gambar
            eventImage.innerHTML = `<div style="display:flex; flex-direction:column; align-items:center; color:#d1d5db"><i class="fas fa-image" style="font-size:4rem; margin-bottom:10px"></i></div>`;
        }
    }

    if (eventTags && event.category) {
        eventTags.innerHTML = `<span class="tag tag-technology">${event.category}</span>`;
    }

    if (eventTitle) eventTitle.textContent = event.title;
    if (eventDescription) eventDescription.textContent = event.description;
    
    if (eventDate) {
        const date = new Date(event.event_date);
        eventDate.textContent = date.toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    if (eventLocation) eventLocation.textContent = event.location;
    
    const organizerName = event.organizer_name || 'Tidak disebutkan';
    const organizerContact = event.organizer_contact || 'Tidak ada';

    if (eventOrganizer) eventOrganizer.textContent = organizerName;
    if (sidebarOrganizerName) sidebarOrganizerName.textContent = organizerName;
    if (sidebarOrganizerContact) sidebarOrganizerContact.textContent = organizerContact;
}

function showError(message) {
    if (eventDetailContent) eventDetailContent.style.display = 'none';
    if (errorMessage) errorMessage.style.display = 'block';
    console.error(message);
}

// --- INISIALISASI ---
document.addEventListener('DOMContentLoaded', () => {
    
    // ================== PERBAIKAN UTAMA ==================
    // Pindahkan semua getElementById KE DALAM listener ini
    loggedOutButtons = document.getElementById('logged-out-buttons');
    completeProfileButton = document.getElementById('complete-profile-button');
    userProfileDropdown = document.getElementById('user-profile-dropdown');
    logoutButton = document.getElementById('logout-button');
    userProfileIcon = document.getElementById('user-profile-icon');

    pageTitle = document.querySelector('title');
    eventDetailContent = document.getElementById('event-detail-content');
    errorMessage = document.getElementById('error-message');
    eventImage = document.getElementById('event-image');
    eventTags = document.getElementById('event-tags');
    eventTitle = document.getElementById('event-title');
    eventDate = document.getElementById('event-date');
    eventLocation = document.getElementById('event-location');
    eventOrganizer = document.getElementById('event-organizer');
    eventDescription = document.getElementById('event-description');

    registerButton = document.getElementById('register-button');
    contactInfo = document.getElementById('contact-info');
    sidebarOrganizerName = document.getElementById('sidebar-organizer-name');
    sidebarOrganizerContact = document.getElementById('sidebar-organizer-contact');
    // ================== AKHIR PERBAIKAN ==================

    // Sekarang jalankan fungsi utama
    checkUserStatus();
    fetchEventDetails();

    // Tambahkan listener untuk Tombol Daftar
    if (registerButton) {
        registerButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (contactInfo) contactInfo.style.display = 'block';
            registerButton.style.display = 'none';
        });
    }

    // Listener Logout
    if (logoutButton) {
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const { error } = await supabase.auth.signOut();
                if (error) {
                    console.error('Logout error:', error);
                    alert('Gagal logout: ' + error.message);
                    return;
                }
                // Redirect ke index setelah logout
                window.location.href = '/index.html';
            } catch (error) {
                console.error('Error in logout:', error);
                alert('Terjadi kesalahan saat logout.');
            }
        });
    }
});