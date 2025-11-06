import { supabase } from '/supabaseClient.js';

// --- ELEMEN DOM ---
const featuredEventsContainer = document.getElementById('featured-events-container');
const allEventsContainer = document.getElementById('all-events-container');
const loggedOutButtons = document.getElementById('logged-out-buttons');
const completeProfileButton = document.getElementById('complete-profile-button');
const userProfileDropdown = document.getElementById('user-profile-dropdown');
const logoutButton = document.getElementById('logout-button');
const userProfileIcon = document.getElementById('user-profile-icon');
const kategoriLink = document.getElementById('kategori-link');
const kategoriDropdown = document.getElementById('kategori-dropdown');

// --- FUNGSI HELPER ---
function getInitials(fullName) {
    if (!fullName) return '?';
    const names = fullName.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    const firstInitial = names[0].charAt(0);
    const lastInitial = names[names.length - 1].charAt(0);
    return (firstInitial + lastInitial).toUpperCase();
}

// --- FUNGSI UTAMA ---
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
            userProfileIcon.alt = profile.full_name;
        } else {
            if (completeProfileButton) completeProfileButton.style.display = 'block';
        }
    } else {
        if (loggedOutButtons) loggedOutButtons.style.display = 'flex';
    }
}

async function fetchAndDisplayEvents() {
    if (allEventsContainer) allEventsContainer.innerHTML = "<p>Memuat event...</p>";
    
    const { data: events, error } = await supabase
        .from('events')
        .select('*, profiles(university)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching events:', error);
        if (allEventsContainer) allEventsContainer.innerHTML = "<p>Gagal memuat event.</p>";
        return;
    }

    if (!events || events.length === 0) {
        if (allEventsContainer) allEventsContainer.innerHTML = "<p>Belum ada event yang tersedia.</p>";
        if (featuredEventsContainer) featuredEventsContainer.innerHTML = "";
        return;
    }

    if (allEventsContainer) allEventsContainer.innerHTML = '';
    if (featuredEventsContainer) featuredEventsContainer.innerHTML = '';

    const featuredEvents = events.slice(0, 3);
    featuredEvents.forEach(event => {
        if (featuredEventsContainer) featuredEventsContainer.innerHTML += createEventCard(event);
    });

    events.forEach(event => {
        if (allEventsContainer) allEventsContainer.innerHTML += createEventCard(event);
    });
}

// ================== FUNGSI YANG DIPERBAIKI ==================
function createEventCard(event) {
    const eventDate = new Date(event.event_date).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    const university = event.profiles ? event.profiles.university : 'Universitas';

    // Logika untuk gambar:
    // Cek apakah event.image_url ada (true) dan tidak kosong (not an empty string)
    const imageHtml = (event.image_url && event.image_url.trim() !== '')
        // Jika ADA gambar, gunakan tag <img> dengan style object-fit dari CSS
        ? `<div class="event-image-container">
               <img src="${event.image_url}" alt="${event.title}" class="event-image">
           </div>`
        // Jika TIDAK ADA gambar (null atau string kosong), gunakan placeholder ikon
        : `<div class="event-image-placeholder">
               <i class="fas fa-image"></i>
           </div>`;

    return `
        <div class="event-card">
            <div class="event-card-content">
                 <div class="card-body">
                    ${imageHtml}
                    
                    <div class="tag-container">
                        <span class="tag tag-technology">${event.category || 'Umum'}</span>
                    </div>
                    <h3 class="event-title">${event.title}</h3>
                    <p class="event-description">${event.description || ''}</p>
                    <div class="event-details">
                        <div class="detail-item"><i class="far fa-calendar-alt detail-icon"></i><span>${eventDate}</span></div>
                        <div class="detail-item"><i class="fas fa-map-marker-alt detail-icon"></i><span>${event.location}</span></div>
                        <div class="detail-item"><i class="fas fa-university detail-icon"></i><span>${university}</span></div>
                    </div>
                 </div>
                <div class="rating-and-button">
                    <div class="rating-info">
                        <i class="fas fa-star rating-star-icon"></i>
                        <span class="rating-text">New</span>
                    </div>
                    <a href="event-detail.html?id=${event.id}" class="detail-button">Lihat Detail</a>
                </div>
            </div>
        </div>
    `;
}
// ================== AKHIR FUNGSI YANG DIPERBAIKI ==================

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
}

// --- INISIALISASI & EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    checkUserStatus();
    fetchAndDisplayEvents();

    if (kategoriLink) {
        kategoriLink.addEventListener('click', function(event) {
            event.preventDefault();
            if (userProfileDropdown) userProfileDropdown.classList.remove('show');
            kategoriDropdown.classList.toggle('show');
        });
    }

    if (userProfileIcon) {
        userProfileIcon.addEventListener('click', function(event) {
            event.preventDefault();
            if (kategoriDropdown) kategoriDropdown.classList.remove('show');
            userProfileDropdown.classList.toggle('show');
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => { e.preventDefault(); handleLogout(); });
    }

    window.addEventListener('click', function(event) {
        if (kategoriDropdown && !event.target.closest('#kategori-dropdown')) {
            kategoriDropdown.classList.remove('show');
        }
        if (userProfileDropdown && !event.target.closest('#user-profile-dropdown')) {
            userProfileDropdown.classList.remove('show');
        }
    });
});

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        checkUserStatus();
    }
});