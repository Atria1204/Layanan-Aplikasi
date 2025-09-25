// frontend/main.js
import { supabase } from './supabaseClient.js'

// ---------- LOGIN ----------
const loginForm = document.getElementById('login-form')
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    const msgEl = document.getElementById('login-message')

    msgEl.textContent = 'Memproses...'

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      msgEl.style.color = 'red'
      msgEl.textContent = error.message
      return
    }

    // sukses → redirect
    msgEl.style.color = 'green'
    msgEl.textContent = 'Login berhasil. Mengalihkan...'
    window.location.href = '/home.html'
  })
}

// ---------- SIGNUP ----------
const signupForm = document.getElementById('signup-form')
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('signup-email').value
    const password = document.getElementById('signup-password').value
    const el = document.getElementById('signup-message')
    el.textContent = 'Memproses...'

    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      el.style.color = 'red'
      el.textContent = error.message
      return
    }

    el.style.color = 'green'
    el.textContent = 'Signup berhasil! Cek email (jika verifikasi diaktifkan).'
    setTimeout(() => window.location.href = '/index.html', 1200)
  })
}

// ---------- PROTECT HOME ----------
async function protectHome() {
  if (!location.pathname.endsWith('/home.html')) return

  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error(error)
  }
  if (!session) {
    // belum login
    window.location.href = '/index.html'
    return
  }

  const userEmailEl = document.getElementById('user-email')
  userEmailEl.textContent = 'Logged in as: ' + (session.user.email ?? session.user.identities?.[0]?.identity_data?.email ?? 'User')
}

protectHome()

// ---------- LOGOUT ----------
const logoutBtn = document.getElementById('logout-btn')
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut()
    window.location.href = '/index.html'
  })
}
