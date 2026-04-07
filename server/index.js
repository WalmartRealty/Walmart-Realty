/**
 * Walmart Real Estate - Backend Server
 * Express.js + SQLite database for property management
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const net = require('net');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const DEFAULT_PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'walmart-realty-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (extname) {
            return cb(null, true);
        }
        cb(new Error('Invalid file type'));
    }
});

// Initialize Database
const db = new Database(path.join(__dirname, 'walmart-realty.db'));

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        address TEXT,
        size_acres REAL,
        price REAL,
        type TEXT DEFAULT 'land',
        listing_type TEXT DEFAULT 'sale',
        status TEXT DEFAULT 'available',
        description TEXT,
        lat REAL,
        lon REAL,
        image TEXT,
        broker_name TEXT,
        broker_email TEXT,
        broker_phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS property_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_id INTEGER,
        image_url TEXT NOT NULL,
        is_primary INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS property_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_id INTEGER,
        document_name TEXT NOT NULL,
        document_url TEXT NOT NULL,
        document_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        email TEXT,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS loi_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_id INTEGER,
        loi_type TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        company TEXT,
        company_address TEXT,
        form_data TEXT,
        document_path TEXT,
        status TEXT DEFAULT 'pending',
        broker_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER,
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id INTEGER,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES admins(id)
    );
`);

// Create default admin if none exists
const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get();
if (adminCount.count === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO admins (username, password, name, email, role) VALUES (?, ?, ?, ?, ?)')
        .run('admin', hashedPassword, 'Administrator', 'admin@walmart.com', 'super_admin');
    console.log('Default admin created: username=admin, password=admin123');
}

// Auth Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Log activity
function logActivity(adminId, action, entityType, entityId, details) {
    db.prepare('INSERT INTO activity_log (admin_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
        .run(adminId, action, entityType, entityId, JSON.stringify(details));
}

// ============= AUTH ROUTES =============

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
    
    if (!admin || !bcrypt.compareSync(password, admin.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
        { id: admin.id, username: admin.username, role: admin.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
    
    res.json({ 
        token, 
        user: { 
            id: admin.id, 
            username: admin.username, 
            name: admin.name, 
            role: admin.role 
        } 
    });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    const admin = db.prepare('SELECT id, username, name, email, role FROM admins WHERE id = ?').get(req.user.id);
    res.json(admin);
});

// ============= PROPERTY ROUTES =============

// Get all properties (public)
app.get('/api/properties', (req, res) => {
    const { status, type, listing_type, city, state } = req.query;
    
    let query = 'SELECT * FROM properties WHERE 1=1';
    const params = [];
    
    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }
    if (type) {
        query += ' AND type = ?';
        params.push(type);
    }
    if (listing_type) {
        query += ' AND listing_type = ?';
        params.push(listing_type);
    }
    if (city) {
        query += ' AND city LIKE ?';
        params.push(`%${city}%`);
    }
    if (state) {
        query += ' AND state = ?';
        params.push(state);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const properties = db.prepare(query).all(...params);
    res.json(properties);
});

// Get single property (public)
app.get('/api/properties/:id', (req, res) => {
    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
    
    if (!property) {
        return res.status(404).json({ error: 'Property not found' });
    }
    
    // Get images
    property.images = db.prepare('SELECT * FROM property_images WHERE property_id = ?').all(req.params.id);
    
    // Get documents
    property.documents = db.prepare('SELECT * FROM property_documents WHERE property_id = ?').all(req.params.id);
    
    res.json(property);
});

// Create property (admin only)
app.post('/api/properties', authenticateToken, (req, res) => {
    const {
        title, city, state, address, size_acres, price, type, listing_type,
        status, description, lat, lon, image, broker_name, broker_email, broker_phone
    } = req.body;
    
    const result = db.prepare(`
        INSERT INTO properties (title, city, state, address, size_acres, price, type, listing_type, status, description, lat, lon, image, broker_name, broker_email, broker_phone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, city, state, address, size_acres, price, type || 'land', listing_type || 'sale', status || 'available', description, lat, lon, image, broker_name, broker_email, broker_phone);
    
    logActivity(req.user.id, 'CREATE', 'property', result.lastInsertRowid, { title, city, state });
    
    res.status(201).json({ id: result.lastInsertRowid, message: 'Property created successfully' });
});

// Update property (admin only)
app.put('/api/properties/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    const existingProperty = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    if (!existingProperty) {
        return res.status(404).json({ error: 'Property not found' });
    }
    
    const fields = Object.keys(updates).filter(k => k !== 'id');
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => updates[f]);
    
    if (fields.length > 0) {
        db.prepare(`UPDATE properties SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
            .run(...values, id);
    }
    
    logActivity(req.user.id, 'UPDATE', 'property', id, updates);
    
    res.json({ message: 'Property updated successfully' });
});

// Update property status (admin only)
app.patch('/api/properties/:id/status', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['available', 'under_contract', 'sold', 'leased', 'pending', 'off_market'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status', validStatuses });
    }
    
    db.prepare('UPDATE properties SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
    
    logActivity(req.user.id, 'STATUS_CHANGE', 'property', id, { status });
    
    res.json({ message: `Property status updated to ${status}` });
});

// Delete property (admin only)
app.delete('/api/properties/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    
    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    if (!property) {
        return res.status(404).json({ error: 'Property not found' });
    }
    
    db.prepare('DELETE FROM properties WHERE id = ?').run(id);
    
    logActivity(req.user.id, 'DELETE', 'property', id, { title: property.title });
    
    res.json({ message: 'Property deleted successfully' });
});

// Upload property image
app.post('/api/properties/:id/images', authenticateToken, upload.single('image'), (req, res) => {
    const { id } = req.params;
    const isPrimary = req.body.is_primary === 'true' ? 1 : 0;
    
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    
    // If this is primary, unset other primaries
    if (isPrimary) {
        db.prepare('UPDATE property_images SET is_primary = 0 WHERE property_id = ?').run(id);
    }
    
    const result = db.prepare('INSERT INTO property_images (property_id, image_url, is_primary) VALUES (?, ?, ?)')
        .run(id, imageUrl, isPrimary);
    
    res.status(201).json({ id: result.lastInsertRowid, image_url: imageUrl });
});

// ============= LOI ROUTES =============

// Submit LOI (public)
app.post('/api/loi', upload.single('document'), (req, res) => {
    const {
        property_id, loi_type, first_name, last_name, email, phone,
        company, company_address, form_data
    } = req.body;
    
    const documentPath = req.file ? `/uploads/${req.file.filename}` : null;
    
    const result = db.prepare(`
        INSERT INTO loi_submissions (property_id, loi_type, first_name, last_name, email, phone, company, company_address, form_data, document_path)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(property_id, loi_type, first_name, last_name, email, phone, company, company_address, form_data, documentPath);
    
    res.status(201).json({ id: result.lastInsertRowid, message: 'LOI submitted successfully' });
});

// Get all LOI submissions (admin only)
app.get('/api/loi', authenticateToken, (req, res) => {
    const submissions = db.prepare(`
        SELECT l.*, p.title as property_title, p.city, p.state
        FROM loi_submissions l
        LEFT JOIN properties p ON l.property_id = p.id
        ORDER BY l.created_at DESC
    `).all();
    
    res.json(submissions);
});

// Update LOI status (admin only)
app.patch('/api/loi/:id/status', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { status, broker_notes } = req.body;
    
    db.prepare('UPDATE loi_submissions SET status = ?, broker_notes = ? WHERE id = ?')
        .run(status, broker_notes, id);
    
    logActivity(req.user.id, 'LOI_STATUS_UPDATE', 'loi', id, { status });
    
    res.json({ message: 'LOI status updated' });
});

// ============= ADMIN ROUTES =============

// Get dashboard stats
app.get('/api/admin/stats', authenticateToken, (req, res) => {
    const stats = {
        totalProperties: db.prepare('SELECT COUNT(*) as count FROM properties').get().count,
        available: db.prepare('SELECT COUNT(*) as count FROM properties WHERE status = ?').get('available').count,
        underContract: db.prepare('SELECT COUNT(*) as count FROM properties WHERE status = ?').get('under_contract').count,
        sold: db.prepare('SELECT COUNT(*) as count FROM properties WHERE status = ?').get('sold').count,
        pendingLOIs: db.prepare('SELECT COUNT(*) as count FROM loi_submissions WHERE status = ?').get('pending').count,
        recentActivity: db.prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 10').all()
    };
    
    res.json(stats);
});

// Get activity log
app.get('/api/admin/activity', authenticateToken, (req, res) => {
    const activities = db.prepare(`
        SELECT a.*, ad.username, ad.name as admin_name
        FROM activity_log a
        LEFT JOIN admins ad ON a.admin_id = ad.id
        ORDER BY a.created_at DESC
        LIMIT 100
    `).all();
    
    res.json(activities);
});

// ============= PORT CHECKING & SERVER START =============

function isPortInUse(port) {
    return new Promise((resolve) => {
        const server = net.createServer()
            .once('error', () => resolve(true))
            .once('listening', () => {
                server.close();
                resolve(false);
            })
            .listen(port);
    });
}

async function findAvailablePort(startPort) {
    let port = startPort;
    const maxPort = startPort + 100;
    
    while (port < maxPort) {
        const inUse = await isPortInUse(port);
        if (!inUse) {
            return port;
        }
        console.log(`Port ${port} is in use, trying ${port + 1}...`);
        port++;
    }
    
    throw new Error('No available ports found');
}

async function startServer() {
    try {
        const port = await findAvailablePort(DEFAULT_PORT);
        
        app.listen(port, () => {
            console.log('\n============================================');
            console.log('   WALMART REAL ESTATE SERVER');
            console.log('============================================');
            console.log(`   🚀 Server running on: http://localhost:${port}`);
            console.log(`   📊 Admin panel: http://localhost:${port}/admin.html`);
            console.log(`   🏠 Public site: http://localhost:${port}/index.html`);
            console.log('============================================');
            console.log('   Default admin: username=admin, password=admin123');
            console.log('============================================\n');
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

startServer();
