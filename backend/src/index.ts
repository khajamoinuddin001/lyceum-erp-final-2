import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import dataRoutes from './routes/data';
import aiRoutes from './routes/ai';
import usersRoutes from './routes/users';
import authMiddleware from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // To parse JSON bodies

// Health check endpoint
// FIX: Explicitly type req and res to match express.RequestHandler
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Lyceum Academy API is running!' });
});

// Routes
// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/data', authMiddleware, dataRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/users', authMiddleware, usersRoutes);


// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
