// admin/admin.js

import { supabase } from '../supabaseClient.js';

console.log('✅ Admin script loaded successfully!');

// --- DOM ELEMENTS ---
const eventListContainer = document.getElementById('event-list-container');
const pendingCountEl = document.getElementById('pending-count');
const approvedCountEl = document.getElementById('approved-count');
const rejectedCountEl = document.getElementById('rejected-count');
const tabPendingCountEl = document.getElementById('tab-pending-count');
const tabApprovedCountEl = document.getElementById('tab-approved-count');
const tabRejectedCountEl = document.getElementById('tab-rejected-count');
const tabAllCountEl = document.getElementById('tab-all-count');
const tabsNav = document.getElementById('tabs-nav');


// --- SECURITY CHECK ---
// Fungsi untuk memeriksa apakah user adalah admin
async function checkAdminStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Jika tidak ada user, lempar ke halaman login
    if (!user) {
        window.location.href = '../login.html';
        return;
    }

    // Ambil profil user untuk memeriksa role
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (error || !profile || profile.role !== 'admin') {
        // Jika bukan admin, lempar ke halaman dashboard pengguna biasa
        alert('Akses ditolak. Anda bukan admin.');
        window.location.href = '../user/dashboard.html';
    }
}

// --- DATA FETCHING AND RENDERING ---

// Fungsi untuk mengambil dan menampilkan jumlah event berdasarkan status
async function fetchEventCounts() {
    const { data, error } = await supabase.from('events').select('status');
    if (error) {
        console.error('Error fetching event counts:', error);
        return;
    }

    const counts = { pending: 0, approved: 0, rejected: 0 };
    data.forEach(event => {
        counts[event.status]++;
    });

    // Update UI
    pendingCountEl.textContent = counts.pending;
    approvedCountEl.textContent = counts.approved;
    rejectedCountEl.textContent = counts.rejected;
    
    tabPendingCountEl.textContent = counts.pending;
    tabApprovedCountEl.textContent = counts.approved;
    tabRejectedCountEl.textContent = counts.rejected;
    tabAllCountEl.textContent = data.length;
}

// Fungsi utama untuk mengambil dan menampilkan daftar event
async function fetchAndDisplayEvents(statusFilter = 'all') {
    eventListContainer.innerHTML = '<p>Loading events...</p>';

    let query = supabase
        .from('events')
        .select(`
            *,
            profiles ( full_name, phone_number )
        `)
        .order('created_at', { ascending: false });

    // Terapkan filter jika bukan 'all'
    if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
    }
    
    const { data: events, error } = await query;

    if (error) {
        console.error('Error fetching events:', error);
        eventListContainer.innerHTML = '<p class="text-red-500">Gagal memuat event.</p>';
        return;
    }

    if (events.length === 0) {
        eventListContainer.innerHTML = '<p>Tidak ada event untuk ditampilkan.</p>';
        return;
    }

    // Kosongkan container dan render setiap event
    eventListContainer.innerHTML = '';
    events.forEach(event => {
        const eventCard = createEventCard(event);
        eventListContainer.appendChild(eventCard);
    });
    lucide.createIcons(); // Re-initialize icons
}

