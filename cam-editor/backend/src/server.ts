import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import camProfileRoutes from './routes/camProfileRoutes';
import calculationRoutes from './routes/calculationRoutes';
import { createDefaultProfile } from './controllers/camProfileController';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Define port
const PORT = process.env.PORT || 5000;

// In-memory data store (since MongoDB is not available)
console.log('Using in-memory data store instead of MongoDB');

// Create a default profile
createDefaultProfile();

// Routes
app.use('/api/cam-profiles', camProfileRoutes);
app.use('/api/calculations', calculationRoutes);

// Basic route
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to Cam Editor API' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
