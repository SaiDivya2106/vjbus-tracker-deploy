const exp = require('express');
const app = exp();
require('dotenv').config();
const path = require('path');
const cors = require('cors');

// Enable CORS for all routes
app.use(cors());

// Deploy React build to this server
app.use(exp.static(path.join(__dirname, '../../frontend/fe1-complaints/build')));

app.use(exp.json());

const mc = require('mongodb').MongoClient;

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'complaintsdb';

// Attempt to connect to Mongo with retries. Start the HTTP server
// only after a successful connection and after collections are set.
async function connectWithRetry(retries = 10, delayMs = 3000) {
  try {
    const client = await mc.connect(MONGO_URL, { serverSelectionTimeoutMS: 5000 });
    const dbObj = client.db(process.env.DB_NAME || DB_NAME);
    const complaintsCollectionObj = dbObj.collection('complaintsCollection');
    const adminsCollectionObj = dbObj.collection('adminsCollection');
    const flaggedusersCollectionObj = dbObj.collection('flaggedusersCollection');
    const superAdminCollectionObj = dbObj.collection('superAdminCollection');
    app.set('complaintsCollectionObj', complaintsCollectionObj);
    app.set('adminsCollectionObj', adminsCollectionObj);
    app.set('flaggedusersCollectionObj', flaggedusersCollectionObj);
    app.set('superAdminCollectionObj', superAdminCollectionObj);
    console.log('DB connection success');
    startServer();
  } catch (err) {
    console.log('DB connection error:', err && err.message ? err.message : err);
    if (retries > 0) {
      console.log(`Retrying Mongo connection in ${delayMs}ms (${retries} attempts left)`);
      setTimeout(() => connectWithRetry(retries - 1, delayMs), delayMs);
    } else {
      console.log('Could not connect to Mongo after retries. Exiting.');
      process.exit(1);
    }
  }
}

// Start trying to connect immediately
connectWithRetry();

const userApp = require('./APIs/user-api');
const adminApp = require('./APIs/admin-api');

app.use('/user-api', userApp);
app.use('/admin-api', adminApp);

app.get("/health", (req, res) => {
    res.status(200).json({ 
        status: "healthy",
        service: "complaints-be", 
        timestamp: new Date().toISOString()
    });
});

// ✅ React SPA fallback (only for non-API GET requests)
app.get('*', (req, res) => {
  if (!req.originalUrl.startsWith('/user-api') && !req.originalUrl.startsWith('/admin-api')) {
    res.sendFile(path.join(__dirname, '../../frontend/fe1-complaints/build/index.html'));
  } else {
    res.status(404).send({ message: "API route not found" });
  }
});

// Express error handler
app.use((err, req, res, next) => {
  res.send({ message: "error", payload: err.message });
  console.log(err);
});

const port = process.env.PORT || 5000;
// Start the server only after MongoDB connection is ready.
// If Mongo fails to connect, the server won't start which avoids
// handlers running with undefined collection objects.

// If a DB connection is already established above, start immediately.
// Otherwise, start inside the successful connect callback.

let serverStarted = false;

function startServer() {
  if (serverStarted) return;
  serverStarted = true;
  app.listen(port, () => console.log(`Web server running on port ${port}`));
}

// If the DB connection was established earlier, the connect promise
// handler should call startServer. To ensure that happens, wrap the
// connect call to start the server upon success.

// Reconnect: attempt to connect and start if not already started.
// (This mirrors the behavior above; the promise handler will run on success.)

