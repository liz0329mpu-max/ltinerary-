/**
 * Main server entry point
 * This file sets up the Express server and connects all routes
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import route handlers
const authRoutes = require('./routes/auth');
const itineraryRoutes = require('./routes/itinerary');
const currencyRoutes = require('./routes/currency');
const aiRoutes = require('./routes/ai');
const { initDatabase } = require('./database/db');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(cors()); // Enable CORS for frontend communication
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// API Routes
app.use('/api/auth', authRoutes); // Authentication routes (register, login)
app.use('/api/itinerary', itineraryRoutes); // Itinerary management routes
app.use('/api/currency', currencyRoutes); // Currency conversion routes
app.use('/api/ai', aiRoutes); // AI assistant routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from client/dist
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  // Handle React routing - return all non-API requests to React app
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Initialize database and start server
(async () => {
  try {
    // Initialize database first
    await initDatabase();
    console.log('Database initialized successfully');
    
    // Start server after database is ready
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
})();


