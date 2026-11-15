const TOKEN = "9211771792:AAHt3M35nDoY7Rn4aGuDWQkGafykJE7r7sI";
const TELEGRAM_URL = `https://api.telegram.org/bot${TOKEN}`;

async function sendMessage(chatId, text) {
  await fetch(`${TELEGRAM_URL}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "HTML"
    })
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("BIMTOL Bot Aktif!");
  }

  try {
    const data = req.body;

    if (data && data.message && data.message.text) {
      const chatId = data.message.chat.id;
      const text = data.message.text.trim();
      const firstName = data.message.from.first_name || "Kak";

      if (text === "/start" || text === "/start@chrisbim_bot") {
        const pesanSambutan =
          `Halo, ${firstName}!. Selamat datang di bot @chrisbim_bot\n\n` +
          `Perkenalkan nama saya BIMTOL, saya merupakan ciptaan @bimarchp\n\n` +
          `Bot ini akan digunakan untuk membantu dan melayani kamu setiap hari!\n\n` +
          `Pilih menu dibawah ini untuk memerintahkan BIMTOL!\n` +
          `• /start - Memulai bot\n` +
          `• /info - Informasi bot`;

        await sendMessage(chatId, pesanSambutan);
      } 
      else if (text === "/info" || text === "/info@chrisbim_bot") {
        const pesanInfo =
          `Halo, ${firstName}!, ini adalah informasi seputar saya\n` +
          `Nama : BIMTOL\n` +
          `Versi : v1.10 Beta\n` +
          `Rilis : 11 November 2026\n` +
          `Diperbarui : 12 November 2026\n` +
          `Bahasa : Indonesia`;

        await sendMessage(chatId, pesanInfo);
      } 
      // Respon jika user mengirim kata "Bimtol" (tidak peduli huruf besar/kecil)
      else if (text.toLowerCase() === "bimtol") {
        const pesanBimtol =
          `Halo, ${firstName}! Bimtol masih disini!\n` +
          `klik tombol Menu untuk memerintahkan saya!`;

        await sendMessage(chatId, pesanBimtol);
      }
      else {
        await sendMessage(
          chatId,
          "Perintah tidak dikenali. Ketik /info untuk melihat informasi BIMTOL atau /start untuk memulai."
        );
      }
    }
  } catch (err) {
    console.error(err);
  }

  return res.status(200).json({ ok: true });
}
