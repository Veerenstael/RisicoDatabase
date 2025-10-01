const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB verbonden'))
.catch((err) => console.error('MongoDB connectie fout:', err));

const riskSchema = new mongoose.Schema({
  riskId: {
    type: String,
    unique: true,
    required: true
  },
  titel: {
    type: String,
    required: true
  },
  omschrijving: {
    type: String,
    required: true
  },
  categorie: {
    type: String,
    enum: ['extern', 'intern'],
    required: true
  },
  kans: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  impact: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  prioriteit: {
    type: Number,
    required: true
  },
  responsstrategie: {
    type: String,
    enum: ['vermijden', 'reduceren', 'overdragen', 'accepteren', 'benutten'],
    required: true
  },
  actiehouder: {
    type: String,
    required: true
  },
  acties: {
    type: String,
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in uitvoering', 'geblokkeerd', 'gesloten'],
    default: 'open',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

riskSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastRisk = await this.constructor.findOne({}, {}, { sort: { 'createdAt': -1 } });
    if (lastRisk && lastRisk.riskId) {
      const lastId = parseInt(lastRisk.riskId.replace('RISK-', ''));
      this.riskId = `RISK-${String(lastId + 1).padStart(4, '0')}`;
    } else {
      this.riskId = 'RISK-0001';
    }
  }
  this.updatedAt = Date.now();
  next();
});

const Risk = mongoose.model('Risk', riskSchema);

app.get('/api/risks', async (req, res) => {
  try {
    const risks = await Risk.find().sort({ createdAt: -1 });
    res.json(risks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/risks/:id', async (req, res) => {
  try {
    const risk = await Risk.findById(req.params.id);
    if (!risk) {
      return res.status(404).json({ message: 'Risico niet gevonden' });
    }
    res.json(risk);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/risks', async (req, res) => {
  const risk = new Risk({
    titel: req.body.titel,
    omschrijving: req.body.omschrijving,
    categorie: req.body.categorie,
    kans: req.body.kans,
    impact: req.body.impact,
    prioriteit: req.body.kans * req.body.impact,
    responsstrategie: req.body.responsstrategie,
    actiehouder: req.body.actiehouder,
    acties: req.body.acties,
    deadline: req.body.deadline,
    status: req.body.status || 'open'
  });

  try {
    const newRisk = await risk.save();
    res.status(201).json(newRisk);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/risks/:id', async (req, res) => {
  try {
    const risk = await Risk.findById(req.params.id);
    if (!risk) {
      return res.status(404).json({ message: 'Risico niet gevonden' });
    }

    Object.keys(req.body).forEach(key => {
      if (key !== 'riskId' && key !== '_id') {
        risk[key] = req.body[key];
      }
    });

    if (req.body.kans && req.body.impact) {
      risk.prioriteit = req.body.kans * req.body.impact;
    }

    const updatedRisk = await risk.save();
    res.json(updatedRisk);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/risks/:id', async (req, res) => {
  try {
    const risk = await Risk.findById(req.params.id);
    if (!risk) {
      return res.status(404).json({ message: 'Risico niet gevonden' });
    }
    await risk.deleteOne();
    res.json({ message: 'Risico verwijderd' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const totalRisks = await Risk.countDocuments();
    const statusCounts = await Risk.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const categorieCounts = await Risk.aggregate([
      { $group: { _id: '$categorie', count: { $sum: 1 } } }
    ]);
    const strategieCounts = await Risk.aggregate([
      { $group: { _id: '$responsstrategie', count: { $sum: 1 } } }
    ]);
    const avgPrioriteit = await Risk.aggregate([
      { $group: { _id: null, avg: { $avg: '$prioriteit' } } }
    ]);

    res.json({
      total: totalRisks,
      byStatus: statusCounts,
      byCategorie: categorieCounts,
      byStrategie: strategieCounts,
      avgPrioriteit: avgPrioriteit[0]?.avg || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server draait op poort ${PORT}`);
});
