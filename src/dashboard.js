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
    if (events.length === 0) {
        myEventsListEl.innerHTML = '<p>Anda belum pernah mensubmit event.</p>';
        return;
    }
    
    events.forEach(event => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = createEventItemHTML(event);
        const eventElement = tempDiv.firstElementChild;
        if (eventElement) {
            eventElement.setAttribute('data-event-id', event.id);
            myEventsListEl.appendChild(eventElement);
        }
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
        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg" data-event-id="${event.id}">
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

function handleViewEvent(eventId) {
    // Navigate to event detail page
    window.location.href = `/main/event-detail.html?id=${eventId}`;
}

function handleEditEvent(eventId) {
    // Navigate to submit event page with edit mode
    window.location.href = `/user/submit_event.html?edit=${eventId}`;
}

async function handleDeleteEvent(eventId) {
    if (!confirm('Apakah Anda yakin ingin menghapus event ini secara permanen?')) return;

    // Hapus dari DOM langsung untuk feedback visual (optimistic update)
    const eventElement = myEventsListEl.querySelector(`[data-event-id="${eventId}"]`);
    if (eventElement) {
        eventElement.style.transition = 'opacity 0.3s';
        eventElement.style.opacity = '0.5';
    }

    try {
        console.log('=== DELETE EVENT START ===');
        console.log('Event ID:', eventId);
        console.log('User ID:', currentUser.id);
        
        // Verifikasi event milik user sebelum hapus
        const { data: verifyData, error: verifyError } = await supabase
            .from('events')
            .select('id, user_id, title')
            .eq('id', eventId)
            .single();
        
        console.log('Verify result:', { verifyData, verifyError });
        
        if (verifyError || !verifyData) {
            console.error('Event tidak ditemukan atau error:', verifyError);
            if (eventElement) {
                eventElement.style.opacity = '1';
            }
            alert('Event tidak ditemukan.');
            await fetchAndDisplayUserEvents(currentUser);
            return;
        }
        
        if (verifyData.user_id !== currentUser.id) {
            console.error('Permission denied. Event user_id:', verifyData.user_id, 'Current user:', currentUser.id);
            if (eventElement) {
                eventElement.style.opacity = '1';
            }
            alert('Anda tidak memiliki izin untuk menghapus event ini.');
            return;
        }
        
        console.log('Event verified. Proceeding with delete...');
        
        // Hapus event dengan select untuk melihat hasilnya
        const { data: deletedData, error: deleteError } = await supabase
            .from('events')
            .delete()
            .eq('id', eventId)
            .eq('user_id', currentUser.id)
            .select();
            
        console.log('Delete operation result:', { deletedData, deleteError });
            
        if (deleteError) {
            console.error('Delete error:', deleteError);
            if (eventElement) {
                eventElement.style.opacity = '1';
            }
            alert('Gagal menghapus event: ' + deleteError.message + '\n\nError code: ' + deleteError.code + '\n\nSilakan periksa RLS policy di Supabase.');
            return;
        }

        // Cek apakah ada data yang dihapus
        if (!deletedData || deletedData.length === 0) {
            console.warn('No rows deleted! This usually means RLS policy is blocking the delete.');
            if (eventElement) {
                eventElement.style.opacity = '1';
            }
            alert('Gagal menghapus event. Tidak ada baris yang terhapus.\n\nKemungkinan masalah:\n1. RLS Policy di Supabase tidak mengizinkan DELETE\n2. Event sudah dihapus sebelumnya\n\nSilakan periksa RLS policy di Supabase Dashboard.');
            
            // Refresh untuk memastikan data terbaru
            await fetchAndDisplayUserEvents(currentUser);
            return;
        }

        console.log('Event deleted successfully:', deletedData);
        
        // Verifikasi sekali lagi bahwa event benar-benar terhapus
        await new Promise(resolve => setTimeout(resolve, 500));
        const { data: checkData, error: checkError } = await supabase
            .from('events')
            .select('id')
            .eq('id', eventId)
            .maybeSingle();
        
        console.log('Verification check:', { checkData, checkError });
        
        if (checkData) {
            console.error('Event masih ada setelah delete! RLS policy mungkin tidak bekerja dengan benar.');
            if (eventElement) {
                eventElement.style.opacity = '1';
            }
            alert('Event masih ada setelah penghapusan.\n\nIni menunjukkan masalah dengan RLS policy di Supabase.\n\nSilakan:\n1. Buka Supabase Dashboard\n2. Pergi ke Table Editor > events > Policies\n3. Pastikan ada policy DELETE yang mengizinkan user menghapus event miliknya sendiri');
            await fetchAndDisplayUserEvents(currentUser);
            return;
        }
        
        // Berhasil! Hapus dari DOM
        console.log('=== DELETE EVENT SUCCESS ===');
        if (eventElement) {
            setTimeout(() => {
                eventElement.remove();
            }, 300);
        }
        
        // Refresh daftar event untuk memastikan data terbaru
        await fetchAndDisplayUserEvents(currentUser);
        
        // Tampilkan alert sukses
        alert('Event berhasil dihapus!');
        
    } catch (error) {
        console.error('=== DELETE EVENT ERROR ===', error);
        if (eventElement) {
            eventElement.style.opacity = '1';
        }
        alert('Terjadi kesalahan saat menghapus event:\n' + error.message + '\n\nSilakan periksa console untuk detail lebih lanjut.');
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/login/login.html';
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    
    if (backButton) {
        backButton.addEventListener('click', () => { window.location.href = '/main/home.html'; });
    }
    
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    
    // Event delegation untuk tombol-tombol di dalam myEventsListEl
    if (myEventsListEl) {
        myEventsListEl.addEventListener('click', (e) => {
            // Handle View button
            const viewButton = e.target.closest('.btn-lihat');
            if (viewButton && viewButton.dataset.id) {
                e.preventDefault();
                handleViewEvent(viewButton.dataset.id);
                return;
            }

            // Handle Edit button
            const editButton = e.target.closest('.btn-edit');
            if (editButton && editButton.dataset.id) {
                e.preventDefault();
                handleEditEvent(editButton.dataset.id);
                return;
            }

            // Handle Delete button - check for both btn-delete class and icon parent
            const deleteButton = e.target.closest('.btn-delete') || e.target.closest('.btn-hapus');
            if (deleteButton && deleteButton.dataset.id) {
                e.preventDefault();
                e.stopPropagation();
                handleDeleteEvent(deleteButton.dataset.id);
                return;
            }
            
            // Handle click on icon inside delete button
            if (e.target.closest('i.fa-trash-alt')) {
                const deleteBtn = e.target.closest('.btn-delete') || e.target.closest('.btn-hapus');
                if (deleteBtn && deleteBtn.dataset.id) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteEvent(deleteBtn.dataset.id);
                    return;
                }
            }
        });
    }
});