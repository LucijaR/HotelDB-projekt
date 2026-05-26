require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());
const PORT = 5000;

// PostgreSQL konekcija
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: process.env.DB_PASSWORD,
    port: 5432,
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('Greška pri spajanju na PostgreSQL bazu:', err.stack);
    }
    console.log('Uspješno spojeni na PostgreSQL bazu!');
    release();
});

// MongoDB konekcija
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Uspješno spojeni na MongoDB bazu!'))
    .catch(err => console.error('Greška pri spajanju na MongoDB bazu:', err));

// Ruta za rezervacije (switching)
app.get('/api/rezervacije', async (req, res) => {
  try {
    if (process.env.DB_TYPE === 'postgres') {
      const queryText = `
        SELECT
          r.id_rezervacije AS id,
          CONCAT(g.ime, ' ', g.prezime) AS guest_name,
          vs.naziv AS room_type,
          r.check_in,
          r.check_out,
          r.status
        FROM Rezervacije r
        JOIN Gosti g ON r.id_gosta = g.id_gosta
        JOIN Sobe s ON r.id_sobe = s.id_sobe
        JOIN VrstaSobe vs ON s.vrsta_sobe_id = vs.vrsta_sobe_id
        ORDER BY r.check_in DESC;
      `;
      const { rows } = await pool.query(queryText);
      res.json(rows);

    } else if (process.env.DB_TYPE === 'mongo') {
      const Rezervacija = require('./models/Rezervacija');

      const rezervacije = await Rezervacija.aggregate([
        {
          $lookup: {
            from: 'Gosti',
            localField: 'id_gosta',
            foreignField: '_id',
            as: 'gost'
          }
        },
        { $unwind: { path: '$gost', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'Sobe',
            localField: 'id_sobe',
            foreignField: '_id',
            as: 'soba'
          }
        },
        { $unwind: { path: '$soba', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'VrstaSobe',
            localField: 'soba.vrsta_sobe_id',
            foreignField: '_id',
            as: 'vrstaSobe'
          }
        },
        { $unwind: { path: '$vrstaSobe', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            id: { $toString: '$_id' },
            guest_name: {
              $concat: [
                { $ifNull: ['$gost.ime', 'Nepoznat'] },
                ' ',
                { $ifNull: ['$gost.prezime', ''] }
              ]
            },
            room_type: { $ifNull: ['$vrstaSobe.naziv', 'Standard'] },
            check_in: 1,
            check_out: 1,
            status: 1,
          }
        }
      ]);

      res.json(rezervacije);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Greška na serveru kod dohvaćanja rezervacija');
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    let stats;

    if (process.env.DB_TYPE === 'postgres') {
      const totalResult = await pool.query('SELECT COUNT(*) FROM Rezervacije');
      const confirmedResult = await pool.query("SELECT COUNT(*) FROM Rezervacije WHERE status = 'confirmed'");
      const pendingResult = await pool.query("SELECT COUNT(*) FROM Rezervacije WHERE status = 'pending'");
      const roomsResult = await pool.query('SELECT COUNT(*) FROM Sobe WHERE dostupna = true');

      stats = {
        totalBookings: parseInt(totalResult.rows[0].count),
        confirmed: parseInt(confirmedResult.rows[0].count),
        pending: parseInt(pendingResult.rows[0].count),
        availableRooms: parseInt(roomsResult.rows[0].count),
      };

    } else if (process.env.DB_TYPE === 'mongo') {
      const Rezervacija = require('./models/Rezervacija');
      const Soba = require('./models/Soba');

      stats = {
        totalBookings: await Rezervacija.countDocuments(),
        confirmed: await Rezervacija.countDocuments({ status: 'Potvrđena' }),
        pending: await Rezervacija.countDocuments({ status: 'Na čekanju' }),
        availableRooms: await Soba.countDocuments({ status: 'Slobodna' }),
      };
    }

    res.json(stats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Greška kod dohvaćanja statistika');
  }
});

app.get('/api/test-postgres', (req, res) => {
    res.json({ poruka: "Pozdrav! Server radi i spreman je za PostgreSQL CRUD!" });
});

app.listen(PORT, () => {
    console.log(`Backend server je upaljen na http://localhost:${PORT}`);
});