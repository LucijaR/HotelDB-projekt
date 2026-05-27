require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());
const PORT = 5000;

// PostgreSQL konekcija (čita postavke iz .env)
const pool = new Pool({
  user: process.env.PG_USER || process.env.PGUSER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE || process.env.PGDATABASE || 'postgres',
  password: process.env.DB_PASSWORD || process.env.PG_PASSWORD || '',
  port: process.env.PG_PORT ? parseInt(process.env.PG_PORT, 10) : 5432,
  // opcionalne tunable postavke
  max: process.env.PG_MAX ? parseInt(process.env.PG_MAX, 10) : 10,
  idleTimeoutMillis: process.env.PG_IDLE_TIMEOUT_MS ? parseInt(process.env.PG_IDLE_TIMEOUT_MS, 10) : 30000,
  connectionTimeoutMillis: process.env.PG_CONN_TIMEOUT_MS ? parseInt(process.env.PG_CONN_TIMEOUT_MS, 10) : 0,
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('Greška pri spajanju na PostgreSQL bazu:', err.stack);
    }
    console.log('Uspješno spojeni na PostgreSQL bazu!');
    release();
});

// MongoDB konekcija
/*mongoose.connect(process.env.MONGODB_URI)
     .then(() => console.log('Uspješno spojeni na MongoDB bazu!'))
     .catch(err => console.error('Greška pri spajanju na MongoDB bazu:', err));*/

// ==================== REZERVACIJE ====================

