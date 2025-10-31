// server.js
// Veerenstael Risk Management – simpele API met Basic Auth (1 gedeeld account)

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// ---------- App setup ----------
const app = express();
app.use(cors()); // pas evt. aan met { origin: ['https://jouwdomein'], credentials:false }
app.use(express.json());

// ---------- Basic Auth (1 gedeelde login) ----------
const ENABLE_BASIC_AUTH = String(process.env.ENABLE_BASIC_AUTH || 'true').toLowerCase() === 'true';
const BASIC_USER = process.env.BASIC_USER || 'veerenstael';
const BASIC_PASS = process.env.BASIC_PASS || 'SterkGedeeldWachtwoordHier';

// middleware vóór alle routes
if (ENABLE_BASIC_AUTH) {
  app.use((req, res, next) => {
    const header = req.headers['authorization'] || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Basic' || !token) {
      res.set('WWW-Authenticate', 'Basic realm="Veerenstael interne tool"');
      return res.status(401).send('Authenticatie vereist');
    }
    const [u, p] = Buffer.from(token, 'base64').toString().split(':');
    if (u === BASIC_USER && p === BASIC_PASS) return next();
    return res.status(401).send('Onjuist');
  });
}

// ---------- Database ----------
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/risks';
mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB verbonden'))
  .catch((err) => console.error('MongoDB connectie fout:', err));

// Flexibel schema: accepteert velden uit de frontend (zonder strikte validatie)
const riskSchema = new mongoose.Schema(
  {
    riskId: { type: String, unique: true, index: true },
    titel: String,
    beschrijving: String,
    status: { type: String, default: 'Nieuw' }, // Nieuw | Open | Gesloten e.d.
    categorie: String,
    strategie: String, // bv. TAO/SAO/… als je dat gebruikt
    eigenaar: String,
    kans: Number,      // 1..5
    impact: Number,    // 1..5
    kleur: String,     // optioneel voor heatmap
    deadline: Date,
    opmerkingen: String,
    // vrij veld voor alles wat je app meestuurt:
    extra: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, strict: false }
);

// Automatische oplopende riskId (RISK-0001, 0002, …)
riskSchema.pre('save', async function (next) {
  if (this.isNew && !this.riskId) {
    const last = await this.constructor.findOne({}).sort({ createdAt: -1 }).select('riskId').lean();
    if (last && last.riskId && /^RISK-\d{4,}$/.test(last.riskId)) {
      const n = parseInt(last.riskId.replace('RISK-', ''), 10) + 1;
      this.riskId = `RISK-${String(n).padStart(4, '0')}`;
    } else {
      this.riskId = 'RISK-0001';
    }
  }
  next();
});

const Risk = mongoose.model('Risk', riskSchema);

// ---------- Routes ----------
const router = express.Router();

// Lijst
router.get('/risks', async (req, res) => {
  const items = await Risk.find({}).sort({ createdAt: -1 }).lean();
  res.json(items);
});

// Aanmaken
router.post('/risks', async (req, res) => {
  try {
    const doc = await Risk.create(req.body);
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Updaten
router.put('/risks/:id', async (req, res) => {
  try {
    const doc = await Risk.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ message: 'Niet gevonden' });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Verwijderen
router.delete('/risks/:id', async (req, res) => {
  try {
    const r = await Risk.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ message: 'Niet gevonden' });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Eenvoudige stats voor tegels/filters/heatmap
router.get('/stats', async (req, res) => {
  const total = await Risk.countDocuments();
  const byStatus = await Risk.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const byCategorie = await Risk.aggregate([{ $group: { _id: '$categorie', count: { $sum: 1 } } }]);
  const byStrategie = await Risk.aggregate([{ $group: { _id: '$strategie', count: { $sum: 1 } } }]);
  res.json({
    total,
    byStatus,
    byCategorie,
    byStrategie,
  });
});

app.use('/api', router);

// ---------- Start ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server draait op poort ${PORT}`));
