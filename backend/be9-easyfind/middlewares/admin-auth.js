// middleware/auth.js
const jwt = require('jsonwebtoken');

const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || [];

module.exports = function (req, res, next) {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Decoded admin data:", decoded);

    const email = decoded.email;
    if (!email || !ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({ msg: 'Forbidden: Email not authorized' });
    }

    req.admin = decoded.admin;
    next();
  } catch (err) {
    console.error("❌ Token verification failed:", err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
