const mongoose = require('mongoose');

const gostSchema = new mongoose.Schema({
  ime: String,
  prezime: String,
  email: String,
  id_mjesta: mongoose.Schema.Types.ObjectId,
}, { collection: 'Gosti' });

module.exports = mongoose.model('Gost', gostSchema);