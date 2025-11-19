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
const allEventsTitle = document.getElementById('all-events-title');

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

async function fetchAndDisplayEvents(categoryFilter = 'all') {
    if (allEventsContainer) allEventsContainer.innerHTML = "<p>Memuat event...</p>";
    // Jangan reset featured container jika hanya filter bawah yang berubah, tapi untuk simplisitas kita reset dulu gapapa
    if (featuredEventsContainer && categoryFilter === 'all') featuredEventsContainer.innerHTML = "<p>Memuat event...</p>";

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
        if (featuredEventsContainer && categoryFilter === 'all') featuredEventsContainer.innerHTML = "";
        return;
    }

    if (allEventsContainer) allEventsContainer.innerHTML = '';
    if (featuredEventsContainer) featuredEventsContainer.innerHTML = '';

    // Logika Render Featured Events (Hanya tampil di 'all')
    if (categoryFilter === 'all') {
        if (featuredEventsContainer) featuredEventsContainer.style.display = 'grid'; // Pastikan display grid/block
        
        // Ambil 3 event teratas untuk featured
        const featuredEvents = events.slice(0, 3);
        featuredEvents.forEach(event => {
            if (featuredEventsContainer) featuredEventsContainer.innerHTML += createEventCard(event);
        });
    } else {
        // Sembunyikan featured container kalau lagi filter kategori
        if (featuredEventsContainer) featuredEventsContainer.style.display = 'none';
    }

    // Render Semua Event (atau hasil filter)
    events.forEach(event => {
        if (allEventsContainer) allEventsContainer.innerHTML += createEventCard(event);
    });
}

/**
 * FUNGSI INI YANG DIUBAH TOTAL
 * Menyesuaikan dengan CSS Modern Card yang baru dibuat
 */
function createEventCard(event) {
    // Format Tanggal
    const eventDate = new Date(event.event_date).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    
    // Handle data null/undefined
    const university = event.profiles ? event.profiles.university : 'Universitas';
    const category = event.category || 'Umum';
    
    // Handle Gambar: Jika kosong, pakai placeholder gambar agar layout tetap rapi
    const imageSrc = (event.image_url && event.image_url.trim() !== '')
        ? event.image_url
        : 'https://placehold.co/600x400/e0e7ff/4f46e5?text=No+Image'; 

    // Return HTML sesuai struktur CSS Modern Card
    return `
        <div class="event-card">
            <div class="event-image-container">
                <span class="category-tag">${category}</span>
                <img src="${imageSrc}" alt="${event.title}">
            </div>
            
            <div class="event-content">
                <h3 class="event-title">${event.title}</h3>
                <p class="event-description">${event.description || 'Tidak ada deskripsi event.'}</p>
                
                <div class="event-info-row">
                    <i class="far fa-calendar-alt"></i>
                    <span>${eventDate}</span>
                </div>
                <div class="event-info-row">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${event.location}</span>
                </div>
                 <div class="event-info-row">
                    <i class="fas fa-university"></i>
                    <span>${university}</span>
                </div>

                <div class="card-footer">
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
    checkUserStatus();
    fetchAndDisplayEvents('all');

    if (kategoriLink) {
        kategoriLink.addEventListener('click', function(event) {
            event.preventDefault();
            if (userProfileDropdown) userProfileDropdown.classList.remove('show');
            kategoriDropdown.classList.toggle('show');
        });
    }

    if (kategoriDropdown) {
        kategoriDropdown.addEventListener('click', (event) => {
            const filterLink = event.target.closest('.category-filter');
            if (filterLink) {
                event.preventDefault();
                const category = filterLink.dataset.category;
                
                kategoriDropdown.classList.remove('show');
                
                if (allEventsTitle) {
                    allEventsTitle.textContent = category === 'all' ? 'Semua Event' : `Event Kategori: ${category}`;
                }
                
                // Panggil fungsi fetch
                fetchAndDisplayEvents(category);
            }
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