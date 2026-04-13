const exp = require('express');
const app = exp();
require('dotenv').config();
const path = require('path');
const cors = require('cors');
app.use(cors({
  origin: "http://localhost:3000", // 👈 exact origin
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));


// Deploy React build to this server
app.use(exp.static(path.join(__dirname, '../../frontend/fe1-complaints/build')));

app.use(exp.json());

const isExperimental = require('./utils/isExperimental');
const demoDb = require('./demo/demoDatabase');
const mc = require('mongodb').MongoClient;

if (isExperimental) {
  console.log("⚠️ STARTING IN EXPERIMENTAL (DEMO) MODE ⚠️");
  console.log("No real database connection. Data is in-memory only.");

  const complaintsCollectionObj = demoDb.collection('complaintsCollection');
  const adminsCollectionObj = demoDb.collection('adminsCollection');
  const flaggedusersCollectionObj = demoDb.collection('flaggedusersCollection');
  const superAdminCollectionObj = demoDb.collection('superAdminCollection');
  const assistantsCollectionObj = demoDb.collection('assistantsCollection');

  app.set('complaintsCollectionObj', complaintsCollectionObj);
  app.set('adminsCollectionObj', adminsCollectionObj);
  app.set('flaggedusersCollectionObj', flaggedusersCollectionObj);
  app.set('superAdminCollectionObj', superAdminCollectionObj);
  app.set('assistantsCollectionObj', assistantsCollectionObj);

  console.log('✅ Demo DB initialized');

  // Weekly Reset Logic (Simulated with 1-hour interval check or just run on startup)
  // For demo purposes, we can also expose an endpoint or just rely on server restarts.
  // But per requirements: "Weekly Data Reset".

  const RESET_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days
  let lastReset = Date.now();

  setInterval(() => {
    const now = Date.now();
    if (now - lastReset > RESET_INTERVAL) {
      demoDb.resetData();
      lastReset = now;
      console.log("♻️ Weekly Demo Data Reset Triggered");
    }
  }, 60 * 60 * 1000); // Check every hour

} else {
  // REAL PRODUCTION MODE
  mc.connect('mongodb://127.0.0.1:27017')
    .then(client => {
      const dbObj = client.db(process.env.DB_NAME);
      const complaintsCollectionObj = dbObj.collection('complaintsCollection');
      const adminsCollectionObj = dbObj.collection('adminsCollection');
      const flaggedusersCollectionObj = dbObj.collection('flaggedusersCollection');
      const superAdminCollectionObj = dbObj.collection('superAdminCollection')
      const assistantsCollectionObj = dbObj.collection('assistantCollection'); // New collection for assistants
      app.set('complaintsCollectionObj', complaintsCollectionObj);
      app.set('adminsCollectionObj', adminsCollectionObj);
      app.set('flaggedusersCollectionObj', flaggedusersCollectionObj);
      app.set('superAdminCollectionObj', superAdminCollectionObj);
      app.set('assistantsCollectionObj', assistantsCollectionObj);
      console.log('DB connection success');

      const reminderCron = require("./cron/reminderCron");

      // Start cron scheduler
      reminderCron(
        complaintsCollectionObj,
        adminsCollectionObj
      );
    })
    .catch(err => {
      console.log("DB connection error: ", err);
    });
}



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
app.listen(port, () => console.log(`Web server running on port ${port}`));
