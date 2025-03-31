// server.js
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");

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

// GET /booking
app.get("/booking", (req, res) => {
  db.all("SELECT * FROM bookings ORDER BY datetime ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST /booking
app.post("/booking", (req, res) => {
  const { massageType, datetime, user } = req.body;

  if (!massageType || !datetime || !user)
    return res.status(400).json({ error: "Minden mező kötelező." });

  const stmt = db.prepare(
    "INSERT INTO bookings (massageType, datetime, user) VALUES (?, ?, ?)"
  );
  stmt.run(massageType, datetime, user, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

// Egyszerű admin felület, amely listázza a foglalásokat HTML-ben
app.get("/admin", (req, res) => {
  db.all("SELECT * FROM bookings ORDER BY datetime ASC", [], (err, rows) => {
    if (err) return res.status(500).send("Adatbázis hiba!");

    let html = `
      <html>
      <head>
        <title>Foglalások Admin</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h2>📅 Foglalások listája</h2>
        <table>
          <tr>
            <th>ID</th>
            <th>Masszázs típus</th>
            <th>Dátum & Időpont</th>
            <th>Felhasználó</th>
          </tr>`;

    rows.forEach(row => {
      html += `
          <tr>
            <td>${row.id}</td>
            <td>${row.massageType}</td>
            <td>${row.datetime}</td>
            <td>${row.user}</td>
          </tr>`;
    });

    html += `
        </table>
      </body>
      </html>`;

    res.send(html);
  });
});


// Start server
app.listen(port, () => {
  console.log(`✅ Foglalás API fut: http://localhost:${port}`);
});
