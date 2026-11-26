export const config = {
  api: {
    bodyParser: false, // Penting agar upload Foto & Video (FormData) tidak rusak
  },
};

export default async function handler(req, res) {
  // Atur izin CORS agar bisa diakses dari GitHub Pages Anda
  res.setHeader("Access-Control-Allow-Origin", "https://bimtolproject.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, description: "Method Not Allowed" });
  }

  const endpoint = req.query.endpoint;
  if (!["sendMessage", "sendPhoto", "sendVideo"].includes(endpoint)) {
    return res.status(403).json({ ok: false, description: "Endpoint tidak diizinkan" });
  }

  try {
    // Baca raw body dari request (baik JSON maupun FormData foto/video)
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks);

    const tgRes = await fetch(
      `https://api.telegram.org/bot${process.env.TG_TOKEN}/${endpoint}`,
      {
        method: "POST",
        headers: {
          "Content-Type": req.headers["content-type"] || "application/json",
        },
        body: rawBody,
      }
    );

    const data = await tgRes.json();
    return res.status(tgRes.status).json(data);
  } catch (err) {
    return res.status(500).json({ ok: false, description: err.message });
  }
}
