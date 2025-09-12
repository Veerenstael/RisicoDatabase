// routes/risks.js
const express = require('express');
const Risk = require('../models/Risk');
const router = express.Router();

// Voeg een nieuw risico toe
router.post('/', async (req, res) => {
  try {
    const newRisk = new Risk({
      description: req.body.description,
    });
    await newRisk.save();
    res.status(201).json(newRisk);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Haal alle risico's op
router.get('/', async (req, res) => {
  try {
    const risks = await Risk.find();
    res.status(200).json(risks);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
