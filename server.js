// Importeren van de benodigde modules
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Laad de .env bestand om gevoelige gegevens zoals MONGO_URI in te stellen
dotenv.config();

// Maak een nieuwe Express applicatie
const app = express();

// Zorg ervoor dat de server JSON data kan ontvangen
app.use(express.json());

// Log het IP-adres van inkomende verzoeken (voor debugging)
app.use((req, res, next) => {
  console.log('Incoming request from IP:', req.ip);  // Log het IP-adres
  next();
});

// Verbind met MongoDB via Mongoose
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('MongoDB verbonden');
  })
  .catch((err) => {
    console.error('MongoDB fout:', err);
  });

// Mongoose schema en model voor risico's
const riskSchema = new mongoose.Schema({
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Risk = mongoose.model('Risk', riskSchema);

// Route om risico's op te halen
app.get('/api/risks', async (req, res) => {
  try {
    const risks = await Risk.find();  // Haal alle risico's op
    res.status(200).json(risks);  // Stuur de risico's als JSON terug
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route om een nieuw risico toe te voegen
app.post('/api/risks', async (req, res) => {
  const newRisk = new Risk({
    description: req.body.description,
  });

  try {
    const savedRisk = await newRisk.save();  // Sla het risico op in de database
    res.status(201).json(savedRisk);  // Stuur het nieuwe risico terug
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Start de server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server draait op poort ${PORT}`);
});
