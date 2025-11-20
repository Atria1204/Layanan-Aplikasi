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
const searchInput = document.getElementById('search-input');
const searchIcon = document.getElementById('search-icon');
const loadMoreButton = document.querySelector('.load-more-button');
const primaryButton = document.querySelector('.cta-button.primary');
const secondaryButton = document.querySelector('.cta-button.secondary');

// Variabel untuk pagination dan search
let currentPage = 1;
let currentCategory = 'all';
let currentSearchQuery = '';
const eventsPerPage = 12;
let allEventsData = [];

// --- FUNGSI HELPER ---
function getInitials(fullName) {
    if (!fullName) return '?';
    const names = fullName.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    const firstInitial = names[0].charAt(0);
    const lastInitial = names[names.length - 1].charAt(0);
    return (firstInitial + lastInitial).toUpperCase();
}

// Fungsi untuk setup event listener pada profile icon dan admin badge
function setupProfileIconListener() {
    const currentUserProfileIcon = document.getElementById('user-profile-icon');
    const currentUserProfileDropdown = document.getElementById('user-profile-dropdown');
    const currentKategoriDropdown = document.getElementById('kategori-dropdown');
    
    // Setup listener untuk user profile icon (user biasa)
    if (currentUserProfileIcon && currentUserProfileDropdown) {
        // Hapus semua event listener lama dengan clone
        const oldIcon = currentUserProfileIcon;
        const newIcon = oldIcon.cloneNode(true);
        oldIcon.parentNode.replaceChild(newIcon, oldIcon);
        
        // Setup listener baru langsung dengan onclick
        newIcon.onclick = function(event) {
            console.log('Profile icon clicked!'); // Debug log
            event.preventDefault();
            event.stopPropagation();
            if (currentKategoriDropdown) currentKategoriDropdown.classList.remove('show');
            if (currentUserProfileDropdown) {
                currentUserProfileDropdown.classList.toggle('show');
                console.log('Dropdown toggled, show class:', currentUserProfileDropdown.classList.contains('show')); // Debug log
            }
        };
        newIcon.style.cursor = 'pointer';
        newIcon.style.pointerEvents = 'auto';
        newIcon.style.position = 'relative';
        newIcon.style.zIndex = '1003';
    }
    
    // Setup listener untuk admin badge
    const adminBadge = currentUserProfileDropdown?.querySelector('.admin-badge');
    if (adminBadge) {
        adminBadge.onclick = function(event) {
            console.log('Admin badge clicked!'); // Debug log
            event.preventDefault();
            event.stopPropagation();
            if (currentKategoriDropdown) currentKategoriDropdown.classList.remove('show');
            if (currentUserProfileDropdown) {
                currentUserProfileDropdown.classList.toggle('show');
            }
        };
        adminBadge.style.cursor = 'pointer';
        adminBadge.style.pointerEvents = 'auto';
    }
}

// --- FUNGSI UTAMA ---
async function checkUserStatus() {
    const { data: { session } } = await supabase.auth.getSession();
    await updateHeaderUI(session ? session.user : null);
    // Setup listener setelah UI diperbarui
    setTimeout(setupProfileIconListener, 100);
}

