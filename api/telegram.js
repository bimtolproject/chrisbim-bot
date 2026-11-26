module.exports = async function handler(req, res) {
  const allowedOrigins = [
    "https://bimtolproject.github.io",
    "https://bimtolproject.my.id"
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
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

  const token = (process.env.TG_TOKEN || process.env.TELEGRAM_TOKEN || "").trim();
  if (!token) {
    return res.status(500).json({ ok: false, description: "Token bot belum terbaca di Vercel" });
  }

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks);

    const tgRes = await fetch(
      `https://api.telegram.org/bot${token}/${endpoint}`,
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
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
