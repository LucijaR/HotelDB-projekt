const { MongoClient } = require("mongodb");
const url = "mongodb://localhost:27017";
const dbName = "HotelDB";

async function withDb(fn) {
  const client = new MongoClient(url);
  await client.connect();
  try {
    const db = client.db(dbName);
    return await fn(db);
  } finally {
    await client.close();
  }
}

async function deleteOneWellness(naziv) {
  return withDb((db) => db.collection("Wellness").deleteOne({ naziv }));
}

async function deleteManyWellness(filter = {}) {
  return withDb((db) => db.collection("Wellness").deleteMany(filter));
}

async function dropWellnessCollection() {
  return withDb(async (db) => {
    const coll = db.collection("Wellness");
    try {
      return await coll.drop();
    } catch (e) {
      return false;
    }
  });
}

async function deleteOneSpa(naziv) {
  return withDb((db) => db.collection("Spa").deleteOne({ naziv }));
}

async function deleteManySpa(filter = {}) {
  return withDb((db) => db.collection("Spa").deleteMany(filter));
}

async function dropSpaCollection() {
  return withDb(async (db) => {
    const coll = db.collection("Spa");
    try {
      return await coll.drop();
    } catch (e) {
      return false;
    }
  });
}

async function deleteOneMasaze(naziv) {
  return withDb((db) => db.collection("Masaze").deleteOne({ naziv }));
}

async function deleteManyMasaze(filter = {}) {
  return withDb((db) => db.collection("Masaze").deleteMany(filter));
}

async function dropMasazeCollection() {
  return withDb(async (db) => {
    const coll = db.collection("Masaze");
    try {
      return await coll.drop();
    } catch (e) {
      return false;
    }
  });
}

module.exports = {
  deleteOneWellness,
  deleteManyWellness,
  dropWellnessCollection,
  deleteOneSpa,
  deleteManySpa,
  dropSpaCollection,
  deleteOneMasaze,
  deleteManyMasaze,
  dropMasazeCollection,
};
