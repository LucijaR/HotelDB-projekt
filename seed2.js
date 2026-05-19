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
        // 1. MJESTO STANOVANJA
        // =========================
        const kolekcijaMjesto = db.collection('MjestoStanovanja');

        const mjestaPodaci = [
            {
                _id: new ObjectId("6a0c794a833e86a866a1387e"),
                drzava: "Hrvatska",
                grad: "Zagreb",
                postanski_broj: "10000",
                adresa: "Ilica 120"
            },
            {
                _id: new ObjectId("6a0c794a833e86a866a1387f"),
                drzava: "Hrvatska",
                grad: "Split",
                postanski_broj: "21000",
                adresa: "Riva 5"
            },
            {
                _id: new ObjectId("6a0c794a833e86a866a13880"),
                drzava: "Hrvatska",
                grad: "Rijeka",
                postanski_broj: "51000",
                adresa: "Korzo 18"
            },
            {
                _id: new ObjectId("6a0c794a833e86a866a13881"),
                drzava: "Hrvatska",
                grad: "Osijek",
                postanski_broj: "31000",
                adresa: "Europska avenija 10"
            },
            {
                _id: new ObjectId("6a0c794a833e86a866a13882"),
                drzava: "Hrvatska",
                grad: "Zadar",
                postanski_broj: "23000",
                adresa: "Kalelarga 22"
            }
        ];

        await kolekcijaMjesto.insertMany(mjestaPodaci);
        console.log("Kolekcija MjestoStanovanja kreirana i napunjena!");

        // =========================
        // 2. GOSTI
        // =========================
        const kolekcijaGosti = db.collection('Gosti');

        const gostiPodaci = [
            {
                _id: new ObjectId("6a0c769f833e86a866a1386e"),
                ime: "Lovro",
                prezime: "Barišić",
                email: "lovro.barisić@example.com",
                id_mjesta: new ObjectId("6a0c794a833e86a866a1387e")
            },
            {
                _id: new ObjectId("6a0c77ca833e86a866a13873"),
                ime: "Nika",
                prezime: "Kraljević",
                email: "nika.kraljevic@gmail.com",
                id_mjesta: new ObjectId("6a0c794a833e86a866a1387f")
            },
            {
                _id: new ObjectId("6a0c77ca833e86a866a13874"),
                ime: "Teo",
                prezime: "Vuković",
                email: "teo.vukovic@mail.com",
                id_mjesta: new ObjectId("6a0c794a833e86a866a13880")
            },
            {
                _id: new ObjectId("6a0c77ca833e86a866a13875"),
                ime: "Mia",
                prezime: "Sokol",
                email: "mila.sokol@gmail.com",
                id_mjesta: new ObjectId("6a0c794a833e86a866a13881")
            },
            {
                _id: new ObjectId("6a0c77ca833e86a866a13876"),
                ime: "Roko",
                prezime: "Jurić",
                email: "roko.juric@yahoo.com",
                id_mjesta: new ObjectId("6a0c794a833e86a866a13882")
            }
        ];

        await kolekcijaGosti.insertMany(gostiPodaci);
        console.log("Kolekcija Gosti kreirana i napunjena!");

        // =========================
        // 3. PLAĆANJA
        // =========================
        const kolekcijaPlacanja = db.collection('Placanja');

        const placanjaPodaci = [
            {
                _id: new ObjectId("6a0c79ef833e86a866a13890"),
                iznos: 49.99,
                nacin_placanja: "Kartica",
                status: "Završeno"
            },
            {
                _id: new ObjectId("6a0c79ef833e86a866a13891"),
                iznos: 120,
                nacin_placanja: "Gotovina",
                status: "Završeno"
            },
            {
                _id: new ObjectId("6a0c79ef833e86a866a13892"),
                iznos: 15.5,
                nacin_placanja: "PayPal",
                status: "Na čekanju"
            },
            {
                _id: new ObjectId("6a0c79ef833e86a866a13893"),
                iznos: 250.75,
                nacin_placanja: "Kartica",
                status: "Odbijeno"
            },
            {
                _id: new ObjectId("6a0c79ef833e86a866a13894"),
                iznos: 89.9,
                nacin_placanja: "Internet bankarstvo",
                status: "Završeno"
            }
        ];

        await kolekcijaPlacanja.insertMany(placanjaPodaci);
        console.log("Kolekcija Placanja kreirana i napunjena!");

        // =========================
        // 4. REZERVACIJE
        // =========================
        const kolekcijaRezervacije = db.collection('Rezervacije');

        const rezervacijePodaci = [
            {
                _id: new ObjectId("6a0c7a6d833e86a866a1389d"),
                id_gosta: new ObjectId("6a0c769f833e86a866a1386e"),
                id_sobe: new ObjectId("6a0c6f2ec311e1189ac79a62"),
                id_placanja: new ObjectId("6a0c79ef833e86a866a13890"),
                check_in: "2026-06-01",
                check_out: "2026-06-05",
                ukupna_cijena: 199.99,
                status: "Potvrđena"
            },
            {
                _id: new ObjectId("6a0c7a6d833e86a866a1389e"),
                id_gosta: new ObjectId("6a0c77ca833e86a866a13873"),
                id_sobe: new ObjectId("6a0c6f2ec311e1189ac79a63"),
                id_placanja: new ObjectId("6a0c79ef833e86a866a13891"),
                check_in: "2026-06-10",
                check_out: "2026-06-12",
                ukupna_cijena: 120,
                status: "Na čekanju"
            },
            {
                _id: new ObjectId("6a0c7a6d833e86a866a1389f"),
                id_gosta: new ObjectId("6a0c77ca833e86a866a13874"),
                id_sobe: new ObjectId("6a0c6f2ec311e1189ac79a64"),
                id_placanja: new ObjectId("6a0c79ef833e86a866a13894"),
                check_in: "2026-07-01",
                check_out: "2026-07-07",
                ukupna_cijena: 450.5,
                status: "Potvrđena"
            }
        ];

        await kolekcijaRezervacije.insertMany(rezervacijePodaci);
        console.log("Kolekcija Rezervacije kreirana i napunjena!");

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

main();