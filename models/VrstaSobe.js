const mongoose = require('mongoose');

const vrstaSobeSchema = new mongoose.Schema({
  naziv: String,
  cijena: Number,
  kapacitet: Number,
}, { collection: 'VrstaSobe' });

module.exports = mongoose.model('VrstaSobe', vrstaSobeSchema);