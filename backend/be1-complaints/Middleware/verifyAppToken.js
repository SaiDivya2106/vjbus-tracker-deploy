const jwt = require("jsonwebtoken");

const verifyAppToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // contains email, name, picture, etc.
    next();
  } catch (error) {
    console.error("App token verification failed:", error.message);
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

module.exports = verifyAppToken;
