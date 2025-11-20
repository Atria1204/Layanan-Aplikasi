import { supabase } from '../supabaseClient.js';

// --- DOM ELEMENTS ---
const eventListContainer = document.getElementById('event-list-container');
const tabsNav = document.getElementById('tabs-nav');
const tabLinks = document.querySelectorAll('.tab-link');

// Stats Elements
const pendingCountEl = document.getElementById('pending-count');
const approvedCountEl = document.getElementById('approved-count');
const rejectedCountEl = document.getElementById('rejected-count');

const tabPendingCountEl = document.getElementById('tab-pending-count');
const tabApprovedCountEl = document.getElementById('tab-approved-count');
const tabRejectedCountEl = document.getElementById('tab-rejected-count');
const tabAllCountEl = document.getElementById('tab-all-count');

let currentFilter = 'pending'; // Default tab yang aktif saat pertama buka

// --- 1. SECURITY CHECK (Cek apakah user adalah Admin) ---
async function checkAdminStatus() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.user) {
        window.location.href = '/login/login.html';
        return;
    }

    // Cek role di tabel profiles
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (error || !profile || profile.role !== 'admin') {
        alert('Akses ditolak. Halaman ini khusus Admin.');
        window.location.href = '/user/dashboard.html';
    }
}

// --- 2. FETCH DATA EVENT ---
async function fetchEvents() {
    // Tampilkan loading state
    eventListContainer.innerHTML = `
        <div class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-indigo-600"></div>
            <p class="mt-2 text-gray-400">Memuat data...</p>
        </div>`;

    // Query Dasar
    let query = supabase
        .from('events')
        .select('*, profiles(full_name, phone_number)')
        .order('created_at', { ascending: false });

    // Terapkan Filter Tab (Kecuali 'all')
    if (currentFilter !== 'all') {
        query = query.eq('status', currentFilter);
    }

    const { data: events, error } = await query;

    if (error) {
        console.error('Error fetching events:', error);
        eventListContainer.innerHTML = '<div class="text-center text-red-500 py-10">Gagal memuat data. Silakan refresh.</div>';
        return;
    }

    // Update Angka Statistik
    await updateStats();
    
    // Render Kartu
    renderEvents(events);
}

