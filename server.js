const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// SQLite adatbázis inicializálás
const db = new sqlite3.Database("bookings.db");
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    month TEXT NOT NULL,
    day TEXT NOT NULL,
    timeSlot TEXT NOT NULL,
    massageType TEXT NOT NULL,
    duration TEXT NOT NULL,
    comment TEXT
  )`);
});

// GET /booking - Foglalások lekérdezése
app.get("/booking", (req, res) => {
  db.all("SELECT * FROM bookings ORDER BY datetime ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST /booking - Új foglalás hozzáadása
app.post("/booking", (req, res) => {
  const { name, email, phone, month, day, timeSlot, massageType, duration, comment } = req.body;

  // Ellenőrizzük, hogy minden szükséges adat megvan
  if (!name || !email || !phone || !month || !day || !timeSlot || !massageType || !duration) {
    return res.status(400).json({ error: "Minden mező kitöltése kötelező!" });
  }

  // Foglalás adatbázisba mentése
  const stmt = db.prepare(
    "INSERT INTO bookings (name, email, phone, month, day, timeSlot, massageType, duration, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  stmt.run(name, email, phone, month, day, timeSlot, massageType, duration, comment, function (err) {
    if (err) {
      console.error("❌ Hiba a foglalás mentésekor:", err);
      return res.status(500).json({ error: err.message });
    }

    // Küldj emailt az adminnak és a felhasználónak
    sendEmail(name, email, phone, month, day, timeSlot, massageType, duration, comment);

    // Válasz küldése, hogy a foglalás sikeresen rögzítve lett
    res.status(201).json({ id: this.lastID, message: "Foglalás sikeresen elküldve!" });
  });
});

// Email küldés (admin és felhasználó részére)
function sendEmail(name, email, phone, month, day, timeSlot, massageType, duration, comment) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,  // A Gmail email címed
      pass: process.env.EMAIL_PASS   // Gmail app jelszó
    }
  });

  // Admin email értesítés
  const mailOptionsAdmin = {
    from: process.env.EMAIL_USER,
    to: 'bazsolotifuti@gmail.com',  // Az admin email címe
    subject: 'Új masszázs foglalás',
    text: `
Új foglalás érkezett az appon keresztül:

Név: ${name}
Email: ${email}
Telefonszám: ${phone}
Dátum: ${month} ${day}
Időablak: ${timeSlot}
Masszázs Típus: ${massageType}
Időtartam: ${duration}
Megjegyzés: ${comment}
    `
  };

  transporter.sendMail(mailOptionsAdmin, (error, info) => {
    if (error) {
      console.error("❌ Email küldési hiba:", error);
    } else {
      console.log("📧 Admin email elküldve:", info.response);
    }
  });

  // Felhasználói email értesítés
  const mailOptionsUser = {
    from: process.env.EMAIL_USER,
    to: email,  // Felhasználó email címe
    subject: 'Masszázs időpontfoglalás visszaigazolás',
    text: `
Kedves ${name}!

A foglalásod sikeresen rögzítésre került:
- Masszázs típus: ${massageType}
- Időpont: ${month} ${day}, ${timeSlot}

Ha bármi kérdésed van, keresd bátran ügyfélszolgálatunkat!
    `
  };

  transporter.sendMail(mailOptionsUser, (error, info) => {
    if (error) {
      console.error("❌ Hiba a felhasználói email küldésekor:", error);
    } else {
      console.log("📧 Felhasználói email elküldve:", info.response);
    }
  });
}

// Szerver indítása
app.listen(port, () => {
  console.log(`✅ Foglalás API fut: http://localhost:${port}`);
});
