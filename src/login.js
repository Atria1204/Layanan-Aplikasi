// src/login.js
import { supabase } from '../supabaseClient.js'

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault()

  const email = document.getElementById("email").value
  const password = document.getElementById("password").value

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    alert("Login gagal: " + error.message)
  } else {
    alert("Login sukses, selamat datang " + data.user.email)
    window.location.href = "home.html"
  }
})
