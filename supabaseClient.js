// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// Ganti dengan punya kamu di Supabase > Project Settings > API
const supabaseUrl = "https://jemojmbnrhyalgcdqruj.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplbW9qbWJucmh5YWxnY2RxcnVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxOTQzNzUsImV4cCI6MjA3Mzc3MDM3NX0.Z2Dl7Lx6RtXI6u_e5qlRt8CENVqBRwFSKKakeoRa45M"
export const supabase = createClient(supabaseUrl, supabaseKey)
