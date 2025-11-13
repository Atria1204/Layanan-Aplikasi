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
const allEventsTitle = document.getElementById('all-events-title'); // <-- BARU

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
    // ... (Fungsi ini tetap sama, tidak perlu diubah) ...
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

/**
 * DIPERBARUI: Fungsi ini sekarang menerima filter kategori
 */
async function fetchAndDisplayEvents(categoryFilter = 'all') {
    if (allEventsContainer) allEventsContainer.innerHTML = "<p>Memuat event...</p>";
    if (featuredEventsContainer) featuredEventsContainer.innerHTML = "<p>Memuat event...</p>";

    // 1. Buat query dasar
    let query = supabase
        .from('events')
        .select('*, profiles(university)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

    // 2. Tambahkan filter jika kategori BUKAN 'all'
    if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
    }
    
    // 3. Jalankan query
    const { data: events, error } = await query;

    if (error) {
        console.error('Error fetching events:', error);
        if (allEventsContainer) allEventsContainer.innerHTML = "<p>Gagal memuat event.</p>";
        return;
    }

    if (!events || events.length === 0) {
        if (allEventsContainer) allEventsContainer.innerHTML = `<p>Belum ada event untuk kategori "${categoryFilter}".</p>`;
        if (featuredEventsContainer) featuredEventsContainer.innerHTML = "";
        return;
    }

    if (allEventsContainer) allEventsContainer.innerHTML = '';
    if (featuredEventsContainer) featuredEventsContainer.innerHTML = '';

    // Hanya tampilkan event di "Featured" jika filternya 'all' (atau sesuaikan logikanya)
    if (categoryFilter === 'all') {
        const featuredEvents = events.slice(0, 3);
        featuredEvents.forEach(event => {
            if (featuredEventsContainer) featuredEventsContainer.innerHTML += createEventCard(event);
        });
    } else {
        // Jika sedang memfilter, kita bisa sembunyikan "Featured" atau tampilkan hasil filter juga
         if (featuredEventsContainer) featuredEventsContainer.style.display = 'none';
    }


    events.forEach(event => {
        if (allEventsContainer) allEventsContainer.innerHTML += createEventCard(event);
    });
}

function createEventCard(event) {
    // ... (Fungsi ini tetap sama, tidak perlu diubah) ...
    const eventDate = new Date(event.event_date).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    const university = event.profiles ? event.profiles.university : 'Universitas';

    const imageHtml = (event.image_url && event.image_url.trim() !== '')
        ? `<div class="event-image-container"><img src="${event.image_url}" alt="${event.title}" class="event-image"></div>`
        : `<div class="event-image-placeholder"><i class="fas fa-image"></i></div>`;

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

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
}

// --- INISIALISASI & EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    // Panggil fungsi utama saat halaman dimuat
    checkUserStatus();
    fetchAndDisplayEvents('all'); // Memuat semua event saat pertama kali

    // Listener untuk Kategori
    if (kategoriLink) {
        kategoriLink.addEventListener('click', function(event) {
            event.preventDefault();
            if (userProfileDropdown) userProfileDropdown.classList.remove('show');
            kategoriDropdown.classList.toggle('show');
        });
    }

    // BARU: Listener untuk filter kategori
    if (kategoriDropdown) {
        kategoriDropdown.addEventListener('click', (event) => {
            // Cek apakah yang diklik adalah link filter
            const filterLink = event.target.closest('.category-filter');
            if (filterLink) {
                event.preventDefault();
                
                const category = filterLink.dataset.category;
                
                // Tutup dropdown
                kategoriDropdown.classList.remove('show');
                
                // Ubah judul & tampilkan/sembunyikan "Featured"
                if (allEventsTitle) {
                    allEventsTitle.textContent = category === 'all' ? 'Semua Event' : `Event Kategori: ${category}`;
                }
                if (featuredEventsContainer) {
                    featuredEventsContainer.style.display = category === 'all' ? 'grid' : 'none';
                }

                // Panggil ulang fungsi fetch dengan filter baru
                fetchAndDisplayEvents(category);
            }
        });
    }

    // Listener untuk Profil
    if (userProfileIcon) {
        userProfileIcon.addEventListener('click', function(event) {
            event.preventDefault();
            if (kategoriDropdown) kategoriDropdown.classList.remove('show');
            userProfileDropdown.classList.toggle('show');
        });
    }

    // Listener untuk Logout
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => { e.preventDefault(); handleLogout(); });
    }

    // Listener untuk klik di luar dropdown
    window.addEventListener('click', function(event) {
        if (kategoriDropdown && !event.target.closest('#kategori-dropdown')) {
            kategoriDropdown.classList.remove('show');
        }
        if (userProfileDropdown && !event.target.closest('#user-profile-dropdown')) {
            userProfileDropdown.classList.remove('show');
        }
    });
});

// Listener untuk cache (saat tombol 'back' browser)
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        checkUserStatus();
    }
});