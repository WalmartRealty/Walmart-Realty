require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { db, initializeDatabase, PROPERTY_STATUSES, PROPERTY_TYPES, LISTING_TYPES } = require('./database');

// ── Fail-fast: refuse to boot without a real JWT secret ──────────────────────
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('FATAL: JWT_SECRET env var is missing or too short (need 32+ chars). Refusing to start.');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// ── Allowed origins (comma-separated in ALLOWED_ORIGINS env var) ──────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3001')
    .split(',')
    .map(o => o.trim());

// ── Security headers (Helmet) ─────────────────────────────────────────────────
app.use(helmet());

// ── CORS — restrict to known origins only ────────────────────────────────────
app.use(cors({
    origin: (origin, callback) => {
        // Allow server-to-server (no origin) and listed origins
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: origin '${origin}' not allowed`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// ── Rate limiters ─────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: { error: 'Too many login attempts. Try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: { error: 'Rate limit exceeded. Slow down!' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ── Body parsing, XSS sanitisation, HTTP-param pollution prevention ───────────
app.use(express.json({ limit: '1mb' }));
app.use(xssClean());
app.use(hpp());

// ── Static files ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..')));
// /uploads served by authenticated route only — NOT as open static middleware

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// ── File upload configuration ───────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx']);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Preserve only the whitelisted extension, never trust originalname directly
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, uniqueSuffix + ext);
    },
});

function fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIME_TYPES.has(file.mimetype) && ALLOWED_EXTENSIONS.has(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`File type not allowed: ${file.mimetype} / ${ext}`), false);
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024, files: 5 }, // 10 MB, max 5 files
});

// Initialize database
initializeDatabase();

// ── Seed default admin — credentials MUST come from env, no hardcoded fallback ──────────
function createDefaultAdmin() {
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
        console.warn('WARNING: ADMIN_USERNAME / ADMIN_PASSWORD not set. Skipping default admin seed.');
        return;
    }
    const stmt = db.prepare('SELECT * FROM admin_users WHERE username = ?');
    const existing = stmt.get(process.env.ADMIN_USERNAME);
    if (!existing) {
        const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12);
        const insert = db.prepare('INSERT INTO admin_users (username, password_hash, name, role) VALUES (?, ?, ?, ?)');
        insert.run(process.env.ADMIN_USERNAME, hash, 'Administrator', 'super_admin');
        console.log('Default admin user created from env config.');
    }
}
createDefaultAdmin();

// Auth middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Access denied' });
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
}

// Log activity
function logActivity(userId, action, entityType, entityId, details) {
    const stmt = db.prepare('INSERT INTO activity_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)');
    stmt.run(userId, action, entityType, entityId, JSON.stringify(details));
}

// ── AUTH ROUTES ─────────────────────────────────────────────────────────────

// Apply global API rate limiter to all /api/* routes
app.use('/api/', apiLimiter);

app.post('/api/auth/login', loginLimiter, (req, res) => {
    const { username, password } = req.body;
    
    const stmt = db.prepare('SELECT * FROM admin_users WHERE username = ?');
    const user = stmt.get(username);
    
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    db.prepare('UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    
    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
    
    logActivity(user.id, 'login', 'user', user.id, { username });
    
    res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    const stmt = db.prepare('SELECT id, username, name, email, role FROM admin_users WHERE id = ?');
    const user = stmt.get(req.user.id);
    res.json(user);
});

// ============ PROPERTIES ROUTES ============

// Get all properties (public)
app.get('/api/properties', (req, res) => {
    const { status, type, listing_type, state, search } = req.query;
    
    let query = 'SELECT * FROM properties WHERE 1=1';
    const params = [];
    
    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }
    if (type) {
        query += ' AND property_type = ?';
        params.push(type);
    }
    if (listing_type) {
        query += ' AND listing_type = ?';
        params.push(listing_type);
    }
    if (state) {
        query += ' AND state = ?';
        params.push(state);
    }
    if (search) {
        query += ' AND (city LIKE ? OR state LIKE ? OR address LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const stmt = db.prepare(query);
    const properties = stmt.all(...params);
    
    res.json(properties);
});

// Get single property (public)
app.get('/api/properties/:id', (req, res) => {
    const stmt = db.prepare('SELECT * FROM properties WHERE id = ?');
    const property = stmt.get(req.params.id);
    
    if (!property) {
        return res.status(404).json({ error: 'Property not found' });
    }
    
    // Get images
    const images = db.prepare('SELECT * FROM property_images WHERE property_id = ?').all(req.params.id);
    // Get documents
    const documents = db.prepare('SELECT * FROM property_documents WHERE property_id = ?').all(req.params.id);
    
    res.json({ ...property, images, documents });
});

// Create property (admin)
app.post('/api/properties', authenticateToken, (req, res) => {
    const {
        city, state, address, size_acres, size_sqft, property_type, listing_type,
        price, status, description, features, lat, lon, image_url,
        broker_name, broker_email, broker_phone, store_number
    } = req.body;
    
    const stmt = db.prepare(`
        INSERT INTO properties (
            city, state, address, size_acres, size_sqft, property_type, listing_type,
            price, status, description, features, lat, lon, image_url,
            broker_name, broker_email, broker_phone, store_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
        city, state, address, size_acres, size_sqft, property_type || 'land', listing_type || 'sale',
        price, status || 'available', description, JSON.stringify(features || []), lat, lon, image_url,
        broker_name, broker_email, broker_phone, store_number
    );
    
    logActivity(req.user.id, 'create', 'property', result.lastInsertRowid, { city, state });
    
    res.json({ id: result.lastInsertRowid, message: 'Property created successfully' });
});

// Update property (admin)
app.put('/api/properties/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    // Build dynamic update query
    const fields = Object.keys(updates).filter(k => k !== 'id');
    if (fields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }
    
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => {
        if (f === 'features' && typeof updates[f] === 'object') {
            return JSON.stringify(updates[f]);
        }
        return updates[f];
    });
    
    const stmt = db.prepare(`UPDATE properties SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    stmt.run(...values, id);
    
    logActivity(req.user.id, 'update', 'property', id, updates);
    
    res.json({ message: 'Property updated successfully' });
});

// Update property status (admin) - quick action
app.patch('/api/properties/:id/status', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!PROPERTY_STATUSES.includes(status)) {
        return res.status(400).json({ error: 'Invalid status', valid: PROPERTY_STATUSES });
    }
    
    const stmt = db.prepare('UPDATE properties SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(status, id);
    
    logActivity(req.user.id, 'status_change', 'property', id, { status });
    
    res.json({ message: `Property status updated to ${status}` });
});

// Delete property (admin)
app.delete('/api/properties/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    
    // Get property info for logging
    const property = db.prepare('SELECT city, state FROM properties WHERE id = ?').get(id);
    
    const stmt = db.prepare('DELETE FROM properties WHERE id = ?');
    stmt.run(id);
    
    logActivity(req.user.id, 'delete', 'property', id, property);
    
    res.json({ message: 'Property deleted successfully' });
});

// Bulk import properties (admin)
app.post('/api/properties/bulk', authenticateToken, (req, res) => {
    const { properties } = req.body;
    
    if (!Array.isArray(properties)) {
        return res.status(400).json({ error: 'Properties must be an array' });
    }
    
    const stmt = db.prepare(`
        INSERT INTO properties (
            city, state, address, size_acres, property_type, listing_type,
            price, status, lat, lon, store_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertMany = db.transaction((props) => {
        let count = 0;
        for (const p of props) {
            stmt.run(
                p.city, p.state, p.address, p.size_acres, p.property_type || 'land',
                p.listing_type || 'sale', p.price, p.status || 'available',
                p.lat, p.lon, p.store_number
            );
            count++;
        }
        return count;
    });
    
    const count = insertMany(properties);
    logActivity(req.user.id, 'bulk_import', 'property', null, { count });
    
    res.json({ message: `${count} properties imported successfully` });
});

// ============ LOI SUBMISSIONS ROUTES ============

// Submit LOI (public)
app.post('/api/loi', upload.single('loiFile'), (req, res) => {
    const {
        property_id, loi_type, first_name, last_name, email, phone,
        company, company_address, form_data
    } = req.body;
    
    const stmt = db.prepare(`
        INSERT INTO loi_submissions (
            property_id, loi_type, first_name, last_name, email, phone,
            company, company_address, form_data, file_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
        property_id, loi_type, first_name, last_name, email, phone,
        company, company_address, form_data,
        req.file ? req.file.filename : null
    );
    
    res.json({ id: result.lastInsertRowid, message: 'LOI submitted successfully' });
});

// Get all LOI submissions (admin)
app.get('/api/loi', authenticateToken, (req, res) => {
    const stmt = db.prepare(`
        SELECT l.*, p.city, p.state 
        FROM loi_submissions l 
        LEFT JOIN properties p ON l.property_id = p.id 
        ORDER BY l.created_at DESC
    `);
    const submissions = stmt.all();
    res.json(submissions);
});

// Update LOI status (admin)
app.patch('/api/loi/:id/status', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const stmt = db.prepare('UPDATE loi_submissions SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(status, notes, id);
    
    logActivity(req.user.id, 'loi_status_change', 'loi', id, { status });
    
    res.json({ message: 'LOI status updated' });
});

// ============ DASHBOARD STATS ============

app.get('/api/stats', authenticateToken, (req, res) => {
    const totalProperties = db.prepare('SELECT COUNT(*) as count FROM properties').get().count;
    const availableProperties = db.prepare("SELECT COUNT(*) as count FROM properties WHERE status = 'available'").get().count;
    const underContract = db.prepare("SELECT COUNT(*) as count FROM properties WHERE status = 'under_contract'").get().count;
    const soldProperties = db.prepare("SELECT COUNT(*) as count FROM properties WHERE status = 'sold'").get().count;
    const pendingLOIs = db.prepare("SELECT COUNT(*) as count FROM loi_submissions WHERE status = 'pending'").get().count;
    const recentActivity = db.prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 10').all();
    
    res.json({
        totalProperties,
        availableProperties,
        underContract,
        soldProperties,
        pendingLOIs,
        recentActivity
    });
});

// ============ REFERENCE DATA ============

app.get('/api/reference', (req, res) => {
    res.json({
        statuses: PROPERTY_STATUSES,
        propertyTypes: PROPERTY_TYPES,
        listingTypes: LISTING_TYPES
    });
});

// ── FILE UPLOAD (admin-only) ───────────────────────────────────────────────────────

app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({
        filename: req.file.filename,
        url: `/api/uploads/${req.file.filename}`,
        originalName: req.file.originalname,
        size: req.file.size,
    });
});

// Serve uploaded files — requires a valid JWT (files are internal-only)
app.get('/api/uploads/:filename', authenticateToken, (req, res) => {
    // Prevent path traversal: strip any directory separators from the param
    const filename = path.basename(req.params.filename);
    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }
    res.sendFile(filePath);
});

// ── Multer error handler ───────────────────────────────────────────────────────────
// Must have 4 params to be treated as an error handler by Express
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    if (err.name === 'MulterError' || err.message?.startsWith('File type not allowed')) {
        return res.status(400).json({ error: err.message });
    }
    if (err.message?.startsWith('CORS')) {
        return res.status(403).json({ error: err.message });
    }
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Serve admin dashboard
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`  Walmart Real Estate Admin Server`);
    console.log(`========================================`);
    console.log(`  Server running on: http://localhost:${PORT}`);
    console.log(`  Admin panel: http://localhost:${PORT}/admin`);
    console.log(`  API: http://localhost:${PORT}/api`);
    console.log(`========================================\n`);
});
