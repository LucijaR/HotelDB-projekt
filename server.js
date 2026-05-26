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

// OPERACIJA: CREATE - Dodavanje novog gosta i njegove rezervacije u bazu podataka
app.post('/api/rezervacije', async (req, res) => {
  const { guestName, roomType, checkIn, checkOut, status, email, brojTelefona } = req.body;

  try {
    const [ime, ...ostatakPrezimena] = guestName.trim().split(" ");
    const prezime = ostatakPrezimena.join(" ") || "Prezime"; 

    const nasumicniOib = Math.floor(10000000000 + Math.random() * 90000000000).toString();

    const noviGost = await pool.query(
      `INSERT INTO Gosti (ime, prezime, email, jmbg_oib, broj_telefona, datum_registracije, id_mjesta) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, 1) 
       RETURNING id_gosta`,
      [ime, prezime, email, nasumicniOib, brojTelefona]
    );

    const idGosta = noviGost.rows[0].id_gosta;

    let idSobe = 1; 
    if (roomType === "Suite") idSobe = 3;
    else if (roomType === "Deluxe" || roomType === "Standard") idSobe = 2;

    const novoPlacanje = await pool.query(
      `INSERT INTO Placanja (iznos, nacin_placanja, status) 
       VALUES (150.00, 'kartica', 'neplaceno') 
       RETURNING id_placanja`
    );
    const idPlacanja = pool.rows ? novoPlacanje.rows[0].id_placanja : novoPlacanje.rows[0].id_placanja;

    const dbStatus = status === "Confirmed" ? "potvrdena" : "cekiranje";

    const novaRezervacija = await pool.query(
      `INSERT INTO Rezervacije (id_gosta, id_sobe, id_placanja, check_in, check_out, ukupna_cijena, status) 
       VALUES ($1, $2, $3, $4, $5, 150.00, $6) 
       RETURNING id_rezervacije`,
      [idGosta, idSobe, idPlacanja, checkIn, checkOut, dbStatus]
    );

    res.status(201).json({ 
      id: novaRezervacija.rows[0].id_rezervacije.toString(),
      message: "Rezervacija uspješno spremljena u bazu!" 
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Greška na serveru kod kreiranja rezervacije");
  }
});

app.listen(PORT, () => {
    console.log(`Backend server je upaljen na http://localhost:${PORT}`);
});

app.get('/api/test-postgres', (req, res) => {
    res.json({ poruka: "Pozdrav! Server radi i spreman je za PostgreSQL CRUD!" });
});