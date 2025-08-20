const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  // console.log(authHeader)

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1]; // Extract the token after "Bearer"

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify using shared secret
    req.user = decoded; // Attach user payload to the request
    next();
  } catch (err) {
    console.error("❌ Invalid token:", err.message);
    res.status(401).json({ message: "UnAuthorized:Invalid or expired token" });
  }
};

module.exports = auth;
