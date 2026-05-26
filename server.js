require('dotenv').config();
const cors = require('cors');
const express = require('express');
const { Pool } = require('pg'); 

const app = express();
app.use(cors()); 
const PORT = 5000;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: process.env.DB_PASSWORD,
    port: 5432,
});

app.use(express.json());

pool.connect((err, client, release) => {
    if (err) {
        return console.error('Greška pri spajanju na PostgreSQL bazu:', err.stack);
    }
    console.log('Uspješno spojeni na PostgreSQL bazu!');
    release(); 
});

// Ruta za dohvaćanje svih rezervacija za frontend tablicu
app.get('/api/rezervacije', async (req, res) => {
  try {
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
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Greška na serveru kod dohvaćanja rezervacija");
  }
});

app.listen(PORT, () => {
    console.log(`Backend server je upaljen na http://localhost:${PORT}`);
});

app.get('/api/test-postgres', (req, res) => {
    res.json({ poruka: "Pozdrav! Server radi i spreman je za PostgreSQL CRUD!" });
});