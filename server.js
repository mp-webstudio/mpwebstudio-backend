const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "200kb" }));

const allowedOrigins = [
  "https://mpwebstudio.rs",
  "https://www.mpwebstudio.rs",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Postman nema origin
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS blocked for origin: " + origin));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.get("/", (req, res) => {
  res.json({ ok: true, message: "MP Web Studio API radi ✅" });
});

app.post("/api/contact", (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim();
  const message = String(req.body?.message || "").trim();
  const phone = String(req.body?.phone || "").trim();
  const sourcePage = String(req.body?.sourcePage || "").trim();

  if (!name || name.length < 2) {
    return res.status(400).json({ success: false, message: "Unesite ime (min 2 slova)." });
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return res.status(400).json({ success: false, message: "Unesite ispravan email." });
  }

  if (!message || message.length < 10) {
    return res.status(400).json({ success: false, message: "Poruka mora imati bar 10 karaktera." });
  }

  console.log("📩 Novi upit:", {
    name,
    email,
    phone: phone || null,
    message,
    sourcePage: sourcePage || null,
    createdAt: new Date().toISOString(),
  });

  return res.status(201).json({
    success: true,
    message: "Hvala! Upit je primljen. Javićemo vam se uskoro.",
  });
});

app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({ success: false, message: "Greška na serveru. Pokušajte ponovo." });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server radi na http://localhost:${PORT}`);
});