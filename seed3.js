const { MongoClient, ObjectId } = require('mongodb');

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

        const dorucak = await kolekcijaDodaci.findOne({ naziv_stavke: "Doručak" });
        const parking = await kolekcijaDodaci.findOne({ naziv_stavke: "Parking" });
        const bazen = await kolekcijaDodaci.findOne({ naziv_stavke: "Bazen" });

        const sobaDodaciPodaci = [
            { id_sobe: new ObjectId("6a0cacc623b7cfb9819beb84"), id_stavke: dorucak._id },
            { id_sobe: new ObjectId("6a0cacc623b7cfb9819beb84"), id_stavke: parking._id },
            { id_sobe: new ObjectId("6a0cacc623b7cfb9819beb85"), id_stavke: bazen._id    },
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