/**
 * Authentication routes
 * Handles user registration and login
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../database/db');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user account
 * Request body: { username, email, password }
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = await getDatabase();

    // Check if username or email already exists
    const existingUser = db.data.users.find(
      u => u.username === username || u.email === email
    );

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password before storing (security best practice)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate new user ID
    const newId = db.data.users.length > 0 
      ? Math.max(...db.data.users.map(u => u.id)) + 1 
      : 1;

    // Create new user
    const newUser = {
      id: newId,
      username,
      email,
      password: hashedPassword,
      created_at: new Date().toISOString()
    };

    // Add user to database
    db.data.users.push(newUser);
    await db.write();

    // Generate JWT token for immediate login after registration
    const token = jwt.sign(
      { id: newUser.id, username, email },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: newUser.id, username, email }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

/**
 * POST /api/auth/login
 * Login with existing credentials
 * Request body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = await getDatabase();

    // Find user by email
    const user = db.data.users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare provided password with hashed password in database
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token for authenticated session
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;


