// Membuat koneksi ke Supabase menggunakan konfigurasi di config.js
// Variabel "sb" ini yang dipakai di script.js untuk ambil/simpan data
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);