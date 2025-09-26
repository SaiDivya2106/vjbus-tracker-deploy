require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            "http://localhost:3000", 
            "http://localhost:4000", 
            "http://localhost:6000", 
            "http://localhost:3117",
            "http://localhost:3119",
            "https://dev-auth.vjstartup.com",
            "https://auth.vjstartup.com",
            "https://dev-bus.vjstartup.com",
            "https://dev-wall.vjstartup.com",
            /^https?:\/\/([a-zA-Z0-9-]+\.)?vjstartup\.com/
        ];

        // Check if the origin matches any of the allowed origins
        const isAllowed = allowedOrigins.some((allowedOrigin) => {
            if (allowedOrigin instanceof RegExp) {
                return allowedOrigin.test(origin); // Check with regex for subdomains
            }
            return origin === allowedOrigin;
        });

        

        if (isAllowed || !origin) {
            callback(null, true); // ✅ Allow the request
        } else {
            callback(new Error('Not allowed by CORS'), false); // ❌ Reject the request
        }
    },
    credentials: true   // ✅ Allow cross-origin cookies
}));
app.options("*", cors());
app.use(cookieParser());

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post("/auth/google", async (req, res) => {
    const { token } = req.body;
    console.log("🔍 Debug: Received Google Token =", token);

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        console.log("✅ Google Token Verified:", payload);

        const { email, name, picture, family_name } = payload;

        // ✅ Generate new JWT for internal authentication
        const userToken = jwt.sign(
            { email, name, picture, family_name },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );
        const isLocalhost = req.hostname === 'localhost' || req.hostname.startsWith('127.') || req.hostname === '::1';
        const cookieDomain = isLocalhost ? undefined : '.vjstartup.com'; // no domain needed for localhost
        
        // ✅ Set cookies with correct flags
       // Set userToken cookie
res.cookie("userToken", userToken, {
    domain: cookieDomain,       // ✅ dynamic
    path: "/",
    httpOnly: true,
    secure: !isLocalhost,       // ✅ true if HTTPS (production)
    sameSite: "Lax",
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
  
  // Set user info cookie
  res.cookie("user", JSON.stringify({ email, name, picture, family_name }), {
    domain: cookieDomain,       // ✅ dynamic
    path: "/",
    secure: !isLocalhost,
    sameSite: "Lax",
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
  
        console.log("✅ Cookies Set in Response Headers:", res.getHeaders()['set-cookie']);

        res.json({ token: userToken, user: { email, name, picture ,family_name} });

    } catch (error) {
        console.error("❌ Google Token Verification Failed:", error);
        res.status(401).json({ error: "Invalid Token" });
    }
});





app.get("/check-auth", (req, res) => {
    console.log("🔍 Debug: Received Check-auth ");
    const token = req.cookies.userToken;

    if (!token) {
        return res.json({ logged_in: false });
    }

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ logged_in: true, user });
    } catch (error) {
        res.json({ logged_in: false });
    }
});



app.post("/verify-token", (req, res) => {
    const { token } = req.body; // ✅ Get token from request body
    console.log("🔍 Debug: Received Token for Verification =", token);

    if (!token) return res.status(401).json({ valid: false });

    try {
        // ✅ Verify the token using your secret
        const user = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ Token Verified:", user);
        res.json({ valid: true, user });
    } catch (error) {
        console.error("❌ Token Verification Failed:", error);
        res.status(403).json({ valid: false });
    }
});

app.post("/logout", (req, res) => {
    console.log("🔍 Debug: Logout");

    const isLocalhost = req.hostname === 'localhost' || req.hostname.startsWith('127.') || req.hostname === '::1';
    const cookieDomain = isLocalhost ? undefined : '.vjstartup.com'; // no domain needed for localhost

    // Clear userToken cookie for all subdomains of vjstartup.com
    res.cookie("userToken", "", { 
        domain: cookieDomain,    // ✅ dynamic domain
        path: "/",               // Applies to the entire domain
        expires: new Date(0),    // Set expiry date in the past to delete the cookie
        httpOnly: true,          // Secure the cookie from JavaScript access
        secure: !isLocalhost,    // ✅ true if HTTPS (production)
        sameSite: "Lax"          // Set appropriate SameSite policy
    });

    // Optionally, clear the 'user' cookie as well
    res.cookie("user", "", { 
        domain: cookieDomain,    // ✅ dynamic domain
        path: "/", 
        expires: new Date(0),
        secure: !isLocalhost,    // ✅ true if HTTPS (production)
        sameSite: "Lax"
    });

    res.json({ success: true });
});


app.listen(3115, () => console.log("Auth Server running on port 3115"));
