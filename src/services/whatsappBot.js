const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const chrono = require('chrono-node');
const Reminder = require('../models/Reminder');

class WhatsAppBot {
  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        args: ['--no-sandbox'],
      }
    });

    this.initialize();
  }

  initialize() {
    this.client.on('qr', (qr) => {
      qrcode.generate(qr, { small: true });
      console.log('QR Code generated. Scan it with WhatsApp to login.');
    });

    this.client.on('ready', () => {
      console.log('WhatsApp bot is ready!');
    });

    this.client.on('message', async (message) => {
      // Log debug untuk pesan masuk
      console.log('Pesan masuk:', message.body, 'mentionedIds:', message.mentionedIds, 'botId:', this.client.info?.wid?._serialized);
      // Deteksi mention ke akun bot sendiri dan command /reminder
      if (
        message.mentionedIds &&
        this.client.info &&
        message.mentionedIds.includes(this.client.info.wid._serialized) &&
        message.body.toLowerCase().includes('/reminder')
      ) {
        await this.handleCommand(message);
      }
    });

    this.client.initialize();
  }

  async handleCommand(message) {
    const command = message.body.toLowerCase();
    if (command.includes('/help')) {
      await this.handleHelpCommand(message);
    } else if (command.includes('/reminder')) {
      await this.handleReminderCommand(message);
    }
  }

  async handleHelpCommand(message) {
    const helpMessage = `🤖 *BANTUAN PENGGUNAAN BOT CTS BANGET *\n\n` +
      `*Perintah yang tersedia:*\n` +
      `1. @bot /help - Menampilkan bantuan ini\n` +
      `2. @bot ingetin untuk [judul meeting] jam [waktu] tanggal [tanggal]\n\n` +
      `*Contoh penggunaan:*\n` +
      `@bot ingetin untuk meeting pak bon jam 2 tanggal 14 november 2025\n\n` +
      `*Catatan:*\n` +
      `- Bot akan mengirim pengingat 1 hari dan 30 menit sebelum jadwal\n` +
      `- Pastikan format tanggal dan waktu jelas dan benar\n` +
      `- Bot akan mengirim konfirmasi setelah menerima perintah`;

    await message.reply(helpMessage);
  }

  async handleReminderCommand(message) {
    try {
      // Extract meeting details using chrono
      const parsedDate = chrono.parseDate(message.body);
      if (!parsedDate) {
        await message.reply('Maaf, saya tidak bisa memahami waktu meeting. Mohon gunakan format yang jelas, contoh: "@bot ingetin untuk meeting pak bon jam 2 tanggal 14 november 2025"');
        return;
      }

      // Extract meeting title (everything between "untuk" and the time)
      const titleMatch = message.body.match(/untuk\s+(.*?)\s+(?:jam|tanggal)/i);
      const meetingTitle = titleMatch ? titleMatch[1].trim() : 'Meeting';

      // Create reminder
      const reminder = new Reminder({
        chatId: message.from,
        meetingTitle,
        meetingTime: parsedDate,
        createdBy: message.from,
      });

      await reminder.save();

      // Send confirmation
      await message.reply(`✅ Saya akan mengingatkan untuk ${meetingTitle} pada ${parsedDate.toLocaleString('id-ID')}. Saya akan mengirim pengingat 1 hari dan 30 menit sebelum jadwal.`);
    } catch (error) {
      console.error('Error handling reminder command:', error);
      await message.reply('Maaf, terjadi kesalahan saat memproses permintaan Anda.');
    }
  }

  async sendReminder(reminder) {
    try {
      const message = `🔔 Frenlyy Reminder Meeting\n\n` +
        `Judul: ${reminder.meetingTitle}\n` +
        `Waktu: ${reminder.meetingTime.toLocaleString('id-ID')}\n\n` +
        `Jangan Telat yeee oiii`;

      await this.client.sendMessage(reminder.chatId, message);
    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  }
}

module.exports = new WhatsAppBot(); 