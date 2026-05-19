const { MongoClient, ObjectId } = require('mongodb');

const url = 'mongodb://localhost:27017';
const dbName = 'HotelDB';

async function main() {
    const client = new MongoClient(url);

    try {
        await client.connect();
        console.log("Uspješno spojeni na MongoDB!");

        const db = client.db(dbName);

        // =========================
        // 1. VRSTA SOBE
        // =========================
        const kolekcijaVrstaSobe = db.collection('VrstaSobe');

        const vrsteSobaPodaci = [
            { naziv: "Standard", cijena: 50.00, kapacitet: 2 },
            { naziv: "Apartman", cijena: 120.00, kapacitet: 4 }
        ];

        await kolekcijaVrstaSobe.insertMany(vrsteSobaPodaci);

        const standardSoba = await kolekcijaVrstaSobe.findOne({ naziv: "Standard" });
        const apartmanSoba = await kolekcijaVrstaSobe.findOne({ naziv: "Apartman" });

        // =========================
        // 2. SOBE
        // =========================
        const kolekcijaSobe = db.collection('Sobe');

        const sobePodaci = [
            {
                broj_sobe: "101",
                vrsta_sobe_id: standardSoba._id,
                status: "Slobodna"
            },
            {
                broj_sobe: "202",
                vrsta_sobe_id: apartmanSoba._id,
                status: "Zauzeta"
            },
            {
                broj_sobe: "303",
                vrsta_sobe_id: standardSoba._id,
                status: "Zauzeta"
            }
        ];

        await kolekcijaSobe.insertMany(sobePodaci);

        const soba101 = await kolekcijaSobe.findOne({ broj_sobe: "101" });

        // =========================
        // 3. MJESTO STANOVANJA
        // =========================
        const kolekcijaMjesta = db.collection('MjestoStanovanja');

        const mjestaPodaci = [
            {
                drzava: "Hrvatska",
                grad: "Zagreb",
                postanski_broj: "10000",
                adresa: "Ilica 120"
            },
            {
                drzava: "Hrvatska",
                grad: "Split",
                postanski_broj: "21000",
                adresa: "Riva 5"
            }
        ];

        await kolekcijaMjesta.insertMany(mjestaPodaci);

        const zagreb = await kolekcijaMjesta.findOne({ grad: "Zagreb" });
        const split = await kolekcijaMjesta.findOne({ grad: "Split" });

        // =========================
        // 4. GOSTI
        // =========================
        const kolekcijaGosti = db.collection('Gosti');

        const gostiPodaci = [
            {
                ime: "Lovro",
                prezime: "Barišić",
                email: "lovro@gmail.com",
                id_mjesta: zagreb._id
            },
            {
                ime: "Nika",
                prezime: "Kraljević",
                email: "nika@gmail.com",
                id_mjesta: split._id
            }
        ];

        await kolekcijaGosti.insertMany(gostiPodaci);

        const gostLovro = await kolekcijaGosti.findOne({ ime: "Lovro" });

        // =========================
        // 5. PLAĆANJA
        // =========================
        const kolekcijaPlacanja = db.collection('Placanja');

        const placanjaPodaci = [
            {
                iznos: 120,
                nacin_placanja: "Kartica",
                status: "Završeno"
            },
            {
                iznos: 80,
                nacin_placanja: "Gotovina",
                status: "Na čekanju"
            }
        ];

        await kolekcijaPlacanja.insertMany(placanjaPodaci);

        const placanje1 = await kolekcijaPlacanja.findOne({ iznos: 120 });

        // =========================
        // 6. REZERVACIJE
        // =========================
        const kolekcijaRezervacije = db.collection('Rezervacije');

        const rezervacijePodaci = [
            {
                id_gosta: gostLovro._id,
                id_sobe: soba101._id,
                id_placanja: placanje1._id,
                check_in: "2026-06-01",
                check_out: "2026-06-05",
                ukupna_cijena: 200,
                status: "Potvrđena"
            }
        ];

        await kolekcijaRezervacije.insertMany(rezervacijePodaci);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

main();