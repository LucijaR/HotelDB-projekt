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
// mongoose.connect(process.env.MONGODB_URI)
//     .then(() => console.log('Uspješno spojeni na MongoDB bazu!'))
//     .catch(err => console.error('Greška pri spajanju na MongoDB bazu:', err));

// ==================== REZERVACIJE ====================

app.get('/api/rezervacije', async (req, res) => {
  try {
    if (process.env.DB_TYPE === 'postgres') {
      const { rows } = await pool.query(`
        SELECT
          r.id_rezervacije AS id,
          CONCAT(g.ime, ' ', g.prezime) AS guest_name,
          vs.naziv AS room_type,
          r.check_in,
          r.check_out,
          r.status
        FROM "Rezervacije" r
        JOIN "Gosti" g ON r.id_gosta = g.id_gosta
        JOIN "Sobe" s ON r.id_sobe = s.id_sobe
        JOIN "VrstaSobe" vs ON s.vrsta_sobe_id = vs.vrsta_sobe_id
        ORDER BY r.check_in DESC
      `);
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

app.post('/api/rezervacije', async (req, res) => {
  try {
    if (process.env.DB_TYPE === 'postgres') {
      const { id_gosta, id_sobe, id_placanja, check_in, check_out, ukupna_cijena, status } = req.body;
      const { rows } = await pool.query(`
        INSERT INTO "Rezervacije" (id_gosta, id_sobe, id_placanja, check_in, check_out, ukupna_cijena, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [id_gosta, id_sobe, id_placanja, check_in, check_out, ukupna_cijena, status]);
      res.status(201).json(rows[0]);

    } else if (process.env.DB_TYPE === 'mongo') {
      const Rezervacija = require('./models/Rezervacija');
      const nova = new Rezervacija(req.body);
      await nova.save();
      res.status(201).json(nova);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Greška kod kreiranja rezervacije');
  }
});

app.put('/api/rezervacije/:id', async (req, res) => {
  try {
    if (process.env.DB_TYPE === 'postgres') {
      const { id } = req.params;
      const { id_gosta, id_sobe, id_placanja, check_in, check_out, ukupna_cijena, status } = req.body;
      const { rows } = await pool.query(`
        UPDATE "Rezervacije"
        SET id_gosta=$1, id_sobe=$2, id_placanja=$3, check_in=$4, check_out=$5, ukupna_cijena=$6, status=$7
        WHERE id_rezervacije=$8
        RETURNING *
      `, [id_gosta, id_sobe, id_placanja, check_in, check_out, ukupna_cijena, status, id]);
      res.json(rows[0]);

    } else if (process.env.DB_TYPE === 'mongo') {
      const Rezervacija = require('./models/Rezervacija');
      const updated = await Rezervacija.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(updated);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Greška kod ažuriranja rezervacije');
  }
});

app.delete('/api/rezervacije/:id', async (req, res) => {
  try {
    if (process.env.DB_TYPE === 'postgres') {
      await pool.query(`DELETE FROM "Rezervacije" WHERE id_rezervacije=$1`, [req.params.id]);
      res.json({ poruka: 'Rezervacija obrisana' });

    } else if (process.env.DB_TYPE === 'mongo') {
      const Rezervacija = require('./models/Rezervacija');
      await Rezervacija.findByIdAndDelete(req.params.id);
      res.json({ poruka: 'Rezervacija obrisana' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Greška kod brisanja rezervacije');
  }
});

// ==================== STATISTIKE ====================

app.get('/api/stats', async (req, res) => {
  try {
    let stats;

    if (process.env.DB_TYPE === 'postgres') {
      const total    = await pool.query('SELECT COUNT(*) FROM "Rezervacije"');
      const confirmed = await pool.query(`SELECT COUNT(*) FROM "Rezervacije" WHERE status = 'Potvrđena'`);
      const pending   = await pool.query(`SELECT COUNT(*) FROM "Rezervacije" WHERE status = 'Na čekanju'`);
      const available = await pool.query(`SELECT COUNT(*) FROM "Sobe" WHERE status = 'Slobodna'`);

      stats = {
        totalBookings: parseInt(total.rows[0].count),
        confirmed: parseInt(confirmed.rows[0].count),
        pending: parseInt(pending.rows[0].count),
        availableRooms: parseInt(available.rows[0].count),
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

// ==================== GOSTI ====================

app.get('/api/gosti', async (req, res) => {
  try {
    if (process.env.DB_TYPE === 'postgres') {
      const { rows } = await pool.query(`
        SELECT
          g.id_gosta,
          g.ime,
          g.prezime,
          g.email,
          m.grad,
          m.drzava
        FROM "Gosti" g
        LEFT JOIN "MjestaStanovanja" m ON g.id_mjesta = m.id_mjesta
        ORDER BY g.prezime ASC
      `);
      res.json(rows);

    } else if (process.env.DB_TYPE === 'mongo') {
      const Gost = require('./models/Gost');
      const gosti = await Gost.find();
      res.json(gosti);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Greška kod dohvaćanja gostiju');
  }
});

// ==================== SOBE ====================

app.get('/api/sobe', async (req, res) => {
  try {
    if (process.env.DB_TYPE === 'postgres') {
      const { rows } = await pool.query(`
        SELECT
          s.id_sobe,
          s.broj_sobe,
          s.status,
          vs.naziv AS vrsta,
          vs.cijena,
          vs.kapacitet
        FROM "Sobe" s
        JOIN "VrstaSobe" vs ON s.vrsta_sobe_id = vs.vrsta_sobe_id
        ORDER BY s.broj_sobe ASC
      `);
      res.json(rows);

    } else if (process.env.DB_TYPE === 'mongo') {
      const Soba = require('./models/Soba');
      const sobe = await Soba.find();
      res.json(sobe);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Greška kod dohvaćanja soba');
  }
});

// ==================== WELLNESS ====================

app.get('/api/wellness', async (req, res) => {
  try {
    if (process.env.DB_TYPE === 'postgres') {
      const { rows } = await pool.query(`
        SELECT
          w.id_wellnessa,
          CONCAT(g.ime, ' ', g.prezime) AS gost,
          sp.ime_usluge AS usluga,
          m.tip_masaze AS masaza,
          CONCAT(o.ime, ' ', o.prezime) AS osoblje,
          w.datum_zakazivanja,
          w.vrijeme_zakazivanja,
          w.status
        FROM "Wellness" w
        LEFT JOIN "Gosti" g ON w.id_gosta = g.id_gosta
        LEFT JOIN "Spa" sp ON w.id_usluge = sp.id_usluge
        LEFT JOIN "Masaze" m ON w.id_masaze = m.id_masaze
        LEFT JOIN "Osoblje" o ON w.id_osoblja = o.id_osoblja
        ORDER BY w.datum_zakazivanja DESC
      `);
      res.json(rows);

    } else if (process.env.DB_TYPE === 'mongo') {
      res.json([]);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Greška kod dohvaćanja wellness termina');
  }
});

// ==================== PLACANJA ====================

app.get('/api/placanja', async (req, res) => {
  try {
    if (process.env.DB_TYPE === 'postgres') {
      const { rows } = await pool.query(`
        SELECT
          p.id_placanja,
          p.iznos,
          p.nacin_placanja,
          p.status,
          CONCAT(g.ime, ' ', g.prezime) AS gost
        FROM "Placanja" p
        LEFT JOIN "Rezervacije" r ON p.id_placanja = r.id_placanja
        LEFT JOIN "Gosti" g ON r.id_gosta = g.id_gosta
        ORDER BY p.id_placanja DESC
      `);
      res.json(rows);

    } else if (process.env.DB_TYPE === 'mongo') {
      res.json([]);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Greška kod dohvaćanja plaćanja');
  }
});

app.get('/api/test-postgres', (req, res) => {
    res.json({ poruka: "Pozdrav! Server radi i spreman je za PostgreSQL CRUD!" });
});

app.listen(PORT, () => {
    console.log(`Backend server je upaljen na http://localhost:${PORT}`);
});