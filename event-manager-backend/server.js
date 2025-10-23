import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import eventRoutes from './routes/events.js';
import Event from './models/Event.js';

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection - Connect to your local MongoDB
const MONGODB_URI = 'mongodb+srv://geddanarendra2_db_user:jagan1234@cluster0.yuwrp2i.mongodb.net/eventlogger?retryWrites=true&w=majority';

console.log('🔗 Connecting to MongoDB at:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Successfully connected to MongoDB');
    console.log('📊 Database: eventmanager');
    console.log('🌐 You can view your data in MongoDB Compass');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('💡 Make sure MongoDB is running on localhost:27017');
    process.exit(1);
  });

// Routes
app.use('/api/events', eventRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Event Manager API is running!',
    database: 'MongoDB (localhost)',
    endpoints: {
      events: '/api/events',
      health: '/api/health'
    }
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'OK', 
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('📋 Check health: http://localhost:5000/api/health');
});