// Fungsi untuk membuat HTML satu kartu event
function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row relative';

    // Logika untuk status badge
    const statusInfo = {
        pending: { text: 'Pending', bg: 'bg-yellow-100', text_color: 'text-yellow-700' },
        approved: { text: 'Disetujui', bg: 'bg-green-100', text_color: 'text-green-700' },
        rejected: { text: 'Ditolak', bg: 'bg-red-100', text_color: 'text-red-700' },
    };
    const currentStatus = statusInfo[event.status] || statusInfo.pending;
    
    // Logika untuk menampilkan tombol aksi
    const actionButtons = event.status === 'pending' ? `
        <a href="#" class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
           <i data-lucide="eye" class="w-4 h-4 mr-2"></i>Detail
        </a>
        <button data-id="${event.id}" data-action="approve" class="action-btn inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
           <i data-lucide="check" class="w-4 h-4 mr-2"></i>Setujui
        </button>
         <button data-id="${event.id}" data-action="reject" class="action-btn inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
           <i data-lucide="x" class="w-4 h-4 mr-2"></i>Tolak
        </button>
    ` : `
        <a href="#" class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
           <i data-lucide="eye" class="w-4 h-4 mr-2"></i>Detail
        </a>
    `;

    // Format tanggal
    const eventDate = new Date(event.event_date);
    const submittedDate = new Date(event.created_at);

    card.innerHTML = `
        <span class="absolute top-4 right-4 ${currentStatus.bg} ${currentStatus.text_color} text-xs font-semibold px-3 py-1 rounded-full">${currentStatus.text}</span>
        <img src="${event.image_url || 'https://placehold.co/800x600/e2e8f0/64748b?text=Event'}" 
             alt="${event.title}" class="w-full md:w-64 h-48 md:h-auto object-cover">
        <div class="p-6 flex-1 flex flex-col">
            <div class="flex-grow">
                <h2 class="text-xl font-bold mb-1">${event.title}</h2>
                <p class="text-gray-600 text-sm mb-4">${event.description || 'Tidak ada deskripsi.'}</p>
                <div class="space-y-3 text-sm text-gray-700">
                    <div class="flex items-center">
                        <i data-lucide="calendar" class="w-4 h-4 mr-3 text-gray-400"></i> ${eventDate.toLocaleDateString('id-ID')} • ${eventDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit' })}
                    </div>
                    <div class="flex items-start">
                        <i data-lucide="map-pin" class="w-4 h-4 mr-3 text-gray-400 mt-1"></i> 
                        <div>${event.location || 'Lokasi tidak tersedia.'}</div>
                    </div>
                    <div class="flex items-center">
    <i data-lucide="user" class="w-4 h-4 mr-3 text-gray-400"></i>
    ${
      // Jika profil ada, tampilkan detailnya. Jika tidak, tampilkan pesan.
      event.profiles
        ? `${event.profiles.full_name || "Nama Tidak Ada"} • ${event.profiles.phone_number || "Kontak Tidak Ada"}`
        : "Pengguna Dihapus"
    }
</div>
                </div>
            </div>
            <div class="border-t mt-4 pt-4 flex items-center justify-between">
                <div>
                   <span class="bg-indigo-100 text-indigo-700 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">${event.category || 'Umum'}</span>
                   <span class="text-xs text-gray-500">Submitted ${submittedDate.toLocaleString('id-ID')}</span>
                </div>
                <div class="flex items-center space-x-2">
                    ${actionButtons}
                </div>
            </div>
        </div>
    `;
    return card;
}

// --- EVENT HANDLERS ---

// Fungsi untuk meng-handle update status (approve/reject)
async function handleUpdateStatus(eventId, newStatus) {
    const confirmed = confirm(`Anda yakin ingin ${newStatus === 'approved' ? 'menyetujui' : 'menolak'} event ini?`);
    if (!confirmed) return;

    const { error } = await supabase
        .from('events')
        .update({ status: newStatus })
        .eq('id', eventId);
    
    if (error) {
        console.error('Error updating status:', error);
        alert('Gagal mengupdate status event.');
    } else {
        alert('Status event berhasil diupdate!');
        // Refresh data di halaman
        fetchEventCounts();
        // Ambil filter yang sedang aktif dari tab
        const activeTab = tabsNav.querySelector('.border-indigo-600');
        const currentFilter = activeTab.dataset.status || 'all';
        fetchAndDisplayEvents(currentFilter);
    }
}

// Event listener untuk tombol approve/reject menggunakan event delegation
eventListContainer.addEventListener('click', (e) => {
    const button = e.target.closest('.action-btn');
    if (button) {
        e.preventDefault();
        const eventId = button.dataset.id;
        const action = button.dataset.action;
        if (action === 'approve') {
            handleUpdateStatus(eventId, 'approved');
        } else if (action === 'reject') {
            handleUpdateStatus(eventId, 'rejected');
        }
    }
});

// Event listener untuk tabs filter
tabsNav.addEventListener('click', (e) => {
    e.preventDefault();
    const link = e.target.closest('.tab-link');
    if (link) {
        // Hapus style aktif dari semua tab
        tabsNav.querySelectorAll('.tab-link').forEach(tab => {
            tab.classList.remove('text-indigo-600', 'border-b-2', 'border-indigo-600');
        });
        // Tambahkan style aktif ke tab yang diklik
        link.classList.add('text-indigo-600', 'border-b-2', 'border-indigo-600');

        const statusFilter = link.dataset.status;
        fetchAndDisplayEvents(statusFilter);
    }
});


// --- INITIALIZATION ---
// Fungsi yang berjalan saat halaman pertama kali dimuat
async function initializePage() {
    await checkAdminStatus(); // Pertama, cek status admin
    fetchEventCounts();       // Kedua, hitung statistik
    fetchAndDisplayEvents('all'); // Ketiga, tampilkan semua event
}

// Jalankan saat DOM selesai dimuat
document.addEventListener('DOMContentLoaded', initializePage);