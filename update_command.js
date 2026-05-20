// =========================
// 1. UPDATE: DODACI
// =========================
db["Dodaci"].updateOne(
    { naziv_stavke: "Bazen" }, 
    { $set: { cijena: 50 } } 
)

db["Dodaci"].updateMany(
    { cijena: { $gt: 10 } }, 
    { $set: { status: "Basic" } }
)

// =========================
// 2. UPDATE: GOSTI
// =========================
db["Gosti"].updateOne(
    { ime: "Mia", prezime: "Sokol" },
    { $set: { email: "mia.sokolnovi@gmail.com" } }
)

// =========================
// 3. UPDATE: PLACANJA
// =========================
db["Placanja"].updateOne(
    { iznos: 250.75, status: "Odbijeno" },
    { $set: { status: "Završeno" } }
)

// =========================
// 4. UPDATE: SOBE
// =========================
db["Sobe"].updateOne(
    { broj_sobe: "202" },
    { $set: { status: "Slobodna" } }
)

db["Sobe"].updateMany(
    { status: "Čišćenje" },
    { $set: { status: "Slobodna" } }
)

// =========================
// PROVJERA NAKON UPDATE-A (TEST)
// =========================
db["Dodaci"].find()
db["Gosti"].find()
db["Placanja"].find()
db["Sobe"].find()