async function updateHeaderUI(user) {
    if (loggedOutButtons) loggedOutButtons.style.display = 'none';
    if (completeProfileButton) completeProfileButton.style.display = 'none';
    if (userProfileDropdown) userProfileDropdown.style.display = 'none';

    if (user) {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', user.id)
            .single();
            
        if (error) console.error("Gagal mengambil profil:", error);

        if (profile && profile.full_name) {
            if (userProfileDropdown) {
                userProfileDropdown.style.display = 'block';
                
                // Cek apakah user adalah admin
                if (profile.role === 'admin') {
                    // Tampilkan badge ADMIN merah, sembunyikan profile icon
                    if (userProfileIcon) {
                        userProfileIcon.style.display = 'none';
                    }
                    
                    // Cek apakah sudah ada admin badge, jika belum buat
                    let adminBadge = userProfileDropdown.querySelector('.admin-badge');
                    if (!adminBadge) {
                        adminBadge = document.createElement('div');
                        adminBadge.className = 'admin-badge';
                        adminBadge.textContent = 'ADMIN';
                        adminBadge.style.cursor = 'pointer';
                        adminBadge.style.pointerEvents = 'auto';
                        // Insert sebelum dropdown content
                        const dropdownContent = userProfileDropdown.querySelector('.dropdown-content');
                        if (dropdownContent) {
                            userProfileDropdown.insertBefore(adminBadge, dropdownContent);
                        } else {
                            userProfileDropdown.insertBefore(adminBadge, userProfileDropdown.firstChild);
                        }
                    }
                    adminBadge.style.display = 'flex';
                    adminBadge.style.cursor = 'pointer';
                    adminBadge.style.pointerEvents = 'auto';
                    
                    // Pastikan event listener terpasang pada admin badge
                    adminBadge.onclick = function(event) {
                        event.preventDefault();
                        event.stopPropagation();
                        if (kategoriDropdown) kategoriDropdown.classList.remove('show');
                        if (userProfileDropdown) {
                            userProfileDropdown.classList.toggle('show');
                        }
                    };
                } else {
                    // User biasa - tampilkan inisial, sembunyikan admin badge
                    let adminBadge = userProfileDropdown.querySelector('.admin-badge');
                    if (adminBadge) {
                        adminBadge.style.display = 'none';
                    }
                    
                    if (userProfileIcon) {
                        userProfileIcon.style.display = 'block';
                        userProfileIcon.style.cursor = 'pointer';
                        userProfileIcon.style.pointerEvents = 'auto';
                        userProfileIcon.style.position = 'relative';
                        userProfileIcon.style.zIndex = '1003';
                        const initials = getInitials(profile.full_name);
                        userProfileIcon.src = `https://placehold.co/40x40/6366f1/ffffff?text=${initials}`;
                        userProfileIcon.alt = profile.full_name;
                        
                        // Pastikan event listener terpasang langsung
                        userProfileIcon.onclick = function(event) {
                            console.log('Profile icon onclick triggered!'); // Debug
                            event.preventDefault();
                            event.stopPropagation();
                            if (kategoriDropdown) kategoriDropdown.classList.remove('show');
                            if (userProfileDropdown) {
                                userProfileDropdown.classList.toggle('show');
                                console.log('User dropdown toggled'); // Debug
                            }
                        };
                    }
                }
            }
        } else {
            if (completeProfileButton) completeProfileButton.style.display = 'block';
        }
    } else {
        if (loggedOutButtons) loggedOutButtons.style.display = 'flex';
    }
}

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
                    <a href="/main/event-detail.html?id=${event.id}" class="detail-button">Lihat Detail</a>
                </div>
            </div>
        </div>
    `;
}

async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Logout error:', error);
            alert('Gagal logout: ' + error.message);
            return;
        }
        
        // Update UI setelah logout
        await checkUserStatus();
        
        // Reload untuk memastikan semua state ter-reset
        window.location.reload();
    } catch (error) {
        console.error('Error in handleLogout:', error);
        alert('Terjadi kesalahan saat logout.');
    }
}

// --- INISIALISASI & EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', async () => {
    await checkUserStatus();
    fetchAndDisplayEvents('all');
    
    // Setup event listeners setelah UI diperbarui
    setTimeout(() => {
        const currentUserProfileIcon = document.getElementById('user-profile-icon');
        if (currentUserProfileIcon && !currentUserProfileIcon.hasAttribute('data-listener-attached')) {
            currentUserProfileIcon.setAttribute('data-listener-attached', 'true');
            currentUserProfileIcon.addEventListener('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                const kategoriDropdown = document.getElementById('kategori-dropdown');
                const userProfileDropdown = document.getElementById('user-profile-dropdown');
                if (kategoriDropdown) kategoriDropdown.classList.remove('show');
                if (userProfileDropdown) {
                    userProfileDropdown.classList.toggle('show');
                }
            });
        }
    }, 200);

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
                
                // Reset search input
                if (searchInput) searchInput.value = '';
                
                // Panggil fungsi fetch
                fetchAndDisplayEvents(category, '', true);
            }
        });
    }

    // Fungsi untuk toggle dropdown
    function toggleUserDropdown(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (kategoriDropdown) kategoriDropdown.classList.remove('show');
        if (userProfileDropdown) {
            userProfileDropdown.classList.toggle('show');
        }
    }
    
    // Event listener menggunakan event delegation pada document dengan capture phase
    // Ini akan menangkap semua klik termasuk yang dibuat secara dinamis
    document.addEventListener('click', function(event) {
        // Cek apakah klik pada profile icon (dengan berbagai cara)
        const clickedIcon = event.target.closest('#user-profile-icon') || 
                           (event.target.id === 'user-profile-icon' ? event.target : null) ||
                           (event.target.tagName === 'IMG' && event.target.classList.contains('user-profile-icon') ? event.target : null);
        
        if (clickedIcon) {
            const dropdown = document.getElementById('user-profile-dropdown');
            if (dropdown && dropdown.contains(clickedIcon)) {
                console.log('Profile icon clicked via delegation!');
                toggleUserDropdown(event);
                return;
            }
        }
        
        // Cek apakah klik pada admin badge
        const clickedBadge = event.target.closest('.admin-badge') || 
                            (event.target.classList.contains('admin-badge') ? event.target : null);
        if (clickedBadge) {
            const dropdown = document.getElementById('user-profile-dropdown');
            if (dropdown && dropdown.contains(clickedBadge)) {
                console.log('Admin badge clicked via delegation!');
                toggleUserDropdown(event);
                return;
            }
        }
    }, true); // Gunakan capture phase untuk memastikan tertangkap lebih awal

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