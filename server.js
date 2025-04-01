const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());  // Make sure bodyParser is enabled for JSON

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

// POST /booking - Új foglalás hozzáadása
app.post('/booking', (req, res) => {
    try {
        // Log the request body to check what we are receiving
        console.log("Foglalás adatai: ", req.body);

        // Ellenőrzés: Ha nincs name, email vagy bármely más fontos mező, akkor válasz
        const { name, email, phone, month, day, timeSlot, massageType, duration, comment } = req.body;

        if (!name || !email || !phone || !month || !day || !timeSlot || !massageType || !duration) {
            return res.status(400).json({ error: "Minden mező kötelező." });
        }

        // Adatbázisba mentés
        const stmt = db.prepare("INSERT INTO bookings (name, email, phone, month, day, timeSlot, massageType, duration, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        stmt.run(name, email, phone, month, day, timeSlot, massageType, duration, comment, function (err) {
            if (err) {
                console.log("Hiba a mentés során: ", err);
                return res.status(500).json({ error: err.message });
            }

            console.log("Foglalás sikeresen mentve!");  // Ha minden oké
            sendEmailToAdmin(name, email, phone, month, day, timeSlot, massageType, duration, comment);
            sendEmailToUser(name, email, phone, month, day, timeSlot, massageType, duration, comment);
            res.status(201).json({ id: this.lastID });
        });
    } catch (error) {
        console.error("Hiba a foglalás során:", error);
        res.status(500).json({ error: "Hiba történt a foglalás mentése során." });
    }
});

// Email küldés az adminnak
function sendEmailToAdmin(name, email, phone, month, day, timeSlot, massageType, duration, comment) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'your-email@gmail.com',
            pass: 'your-email-password'
        }
    });

    const mailOptions = {
        from: 'your-email@gmail.com',
        to: 'admin-email@example.com',
        subject: 'Új masszázs foglalás',
        text: `Új foglalás érkezett:
               Név: ${name}
               Email: ${email}
               Telefonszám: ${phone}
               Dátum: ${month} ${day}
               Időablak: ${timeSlot}
               Masszázs Típus: ${massageType}
               Időtartam: ${duration}
               Megjegyzés: ${comment || "Nincs megjegyzés."}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("Hiba az email küldés során: ", error);
        } else {
            console.log('Email elküldve: ' + info.response);
        }
    });
}

// Email küldés a felhasználónak
function sendEmailToUser(name, email, phone, month, day, timeSlot, massageType, duration, comment) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'your-email@gmail.com',
            pass: 'your-email-password'
        }
    });

    const mailOptions = {
        from: 'your-email@gmail.com',
        to: email,
        subject: 'Foglalás visszaigazolás',
        text: `Kedves ${name}!

               Köszönjük a foglalását! Az alábbi részletekben található:
               Dátum: ${month} ${day}
               Időablak: ${timeSlot}
               Masszázs Típus: ${massageType}
               Időtartam: ${duration}
               Megjegyzés: ${comment || "Nincs megjegyzés."}
               
               Várjuk szeretettel!`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("Hiba az email küldés során: ", error);
        } else {
            console.log('Visszaigazoló email elküldve: ' + info.response);
        }
    });
}

// Indítás
app.listen(port, () => {
    console.log(`API fut a ${port}-es porton`);
});
