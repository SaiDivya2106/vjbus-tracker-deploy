const { OAuth2Client } = require("google-auth-library");

// Replace with your actual Google client ID
const client = new OAuth2Client(
  "522460567146-ubk3ojomopil8f68hl73jt1pj0jbbm68.apps.googleusercontent.com"
);

const verifyGoogleToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience:
        "522460567146-ubk3ojomopil8f68hl73jt1pj0jbbm68.apps.googleusercontent.com", // Same as frontend client ID
    });

    const payload = ticket.getPayload();

    // Attach user info to the request
    req.user = {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };

    next(); // Allow route to proceed
  } catch (error) {
    console.error("Token verification failed:", error.message);
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

module.exports = verifyGoogleToken;
