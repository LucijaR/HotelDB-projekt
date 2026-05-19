const { execSync } = require("child_process");
const { MongoClient } = require("mongodb");
const {
  deleteOneWellness,
  deleteManyWellness,
  deleteOneSpa,
  deleteManySpa,
  deleteOneMasaze,
  deleteManyMasaze,
} = require("./delete_ops");

const url = "mongodb://localhost:27017";
const dbName = "HotelDB";

async function showAll(db, collectionName) {
  const docs = await db.collection(collectionName).find().toArray();
  console.log(JSON.stringify(docs, null, 2));
}

(async () => {
  try {
    console.log("Reseeding data with seed4.js...");
    execSync("node seed4.js", { stdio: "inherit" });

    const client = new MongoClient(url);
    await client.connect();
    const db = client.db(dbName);

    // Test Wellness
    console.log("\n====== TESTING WELLNESS ======");
    console.log("Initial Wellness documents:");
    await showAll(db, "Wellness");

    console.log("\nDeleting one Wellness document...");
    const r1 = await deleteOneWellness("Wellness paket 1");
    console.log("deleteOne result:", r1);

    console.log("\nWellness documents after deleteOne:");
    await showAll(db, "Wellness");

    console.log("\nDeleting remaining Wellness documents...");
    const r2 = await deleteManyWellness();
    console.log("deleteMany result:", r2);

    console.log("\nWellness documents after deleteMany:");
    await showAll(db, "Wellness");

    // Test Spa
    console.log("\n====== TESTING SPA ======");
    execSync("node seed4.js", { stdio: "inherit" });
    console.log("\nInitial Spa documents:");
    await showAll(db, "Spa");

    console.log("\nDeleting one Spa document...");
    const r3 = await deleteOneSpa("Sauna");
    console.log("deleteOne result:", r3);

    console.log("\nSpa documents after deleteOne:");
    await showAll(db, "Spa");

    console.log("\nDeleting remaining Spa documents...");
    const r4 = await deleteManySpa();
    console.log("deleteMany result:", r4);

    console.log("\nSpa documents after deleteMany:");
    await showAll(db, "Spa");

    // Test Masaze
    console.log("\n====== TESTING MASAZE ======");
    execSync("node seed4.js", { stdio: "inherit" });
    console.log("\nInitial Masaze documents:");
    await showAll(db, "Masaze");

    console.log("\nDeleting one Masaze document...");
    const r5 = await deleteOneMasaze("Klasična masaža");
    console.log("deleteOne result:", r5);

    console.log("\nMasaze documents after deleteOne:");
    await showAll(db, "Masaze");

    console.log("\nDeleting remaining Masaze documents...");
    const r6 = await deleteManyMasaze();
    console.log("deleteMany result:", r6);

    console.log("\nMasaze documents after deleteMany:");
    await showAll(db, "Masaze");

    await client.close();
    console.log("\n====== ALL DELETE TESTS COMPLETED SUCCESSFULLY ======");
  } catch (e) {
    console.error("Test failed:", e);
    process.exit(1);
  }
})();

//pokretanje
//# Reseed podataka
//node seed4.js

//# rezultati
//node test_delete.js
