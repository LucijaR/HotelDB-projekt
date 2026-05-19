const { MongoClient } = require("mongodb");

const url = "mongodb://localhost:27017";
const dbName = "HotelDB";

async function main() {
  const client = new MongoClient(url);

  try {
    await client.connect();
    console.log("Uspješno spojeni na MongoDB!");
    const db = client.db(dbName);

    const kolekcijaSpa = db.collection("Spa");
    const spaPodaci = [
      { naziv: "Sauna", opis: "Suha sauna", cijena: 0, trajanje_min: 30 },
      {
        naziv: "Parna kupelj",
        opis: "Relaksirajuća parna soba",
        cijena: 0,
        trajanje_min: 20,
      },
    ];
    await kolekcijaSpa.insertMany(spaPodaci);
    console.log("Kolekcija Spa kreirana i napunjena!");

    const kolekcijaMasaze = db.collection("Masaze");
    const masazePodaci = [
      {
        naziv: "Klasična masaža",
        terapeut: "Ivan",
        cijena: 40.0,
        trajanje_min: 60,
      },
      {
        naziv: "Aromaterapija",
        terapeut: "Marija",
        cijena: 50.0,
        trajanje_min: 60,
      },
    ];
    await kolekcijaMasaze.insertMany(masazePodaci);
    console.log("Kolekcija Masaze kreirana i napunjena!");

    const kolekcijaWellness = db.collection("Wellness");
    const wellnessPodaci = [
      { naziv: "Wellness paket 1", opis: "Sauna + masaža", cijena: 70.0 },
      {
        naziv: "Wellness paket 2",
        opis: "Parna kupelj + aromaterapija",
        cijena: 90.0,
      },
    ];
    await kolekcijaWellness.insertMany(wellnessPodaci);
    console.log("Kolekcija Wellness kreirana i napunjena!");
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

main();
