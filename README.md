# WhatsApp Meeting Reminder Bot

Bot WhatsApp untuk mengatur dan mengingatkan jadwal pertemuan secara otomatis.

## Fitur

- Mengatur pengingat meeting melalui pesan WhatsApp
- Mengirim pengingat 1 hari dan 30 menit sebelum jadwal
- Mendukung format pesan natural language (contoh: "@bot ingetin untuk meeting pak bon jam 2 tanggal 14 november 2025")

## Persyaratan

- Node.js v14 atau lebih baru
- MongoDB
- Chrome/Chromium (untuk WhatsApp Web)
- Docker dan Docker Compose (untuk deployment)

## Instalasi

### Cara 1: Instalasi Manual

1. Clone repository ini
2. Install dependencies:
   ```bash
   npm install
   ```
3. Buat file `.env` dengan konfigurasi berikut:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/whatsapp-reminder
   ```
4. Jalankan aplikasi:
   ```bash
   npm start
   ```
5. Scan QR code yang muncul di terminal dengan WhatsApp di ponsel Anda

### Cara 2: Menggunakan Docker

1. Clone repository ini
2. Jalankan dengan Docker Compose:
   ```bash
   docker-compose up -d
   ```
3. Scan QR code yang muncul di log dengan WhatsApp di ponsel Anda:
   ```bash
   docker-compose logs -f app
   ```

## Penggunaan

1. Invite bot ke grup WhatsApp
2. Tag bot dengan format:
   ```
   @bot ingetin untuk [judul meeting] jam [waktu] tanggal [tanggal]
   ```
   Contoh:
   ```
   @bot ingetin untuk meeting pak bon jam 2 tanggal 14 november 2025
   ```

Bot akan mengirimkan konfirmasi dan mengingatkan meeting 1 hari dan 30 menit sebelum jadwal.

## Perintah Bot

1. `@bot /help` - Menampilkan bantuan penggunaan bot
2. `@bot ingetin untuk [judul meeting] jam [waktu] tanggal [tanggal]` - Mengatur pengingat meeting

## Pengembangan

Untuk mode development dengan auto-reload:
```bash
npm run dev
```

## Deployment di VPS

1. Install Docker dan Docker Compose di VPS:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. Clone repository ke VPS:
   ```bash
   git clone [URL_REPOSITORY]
   cd whatsapp-meeting-reminder
   ```

3. Jalankan aplikasi:
   ```bash
   docker-compose up -d
   ```

4. Cek log untuk QR code:
   ```bash
   docker-compose logs -f app
   ```

5. Scan QR code dengan WhatsApp di ponsel Anda

## Catatan Penting

- Pastikan port 3000 dan 27017 tidak digunakan oleh aplikasi lain
- Data WhatsApp session disimpan di volume `.wwebjs_auth`
- Data MongoDB disimpan di volume `mongodb_data`
- Aplikasi akan restart otomatis jika terjadi crash
