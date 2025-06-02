import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import allRoutes from './routes/index.js'; // 👈 centralized route import


dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount all routes under /api
app.use('/api', allRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

export default app;
