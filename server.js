// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const riskRoutes = require('./routes/risks');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Verbinding maken met MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB verbonden'))
  .catch(err => console.error('MongoDB fout:', err));

// API-routes voor risico's
app.use('/api/risks', riskRoutes);

// Start de server
app.listen(PORT, () => {
  console.log(`Server draait op poort ${PORT}`);
});
