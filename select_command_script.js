const { MongoClient } = require("mongodb");

const url = "mongodb://localhost:27017";
const dbName = "HotelDB";

async function main() {
  const client = new MongoClient(url);

  try {
    await client.connect();
    const db = client.db(dbName);

    // 1. Sve sobe
    const sobe = await db.collection("Sobe").find({}).toArray();
    console.log("Sve sobe:", sobe);

    // 2. Samo slobodne sobe
    const slobodne = await db.collection("Sobe")
      .find({ status: "Slobodna" })
      .toArray();
    console.log("Slobodne sobe:", slobodne);


        // 3. Masaže skuplje od 45
    const masaze = await db.collection("Masaze")
      .find({ cijena: { $gt: 45 } })
      .toArray();
    console.log("Skuplje masaže:");
    console.log(masaze);

    //4. Manageri
      const manageri = await db.collection("Osoblje")
      .find({ pozicija: "Manager" })
      .toArray();
    console.log("Manageri:");
    console.log(manageri);

    //5. Plaćanja gotovinom
     const gotovina = await db.collection("Placanja")
      .find({ nacin_placanja: "Gotovina" })
      .toArray();
    console.log("Plaćanja gotovinom:");
    console.log(gotovina);

  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

main();