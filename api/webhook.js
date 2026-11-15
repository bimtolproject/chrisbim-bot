const TOKEN = "9211771792:AAHt3M35nDoY7Rn4aGuDWQkGafykJE7r7sI";
const TELEGRAM_URL = `https://api.telegram.org/bot${TOKEN}`;
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "").trim();

// Bank Soal Kuis
const BANK_KUIS = [
  { soal: "Planet terbesar di tata surya kita adalah?", jawaban: "jupiter" },
  { soal: "Apa ibu kota negara Jepang?", jawaban: "tokyo" },
  { soal: "Berapa hasil dari 15 x 4 + 10?", jawaban: "70" },
  { soal: "Komponen motor matic yang berfungsi mengubah rasio putaran secara otomatis disebut?", jawaban: "cvt" },
  { soal: "Unsur kimia dengan lambang O adalah?", jawaban: "oksigen" },
  { soal: "Gunung tertinggi di Pulau Jawa adalah Gunung?", jawaban: "semeru" },
  { soal: "Bahasa pemrograman yang berjalan langsung di browser web adalah?", jawaban: "javascript" },
  { soal: "Berapa jumlah provinsi di Pulau Jawa saat ini?", jawaban: "6" },
  { soal: "Hewan tercepat di darat adalah?", jawaban: "cheetah" },
  { soal: "Siapa pencipta bot BIMTOL? (tulis username tanpa @)", jawaban: "bimarchp" }
];

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

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

async function sendTyping(chatId) {
  await fetch(`${TELEGRAM_URL}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      action: "typing"
    })
  });
}

async function sendDice(chatId, emoji) {
  const res = await fetch(`${TELEGRAM_URL}/sendDice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      emoji: emoji
    })
  });
  return await res.json();
}

async function panggilModelGemini(modelName, promptText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }]
    })
  });
  return await res.json();
}

