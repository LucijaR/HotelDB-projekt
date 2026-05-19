const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const dbName = 'HotelDB';

async function main() {
    const client = new MongoClient(url);

    try {
        await client.connect();
        console.log("Spojeno na MongoDB!");

        const db = client.db(dbName);

        
        // dodaci
        
        const kolekcijaDodaci = db.collection('Dodaci');

        const dodaciPodaci = [
            { naziv_stavke: "Doručak", cijena: 10 },
            { naziv_stavke: "Parking", cijena: 5 },
            { naziv_stavke: "Bazen", cijena: 15 },
        ];

        await kolekcijaDodaci.insertMany(dodaciPodaci);
        console.log("Dodaci ubaceni!");

        
        // soba dodaci
    
        const kolekcijaSobaDodaci = db.collection('SobaDodaci');

        const sobaDodaciPodaci = [
            { id_sobe: "101", id_stavke: "Doručak" },
            { id_sobe: "101", id_stavke: "Parking" },
            { id_sobe: "202", id_stavke: "Bazen" },
        ];

        await kolekcijaSobaDodaci.insertMany(sobaDodaciPodaci);
        console.log("SobaDodaci ubaceni!");

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

main();