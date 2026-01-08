/**
 * Authentication middleware
 * Verifies JWT tokens for protected routes
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token from request headers
 * Adds user information to request object if token is valid
 */
const authenticateToken = (req, res, next) => {
  // Get token from Authorization header (format: "Bearer <token>")
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token part

  // If no token provided, return 401 Unauthorized
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Verify token using JWT_SECRET from environment variables
  const jwtSecret = process.env.JWT_SECRET || 'default-secret';
  
  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      // 提供更详细的错误信息以便调试
      console.error('Token verification failed:', err.name, err.message);
      console.log('JWT_SECRET configured:', jwtSecret ? 'Yes' : 'No (using default)');
      
      // 根据错误类型返回不同的错误信息
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ error: 'Token has expired. Please login again.' });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(403).json({ error: 'Invalid token. Please login again.' });
      } else {
        return res.status(403).json({ error: 'Invalid or expired token. Please login again.' });
      }
    }
    
    // Attach user information to request object for use in route handlers
    req.user = user;
    next(); // Continue to next middleware/route handler
  });
};

module.exports = { authenticateToken };