app.get('/api/rezervacije', async (req, res) => {
  try {
    if (process.env.DB_TYPE === 'postgres') {
      const { rows } = await pool.query(`
        SELECT
          r.id_rezervacije AS id,
          COALESCE(CONCAT(g.ime, ' ', g.prezime), 'Nepoznati Gost') AS guest_name,
          COALESCE(vs.naziv, 'Standard') AS room_type,
          r.check_in,
          r.check_out,
          r.status,
          COALESCE(g.email, '') AS email,
          COALESCE(g.broj_telefona, '') AS broj_telefona
        FROM "Rezervacije" r
        LEFT JOIN "Gosti" g ON r.id_gosta = g.id_gosta
        LEFT JOIN "Sobe" s ON r.id_sobe = s.id_sobe
        LEFT JOIN "VrstaSobe" vs ON s.vrsta_sobe_id = vs.vrsta_sobe_id
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
            email: { $ifNull: ['$gost.email', ''] },
            broj_telefona: { $ifNull: ['$gost.broj_telefona', ''] },
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
  console.log('DB_TYPE:', process.env.DB_TYPE);
  console.log('Body:', req.body);
  try {
    
      const { guestName, roomType, checkIn, checkOut, status, email, brojTelefona } = req.body;
      
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      if (checkOutDate <= checkInDate) {
        return res.status(400).json({ greška: 'Check-out mora biti nakon check-in datuma' });
      }

      if (process.env.DB_TYPE === 'postgres') {
      let gost = await pool.query(
        `SELECT id_gosta FROM "Gosti" WHERE email = $1`, [email]
      );
      
      if (gost.rows.length === 0) {
        const dijelovi = guestName.split(' ');
        const ime = dijelovi[0];
        const prezime = dijelovi.slice(1).join(' ') || '';
        gost = await pool.query(
          `INSERT INTO "Gosti" (ime, prezime, email, broj_telefona) 
           VALUES ($1, $2, $3, $4) RETURNING id_gosta`,
          [ime, prezime, email, brojTelefona]
        );
      }
      
      const id_gosta = gost.rows[0].id_gosta;

      const soba = await pool.query(`
        SELECT s.id_sobe FROM "Sobe" s
        JOIN "VrstaSobe" vs ON s.vrsta_sobe_id = vs.vrsta_sobe_id
        WHERE vs.naziv = $1 AND s.status = 'Slobodna'
        LIMIT 1
      `, [roomType]);

      if (soba.rows.length === 0) {
        return res.status(400).json({ greška: `Nema slobodnih soba tipa ${roomType}` });
      }

      const id_sobe = soba.rows[0].id_sobe;

      const preklapanje = await pool.query(`
        SELECT id_rezervacije FROM "Rezervacije"
        WHERE id_sobe = $1
        AND check_in < $2
        AND check_out > $3
        LIMIT 1
      `, [id_sobe, checkOut, checkIn]);

      if (preklapanje.rows.length > 0) {
        return res.status(400).json({ greška: 'Soba nije slobodna u odabranom periodu' });
      }

      const { rows } = await pool.query(`
        INSERT INTO "Rezervacije" (id_gosta, id_sobe, check_in, check_out, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id_rezervacije AS id
      `, [id_gosta, id_sobe, checkIn, checkOut, status === 'Confirmed' ? 'potvrdena' : 'Na čekanju']);

      res.status(201).json({ id: rows[0].id.toString() });

    } else if (process.env.DB_TYPE === 'mongo') {
      const Rezervacija = require('./models/Rezervacija');
      const Gost = require('./models/Gost');
      const Soba = require('./models/Soba');
      const VrstaSobe = require('./models/VrstaSobe');

      const { guestName, roomType, checkIn, checkOut, status, email, brojTelefona } = req.body;

      let gost = await Gost.findOne({ email });
      console.log('Gost pronađen:', gost);

      if (!gost) {
        const dijelovi = guestName.trim().split(' ');
        gost = await Gost.create({
          ime: dijelovi[0],
          prezime: dijelovi.slice(1).join(' ') || '',
          email,
          broj_telefona: brojTelefona
        });
        console.log('Gost kreiran:', gost);
      }

      const vrstaSobe = await VrstaSobe.findOne({ naziv: roomType });
      console.log('VrstaSobe pronađena:', vrstaSobe);
      if (!vrstaSobe) {
        return res.status(400).json({ greška: `Vrsta sobe '${roomType}' ne postoji` });
      }

      const soba = await Soba.findOne({ vrsta_sobe_id: vrstaSobe._id, status: 'Slobodna' });
      console.log('Soba pronađena:', soba);
      if (!soba) {
        return res.status(400).json({ greška: `Nema slobodnih soba tipa ${roomType}` });
      }

      const preklapanje = await Rezervacija.findOne({
        id_sobe: soba._id,
        $or: [{ check_in: { $lt: checkOutDate }, check_out: { $gt: checkInDate } }]
      });
      if (preklapanje) {
        return res.status(400).json({ greška: 'Soba nije slobodna u odabranom periodu' });
      }
      const rezervacija = await Rezervacija.create({
        id_gosta: gost._id,
        id_sobe: soba._id,
        check_in: checkInDate,
        check_out: checkOutDate,
        status: status === 'Confirmed' ? 'potvrdena' : 'Na čekanju',
        ukupna_cijena: 0
      });
      console.log('Rezervacija kreirana:', rezervacija);

      res.status(201).json({ id: rezervacija._id.toString() });
    }
  } catch (err) {
    console.error('ERROR:', err.message);
    res.status(500).send('Greška kod kreiranja rezervacije');
  }
});

app.put('/api/rezervacije/:id', async (req, res) => {
  console.log('PUT id:', req.params.id);
  console.log('PUT body:', req.body);
  console.log('DB_TYPE:', process.env.DB_TYPE);

  try {
    const { id } = req.params;
    const { guestName, checkIn, checkOut, status, roomType } = req.body;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ greška: 'Check-out mora biti nakon check-in datuma' });
    }

    if (process.env.DB_TYPE === 'postgres') {
      const dijelovi = (guestName || '').trim().split(' ');
      const ime = dijelovi[0] || '';
      const prezime = dijelovi.slice(1).join(' ') || '';

      await pool.query(`
        UPDATE "Gosti" g
        SET ime = $1, prezime = $2
        FROM "Rezervacije" r
        WHERE r.id_rezervacije = $3 AND r.id_gosta = g.id_gosta
      `, [ime, prezime, id]);

      const soba = await pool.query(`
        SELECT s.id_sobe FROM "Sobe" s
        JOIN "VrstaSobe" vs ON s.vrsta_sobe_id = vs.vrsta_sobe_id
        WHERE vs.naziv = $1
        LIMIT 1
      `, [roomType]);

      const id_sobe = soba.rows[0]?.id_sobe;

      const preklapanje = await pool.query(`
        SELECT id_rezervacije FROM "Rezervacije"
        WHERE id_sobe = $1
        AND id_rezervacije != $2
        AND check_in < $3
        AND check_out > $4
        LIMIT 1
      `, [id_sobe, id, checkOut, checkIn]);

      if (preklapanje.rows.length > 0) {
        return res.status(400).json({ greška: 'Soba nije slobodna u odabranom periodu' });
      }

      const { rows } = await pool.query(`
        UPDATE "Rezervacije"
        SET check_in=$1, check_out=$2, status=$3, id_sobe=$4
        WHERE id_rezervacije=$5
        RETURNING *
      `, [checkIn, checkOut, status === 'Confirmed' ? 'potvrdena' : 'Na čekanju', id_sobe, id]);

      return res.json(rows[0]);

    } else if (process.env.DB_TYPE === 'mongo') {
      const Rezervacija = require('./models/Rezervacija');
      const Gost = require('./models/Gost');
      const Soba = require('./models/Soba');
      const VrstaSobe = require('./models/VrstaSobe');

      const postojecaRezervacija = await Rezervacija.findById(id);
      if (!postojecaRezervacija) {
        return res.status(404).json({ greška: 'Rezervacija nije pronađena u MongoDB bazi' });
      }

      if (guestName) {
        const dijelovi = guestName.trim().split(' ');
        const ime = dijelovi[0];
        const prezime = dijelovi.slice(1).join(' ') || '';

        await Gost.findByIdAndUpdate(postojecaRezervacija.id_gosta, {
          ime: ime,
          prezime: prezime
        });
      }

      let noviIdSobe = postojecaRezervacija.id_sobe;
      if (roomType) {
        const vrstaSobe = await VrstaSobe.findOne({ naziv: roomType });
        if (!vrstaSobe) {
          return res.status(400).json({ greška: `Vrsta sobe '${roomType}' ne postoji` });
        }

        const slobodnaSoba = await Soba.findOne({ vrsta_sobe_id: vrstaSobe._id, });
        if (!slobodnaSoba) {
          return res.status(400).json({ greška: `Nema slobodnih soba tipa ${roomType}` });
        }
        noviIdSobe = slobodnaSoba._id;
      }

      const preklapanje = await Rezervacija.findOne({
        id_sobe: noviIdSobe,
        _id: { $ne: id },
        $or: [{ check_in: { $lt: checkOutDate }, check_out: { $gt: checkInDate } }]
      });
      if (preklapanje) {
        return res.status(400).json({ greška: 'Soba nije slobodna u odabranom periodu' });
      }


      const azuriranaRezervacija = await Rezervacija.findByIdAndUpdate(
        id,
        {
          check_in: checkIn ? new Date(checkIn) : postojecaRezervacija.check_in,
          check_out: checkOut ? new Date(checkOut) : postojecaRezervacija.check_out,
          status: status === 'Confirmed' ? 'potvrdena' : 'Na čekanju',
          id_sobe: noviIdSobe
        },
        { new: true }
      );

      return res.json(azuriranaRezervacija);
    }

  } catch (err) {
    console.error('Greška kod ažuriranja rezervacije:', err.message);
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
        confirmed: await Rezervacija.countDocuments({ status: 'potvrdena' }),
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
    res.json({ poruka: "Pozdrav! Server radi i spreman je za CRUD!" });
});

app.listen(PORT, () => {
    console.log(`Backend server je upaljen na http://localhost:${PORT}`);
});