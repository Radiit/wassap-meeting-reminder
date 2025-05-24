# Panduan Penggunaan WhatsApp Meeting Reminder Bot

## Perintah Dasar

Bot ini mendukung beberapa perintah dasar yang dapat digunakan dalam grup WhatsApp:

### 1. Mengatur Pertemuan

Untuk mengatur pertemuan baru, gunakan perintah:

```
/set-meeting <tanggal dan waktu> <judul pertemuan>
```

Atau:

```
@set-meeting <tanggal dan waktu> <judul pertemuan>
```

Contoh:
- `/set-meeting 5 januari 19:00 Diskusi Project X`
- `/set-meeting besok jam 10 pagi Meeting Tim`
- `/set-meeting senin depan 14:30 Review Sprint`

Bot akan memproses perintah tersebut, membuat event di Google Calendar, dan mengirimkan konfirmasi ke grup.

### 2. Melihat Daftar Pertemuan

Untuk melihat daftar pertemuan yang akan datang, gunakan perintah:

```
/list-meetings
```

Atau:

```
@list-meetings
```

Bot akan menampilkan daftar 5 pertemuan terdekat yang dijadwalkan untuk grup tersebut.

### 3. Membatalkan Pertemuan

Untuk membatalkan pertemuan, gunakan perintah:

```
/cancel-meeting <indeks atau judul>
```

Atau:

```
@cancel-meeting <indeks atau judul>
```

Contoh:
- `/cancel-meeting 1` (membatalkan pertemuan pertama dari daftar)
- `/cancel-meeting Diskusi Project X` (membatalkan pertemuan dengan judul tersebut)

Hanya pembuat pertemuan atau admin grup yang dapat membatalkan pertemuan.

## Format Tanggal dan Waktu

Bot mendukung berbagai format tanggal dan waktu dalam Bahasa Indonesia, seperti:

- Tanggal spesifik: `5 januari 2024`
- Hari relatif: `besok`, `lusa`, `senin depan`
- Waktu: `19:00`, `7 malam`, `10 pagi`
- Kombinasi: `besok jam 3 sore`, `senin depan jam 10:30`

## Pengingat

Bot akan mengirimkan pengingat ke grup WhatsApp 30 menit sebelum pertemuan dimulai. Pengingat ini berisi informasi tentang pertemuan, termasuk judul, tanggal, dan waktu.

## Integrasi Google Calendar

Setiap pertemuan yang dibuat melalui bot akan otomatis ditambahkan ke Google Calendar. Ini memungkinkan Anda untuk melihat dan mengelola pertemuan melalui aplikasi Google Calendar.

## Batasan

- Bot hanya dapat digunakan dalam grup WhatsApp, bukan dalam chat pribadi.
- Bot memerlukan izin untuk mengirim pesan ke grup.
- Untuk menggunakan fitur Google Calendar, administrator bot harus mengautentikasi dengan akun Google terlebih dahulu.