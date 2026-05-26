const mongoose = require('mongoose');

const rezervacijaSchema = new mongoose.Schema({
  id_gosta: mongoose.Schema.Types.ObjectId,
  id_sobe: mongoose.Schema.Types.ObjectId,
  id_placanja: mongoose.Schema.Types.ObjectId,
  check_in: Date,
  check_out: Date,
  status: String,
  ukupna_cijena: Number,
}, { collection: 'Rezervacije' });

module.exports = mongoose.model('Rezervacija', rezervacijaSchema);

