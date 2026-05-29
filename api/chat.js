const https = require("https");

module.exports = async (req, res) => {
  // Hanya terima POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Ambil API key dari environment variable Vercel (AMAN, tidak terekspos ke publik)
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) {
    return res.status(500).json({ error: "API key belum dikonfigurasi di server." });
  }

  const { messages, userName } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Format request tidak valid." });
  }

  const body = JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: `Kamu adalah Papi AI, asisten kecerdasan buatan yang cerdas, ramah, dan sangat membantu. ${userName ? `Nama pengguna yang sedang chat dengan kamu adalah ${userName}.` : ""} Jawab dalam Bahasa Indonesia yang natural dan hangat. Gunakan **bold** untuk penekanan penting. Berikan jawaban yang informatif, jelas, dan mudah dipahami.`,
    messages,
  });

  const options = {
    hostname: "api.anthropic.com",
    path: "/v1/messages",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Length": Buffer.byteLength(body),
    },
  };

  return new Promise((resolve) => {
    const apiReq = https.request(options, (apiRes) => {
      let data = "";
      apiRes.on("data", (chunk) => (data += chunk));
      apiRes.on("end", () => {
        try {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.status(apiRes.statusCode).json(JSON.parse(data));
        } catch (e) {
          res.status(500).json({ error: "Gagal memproses respons API." });
        }
        resolve();
      });
    });
    apiReq.on("error", (e) => {
      res.status(500).json({ error: "Koneksi ke API gagal: " + e.message });
      resolve();
    });
    apiReq.write(body);
    apiReq.end();
  });
};
