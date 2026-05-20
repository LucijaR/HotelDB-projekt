const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const dbName = 'HotelDB'; 

async function main() {
    const client = new MongoClient(url);

    try {
        await client.connect();
        console.log("Uspješno spojeni na MongoDB za UPDATE operacije!");
        const db = client.db(dbName);

        // =========================
        // 1. UPDATE: DODACI
        // =========================
        const dodaci = db.collection('Dodaci');
        
        const resDodaci1 = await dodaci.updateOne(
            { naziv_stavke: "Bazen" },
            { $set: { cijena: 50 } }
        );
        console.log(`Dodaci (updateOne): Izmijenjeno dokumenata -> ${resDodaci1.modifiedCount}`);

        const resDodaci2 = await dodaci.updateMany(
            { cijena: { $gt: 10 } },
            { $set: { status: "Basic" } }
        );
        console.log(`Dodaci (updateMany): Izmijenjeno dokumenata -> ${resDodaci2.modifiedCount}`);


        // =========================
        // 2. UPDATE: GOSTI
        // =========================
        const gosti = db.collection('Gosti');
        
        const resGosti = await gosti.updateOne(
            { ime: "Mia", prezime: "Sokol" },
            { $set: { email: "mia.sokolnovi@gmail.com" } }
        );
        console.log(`Gosti (updateOne): Izmijenjeno dokumenata -> ${resGosti.modifiedCount}`);


        // =========================
        // 3. UPDATE: PLACANJA
        // =========================
        const placanja = db.collection('Placanja');
        
        const resPlacanja = await placanja.updateOne(
            { iznos: 250.75, status: "Odbijeno" },
            { $set: { status: "Završeno" } }
        );
        console.log(`Placanja (updateOne): Izmijenjeno dokumenata -> ${resPlacanja.modifiedCount}`);


        // =========================
        // 4. UPDATE: SOBE
        // =========================
        const sobe = db.collection('Sobe');
        
        const resSobe1 = await sobe.updateOne(
            { broj_sobe: "202" },
            { $set: { status: "Slobodna" } }
        );
        console.log(`Sobe (updateOne): Izmijenjeno dokumenata -> ${resSobe1.modifiedCount}`);

        const resSobe2 = await sobe.updateMany(
            { status: "Čišćenje" },
            { $set: { status: "Slobodna" } }
        );
        console.log(`Sobe (updateMany): Izmijenjeno dokumenata -> ${resSobe2.modifiedCount}`);

        console.log("\nSve update operacije su uspješno izvršene i testirane!");

    } catch (e) {
        console.error("Uups, dogodila se greška pri updateu: ", e);
    } finally {
        await client.close();
    }
}

main();