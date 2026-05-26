require('dotenv').config();
const express = require('express');
const { Pool } = require('pg'); 

const app = express();
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

app.listen(PORT, () => {
    console.log(`Backend server je upaljen na http://localhost:${PORT}`);
});

app.get('/api/test-postgres', (req, res) => {
    res.json({ poruka: "Pozdrav! Server radi i spreman je za PostgreSQL CRUD!" });
});