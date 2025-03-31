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

// SQLite init
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
    comment TEXT,
    datetime TEXT NOT NULL  
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
app.post('/booking', (req, res) => {
    try {
        const { name, email, phone, month, day, timeSlot, massageType, duration, comment } = req.body;

        if (!name || !email || !phone || !month || !day || !timeSlot || !massageType || !duration) {
            return res.status(400).json({ error: "Minden mező kötelező." });
        }

        // Mentés az adatbázisba
        const stmt = db.prepare("INSERT INTO bookings (name, email, phone, month, day, timeSlot, massageType, duration, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        stmt.run(name, email, phone, month, day, timeSlot, massageType, duration, comment, function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // Admin email küldése
            sendEmailToAdmin(name, email, phone, month, day, timeSlot, massageType, duration, comment);
            
            // Felhasználói email küldése
            sendEmailToUser(name, email, phone, month, day, timeSlot, massageType, duration, comment);

            res.status(201).json({ id: this.lastID });
        });
    } catch (error) {
        console.error("Hiba a foglalás során:", error);
        res.status(500).json({ error: "Hiba történt a foglalás mentése során." });
    }
});

// Admin email küldés
function sendEmailToAdmin(name, email, phone, month, day, timeSlot, massageType, duration, comment) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptionsAdmin = {
        from: process.env.EMAIL_USER,
        to: 'bazsolotifuti@gmail.com', // Admin email címe
        subject: 'Új masszázs foglalás',
        text: `
Új foglalás érkezett:

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
            console.error("❌ Hiba az admin email küldésénél:", error);
        } else {
            console.log("📧 Admin email elküldve:", info.response);
        }
    });
}

// Felhasználói email küldése
function sendEmailToUser(name, email, phone, month, day, timeSlot, massageType, duration, comment) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptionsUser = {
        from: process.env.EMAIL_USER,
        to: email, // Felhasználói email
        subject: 'Masszázs időpontfoglalás visszaigazolás',
        text: `
Kedves ${name},

A foglalásod sikeresen rögzítésre került:
- Masszázs típusa: ${massageType}
- Időpont: ${month} ${day}, ${timeSlot}
- Időtartam: ${duration}
- Megjegyzés: ${comment}

Kérjük, ne habozz keresni, ha bármi kérdésed lenne!
        `
    };

    transporter.sendMail(mailOptionsUser, (error, info) => {
        if (error) {
            console.error("❌ Hiba a felhasználói email küldésénél:", error);
        } else {
            console.log("📧 Felhasználói email elküldve:", info.response);
        }
    });
}

// Start server
app.listen(port, () => {
    console.log(`✅ Foglalás API fut: http://localhost:${port}`);
});
