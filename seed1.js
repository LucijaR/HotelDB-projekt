const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const dbName = 'HotelDB';

async function main() {
    const client = new MongoClient(url);

    try {
        await client.connect();
        console.log("Uspješno spojeni na MongoDB!");
        const db = client.db(dbName);

        // 1. KREIRANJE I PUNJENJE: VrstaSobe
        const kolekcijaVrstaSobe = db.collection('VrstaSobe');
        const vrsteSobaPodaci = [
            { naziv: "Standard", cijena: 50.00, kapacitet: 2 },
            { naziv: "Apartman", cijena: 120.00, kapacitet: 4 },
        ];
        await kolekcijaVrstaSobe.insertMany(vrsteSobaPodaci);
        console.log("Kolekcija VrstaSobe kreirana i napunjena!");

        const standardSoba = await kolekcijaVrstaSobe.findOne({ naziv: "Standard" });
        const apartmanSoba = await kolekcijaVrstaSobe.findOne({ naziv: "Apartman" });

        // 2. KREIRANJE I PUNJENJE: Sobe 
        const kolekcijaSobe = db.collection('Sobe');
        const sobePodaci = [
            { broj_sobe: "101", vrsta_sobe_id: standardSoba._id, status: "Slobodna" },
            { broj_sobe: "202", vrsta_sobe_id: apartmanSoba._id, status: "Zauzeta" },
            { broj_sobe: "303", vrsta_sobe_id: standardSoba._id, status: "Zauzeta" },
            { broj_sobe: "404", vrsta_sobe_id: standardSoba._id, status: "Zauzeta" }
        ];
        await kolekcijaSobe.insertMany(sobePodaci);
        console.log("Kolekcija Sobe kreirana i napunjena!");

        // 3. KREIRANJE I PUNJENJE: Osoblje
        const kolekcijaOsoblje = db.collection('Osoblje');
        const osobljePodaci = [
            { ime: "Ivan", prezime: "Horvat", pozicija: "Recepcioner", email: "ivan@hotel.com" },
            { ime: "Marija", prezime: "Kralj", pozicija: "Manager", email: "marija@hotel.com" },
            { ime: "Ana", prezime: "Antić", pozicija: "Recepcionerka", email: "ana@hotel.com" },
            { ime: "Lucija", prezime: "Lukić", pozicija: "Spremačica", email: "lucija@hotel.com" }
        ];
        await kolekcijaOsoblje.insertMany(osobljePodaci);
        console.log("Kolekcija Osoblje kreirana i napunjena!");

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

main();