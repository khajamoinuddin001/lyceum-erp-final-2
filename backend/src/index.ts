
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth';
import dataRoutes from './routes/data';
import aiRoutes from './routes/ai';
import usersRoutes from './routes/users';
import authMiddleware from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 4000;

// --- Core Middleware ---
app.use(helmet()); // Set security-related HTTP headers
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // To parse JSON bodies

// --- Health Check Endpoint ---
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Lyceum Academy API is running!' });
});

// --- Routes ---
// Public routes (rate limiting is applied within the auth router)
app.use('/api/auth', authRoutes);

// Protected routes (authentication is required)
app.use('/api/data', authMiddleware, dataRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/users', authMiddleware, usersRoutes);

// --- Error Handling Middleware ---
// This must be the last piece of middleware added
app.use(errorHandler);

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
