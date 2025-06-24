require('dotenv').config();  // Load environment variables from .env file
const jwt = require('jsonwebtoken');

// Middleware function to validate JWT token
const authMiddleware = (req, res, next) => {
    // Get token from Authorization header
    const token = req.headers['authorization']?.split(' ')[1];


    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    // Get the secret key from the environment variable
    const secretKey = process.env.JWT_SECRET_KEY;

    if (!secretKey) {
        return res.status(500).json({ message: 'Secret key is not defined' });
    }

    try {
        // Verify the token using the secret key
        const decoded = jwt.verify(token, secretKey);

        // Attach user information (decoded JWT) to the request object
        req.user = decoded;

        // Call the next middleware function
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = authMiddleware;
