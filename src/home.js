import { supabase } from '/supabaseClient.js';

// --- ELEMEN DOM ---
const featuredEventsContainer = document.getElementById('featured-events-container');
const allEventsContainer = document.getElementById('all-events-container');
const loginButton = document.getElementById('login-button');
const completeProfileButton = document.getElementById('complete-profile-button');
const userProfileDropdown = document.getElementById('user-profile-dropdown');
const logoutButton = document.getElementById('logout-button');

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
    loginButton.style.display = 'none';
    completeProfileButton.style.display = 'none';
    userProfileDropdown.style.display = 'none';

    if (user) {
        const { data: profile, error } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        if (error) console.error("Gagal mengambil profil:", error);

        if (profile && profile.full_name) {
            userProfileDropdown.style.display = 'block';
            const userProfileIcon = document.getElementById('user-profile-icon');
            const initials = getInitials(profile.full_name);
            userProfileIcon.src = `https://placehold.co/40x40/6366f1/ffffff?text=${initials}`;
            userProfileIcon.alt = profile.full_name;
        } else {
            completeProfileButton.style.display = 'block';
        }
    } else {
        loginButton.style.display = 'block';
    }
}

async function fetchAndDisplayEvents() {
    allEventsContainer.innerHTML = "<p>Memuat event...</p>";
    const { data: events, error } = await supabase
        .from('events')
        .select('*, profiles(university)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching events:', error);
        allEventsContainer.innerHTML = "<p>Gagal memuat event.</p>";
        return;
    }

    if (events.length === 0) {
        allEventsContainer.innerHTML = "<p>Belum ada event yang tersedia.</p>";
        featuredEventsContainer.innerHTML = "";
        return;
    }

    allEventsContainer.innerHTML = '';
    featuredEventsContainer.innerHTML = '';

    const featuredEvents = events.slice(0, 3);
    featuredEvents.forEach(event => {
        featuredEventsContainer.innerHTML += createEventCard(event);
    });

    events.forEach(event => {
        allEventsContainer.innerHTML += createEventCard(event);
    });
}

function createEventCard(event) {
    const eventDate = new Date(event.event_date).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    const university = event.profiles ? event.profiles.university : 'Universitas';

    return `
        <div class="event-card">
            <div class="event-card-content">
                <div class="card-body">
                    <div class="event-image-container">
                         <img src="${event.image_url || 'https://placehold.co/600x400/e2e8f0/64748b?text=Event'}" alt="${event.title}" class="event-image">
                    </div>
                    <div class="tag-container"><span class="tag tag-technology">${event.category || 'Umum'}</span></div>
                    <h3 class="event-title">${event.title}</h3>
                    <p class="event-description">${event.description || ''}</p>
                    <div class="event-details">
                        <div class="detail-item"><i class="far fa-calendar-alt detail-icon"></i><span>${eventDate}</span></div>
                        <div class="detail-item"><i class="fas fa-map-marker-alt detail-icon"></i><span>${event.location}</span></div>
                        <div class="detail-item"><i class="fas fa-university detail-icon"></i><span>${university}</span></div>
                    </div>
                </div>
                <div class="rating-and-button">
                    <div class="rating-info"><i class="fas fa-star rating-star-icon"></i><span class="rating-text">New</span></div>
                    <a href="event-detail.html?id=${event.id}" class="detail-button">Lihat Detail</a>
                </div>
            </div>
        </div>
    `;
}

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
}

// --- INISIALISASI ---

// Jalankan saat halaman pertama kali dimuat
document.addEventListener('DOMContentLoaded', () => {
    checkUserStatus();
    fetchAndDisplayEvents();

    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => { e.preventDefault(); handleLogout(); });
    }

    const userProfileIcon = document.getElementById('user-profile-icon');
    if (userProfileIcon) {
        userProfileIcon.addEventListener('click', () => { userProfileDropdown.classList.toggle('show'); });
    }

    window.addEventListener('click', function(event) {
        if (userProfileDropdown && !event.target.closest('#user-profile-dropdown')) {
            userProfileDropdown.classList.remove('show');
        }
    });
});

// ================== PERBAIKAN UNTUK MASALAH CACHE ==================
// Listener ini akan berjalan SETIAP KALI halaman ditampilkan,
// termasuk saat pengguna menekan tombol "Back" di browser.
window.addEventListener('pageshow', (event) => {
    // event.persisted bernilai true jika halaman diambil dari cache (bfcache)
    if (event.persisted) {
        console.log('Halaman dimuat dari cache. Memeriksa ulang status pengguna...');
        // Jalankan ulang fungsi pengecekan header
        checkUserStatus();
    }
});