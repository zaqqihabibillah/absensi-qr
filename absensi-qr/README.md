# Presensi QR SMPN 1 Sijunjung

Frontend statis untuk GitHub Pages + Firebase Authentication + Cloud Firestore.

## 1. Buat proyek Firebase
1. Buka https://console.firebase.google.com/ lalu pilih **Add project**.
2. Buat project, lalu tambahkan aplikasi Web (`</>`).
3. Salin konfigurasi SDK ke `js/firebase-config.js`.
4. Authentication → Sign-in method → aktifkan **Email/Password**.
5. Authentication → Users → Add user untuk membuat akun guru.
6. Firestore Database → Create database (Production mode).
7. Buka tab Rules, salin isi `firestore.rules`, lalu **Publish**.
8. Firestore harus berada pada database `(default)`.

> Rules ini mengizinkan semua akun yang berhasil login mengelola data siswa dan presensi. Untuk penggunaan sekolah yang lebih ketat, tahap berikutnya sebaiknya menambahkan custom claims/role admin dan validasi status kehadiran yang lebih ketat.

## 2. Konfigurasi
Isi semua nilai placeholder di `js/firebase-config.js` dengan konfigurasi Web App dari Firebase Console. Jangan mengunggah password akun guru atau private key service account.

## 3. Jalankan lokal
Gunakan server lokal (bukan membuka file langsung), misalnya:
```bash
python -m http.server 8000
```
Lalu buka http://localhost:8000. Kamera biasanya memerlukan localhost atau HTTPS.

## 4. Deploy GitHub Pages
1. Buat repository GitHub, misalnya `absensi-qr`.
2. Upload seluruh isi folder ini ke root repository.
3. Repository → Settings → Pages.
4. Source: **Deploy from a branch**, branch `main`, folder `/ (root)`, Save.
5. Tunggu deployment, lalu buka URL Pages. Tambahkan URL domain GitHub Pages ke Authentication → Settings → Authorized domains jika belum terdaftar.

## 5. Format CSV siswa
Simpan sebagai UTF-8 CSV dengan header dan urutan:
```csv
NISN,Nama,Kelas
0081234567,Ahmad Fauzi,VII-A
0081234568,Siti Aminah,VII-A
```
Parser MVP ini mendukung CSV sederhana (tanpa koma di dalam nama/kelas).

## Catatan implementasi
- NISN harus tepat 10 digit dan dipakai sebagai Document ID.
- Absensi harian menggunakan ID `YYYY-MM-DD_NISN`; transaksi Firestore mencegah scan ganda.
- Tanggal dan jam ditampilkan dalam zona `Asia/Jakarta` (WIB).
- Import CSV melakukan satu write per siswa; lakukan import bertahap jika datanya besar.
- Tailwind tidak digunakan pada versi ini; stylesheet lokal dipilih agar stabil dan tidak bergantung pada CDN Tailwind saat runtime.
