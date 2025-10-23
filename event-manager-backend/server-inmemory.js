import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import cors from 'cors';
import eventRoutes from './routes/events.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

async function startServer() {
  try {
    // Create in-memory MongoDB server
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    console.log('🔗 Starting in-memory MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected to in-memory MongoDB');

    // Routes
    app.use('/api/events', eventRoutes);

    app.get('/', (req, res) => {
      res.json({ 
        message: 'Event Manager API is running with in-memory MongoDB!',
        note: 'Data will be lost when server restarts'
      });
    });

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log('💾 Using in-memory MongoDB (data resets on restart)');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.disconnect();
      await mongod.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();