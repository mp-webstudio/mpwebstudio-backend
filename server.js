const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
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

// ---------- Helpers ----------
function getMailer() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "false") === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP env vars missing (SMTP_HOST/SMTP_USER/SMTP_PASS).");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
// ---------- /Helpers ----------

app.get("/", (req, res) => {
  res.json({ ok: true, message: "MP Web Studio API radi ✅" });
});

app.post("/api/contact", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim();
  const message = String(req.body?.message || "").trim();
  const phone = String(req.body?.phone || "").trim();
  const sourcePage = String(req.body?.sourcePage || "").trim();

  // Validacija
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

  const payload = {
    name,
    email,
    phone: phone || null,
    message,
    sourcePage: sourcePage || null,
    createdAt: new Date().toISOString(),
  };

  console.log("📩 Novi upit:", payload);

  // Slanje email-a
  try {
    const transporter = getMailer();

    const toAddress = process.env.MAIL_TO || process.env.SMTP_USER;
    const fromAddress = process.env.MAIL_FROM || process.env.SMTP_USER;

    const subject = `MP Web Studio — Novi upit (${name})`;

    const text =
      `Novi upit sa sajta MP Web Studio\n\n` +
      `Ime: ${name}\n` +
      `Email: ${email}\n` +
      `Telefon: ${phone || "-"}\n` +
      `Stranica: ${sourcePage || "-"}\n` +
      `Vreme: ${payload.createdAt}\n\n` +
      `Poruka:\n${message}\n`;

    const html =
      `<h2>Novi upit sa sajta MP Web Studio</h2>` +
      `<ul>` +
      `<li><b>Ime:</b> ${escapeHtml(name)}</li>` +
      `<li><b>Email:</b> ${escapeHtml(email)}</li>` +
      `<li><b>Telefon:</b> ${escapeHtml(phone || "-")}</li>` +
      `<li><b>Stranica:</b> ${escapeHtml(sourcePage || "-")}</li>` +
      `<li><b>Vreme:</b> ${escapeHtml(payload.createdAt)}</li>` +
      `</ul>` +
      `<h3>Poruka</h3>` +
      `<p>${escapeHtml(message).replaceAll("\n", "<br>")}</p>`;

    await transporter.sendMail({
      from: fromAddress,
      to: toAddress,
      replyTo: email, // da možeš "Reply" direktno korisniku
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error("❌ Email send failed:", err.message);
    return res.status(500).json({
      success: false,
      message:
        "Upit je primljen, ali email notifikacija nije poslata. Pokušajte ponovo ili pišite na info@mpwebstudio.rs.",
    });
  }

  return res.status(201).json({
    success: true,
    message: "Hvala! Upit je primljen. Javićemo vam se uskoro.",
  });
});

// Global error handler (npr. CORS)
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({ success: false, message: "Greška na serveru. Pokušajte ponovo." });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server radi na http://localhost:${PORT}`);
});