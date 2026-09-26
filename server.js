import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/dbconnect.js';
import { seedDatabase } from './data/seedData.js';
import voiceRoutes from './routes/voiceRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Connect Database & Seed Data
connectDB().then(() => {
  seedDatabase();
});

// API Routes
app.use('/api/voice', voiceRoutes);
app.use('/api/admin', adminRoutes);

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 AJAY-VANI Government Web Portal Server is RUNNING!`);
  console.log(`🌐 Official Portal URL: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
