import { supabase } from '/supabaseClient.js';

// --- FUNGSI HELPER ---
function getInitials(fullName) {
    if (!fullName) return '?';
    const names = fullName.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    const firstInitial = names[0].charAt(0);
    const lastInitial = names[names.length - 1].charAt(0);
    return (firstInitial + lastInitial).toUpperCase();
}

// --- ELEMEN DOM ---
const userInitialsEl = document.getElementById('user-initials');
const welcomeMessageEl = document.getElementById('welcome-message');
const userUniversityEl = document.getElementById('user-university');
const myEventsListEl = document.getElementById('my-events-list');
const totalEventsStatEl = document.getElementById('total-events-stat');
const approvedEventsStatEl = document.getElementById('approved-events-stat');
const pendingEventsStatEl = document.getElementById('pending-events-stat');
const rejectedEventsStatEl = document.getElementById('rejected-events-stat');
const backButton = document.getElementById('back-button');
const logoutButton = document.getElementById('logout-button');
const manageEventsButton = document.getElementById('manage-events-button');

let currentUser = null;

// --- FUNGSI UTAMA ---

async function initializeDashboard() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert('Anda harus login untuk mengakses halaman ini.');
        window.location.href = '/login.html';
        return;
    }
    currentUser = user;
    populateHeader(user);
    fetchAndDisplayUserEvents(user);
}

async function populateHeader(user) {
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, university, role')
        .eq('id', user.id)
        .single();

    if (error || !profile) {
        console.error('Gagal mengambil profil pengguna.', error);
        return;
    }

    const { full_name, university, role } = profile;
    userInitialsEl.textContent = getInitials(full_name);
    welcomeMessageEl.textContent = `Selamat datang, ${full_name}`;
    userUniversityEl.textContent = university || 'Universitas belum diisi';

    if (role === 'admin') {
        manageEventsButton.style.display = 'flex';
    }
}

async function fetchAndDisplayUserEvents(user) {
    myEventsListEl.innerHTML = '<p>Memuat event Anda...</p>';
    const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        myEventsListEl.innerHTML = '<p class="text-red-500">Tidak dapat memuat event.</p>';
        return;
    }
    
    updateStats(events);

    if (events.length === 0) {
        myEventsListEl.innerHTML = '<p>Anda belum pernah mensubmit event.</p>';
        return;
    }

    myEventsListEl.innerHTML = '';
    events.forEach(event => {
        myEventsListEl.innerHTML += createEventItemHTML(event);
    });
}

function updateStats(events) {
    const approvedCount = events.filter(e => e.status === 'approved').length;
    const pendingCount = events.filter(e => e.status === 'pending').length;
    const rejectedCount = events.filter(e => e.status === 'rejected').length;

    totalEventsStatEl.textContent = events.length;
    approvedEventsStatEl.textContent = approvedCount;
    pendingEventsStatEl.textContent = pendingCount;
    rejectedEventsStatEl.textContent = rejectedCount;
}

function createEventItemHTML(event) {
    const statusClasses = { approved: 'status-approved', pending: 'status-pending', rejected: 'status-rejected' };
    const statusText = { approved: 'Published', pending: 'Pending Review', rejected: 'Rejected' };
    const date = new Date(event.created_at).toLocaleDateString('id-ID');

    return `
        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div class="flex items-center">
                <img src="${event.image_url || 'https://placehold.co/64x64/e2e8f0/64748b?text=Img'}" alt="Event Image" class="w-16 h-16 rounded-md mr-4 object-cover">
                <div>
                    <div class="flex items-center">
                        <h3 class="text-lg font-semibold mr-2">${event.title}</h3>
                        <span class="status-badge ${statusClasses[event.status]}">${statusText[event.status]}</span>
                    </div>
                    <p class="text-sm text-gray-500">Disubmit pada ${date}</p>
                </div>
            </div>
            <div class="flex space-x-2">
                <button class="action-button btn-lihat" data-id="${event.id}"><i class="fas fa-eye"></i> Lihat</button>
                <button class="action-button btn-edit" data-id="${event.id}"><i class="fas fa-edit"></i> Edit</button>
                <button class="action-button btn-hapus btn-delete" data-id="${event.id}"><i class="fas fa-trash-alt"></i> Hapus</button>
            </div>
        </div>
    `;
}

async function handleDeleteEvent(eventId) {
    if (!confirm('Apakah Anda yakin ingin menghapus event ini secara permanen?')) return;

    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) {
        alert('Gagal menghapus event.');
    } else {
        alert('Event berhasil dihapus.');
        fetchAndDisplayUserEvents(currentUser);
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/login.html';
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', initializeDashboard);
backButton.addEventListener('click', () => { window.location.href = '/main/home.html'; });
logoutButton.addEventListener('click', handleLogout);
myEventsListEl.addEventListener('click', (e) => {
    const deleteButton = e.target.closest('.btn-delete');
    if (deleteButton) {
        handleDeleteEvent(deleteButton.dataset.id);
    }
});