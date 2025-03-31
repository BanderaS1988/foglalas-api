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
    massageType TEXT NOT NULL,
    datetime TEXT NOT NULL,
    user TEXT NOT NULL
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
    const { name, email, phone, month, day, timeSlot, massageType, duration } = req.body;

    const newBooking = new Booking({ name, email, phone, month, day, timeSlot, massageType, duration });
    newBooking.save()
        .then(() => {
            // Ha a foglalás sikeresen mentve, küldj emailt
            sendEmail(name, email, phone, month, day, timeSlot, massageType, duration);
            res.status(200).send('Foglalás sikeresen elküldve!');
        })
        .catch(err => {
            console.error("❌ Hiba a foglalás mentésekor:", err); // Hiba logolása
            res.status(500).send('Hiba történt a foglalás mentése során.');
        });
});


    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'bazsolotifuti@gmail.com',  // Az admin email címe
      subject: 'Új masszázs foglalás érkezett!',
      text: `
Új foglalás érkezett az appon keresztül:

Név: ${user}
Masszázs típus: ${massageType}
Dátum & Időpont: ${datetime}
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("❌ Email küldési hiba:", error);
      } else {
        console.log("📧 Email elküldve:", info.response);
      }
    });

    // Foglalás sikeres mentése után küldjük a választ
    res.status(201).json({ id: this.lastID });
  });
});

// Start server
app.listen(port, () => {
  console.log(`✅ Foglalás API fut: http://localhost:${port}`);
});
