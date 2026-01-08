/**
 * Itinerary management routes
 * Handles CRUD operations for travel itineraries and attractions
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getDatabase } = require('../database/db');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/itinerary
 * Get all itineraries for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    // Fetch all itineraries for the current user
    const itineraries = db.data.itineraries
      .filter(it => it.user_id === req.user.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(itineraries);
  } catch (error) {
    console.error('Error fetching itineraries:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/itinerary/:id
 * Get a specific itinerary with all its attractions
 */
router.get('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const itineraryId = parseInt(req.params.id);

    // First, get the itinerary
    const itinerary = db.data.itineraries.find(
      it => it.id === itineraryId && it.user_id === req.user.id
    );

    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    // Then, get all attractions for this itinerary
    const attractions = db.data.attractions
      .filter(att => att.itinerary_id === itineraryId)
      .sort((a, b) => {
        if (a.visit_date && b.visit_date) {
          const dateCompare = a.visit_date.localeCompare(b.visit_date);
          if (dateCompare !== 0) return dateCompare;
          return (a.visit_time || '').localeCompare(b.visit_time || '');
        }
        return 0;
      });

    // Combine itinerary with its attractions
    res.json({
      ...itinerary,
      attractions
    });
  } catch (error) {
    console.error('Error fetching itinerary:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/itinerary
 * Create a new itinerary
 * Request body: { title, description, start_date, end_date, cover_image }
 */
router.post('/', async (req, res) => {
  try {
    const { title, description, start_date, end_date, cover_image } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const db = await getDatabase();

    // Generate new itinerary ID
    const newId = db.data.itineraries.length > 0 
      ? Math.max(...db.data.itineraries.map(it => it.id)) + 1 
      : 1;

    // Create new itinerary
    const newItinerary = {
      id: newId,
      user_id: req.user.id,
      title,
      description: description || null,
      start_date: start_date || null,
      end_date: end_date || null,
      cover_image: cover_image || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add itinerary to database
    db.data.itineraries.push(newItinerary);
    await db.write();

    res.status(201).json(newItinerary);
  } catch (error) {
    console.error('Error creating itinerary:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PUT /api/itinerary/:id
 * Update an existing itinerary
 */
router.put('/:id', async (req, res) => {
  try {
    const { title, description, start_date, end_date, cover_image } = req.body;
    const itineraryId = parseInt(req.params.id);

    const db = await getDatabase();

    // First verify the itinerary belongs to the user
    const itinerary = db.data.itineraries.find(
      it => it.id === itineraryId && it.user_id === req.user.id
    );

    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    // Update the itinerary
    if (title !== undefined) itinerary.title = title;
    if (description !== undefined) itinerary.description = description;
    if (start_date !== undefined) itinerary.start_date = start_date;
    if (end_date !== undefined) itinerary.end_date = end_date;
    if (cover_image !== undefined) itinerary.cover_image = cover_image;
    itinerary.updated_at = new Date().toISOString();

    await db.write();

    res.json(itinerary);
  } catch (error) {
    console.error('Error updating itinerary:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * DELETE /api/itinerary/:id
 * Delete an itinerary (cascades to delete all attractions)
 */
router.delete('/:id', async (req, res) => {
  try {
    const itineraryId = parseInt(req.params.id);
    const db = await getDatabase();

    // Verify ownership before deleting
    const itinerary = db.data.itineraries.find(
      it => it.id === itineraryId && it.user_id === req.user.id
    );

    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    // Delete the itinerary
    db.data.itineraries = db.data.itineraries.filter(it => it.id !== itineraryId);
    
    // Delete all attractions for this itinerary (CASCADE)
    db.data.attractions = db.data.attractions.filter(att => att.itinerary_id !== itineraryId);

    await db.write();

    res.json({ message: 'Itinerary deleted successfully' });
  } catch (error) {
    console.error('Error deleting itinerary:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/itinerary/:id/attraction
 * Add an attraction to an itinerary
 * Request body: { name, description, latitude, longitude, address, visit_date, visit_time }
 */
router.post('/:id/attraction', async (req, res) => {
  try {
    const itineraryId = parseInt(req.params.id);
    const { name, description, latitude, longitude, address, visit_date, visit_time, image } = req.body;

    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Name, latitude, and longitude are required' });
    }

    const db = await getDatabase();

    // Verify itinerary ownership
    const itinerary = db.data.itineraries.find(
      it => it.id === itineraryId && it.user_id === req.user.id
    );

    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    // Generate new attraction ID
    const newId = db.data.attractions.length > 0 
      ? Math.max(...db.data.attractions.map(att => att.id)) + 1 
      : 1;

    // Create new attraction
    const newAttraction = {
      id: newId,
      itinerary_id: itineraryId,
      name,
      description: description || null,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address: address || null,
      visit_date: visit_date || null,
      visit_time: visit_time || null,
      image: image || null,
      created_at: new Date().toISOString()
    };

    // Add attraction to database
    db.data.attractions.push(newAttraction);
    await db.write();

    res.status(201).json(newAttraction);
  } catch (error) {
    console.error('Error adding attraction:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * DELETE /api/itinerary/:itineraryId/attraction/:attractionId
 * Remove an attraction from an itinerary
 */
router.delete('/:itineraryId/attraction/:attractionId', async (req, res) => {
  try {
    const itineraryId = parseInt(req.params.itineraryId);
    const attractionId = parseInt(req.params.attractionId);
    const db = await getDatabase();

    // Verify itinerary ownership
    const itinerary = db.data.itineraries.find(
      it => it.id === itineraryId && it.user_id === req.user.id
    );

    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    // Delete the attraction
    db.data.attractions = db.data.attractions.filter(
      att => !(att.id === attractionId && att.itinerary_id === itineraryId)
    );

    await db.write();

    res.json({ message: 'Attraction deleted successfully' });
  } catch (error) {
    console.error('Error deleting attraction:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


