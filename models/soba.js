const mongoose = require('mongoose');

const sobaSchema = new mongoose.Schema({
  broj_sobe: String,
  vrsta_sobe_id: mongoose.Schema.Types.ObjectId,
  status: String,
}, { collection: 'Sobe' });

module.exports = mongoose.model('Soba', sobaSchema);