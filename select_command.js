
// 1. SVE SOBE
db.Sobe.find()

// 2. SLOBODNE SOBE
db.Sobe.find({ status: "Slobodna" })

// 3. MASAŽE SKUPLJE OD 45
db.Masaze.find({ cijena: { $gt: 45 } })

// 4. RECEPTION / OSOBLJE SA POZICIJOM "MANAGER"
db.Osoblje.find({ pozicija: "Manager" })

// 5. PLAĆANJA GOTOVINOM
db.Placanja.find({ nacin_placanja: "Gotovina" })