// --- 3. RENDER EVENTS (Tampilan Kartu) ---
function renderEvents(events) {
    if (!events || events.length === 0) {
        eventListContainer.innerHTML = `
            <div class="text-center py-16 flex flex-col items-center text-gray-400">
                <i data-lucide="inbox" class="w-16 h-16 mb-4 text-gray-200"></i>
                <p class="text-lg">Tidak ada event di kategori ini.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    eventListContainer.innerHTML = '';

    events.forEach(event => {
        // 1. Tentukan Badge Status
        let statusBadge = '';
        if(event.status === 'pending') statusBadge = '<span class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Pending</span>';
        else if(event.status === 'approved') statusBadge = '<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Approved</span>';
        else if(event.status === 'rejected') statusBadge = '<span class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Rejected</span>';

        // 2. Format Tanggal
        const eventDate = new Date(event.event_date).toLocaleDateString('id-ID', { 
            weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
        });

        // 3. Tentukan Tombol Aksi
        let actionButtons = '';
        
        if (event.status === 'pending') {
            // Tombol untuk Pending: Tolak & Setujui
            actionButtons = `
                <div class="flex gap-3 mt-4 sm:mt-0 w-full sm:w-auto">
                    <button class="btn-reject flex-1 sm:flex-none px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors" data-id="${event.id}">
                        Tolak
                    </button>
                    <button class="btn-approve flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm" data-id="${event.id}">
                        Setujui
                    </button>
                </div>
            `;
        } else {
            // Tombol untuk Approved/Rejected: HAPUS (Warna Merah Terang bg-red-500)
            actionButtons = `
                <div class="flex gap-3 mt-4 sm:mt-0 w-full sm:w-auto justify-end">
                    <button class="btn-delete px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto" data-id="${event.id}">
                        <i data-lucide="trash-2" class="w-4 h-4"></i> Hapus
                    </button>
                </div>
            `;
        }

        // 4. Handle Gambar (Placeholder jika kosong)
        const imageSrc = event.image_url || 'https://placehold.co/100x100/e2e8f0/64748b?text=No+Img';

        // 5. Susun HTML Kartu
        const cardHTML = `
            <div class="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row gap-5">
                
                <div class="w-full sm:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                    <img src="${imageSrc}" class="w-full h-full object-cover" alt="${event.title}">
                </div>
                
                <div class="flex-1 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center gap-2 mb-2">
                            ${statusBadge}
                            <span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">${event.category || 'Umum'}</span>
                        </div>
                        
                        <h3 class="text-lg font-bold text-gray-900 leading-tight mb-1">
                            <a href="/main/event-detail.html?id=${event.id}" class="hover:text-indigo-600 transition-colors">${event.title}</a>
                        </h3>
                        
                        <div class="text-sm text-gray-500 flex flex-col gap-1 mt-2">
                            <span class="flex items-center gap-2"><i data-lucide="calendar" class="w-3 h-3"></i> ${eventDate}</span>
                            <span class="flex items-center gap-2"><i data-lucide="map-pin" class="w-3 h-3"></i> ${event.location}</span>
                            <span class="flex items-center gap-2"><i data-lucide="user" class="w-3 h-3"></i> ${event.organizer_name || event.profiles?.full_name || 'User'}</span>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col justify-end border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-100">
                    ${actionButtons}
                </div>
            </div>
        `;

        eventListContainer.innerHTML += cardHTML;
    });

    // Re-init Icons
    lucide.createIcons();
}

// --- 4. UPDATE STATISTIK ---
async function updateStats() {
    const { count: pending } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const { count: approved } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'approved');
    const { count: rejected } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'rejected');
    const { count: all } = await supabase.from('events').select('*', { count: 'exact', head: true });

    // Update Cards Atas
    if(pendingCountEl) pendingCountEl.innerText = pending || 0;
    if(approvedCountEl) approvedCountEl.innerText = approved || 0;
    if(rejectedCountEl) rejectedCountEl.innerText = rejected || 0;

    // Update Badge di Tabs
    if(tabPendingCountEl) tabPendingCountEl.innerText = pending || 0;
    if(tabApprovedCountEl) tabApprovedCountEl.innerText = approved || 0;
    if(tabRejectedCountEl) tabRejectedCountEl.innerText = rejected || 0;
    if(tabAllCountEl) tabAllCountEl.innerText = all || 0;
}

// --- 5. EVENT HANDLERS (Update & Delete) ---

// Handle Click pada Tombol di dalam Event List (Event Delegation)
eventListContainer.addEventListener('click', async (e) => {
    const target = e.target.closest('button');
    if (!target) return;

    const id = target.dataset.id;
    if (!id) return;

    // LOGIKA APPROVE
    if (target.classList.contains('btn-approve')) {
        if (confirm('Setujui event ini? Event akan tampil di halaman publik.')) {
            const { error } = await supabase.from('events').update({ status: 'approved' }).eq('id', id);
            if (!error) fetchEvents();
            else alert('Gagal update status');
        }
    }
    // LOGIKA REJECT
    else if (target.classList.contains('btn-reject')) {
        if (confirm('Tolak event ini?')) {
            const { error } = await supabase.from('events').update({ status: 'rejected' }).eq('id', id);
            if (!error) fetchEvents();
            else alert('Gagal update status');
        }
    }
    // LOGIKA DELETE (HAPUS)
    else if (target.classList.contains('btn-delete')) {
        if (confirm('Hapus event ini secara permanen? Tindakan tidak bisa dibatalkan.')) {
            const { error } = await supabase.from('events').delete().eq('id', id);
            if (!error) {
                alert('Event berhasil dihapus');
                fetchEvents();
            } else {
                console.error(error);
                alert('Gagal menghapus event. Pastikan Anda punya hak akses.');
            }
        }
    }
});

// Handle Tab Navigation
tabsNav.addEventListener('click', (e) => {
    e.preventDefault();
    const clickedTab = e.target.closest('.tab-link');
    
    if (clickedTab) {
        // Reset semua tab
        document.querySelectorAll('.tab-link').forEach(tab => {
            tab.classList.remove('active-tab', 'text-indigo-600', 'border-brand-500', 'border-yellow-400', 'border-green-500', 'border-red-500');
            tab.classList.add('border-transparent', 'text-gray-500');
        });

        // Set tab aktif
        clickedTab.classList.remove('border-transparent', 'text-gray-500');
        clickedTab.classList.add('active-tab'); // Class ini ada di CSS admin.css

        // Update filter & fetch
        currentFilter = clickedTab.dataset.status;
        fetchEvents();
    }
});

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    await checkAdminStatus();
    fetchEvents();
});