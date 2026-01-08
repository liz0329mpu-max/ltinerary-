/**
 * Database initialization and connection
 * Uses lowdb (JSON file-based database) - no compilation needed, pure JavaScript
 */

const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');
const fs = require('fs');

// Database file path - database directory is at project root
const DB_DIR = path.join(__dirname, '../../database');
const DB_PATH = path.join(DB_DIR, 'travel.json');

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Default database structure
const defaultData = {
  users: [],
  itineraries: [],
  attractions: []
};

/**
 * Initialize database connection
 * @returns {Promise<Low>} Database instance
 */
async function initDatabase() {
  try {
    // Create adapter for JSON file
    const adapter = new JSONFile(DB_PATH);
    const db = new Low(adapter, defaultData);

    // Read existing data or use default
    await db.read();
    
    // If database is empty, initialize with default structure
    if (!db.data || Object.keys(db.data).length === 0) {
      db.data = { ...defaultData };
      await db.write();
    }
    
    console.log('Database initialized successfully');
    return db;
  } catch (err) {
    console.error('Error initializing database:', err);
    // Initialize with default data if read fails
    const adapter = new JSONFile(DB_PATH);
    const db = new Low(adapter, defaultData);
    db.data = { ...defaultData };
    await db.write();
    return db;
  }
}

/**
 * Get database instance (singleton pattern)
 */
let dbInstance = null;

async function getDatabase() {
  if (!dbInstance) {
    dbInstance = await initDatabase();
  } else {
    // Ensure data is loaded
    await dbInstance.read();
  }
  return dbInstance;
}

module.exports = { getDatabase, initDatabase };


