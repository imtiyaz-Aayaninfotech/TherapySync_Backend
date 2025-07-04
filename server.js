require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to TherapySync Backend API');
});

app.listen(PORT, () => {
  const now = new Date().toLocaleString();
  console.log('\n===========================================================');
  console.log('🧠  TherapySync Backend Server');
  console.log('===========================================================');
  console.log(`🚀 Server is live at: http://localhost:${PORT}`);
  console.log(`✅ MongoDB Connected: ${process.env.MONGODB_URI?.split('@')[1].split('/')[0]}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🕒 Started at: ${now}`);
  console.log('===========================================================\n');
});
