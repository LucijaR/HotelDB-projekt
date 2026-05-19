
// =========================
// 1. DODACI
// =========================
db["Dodaci"].insertOne({
    naziv_stavke: "kikiriki",
    cijena: 3.99
})

db["Dodaci"].insertMany([
    { naziv_stavke: "čokolada", cijena: 2.50 },
    { naziv_stavke: "voda", cijena: 1.20 },
    { naziv_stavke: "sok", cijena: 2.00 }
])

// =========================
// 2. GOSTI
// =========================
db["Gosti"].insertOne({
    ime: "Petar",
    prezime: "Marić",
    email: "petar@gmail.com",
    id_mjesta: ObjectId("6a0c794a833e86a866a1387e")
})

db["Gosti"].insertMany([
    {
        ime: "Ana",
        prezime: "Anić",
        email: "ana@gmail.com",
      id_mjesta: ObjectId('6a0c794a833e86a866a1387e')
    },
    {
        ime: "Marko",
        prezime: "Marković",
        email: "marko@gmail.com",
      id_mjesta: ObjectId('6a0c794a833e86a866a1387e')
    },
    {
        ime: "Ivana",
        prezime: "Ivić",
        email: "ivana@gmail.com",
        id_mjesta: ObjectId('6a0c794a833e86a866a1387e')
    }
])

// =========================
// 3. PLACANJA
// =========================
db["Placanja"].insertOne({
    iznos: 125,
    nacin_placanja: "Kartica",
    status: "Odbijeno"
})

db["Placanja"].insertMany([
    {
        iznos: 225,
        nacin_placanja: "Paypal",
        status: "Potvrđeno"
    },
    {
        iznos: 300,
        nacin_placanja: "Kartica",
        status: "Završeno"
    }
])

// =========================
// 4. SOBE
// =========================

db["Sobe"].insertOne({
    broj_sobe: "701",
    vrsta_sobe_id: ObjectId("6a0c7e5427a85380adba997e"),
    status: "Slobodna"
})

db["Sobe"].insertMany([
    {
        broj_sobe: "702",
        vrsta_sobe_id: ObjectId("6a0c7e5427a85380adba997e"),
        status: "Zauzeta"
    },
    {
        broj_sobe: "703",
        vrsta_sobe_id: ObjectId("6a0c7e5427a85380adba997f"),
        status: "Slobodna"
    },
    {
        broj_sobe: "704",
        vrsta_sobe_id: ObjectId("6a0c7e5427a85380adba997f"),
        status: "Zauzeta"
    }
])

// =========================
// PROVJERA (TEST)
// =========================
db["Dodaci"].find()
db["Gosti"].find()
db["Placanja"].find()
db["Sobe"].find()