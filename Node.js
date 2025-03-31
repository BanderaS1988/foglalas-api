
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const app = express();
const port = 3000;

// MongoDB beállítások
mongoose.connect('mongodb://localhost:27017/bookingApp', { useNewUrlParser: true, useUnifiedTopology: true });
const bookingSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    month: String,
    day: String,
    timeSlot: String,
    massageType: String,
    duration: String
});
const Booking = mongoose.model('Booking', bookingSchema);

// Middleware a JSON feldolgozásához
app.use(express.json());

// API végpont foglalás küldésére
app.post('/booking', (req, res) => {
    const { name, email, phone, month, day, timeSlot, massageType, duration } = req.body;

    // Mentés az adatbázisba
    const newBooking = new Booking({ name, email, phone, month, day, timeSlot, massageType, duration });
    newBooking.save()
        .then(() => {
            // Email küldése az adminnak
            sendEmail(name, email, phone, month, day, timeSlot, massageType, duration);
            res.status(200).send('Foglalás sikeresen elküldve!');
        })
        .catch(err => {
            res.status(500).send('Hiba történt a foglalás mentése során.');
        });
});

// Email küldése az adminnak
function sendEmail(name, email, phone, month, day, timeSlot, massageType, duration) {
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
               Időtartam: ${duration}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email elküldve: ' + info.response);
        }
    });
}

// Indítás
app.listen(port, () => {
    console.log(`API fut a ${port}-es porton`);
});
