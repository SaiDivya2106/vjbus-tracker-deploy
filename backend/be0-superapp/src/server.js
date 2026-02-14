import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getApps, addApp, updateApp, setAppStatus, deleteApp } from './db.js';

dotenv.config();

const app = express();
const PORT = 6102;

app.use(cors({
    origin: ['http://localhost:8081', 'http://localhost:3102', 'http://[IP_ADDRESS]', 'https://anirudh.vjstartup.com', 'http://10.100.16.121:3102'],
    credentials: true
}));
app.use(express.json());

// Get all apps
app.get('/api/apps', async (req, res) => {
    try {
        const apps = await getApps();
        console.log("Fetched apps:", apps.length);
        res.json(apps);
    } catch (error) {
        console.error("Error getting apps:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Add new app
app.post('/api/apps', async (req, res) => {
    try {
        await addApp(req.body);
        console.log("Added app:", req.body);
        res.json({ success: true });
    } catch (error) {
        console.error("Error adding app:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update app
app.put('/api/apps', async (req, res) => {
    try {
        await updateApp(req.body);
        console.log("Updated app:", req.body);
        res.json({ success: true });
    } catch (error) {
        console.error("Error updating app:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update app status
app.post('/api/apps/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { isenabled } = req.body;
        await setAppStatus(id, isenabled);
        console.log(`Updated app ${id} status to:`, isenabled);
        res.json({ success: true });
    } catch (error) {
        console.error("Error updating app status:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete app
app.delete('/api/apps/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await deleteApp(id);
        console.log(`Deleted app with id: ${id}`);
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting app:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
