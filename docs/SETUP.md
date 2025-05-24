# Panduan Instalasi dan Konfigurasi

## Prasyarat

- Node.js (versi 14 atau lebih baru)
- MongoDB (lokal atau cloud)
- Akun WhatsApp Business API
- Akun Google Cloud Platform dengan Google Calendar API yang diaktifkan

## Langkah 1: Clone Repositori

```bash
git clone https://github.com/username/whatsapp-meeting-reminder.git
cd whatsapp-meeting-reminder
```

## Langkah 2: Instalasi Dependensi

```bash
npm install
```

## Langkah 3: Konfigurasi Lingkungan

1. Salin file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

2. Edit file `.env` dan isi dengan kredensial dan konfigurasi yang sesuai:

```
# WhatsApp Cloud API Credentials
WHATSAPP_API_TOKEN=your_whatsapp_api_token
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token

# Google Calendar API Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
GOOGLE_REFRESH_TOKEN=your_google_refresh_token

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/meeting-reminder

# Application Settings
PORT=3000
NODE_ENV=development

# Reminder Settings (in minutes)
DEFAULT_REMINDER_TIME=30
```

## Langkah 4: Konfigurasi WhatsApp Cloud API

1. Buat akun di [Facebook Developer Portal](https://developers.facebook.com/)
2. Buat aplikasi baru dan aktifkan WhatsApp API
3. Dapatkan token akses dan ID nomor telepon WhatsApp Business
4. Konfigurasikan webhook dengan URL server Anda dan token verifikasi yang Anda tentukan di file `.env`

## Langkah 5: Konfigurasi Google Calendar API

1. Buat project di [Google Cloud Console](https://console.cloud.google.com/)
2. Aktifkan Google Calendar API
3. Buat kredensial OAuth2 (Client ID dan Client Secret)
4. Tambahkan URI redirect yang sesuai dengan `GOOGLE_REDIRECT_URI` di file `.env`

## Langkah 6: Mendapatkan Refresh Token Google

1. Jalankan aplikasi:

```bash
npm run dev
```

2. Buka browser dan akses URL berikut:

```
http://localhost:3000/auth/google
```

3. Ikuti proses autentikasi Google
4. Setelah berhasil, Anda akan melihat refresh token di halaman callback
5. Salin refresh token tersebut dan tambahkan ke file `.env` sebagai `GOOGLE_REFRESH_TOKEN`

## Langkah 7: Menjalankan Aplikasi

```bash
npm start
```

Aplikasi akan berjalan di `http://localhost:3000` (atau port yang Anda tentukan di file `.env`).

## Langkah 8: Mengekspos Webhook ke Internet

Untuk pengujian lokal, Anda dapat menggunakan [ngrok](https://ngrok.com/) untuk mengekspos server lokal Anda ke internet:

```bash
ngrok http 3000
```

Gunakan URL HTTPS yang diberikan oleh ngrok sebagai URL webhook di konfigurasi WhatsApp Cloud API.

## Langkah 9: Verifikasi Webhook

WhatsApp akan mengirimkan permintaan verifikasi ke webhook Anda. Pastikan server Anda berjalan dan dapat diakses dari internet.

## Langkah 10: Deployment Produksi

Untuk deployment produksi, Anda dapat menggunakan layanan hosting seperti:

- Heroku
- AWS Elastic Beanstalk
- Google Cloud Run
- Digital Ocean

Pastikan untuk mengatur variabel lingkungan yang sesuai di platform hosting Anda.

## Pemecahan Masalah

### Webhook Tidak Terverifikasi

- Pastikan URL webhook dapat diakses dari internet
- Periksa apakah token verifikasi di file `.env` sama dengan yang dikonfigurasi di WhatsApp Cloud API

### Pesan Tidak Terkirim

- Periksa log server untuk melihat error
- Pastikan token WhatsApp API masih valid
- Verifikasi bahwa nomor telepon WhatsApp Business sudah disetujui

### Masalah dengan Google Calendar

- Pastikan Google Calendar API sudah diaktifkan
- Periksa apakah refresh token masih valid
- Verifikasi bahwa scope OAuth2 sudah mencakup akses ke Google Calendar