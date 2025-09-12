// models/Risk.js
const mongoose = require('mongoose');

const riskSchema = new mongoose.Schema({
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Risk = mongoose.model('Risk', riskSchema);

module.exports = Risk;