// Fungsi memanggil otak AI Gemini dengan model cadangan & pelaporan error jelas
async function tanyaAI(pertanyaan, namaUser) {
  if (!GEMINI_API_KEY) {
    return "⚠️ API Key AI belum dipasang di pengaturan Vercel (GEMINI_API_KEY).";
  }

  const instruksiSistem =
    `Kamu adalah BIMTOL, asisten AI pintar di Telegram yang diciptakan oleh @bimarchp. ` +
    `Jawab pertanyaan dari ${namaUser} dengan bahasa Indonesia yang ramah, jelas, dan ringkas. ` +
    `Jangan gunakan format Markdown seperti tanda bintang ganda (**), cukup gunakan teks biasa yang rapi.`;

  const promptLengkap = `${instruksiSistem}\n\nPertanyaan pengguna: ${pertanyaan}`;

  // Coba model utama (gemini-2.5-flash), jika gagal coba cadangan (gemini-2.0-flash)
  let json = await panggilModelGemini("gemini-2.5-flash", promptLengkap);
  if (!json?.candidates?.[0]?.content?.parts?.[0]?.text) {
    json = await panggilModelGemini("gemini-2.0-flash", promptLengkap);
  }

  const jawaban = json?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!jawaban) {
    const detailError = json?.error?.message || "Respons kosong dari server AI.";
    return `⚠️ <b>AI Gagal Merespons:</b>\n<code>${escapeHTML(detailError)}</code>`;
  }

  const teksAman = escapeHTML(jawaban);
  return teksAman.length > 4000 ? teksAman.slice(0, 4000) + "..." : teksAman;
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
      const lowerText = text.toLowerCase();
      const firstName = data.message.from.first_name || "Kak";

      // 1. Command /start
      if (lowerText === "/start" || lowerText === "/start@chrisbim_bot") {
        const pesanSambutan =
          `Halo, ${firstName}!. Selamat datang di bot @chrisbim_bot\n\n` +
          `Perkenalkan nama saya BIMTOL, saya merupakan ciptaan @bimarchp\n\n` +
          `Bot ini akan digunakan untuk membantu dan melayani kamu setiap hari!\n\n` +
          `Pilih menu dibawah ini untuk memerintahkan BIMTOL!\n` +
          `• /start - Memulai bot\n` +
          `• /info - Informasi bot\n` +
          `• /tanya [pertanyaan] - Tanya apa saja ke AI BIMTOL\n` +
          `• /game - Daftar game (Adu Dadu & Kuis)`;

        await sendMessage(chatId, pesanSambutan);
      } 
      // 2. Command /info
      else if (lowerText === "/info" || lowerText === "/info@chrisbim_bot") {
        const pesanInfo =
          `Halo, ${firstName}!, ini adalah informasi seputar saya\n` +
          `Nama : BIMTOL\n` +
          `Versi : v1.10 Beta\n` +
          `Rilis : 11 November 2026\n` +
          `Diperbarui : 12 November 2026\n` +
          `Bahasa : Indonesia`;

        await sendMessage(chatId, pesanInfo);
      } 
      // 3. Command AI /tanya <pertanyaan>
      else if (lowerText.startsWith("/tanya")) {
        const pertanyaan = text.replace(/^\/tanya(@chrisbim_bot)?/i, "").trim();

        if (!pertanyaan) {
          await sendMessage(
            chatId,
            `Cara menggunakan fitur AI:\nKetik <code>/tanya</code> diikuti pertanyaan kamu.\n\nContoh:\n<code>/tanya jelaskan cara kerja mesin 4 tak</code>`
          );
        } else {
          await sendTyping(chatId);
          const jawabanAI = await tanyaAI(pertanyaan, firstName);
          await sendMessage(chatId, jawabanAI);
        }
      }
      // 4. Panggilan kata "Bimtol"
      else if (lowerText === "bimtol") {
        const pesanBimtol =
          `Halo, ${firstName}! Bimtol masih disini!\n` +
          `klik tombol Menu untuk memerintahkan saya!`;

        await sendMessage(chatId, pesanBimtol);
      }
      // 5. Menu Daftar Game (/game)
      else if (lowerText === "/game" || lowerText === "/game@chrisbim_bot") {
        const menuGame =
          `🎮 <b>MINI GAME BIMTOL</b>\n\n` +
          `Pilih game yang ingin kamu mainkan:\n` +
          `• /dadu - Adu gede angka lempar dadu lawan BIMTOL 🎲\n` +
          `• /kuis - Kuis pengetahuan & tebak-tebakan 🧠`;

        await sendMessage(chatId, menuGame);
      }
      // 6. Game Adu Gede Dadu (/dadu)
      else if (lowerText === "/dadu" || lowerText === "/dadu@chrisbim_bot") {
        await sendMessage(chatId, `🎲 <b>ADU GEDE DADU!</b>\nDadu pertama milik <b>${firstName}</b>, dadu kedua milik <b>BIMTOL</b>...`);

        const [daduUserRes, daduBotRes] = await Promise.all([
          sendDice(chatId, "🎲"),
          sendDice(chatId, "🎲")
        ]);

        const skorUser = daduUserRes?.result?.dice?.value;
        const skorBot = daduBotRes?.result?.dice?.value;

        if (skorUser && skorBot) {
          await new Promise((r) => setTimeout(r, 3200));

          let hasil = "";
          if (skorUser > skorBot) {
            hasil = `🎉 <b>${firstName.toUpperCase()} MENANG!</b> Angkamu lebih besar!`;
          } else if (skorUser < skorBot) {
            hasil = `😎 <b>BIMTOL MENANG!</b> Coba lempar lagi lewat /dadu!`;
          } else {
            hasil = `🤝 <b>SERI!</b> Angka dadu kita kembar!`;
          }

          await sendMessage(
            chatId,
            `📊 <b>Hasil Lempar Dadu:</b>\n` +
            `• ${firstName}: <b>${skorUser}</b>\n` +
            `• BIMTOL: <b>${skorBot}</b>\n\n` +
            `${hasil}`
          );
        }
      }
      // 7. Game Kuis - Minta Soal (/kuis)
      else if (lowerText === "/kuis" || lowerText === "/kuis@chrisbim_bot") {
        const indexAcak = Math.floor(Math.random() * BANK_KUIS.length);
        const nomorSoal = indexAcak + 1;
        const itemKuis = BANK_KUIS[indexAcak];

        const pesanSoal =
          `🧠 <b>KUIS BIMTOL (Soal #${nomorSoal})</b>\n\n` +
          `Pertanyaan:\n<i>"${itemKuis.soal}"</i>\n\n` +
          `Cara menjawab:\nKetik <code>/jawab ${nomorSoal} jawaban_kamu</code>`;

        await sendMessage(chatId, pesanSoal);
      }
      // 8. Game Kuis - Cek Jawaban (/jawab <nomor> <jawaban>)
      else if (lowerText.startsWith("/jawab")) {
        const isi = lowerText.replace("/jawab@chrisbim_bot", "").replace("/jawab", "").trim();
        const bagian = isi.split(/\s+/);
        const nomorSoal = parseInt(bagian[0], 10);
        const jawabanUser = bagian.slice(1).join(" ").trim();

        if (isNaN(nomorSoal) || nomorSoal < 1 || nomorSoal > BANK_KUIS.length || !jawabanUser) {
          await sendMessage(
            chatId,
            `Format jawaban salah!\nKetik /kuis untuk mendapatkan soal, lalu jawab dengan format:\n<code>/jawab [nomor_soal] [jawaban]</code>`
          );
        } else {
          const kuisTarget = BANK_KUIS[nomorSoal - 1];
          if (jawabanUser === kuisTarget.jawaban.toLowerCase()) {
            await sendMessage(
              chatId,
              `✅ <b>BENAR!</b> Mantap ${firstName}, jawabannya memang <b>${kuisTarget.jawaban.toUpperCase()}</b>!\n\nKetik /kuis untuk soal berikutnya.`
            );
          } else {
            await sendMessage(
              chatId,
              `❌ <b>KURANG TEPAT!</b> Jawaban <i>"${jawabanUser}"</i> masih salah.\n\nCoba jawab lagi dengan <code>/jawab ${nomorSoal} ...</code> atau ketik /kuis untuk ganti soal.`
            );
          }
        }
      }
      // Balasan default
      else {
        await sendMessage(
          chatId,
          "Perintah tidak dikenali. Ketik /tanya [pertanyaan] untuk bertanya ke AI, /game untuk bermain, atau /info untuk info bot."
        );
      }
    }
  } catch (err) {
    console.error(err);
  }

  return res.status(200).json({ ok: true });
}
