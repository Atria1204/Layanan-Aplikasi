// File JavaScript untuk index.html
// Menggunakan fungsi yang sama dengan home.js
import { supabase } from '/supabaseClient.js';

// --- ELEMEN DOM ---
const featuredEventsContainer = document.getElementById('featured-events-container');
const allEventsContainer = document.getElementById('all-events-container');
const loggedOutButtons = document.getElementById('logged-out-buttons');
const userSection = document.getElementById('user-section');
const searchInput = document.getElementById('search-input');
const searchIcon = document.getElementById('search-icon');
const loadMoreButton = document.querySelector('.load-more-button');
const primaryButton = document.querySelector('.cta-button.primary');
const secondaryButton = document.querySelector('.cta-button.secondary');
const kategoriLink = document.getElementById('kategori-link');
const kategoriDropdown = document.getElementById('kategori-dropdown');
const allEventsTitle = document.getElementById('all-events-title');

// Variabel untuk pagination dan search
let currentPage = 1;
let currentCategory = 'all';
let currentSearchQuery = '';
const eventsPerPage = 12;
let allEventsData = [];

// --- FUNGSI UTAMA ---
async function fetchAndDisplayEvents(categoryFilter = 'all', searchQuery = '', resetPage = true) {
    if (resetPage) {
        currentPage = 1;
        currentCategory = categoryFilter;
        currentSearchQuery = searchQuery;
    }

    if (allEventsContainer) allEventsContainer.innerHTML = "<p>Memuat event...</p>";
    if (featuredEventsContainer && categoryFilter === 'all' && !searchQuery) {
        featuredEventsContainer.innerHTML = "<p>Memuat event...</p>";
    }

    // 1. Buat query dasar
    let query = supabase
        .from('events')
        .select('*, profiles(university)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

    // 2. Tambahkan filter kategori jika BUKAN 'all'
    if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
    }

    // 3. Tambahkan filter search jika ada
    if (searchQuery && searchQuery.trim() !== '') {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
    }
    
    // 4. Jalankan query
    const { data: events, error } = await query;

    if (error) {
        console.error('Error fetching events:', error);
        if (allEventsContainer) allEventsContainer.innerHTML = "<p>Gagal memuat event.</p>";
        return;
    }

    // Simpan semua data untuk pagination
    allEventsData = events || [];

    if (!events || events.length === 0) {
        const message = searchQuery 
            ? `Tidak ada event yang ditemukan untuk "${searchQuery}".`
            : `Belum ada event untuk kategori "${categoryFilter}".`;
        if (allEventsContainer) allEventsContainer.innerHTML = `<p>${message}</p>`;
        if (featuredEventsContainer && categoryFilter === 'all' && !searchQuery) {
            featuredEventsContainer.innerHTML = "";
        }
        if (loadMoreButton) loadMoreButton.style.display = 'none';
        return;
    }

    // Render Featured Events (Hanya tampil di 'all' dan tanpa search)
    if (categoryFilter === 'all' && !searchQuery) {
        if (featuredEventsContainer) {
            featuredEventsContainer.style.display = 'grid';
            featuredEventsContainer.innerHTML = '';
            const featuredEvents = events.slice(0, 3);
            featuredEvents.forEach(event => {
                featuredEventsContainer.innerHTML += createEventCard(event);
            });
        }
    } else {
        if (featuredEventsContainer) featuredEventsContainer.style.display = 'none';
    }

    // Render events dengan pagination
    renderEventsWithPagination();
}

function renderEventsWithPagination() {
    if (allEventsContainer) allEventsContainer.innerHTML = '';

    const startIndex = 0;
    const endIndex = currentPage * eventsPerPage;
    const eventsToShow = allEventsData.slice(startIndex, endIndex);

    eventsToShow.forEach(event => {
        if (allEventsContainer) allEventsContainer.innerHTML += createEventCard(event);
    });

    // Tampilkan/sembunyikan tombol Load More
    if (loadMoreButton) {
        if (endIndex >= allEventsData.length) {
            loadMoreButton.style.display = 'none';
        } else {
            loadMoreButton.style.display = 'block';
        }
    }
}

function handleLoadMore() {
    currentPage++;
    renderEventsWithPagination();
}

function handleSearch() {
    const query = searchInput ? searchInput.value.trim() : '';
    fetchAndDisplayEvents(currentCategory, query, true);
}

async function handleHeroButton(buttonType) {
    if (buttonType === 'primary') {
        // Scroll ke section semua event
        const allEventsSection = document.querySelector('.all-events-section');
        if (allEventsSection) {
            allEventsSection.scrollIntoView({ behavior: 'smooth' });
        }
    } else if (buttonType === 'secondary') {
        // Redirect ke halaman komunitas atau login
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            window.location.href = '/user/dashboard.html';
        } else {
            window.location.href = '/login/login.html';
        }
    }
}

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
                    <a href="/main/event-detail.html?id=${event.id}" class="detail-button">Lihat Detail</a>
                </div>
            </div>
        </div>
    `;
}

// --- INISIALISASI & EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayEvents('all');

    // Search functionality
    if (searchIcon) {
        searchIcon.addEventListener('click', handleSearch);
    }
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }

    // Load More button
    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', handleLoadMore);
    }

    // Hero buttons
    if (primaryButton) {
        primaryButton.addEventListener('click', () => handleHeroButton('primary'));
    }
    if (secondaryButton) {
        secondaryButton.addEventListener('click', () => handleHeroButton('secondary'));
    }

    // Category filter
    if (kategoriLink) {
        kategoriLink.addEventListener('click', function(event) {
            event.preventDefault();
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
                
                // Reset search input
                if (searchInput) searchInput.value = '';
                
                // Panggil fungsi fetch
                fetchAndDisplayEvents(category, '', true);
            }
        });
    }

    // Close dropdown when clicking outside
    window.addEventListener('click', function(event) {
        if (kategoriDropdown && !event.target.closest('#kategori-dropdown')) {
            kategoriDropdown.classList.remove('show');
        }
    });
});

