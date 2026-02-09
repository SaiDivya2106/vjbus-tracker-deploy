const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const sseClients = new Map(); // email => Set<res>

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const STARS_FILE = path.join(DATA_DIR, 'stars.json');
const ACTIVITIES_DIR = path.join(DATA_DIR, 'activities');
const COMMENTS_DIR = path.join(DATA_DIR, 'comments');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');

async function ensureDataDirectory() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
  
  // Ensure activities and comments directories exist
  try {
    await fs.access(ACTIVITIES_DIR);
  } catch {
    await fs.mkdir(ACTIVITIES_DIR, { recursive: true });
  }
  
  try {
    await fs.access(COMMENTS_DIR);
  } catch {
    await fs.mkdir(COMMENTS_DIR, { recursive: true });
  }

  // Ensure notifications file exists
  try {
    await fs.access(NOTIFICATIONS_FILE);
  } catch {
    await fs.writeFile(NOTIFICATIONS_FILE, JSON.stringify({}, null, 2), 'utf8');
  }
}

// Helper function to read users.json
async function readUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { managers: [], mous: {} };
  }
}

// ======= Notifications helpers =======
async function readNotifications() {
  try {
    const data = await fs.readFile(NOTIFICATIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

async function writeNotifications(payload) {
  await fs.writeFile(NOTIFICATIONS_FILE, JSON.stringify(payload, null, 2), 'utf8');
}

function makeNotificationId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function getRecipientsForMou(prefix, excludeEmail) {
  const usersData = await readUsers();
  const recipients = new Set();
  if (Array.isArray(usersData.managers)) {
    usersData.managers.forEach(m => recipients.add(m));
  }
  if (usersData.mous && usersData.mous[prefix] && Array.isArray(usersData.mous[prefix].spocs)) {
    usersData.mous[prefix].spocs.forEach(s => recipients.add(s));
  }
  if (excludeEmail) recipients.delete(excludeEmail);
  return Array.from(recipients);
}

async function addNotifications(recipients, notif) {
  if (!Array.isArray(recipients) || recipients.length === 0) return;
  const all = await readNotifications();
  for (const email of recipients) {
    const list = Array.isArray(all[email]) ? all[email] : [];
    const item = { ...notif, id: makeNotificationId(), read: false };
    list.unshift(item);
    // keep last 200 per user
    all[email] = list.slice(0, 200);

    // Broadcast to SSE clients
    const subs = sseClients.get(email);
    if (subs && subs.size) {
      const payload = JSON.stringify({ type: 'new', notification: item });
      for (const res of subs) {
        res.write(`data: ${payload}\n\n`);
      }
    }
  }
  await writeNotifications(all);
}
// SSE notifications stream
app.get('/api/notifications/stream', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Set headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders && res.flushHeaders();

    // Register client
    let set = sseClients.get(email);
    if (!set) { set = new Set(); sseClients.set(email, set); }
    set.add(res);

    // Send initial unreadCount
    const all = await readNotifications();
    const list = Array.isArray(all[email]) ? all[email] : [];
    const unreadCount = list.filter(n => !n.read).length;
    res.write(`data: ${JSON.stringify({ type: 'init', unreadCount })}\n\n`);

    // Heartbeat
    const heart = setInterval(() => {
      if (!res.writableEnded) {
        res.write(`: keep-alive\n\n`);
      }
    }, 30000);

    // Cleanup on close
    req.on('close', () => {
      clearInterval(heart);
      const clients = sseClients.get(email);
      if (clients) {
        clients.delete(res);
        if (clients.size === 0) sseClients.delete(email);
      }
    });
  } catch (error) {
    console.error('SSE error:', error);
    try { res.end(); } catch {}
  }
});

async function getMouTitle(prefix) {
  try {
    // Prefer meta title
    const metaPath = path.join(DATA_DIR, `${prefix}.meta.json`);
    const metaContent = await fs.readFile(metaPath, 'utf8');
    const meta = JSON.parse(metaContent);
    if (meta && meta.title) return meta.title;
  } catch {}
  try {
    // Fallback to JSON name/partner fields
    const jsonPath = path.join(DATA_DIR, `${prefix}.json`);
    const content = await fs.readFile(jsonPath, 'utf8');
    const data = JSON.parse(content);
    return (
      data.title || data.partner_name || (data.partner_institution && data.partner_institution.name) || prefix
    );
  } catch {}
  return prefix;
}

// Helper function to read stars.json
async function readStars() {
  try {
    const data = await fs.readFile(STARS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

// Helper function to write stars.json
async function writeStars(stars) {
  await fs.writeFile(STARS_FILE, JSON.stringify(stars, null, 2), 'utf8');
}

// Helper function to get user role
function getUserRole(email, usersData) {
  if (!email || !usersData) return 'viewer';
  
  // Check if manager
  if (usersData.managers && usersData.managers.includes(email)) {
    return 'manager';
  }
  
  // Check if SPOC for any MoU
  if (usersData.mous) {
    for (const mouId in usersData.mous) {
      if (usersData.mous[mouId].spocs && usersData.mous[mouId].spocs.includes(email)) {
        return 'spoc';
      }
    }
  }
  
  return 'viewer';
}

// Helper function to get SPOCs MoUs
function getSpocMous(email, usersData) {
  if (!email || !usersData || !usersData.mous) return [];
  
  const spocMous = [];
  for (const mouId in usersData.mous) {
    if (usersData.mous[mouId].spocs && usersData.mous[mouId].spocs.includes(email)) {
      spocMous.push(mouId);
    }
  }
  return spocMous;
}

// Serve static PDF files
app.use('/files', express.static(DATA_DIR));
// Serve activity attachments directly
app.use('/files/activities', express.static(ACTIVITIES_DIR));

// Serve PDF directly
app.get('/api/pdf/:prefix', async (req, res) => {
  try {
    const { prefix } = req.params;
    const pdfPath = path.join(DATA_DIR, `${prefix}.pdf`);
    
    // Check if file exists
    await fs.access(pdfPath);
    
    // Set proper headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    
    // Send the file
    res.sendFile(pdfPath);
  } catch (error) {
    console.error('PDF fetch error:', error);
    res.status(404).json({ error: 'PDF not found' });
  }
});

// Upload endpoint (supports file upload or pasted text)
app.post('/api/upload', upload.fields([
  { name: 'jsonFile', maxCount: 1 },
  { name: 'mdFile', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const { prefix, jsonText, mdText, title } = req.body;
    
    if (!prefix) {
      return res.status(400).json({ error: 'Prefix name is required' });
    }

    // Validate prefix (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(prefix)) {
      return res.status(400).json({ 
        error: 'Prefix must contain only letters, numbers, and underscores' 
      });
    }

    const files = req.files || {};
    const hasJsonInput = (files.jsonFile && files.jsonFile[0]) || (jsonText && jsonText.trim().length > 0);
    const hasMdInput = (files.mdFile && files.mdFile[0]) || (mdText && mdText.trim().length > 0);
    const hasPdfInput = files.pdfFile && files.pdfFile[0];
    
    if (!hasJsonInput && !hasMdInput && !hasPdfInput) {
      return res.status(400).json({ error: 'Provide at least one of JSON, Markdown, or PDF' });
    }

    await ensureDataDirectory();

    const savedFiles = [];
    
    // Save title as metadata if provided
    if (title && title.trim()) {
      const metaPath = path.join(DATA_DIR, `${prefix}.meta.json`);
      await fs.writeFile(metaPath, JSON.stringify({ title: title.trim() }, null, 2), 'utf8');
    }

    // Save JSON (file has priority over text if both provided)
    if (hasJsonInput) {
      let jsonContent;
      if (files.jsonFile && files.jsonFile[0]) {
        jsonContent = files.jsonFile[0].buffer.toString('utf8');
      } else {
        jsonContent = String(jsonText);
      }

      // Validate JSON
      try {
        JSON.parse(jsonContent);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON content' });
      }

      const jsonFilePath = path.join(DATA_DIR, `${prefix}.json`);
      await fs.writeFile(jsonFilePath, jsonContent, 'utf8');
      savedFiles.push(`${prefix}.json`);
    }

    // Save Markdown (file has priority over text if both provided)
    if (hasMdInput) {
      let mdContent;
      if (files.mdFile && files.mdFile[0]) {
        mdContent = files.mdFile[0].buffer.toString('utf8');
      } else {
        mdContent = String(mdText);
      }
      const mdFilePath = path.join(DATA_DIR, `${prefix}.md`);
      await fs.writeFile(mdFilePath, mdContent, 'utf8');
      savedFiles.push(`${prefix}.md`);
    }

    // Save PDF file
    if (hasPdfInput) {
      const pdfFile = files.pdfFile[0];
      const pdfFilePath = path.join(DATA_DIR, `${prefix}.pdf`);
      await fs.writeFile(pdfFilePath, pdfFile.buffer);
      savedFiles.push(`${prefix}.pdf`);
    }

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      files: savedFiles
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Update existing MoU (update JSON and/or Markdown individually via file or pasted text)
app.put('/api/mou/:prefix', upload.fields([
  { name: 'jsonFile', maxCount: 1 },
  { name: 'mdFile', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const { prefix } = req.params;
    const { jsonText, mdText, title } = req.body;
    const files = req.files || {};

    await ensureDataDirectory();

    const updates = { updatedJson: false, updatedMd: false, updatedPdf: false, updatedTitle: false };
    
    // Update title if provided
    if (title !== undefined && title !== null) {
      const metaPath = path.join(DATA_DIR, `${prefix}.meta.json`);
      if (title.trim()) {
        await fs.writeFile(metaPath, JSON.stringify({ title: title.trim() }, null, 2), 'utf8');
        updates.updatedTitle = true;
      } else {
        // Delete meta file if title is empty
        try {
          await fs.unlink(metaPath);
          updates.updatedTitle = true;
        } catch (e) {
          // Meta file doesn't exist, that's fine
        }
      }
    }

    // Update JSON if provided
    const hasJsonInput = (files.jsonFile && files.jsonFile[0]) || (jsonText && jsonText.trim().length > 0);
    if (hasJsonInput) {
      let jsonContent;
      if (files.jsonFile && files.jsonFile[0]) {
        jsonContent = files.jsonFile[0].buffer.toString('utf8');
      } else {
        jsonContent = String(jsonText);
      }

      try {
        JSON.parse(jsonContent);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON content' });
      }

      const jsonFilePath = path.join(DATA_DIR, `${prefix}.json`);
      await fs.writeFile(jsonFilePath, jsonContent, 'utf8');
      updates.updatedJson = true;
    }

    // Update Markdown if provided
    const hasMdInput = (files.mdFile && files.mdFile[0]) || (mdText && mdText.trim().length > 0);
    if (hasMdInput) {
      let mdContent;
      if (files.mdFile && files.mdFile[0]) {
        mdContent = files.mdFile[0].buffer.toString('utf8');
      } else {
        mdContent = String(mdText);
      }
      const mdFilePath = path.join(DATA_DIR, `${prefix}.md`);
      await fs.writeFile(mdFilePath, mdContent, 'utf8');
      updates.updatedMd = true;
    }

    // Update PDF if provided
    const hasPdfInput = files.pdfFile && files.pdfFile[0];
    if (hasPdfInput) {
      const pdfFile = files.pdfFile[0];
      const pdfFilePath = path.join(DATA_DIR, `${prefix}.pdf`);
      await fs.writeFile(pdfFilePath, pdfFile.buffer);
      updates.updatedPdf = true;
    }

    if (!updates.updatedJson && !updates.updatedMd && !updates.updatedPdf && !updates.updatedTitle) {
      return res.status(400).json({ error: 'No updates provided. Send JSON, Markdown, PDF, or title.' });
    }

    res.json({ success: true, message: 'MoU updated successfully', ...updates });

  } catch (error) {
    console.error('Error updating MoU:', error);
    res.status(500).json({ error: 'Failed to update MoU' });
  }
});

// Get list of all MoUs
app.get('/api/mous', async (req, res) => {
  try {
    await ensureDataDirectory();
    const files = await fs.readdir(DATA_DIR);
    
    // Group files by prefix
    const mouMap = new Map();
    
    files.forEach(file => {
      const ext = path.extname(file);
      const basename = path.basename(file, ext);
      
      // Skip .meta.json files in grouping
      if (file.endsWith('.meta.json')) return;
      
      const prefix = basename;
      
      if (!mouMap.has(prefix)) {
        mouMap.set(prefix, { prefix, hasJson: false, hasMd: false, hasPdf: false, title: null });
      }
      
      if (ext === '.json') {
        mouMap.get(prefix).hasJson = true;
      } else if (ext === '.md') {
        mouMap.get(prefix).hasMd = true;
      } else if (ext === '.pdf') {
        mouMap.get(prefix).hasPdf = true;
      }
    });

    // Load titles from metadata files and JSON data
    for (const [prefix, mou] of mouMap.entries()) {
      try {
        const metaPath = path.join(DATA_DIR, `${prefix}.meta.json`);
        const metaContent = await fs.readFile(metaPath, 'utf8');
        const meta = JSON.parse(metaContent);
        mou.title = meta.title || null;
      } catch (e) {
        // No metadata file, that's fine
      }
      
      // Load JSON data for display in list
      if (mou.hasJson) {
        try {
          const jsonPath = path.join(DATA_DIR, `${prefix}.json`);
          const jsonContent = await fs.readFile(jsonPath, 'utf8');
          mou.data = JSON.parse(jsonContent);
        } catch (e) {
          console.error(`Error loading JSON for ${prefix}:`, e);
          mou.data = null;
        }
      }
    }

    const mous = Array.from(mouMap.values());
    res.json(mous);

  } catch (error) {
    console.error('Error listing MoUs:', error);
    res.status(500).json({ error: 'Failed to list MoUs' });
  }
});

// Get specific MoU files
app.get('/api/mou/:prefix', async (req, res) => {
  try {
    const { prefix } = req.params;
    const jsonPath = path.join(DATA_DIR, `${prefix}.json`);
    const mdPath = path.join(DATA_DIR, `${prefix}.md`);
    const pdfPath = path.join(DATA_DIR, `${prefix}.pdf`);
    const metaPath = path.join(DATA_DIR, `${prefix}.meta.json`);

    const result = { prefix };

    try {
      const jsonContent = await fs.readFile(jsonPath, 'utf8');
      result.json = JSON.parse(jsonContent);
    } catch (e) {
      result.json = null;
    }

    try {
      result.md = await fs.readFile(mdPath, 'utf8');
    } catch (e) {
      result.md = null;
    }

    try {
      await fs.access(pdfPath);
      result.pdfUrl = `/api/pdf/${prefix}`;
    } catch (e) {
      result.pdfUrl = null;
    }

    try {
      const metaContent = await fs.readFile(metaPath, 'utf8');
      const meta = JSON.parse(metaContent);
      result.title = meta.title || null;
    } catch (e) {
      result.title = null;
    }

    if (!result.json && !result.md && !result.pdfUrl) {
      return res.status(404).json({ error: 'MoU not found' });
    }

    res.json(result);

  } catch (error) {
    console.error('Error fetching MoU:', error);
    res.status(500).json({ error: 'Failed to fetch MoU' });
  }
});

// Delete MoU
app.delete('/api/mou/:prefix', async (req, res) => {
  try {
    const { prefix } = req.params;
    const jsonPath = path.join(DATA_DIR, `${prefix}.json`);
    const mdPath = path.join(DATA_DIR, `${prefix}.md`);
    const pdfPath = path.join(DATA_DIR, `${prefix}.pdf`);
    const metaPath = path.join(DATA_DIR, `${prefix}.meta.json`);

    const deletedFiles = [];

    try {
      await fs.unlink(jsonPath);
      deletedFiles.push(`${prefix}.json`);
    } catch (e) {
      // File doesn't exist
    }

    try {
      await fs.unlink(mdPath);
      deletedFiles.push(`${prefix}.md`);
    } catch (e) {
      // File doesn't exist
    }

    try {
      await fs.unlink(pdfPath);
      deletedFiles.push(`${prefix}.pdf`);
    } catch (e) {
      // File doesn't exist
    }

    try {
      await fs.unlink(metaPath);
      deletedFiles.push(`${prefix}.meta.json`);
    } catch (e) {
      // File doesn't exist
    }

    if (deletedFiles.length === 0) {
      return res.status(404).json({ error: 'MoU not found' });
    }

    res.json({
      success: true,
      message: 'MoU deleted successfully',
      deletedFiles
    });

  } catch (error) {
    console.error('Error deleting MoU:', error);
    res.status(500).json({ error: 'Failed to delete MoU' });
  }
});

// ============ AUTH & USER ENDPOINTS ============

// Get users data (for role checking in frontend)
app.get('/api/users', async (req, res) => {
  try {
    const usersData = await readUsers();
    res.json(usersData);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get user role and access
app.get('/api/auth/user', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const usersData = await readUsers();
    const role = getUserRole(email, usersData);
    const spocMous = role === 'spoc' ? getSpocMous(email, usersData) : [];
    
    res.json({
      email,
      role,
      spocMous
    });
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
});

// ============ DASHBOARD ENDPOINTS ============

// Get dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const usersData = await readUsers();
    const role = getUserRole(email, usersData);
    const files = await fs.readdir(DATA_DIR);
    
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.endsWith('.meta.json') && f !== 'users.json' && f !== 'stars.json');
    
    // Filter MoUs based on role
    let relevantMous = jsonFiles;
    if (role === 'spoc') {
      const spocMous = getSpocMous(email, usersData);
      relevantMous = jsonFiles.filter(f => {
        const prefix = f.replace('.json', '');
        return spocMous.includes(prefix);
      });
    }
    
    let active = 0;
    let expired = 0;
    
    for (const file of relevantMous) {
      try {
        const content = await fs.readFile(path.join(DATA_DIR, file), 'utf8');
        const data = JSON.parse(content);
        
        const endDate = data.end_date || data.mou_end_date;
        if (endDate) {
          const expiry = new Date(endDate);
          const today = new Date();
          if (expiry >= today) {
            active++;
          } else {
            expired++;
          }
        } else {
          active++; // No end date means active
        }
      } catch (e) {
        // Skip invalid JSON files
      }
    }
    
    res.json({
      total: relevantMous.length,
      active,
      expired,
      totalActivities: 0, // TODO: Calculate from activities files
      monthActivities: 0   // TODO: Calculate from activities files
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: 'Failed to get dashboard statistics' });
  }
});

// Get expiring MoUs
app.get('/api/dashboard/expiring', async (req, res) => {
  try {
    const { email, days = 30 } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const usersData = await readUsers();
    const role = getUserRole(email, usersData);
    const files = await fs.readdir(DATA_DIR);
    
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.endsWith('.meta.json') && f !== 'users.json' && f !== 'stars.json');
    
    // Filter MoUs based on role
    let relevantMous = jsonFiles;
    if (role === 'spoc') {
      const spocMous = getSpocMous(email, usersData);
      relevantMous = jsonFiles.filter(f => {
        const prefix = f.replace('.json', '');
        return spocMous.includes(prefix);
      });
    }
    
    const expiringMous = [];
    const today = new Date();
    const thresholdDate = new Date(today);
    thresholdDate.setDate(thresholdDate.getDate() + parseInt(days));
    
    for (const file of relevantMous) {
      try {
        const prefix = file.replace('.json', '');
        const content = await fs.readFile(path.join(DATA_DIR, file), 'utf8');
        const data = JSON.parse(content);
        
        const endDate = data.end_date || data.mou_end_date;
        if (endDate) {
          const expiry = new Date(endDate);
          if (expiry >= today && expiry <= thresholdDate) {
            // Load title from meta file
            let title = data.title || prefix;
            try {
              const metaPath = path.join(DATA_DIR, `${prefix}.meta.json`);
              const metaContent = await fs.readFile(metaPath, 'utf8');
              const meta = JSON.parse(metaContent);
              if (meta.title) title = meta.title;
            } catch (e) {
              // No meta file, use data title or prefix
            }
            
            expiringMous.push({
              prefix,
              title,
              end_date: endDate,
              mou_end_date: endDate
            });
          }
        }
      } catch (e) {
        // Skip invalid JSON files
      }
    }
    
    res.json(expiringMous);
  } catch (error) {
    console.error('Error getting expiring MoUs:', error);
    res.status(500).json({ error: 'Failed to get expiring MoUs' });
  }
});

// Get recent activities
app.get('/api/dashboard/recent-activities', async (req, res) => {
  try {
    const { email, limit = 5 } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // TODO: Implement when activities are added
    res.json([]);
  } catch (error) {
    console.error('Error getting recent activities:', error);
    res.status(500).json({ error: 'Failed to get recent activities' });
  }
});

// ============ NOTIFICATIONS ENDPOINTS ============

// Get notifications for a user
app.get('/api/notifications', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    await ensureDataDirectory();
    const all = await readNotifications();
    const list = Array.isArray(all[email]) ? all[email] : [];
    const unreadCount = list.filter(n => !n.read).length;
    res.json({ notifications: list, unreadCount });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Mark specific notifications as read
app.post('/api/notifications/mark-read', async (req, res) => {
  try {
    const { email, ids } = req.body || {};
    if (!email || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Email and ids[] are required' });
    }
    const all = await readNotifications();
    const list = Array.isArray(all[email]) ? all[email] : [];
    const setIds = new Set(ids);
    all[email] = list.map(n => (setIds.has(n.id) ? { ...n, read: true } : n));
    await writeNotifications(all);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notifications read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// Mark all notifications as read
app.post('/api/notifications/mark-all-read', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const all = await readNotifications();
    const list = Array.isArray(all[email]) ? all[email] : [];
    all[email] = list.map(n => ({ ...n, read: true }));
    await writeNotifications(all);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// ============ STAR/FAVORITE ENDPOINTS ============

// Star a MoU
app.post('/api/mous/:prefix/star', async (req, res) => {
  try {
    const { prefix } = req.params;
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const stars = await readStars();
    if (!stars[email]) {
      stars[email] = [];
    }
    
    if (!stars[email].includes(prefix)) {
      stars[email].push(prefix);
      await writeStars(stars);
    }
    
    res.json({ success: true, starred: true });
  } catch (error) {
    console.error('Error starring MoU:', error);
    res.status(500).json({ error: 'Failed to star MoU' });
  }
});

// Unstar a MoU
app.delete('/api/mous/:prefix/star', async (req, res) => {
  try {
    const { prefix } = req.params;
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const stars = await readStars();
    if (stars[email]) {
      stars[email] = stars[email].filter(p => p !== prefix);
      await writeStars(stars);
    }
    
    res.json({ success: true, starred: false });
  } catch (error) {
    console.error('Error unstarring MoU:', error);
    res.status(500).json({ error: 'Failed to unstar MoU' });
  }
});

// Get starred MoUs
app.get('/api/mous/starred', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const stars = await readStars();
    const starredPrefixes = stars[email] || [];
    
    res.json(starredPrefixes);
  } catch (error) {
    console.error('Error getting starred MoUs:', error);
    res.status(500).json({ error: 'Failed to get starred MoUs' });
  }
});

// Activities endpoints
// Get activities for a MoU
app.get('/api/mous/:prefix/activities', async (req, res) => {
  try {
    const { prefix } = req.params;
    const activitiesFile = path.join(ACTIVITIES_DIR, `${prefix}.json`);
    
    try {
      const data = await fs.readFile(activitiesFile, 'utf8');
      res.json(JSON.parse(data));
    } catch {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Add activity to a MoU
app.post('/api/mous/:prefix/activities', async (req, res) => {
  try {
    const { prefix } = req.params;
    const activity = {
      ...req.body,
      id: Date.now().toString()
    };
    
    const activitiesFile = path.join(ACTIVITIES_DIR, `${prefix}.json`);
    
    let activities = [];
    try {
      const data = await fs.readFile(activitiesFile, 'utf8');
      activities = JSON.parse(data);
    } catch {
      // File doesn't exist yet
    }
    
    activities.push({ ...activity, attachments: [] });
    await fs.writeFile(activitiesFile, JSON.stringify(activities, null, 2));

    // Emit notifications to related users (managers + SPOCs) except actor
    try {
      const title = await getMouTitle(prefix);
      const recipients = await getRecipientsForMou(prefix, activity.createdBy);
      await addNotifications(recipients, {
        type: 'activity',
        prefix,
        title,
        message: `${activity.createdBy || 'Someone'} added an activity: ${activity.title}`,
        actorEmail: activity.createdBy || 'unknown',
        activityId: activity.id,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Activity notification emit failed:', e?.message || e);
    }

    res.json(activity);
  } catch (error) {
    console.error('Error adding activity:', error);
    res.status(500).json({ error: 'Failed to add activity' });
  }
});

// Update activity status
app.patch('/api/mous/:prefix/activities/:activityId', async (req, res) => {
  try {
    const { prefix, activityId } = req.params;
    const { status } = req.body;
    
    const activitiesFile = path.join(ACTIVITIES_DIR, `${prefix}.json`);
    
    const data = await fs.readFile(activitiesFile, 'utf8');
    let activities = JSON.parse(data);
    
    activities = activities.map(act => 
      act.id === activityId ? { ...act, status } : act
    );
    
    await fs.writeFile(activitiesFile, JSON.stringify(activities, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

// Like an activity
app.post('/api/mous/:prefix/activities/:activityId/like', async (req, res) => {
  try {
    const { prefix, activityId } = req.params;
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });

    const activitiesFile = path.join(ACTIVITIES_DIR, `${prefix}.json`);
    const data = await fs.readFile(activitiesFile, 'utf8');
    const activities = JSON.parse(data);

    const target = activities.find(a => a.id === activityId);

    const updated = activities.map(a => {
      if (a.id !== activityId) return a;
      const likes = Array.isArray(a.likes) ? new Set(a.likes) : new Set();
      likes.add(email);
      return { ...a, likes: Array.from(likes) };
    });

    await fs.writeFile(activitiesFile, JSON.stringify(updated, null, 2));
    // Emit notification to activity creator (if different)
    try {
      if (target && target.createdBy && target.createdBy !== email) {
        const title = await getMouTitle(prefix);
        await addNotifications([target.createdBy], {
          type: 'like',
          prefix,
          title,
          message: `${email} liked your activity: ${target.title}`,
          actorEmail: email,
          activityId,
          createdAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn('Like notification emit failed:', e?.message || e);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error liking activity:', error);
    res.status(500).json({ error: 'Failed to like activity' });
  }
});

// Unlike an activity
app.delete('/api/mous/:prefix/activities/:activityId/like', async (req, res) => {
  try {
    const { prefix, activityId } = req.params;
    const { email } = req.query || {};
    if (!email) return res.status(400).json({ error: 'email required' });

    const activitiesFile = path.join(ACTIVITIES_DIR, `${prefix}.json`);
    const data = await fs.readFile(activitiesFile, 'utf8');
    const activities = JSON.parse(data);

    const updated = activities.map(a => {
      if (a.id !== activityId) return a;
      const likes = Array.isArray(a.likes) ? a.likes.filter(e => e !== email) : [];
      return { ...a, likes };
    });

    await fs.writeFile(activitiesFile, JSON.stringify(updated, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Error unliking activity:', error);
    res.status(500).json({ error: 'Failed to unlike activity' });
  }
});
// Delete activity
app.delete('/api/mous/:prefix/activities/:activityId', async (req, res) => {
  try {
    const { prefix, activityId } = req.params;
    
    const activitiesFile = path.join(ACTIVITIES_DIR, `${prefix}.json`);
    
    const data = await fs.readFile(activitiesFile, 'utf8');
    let activities = JSON.parse(data);
    
    activities = activities.filter(act => act.id !== activityId);
    
    await fs.writeFile(activitiesFile, JSON.stringify(activities, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

// Upload activity attachment (photo)
app.post('/api/mous/:prefix/activities/:activityId/attachments', upload.single('photo'), async (req, res) => {
  try {
    const { prefix, activityId } = req.params;
    const { uploadedBy } = req.body || {};
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Ensure attachment folder exists
    const mouAttachDir = path.join(ACTIVITIES_DIR, prefix);
    try { await fs.access(mouAttachDir); } catch { await fs.mkdir(mouAttachDir, { recursive: true }); }

    // Create a safe filename
    const timestamp = Date.now();
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${activityId}_${timestamp}_${safeName}`;
    const filePath = path.join(mouAttachDir, fileName);

    // Persist file to disk
    await fs.writeFile(filePath, req.file.buffer);

    // Update activity record
    const activitiesFile = path.join(ACTIVITIES_DIR, `${prefix}.json`);
    let activities = [];
    try {
      const data = await fs.readFile(activitiesFile, 'utf8');
      activities = JSON.parse(data);
    } catch {}

    activities = activities.map(act => {
      if (act.id !== activityId) return act;
      const attachments = Array.isArray(act.attachments) ? act.attachments : [];
      const url = `/files/activities/${prefix}/${fileName}`;
      return {
        ...act,
        attachments: [
          ...attachments,
          {
            id: `${timestamp}`,
            fileName,
            originalName: req.file.originalname,
            url,
            uploadedAt: new Date().toISOString(),
            uploadedBy: uploadedBy || 'unknown'
          }
        ]
      };
    });

    await fs.writeFile(activitiesFile, JSON.stringify(activities, null, 2));

    res.json({ success: true });
  } catch (error) {
    console.error('Error uploading activity attachment:', error);
    res.status(500).json({ error: 'Failed to upload attachment' });
  }
});

// Comments endpoints
// Get comments for a MoU
app.get('/api/mous/:prefix/comments', async (req, res) => {
  try {
    const { prefix } = req.params;
    const commentsFile = path.join(COMMENTS_DIR, `${prefix}.json`);
    
    try {
      const data = await fs.readFile(commentsFile, 'utf8');
      res.json(JSON.parse(data));
    } catch {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add comment to a MoU
app.post('/api/mous/:prefix/comments', async (req, res) => {
  try {
    const { prefix } = req.params;
    const comment = {
      ...req.body,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    
    const commentsFile = path.join(COMMENTS_DIR, `${prefix}.json`);
    
    let comments = [];
    try {
      const data = await fs.readFile(commentsFile, 'utf8');
      comments = JSON.parse(data);
    } catch {
      // File doesn't exist yet
    }
    
    comments.push(comment);
    await fs.writeFile(commentsFile, JSON.stringify(comments, null, 2));

    // Emit notifications to related users (managers + SPOCs) except actor
    try {
      const title = await getMouTitle(prefix);
      const recipients = await getRecipientsForMou(prefix, comment.userEmail);
      await addNotifications(recipients, {
        type: 'comment',
        prefix,
        title,
        message: `${comment.userEmail || 'Someone'} commented on ${title}`,
        actorEmail: comment.userEmail || 'unknown',
        commentId: comment.id,
        createdAt: comment.timestamp
      });
    } catch (e) {
      console.warn('Comment notification emit failed:', e?.message || e);
    }

    res.json(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Delete comment
app.delete('/api/mous/:prefix/comments/:commentId', async (req, res) => {
  try {
    const { prefix, commentId } = req.params;
    
    const commentsFile = path.join(COMMENTS_DIR, `${prefix}.json`);
    
    const data = await fs.readFile(commentsFile, 'utf8');
    let comments = JSON.parse(data);
    
    comments = comments.filter(c => c.id !== commentId);
    
    await fs.writeFile(commentsFile, JSON.stringify(comments, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
