# Panduan Memperbaiki RLS Policy untuk Fungsi Hapus Event

## Masalah
Event tidak terhapus meskipun alert "Event berhasil dihapus" muncul. Ini biasanya disebabkan oleh RLS (Row Level Security) Policy di Supabase yang tidak mengizinkan operasi DELETE.

## Solusi

### 1. Buka Supabase Dashboard
1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Pergi ke **Table Editor** → pilih tabel **`events`**
4. Klik tab **"Policies"**

### 2. Buat Policy untuk User Menghapus Event Miliknya Sendiri

**Policy Name:** `Users can delete their own events`

**Policy Definition:**
```sql
CREATE POLICY "Users can delete their own events"
ON events
FOR DELETE
USING (auth.uid() = user_id);
```

**Cara membuat:**
1. Klik **"New Policy"**
2. Pilih **"For full customization"**
3. Isi:
   - **Policy name:** `Users can delete their own events`
   - **Allowed operation:** `DELETE`
   - **USING expression:** `auth.uid() = user_id`
4. Klik **"Review"** lalu **"Save policy"**

### 3. Buat Policy untuk Admin Menghapus Semua Event

**Policy Name:** `Admins can delete any event`

**Policy Definition:**
```sql
CREATE POLICY "Admins can delete any event"
ON events
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

**Cara membuat:**
1. Klik **"New Policy"**
2. Pilih **"For full customization"**
3. Isi:
   - **Policy name:** `Admins can delete any event`
   - **Allowed operation:** `DELETE`
   - **USING expression:** 
     ```sql
     EXISTS (
       SELECT 1 FROM profiles
       WHERE profiles.id = auth.uid()
       AND profiles.role = 'admin'
     )
     ```
4. Klik **"Review"** lalu **"Save policy"**

### 4. Verifikasi Policy

Setelah membuat policy, pastikan:
- ✅ Policy aktif (toggle ON)
- ✅ Policy muncul di daftar policies untuk tabel `events`
- ✅ Tidak ada policy lain yang conflict

### 5. Test Fungsi Hapus

1. Buka browser console (F12)
2. Coba hapus event
3. Periksa console untuk log:
   - `=== DELETE EVENT START ===`
   - `Delete operation result:`
   - `=== DELETE EVENT SUCCESS ===` atau error message

## Troubleshooting

### Jika masih tidak berfungsi:

1. **Cek apakah RLS enabled:**
   - Table Editor → events → Settings
   - Pastikan "Enable Row Level Security" aktif

2. **Cek user_id di event:**
   - Pastikan kolom `user_id` di tabel `events` terisi dengan benar
   - Pastikan `user_id` sesuai dengan `auth.uid()`

3. **Cek role admin:**
   - Pastikan di tabel `profiles`, kolom `role` untuk user admin berisi `'admin'` (huruf kecil)

4. **Test langsung di SQL Editor:**
   ```sql
   -- Test delete sebagai user
   DELETE FROM events WHERE id = 'event-id-here' AND user_id = auth.uid();
   
   -- Test delete sebagai admin
   DELETE FROM events WHERE id = 'event-id-here' 
   AND EXISTS (
     SELECT 1 FROM profiles 
     WHERE profiles.id = auth.uid() 
     AND profiles.role = 'admin'
   );
   ```

## Catatan Penting

- RLS Policy berlaku untuk semua operasi (SELECT, INSERT, UPDATE, DELETE)
- Pastikan policy untuk SELECT juga sudah benar agar user bisa melihat event miliknya
- Jika menggunakan service role key, RLS tidak berlaku (tapi jangan gunakan di frontend!)

