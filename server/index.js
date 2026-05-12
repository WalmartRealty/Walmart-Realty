/**
 * Walmart Real Estate - Backend Server
 * Express.js + SQLite database for property management
 * 
 * SECURITY: Hardened for Walmart enterprise standards
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const net = require('net');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');
const { execSync } = require('child_process');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const { v4: uuidv4 } = require('uuid');
const { sendLOINotification, sendContactInquiry } = require('./email-service');
require('dotenv').config();

const app = express();
const DEFAULT_PORT = 3000;

// ============= SECURITY CONFIGURATION =============

// JWT Secret - MUST be set via environment variable in production
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_EXPIRES_IN = '8h'; // Token expires in 8 hours
const BCRYPT_ROUNDS = 12; // Strong password hashing

// Warn if using generated secret (not persistent across restarts)
if (!process.env.JWT_SECRET) {
    console.warn('⚠️  WARNING: JWT_SECRET not set in environment. Using random secret (tokens will invalidate on restart).');
    console.warn('   Set JWT_SECRET in .env file for production!');
}

// ============= SECURITY MIDDLEWARE =============

// Helmet - Sets various HTTP security headers
// Note: CSP disabled in development to allow inline event handlers
const isDev = process.env.NODE_ENV !== 'production';
app.use(helmet({
    contentSecurityPolicy: isDev ? false : {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://i5.walmartimages.com"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: false,
    hsts: isDev ? false : {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Rate limiting - Prevent brute force attacks
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per window
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
});

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: { error: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false
});

const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 uploads per hour
    message: { error: 'Upload limit reached. Please try again later.' }
});

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/marketing/upload', uploadLimiter);
app.use('/api/properties/:id/marketing', uploadLimiter);
app.use('/api/loi-templates', uploadLimiter);

// HPP - Prevent HTTP Parameter Pollution
app.use(hpp());

// CORS - Restrict origins in production
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://walmartrealty.github.io']
        : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Body parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Static file serving
app.use(express.static(path.join(__dirname, '..')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ============= FILE UPLOAD SECURITY =============

// Allowed file types (whitelist approach)
const ALLOWED_FILE_TYPES = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// File upload configuration with security
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        // Ensure upload directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Sanitize filename - remove path traversal attempts
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(sanitizedName).toLowerCase()}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage,
    limits: { 
        fileSize: MAX_FILE_SIZE,
        files: 5 // Max 5 files per request
    },
    fileFilter: (req, file, cb) => {
        // Check MIME type
        if (!ALLOWED_FILE_TYPES[file.mimetype]) {
            return cb(new Error(`File type ${file.mimetype} not allowed`), false);
        }
        
        // Check extension matches MIME type
        const ext = path.extname(file.originalname).toLowerCase();
        if (!ALLOWED_FILE_TYPES[file.mimetype].includes(ext)) {
            return cb(new Error('File extension does not match content type'), false);
        }
        
        cb(null, true);
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

    CREATE TABLE IF NOT EXISTS brokers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        company TEXT,
        states TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS marketing_materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_id INTEGER,
        file_name TEXT NOT NULL,
        file_url TEXT NOT NULL,
        file_type TEXT,
        thumbnail_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS loi_templates (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS contact_inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        company TEXT,
        property_id INTEGER,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'new',
        notes TEXT,
        email_sent INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
    );
`);

// Create default admin if none exists
// Also re-hashes the password if ADMIN_PASSWORD env var has changed.
const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get();
const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
if (adminCount.count === 0) {
    const hashedPassword = bcrypt.hashSync(defaultPassword, BCRYPT_ROUNDS);
    db.prepare('INSERT INTO admins (username, password, name, email, role) VALUES (?, ?, ?, ?, ?)')
        .run(defaultUsername, hashedPassword, 'Administrator', 'admin@walmart.com', 'super_admin');
    console.log(`Default admin created: username=${defaultUsername}, password=${defaultPassword}`);
} else if (process.env.ADMIN_PASSWORD) {
    // If env var is set, update the stored hash so it stays in sync.
    const existing = db.prepare('SELECT id, password FROM admins WHERE username = ?').get(defaultUsername);
    if (existing && !bcrypt.compareSync(defaultPassword, existing.password)) {
        const hashedPassword = bcrypt.hashSync(defaultPassword, BCRYPT_ROUNDS);
        db.prepare('UPDATE admins SET password = ? WHERE id = ?').run(hashedPassword, existing.id);
        console.log(`Admin password updated from ADMIN_PASSWORD env var.`);
    }
}

// Auth Middleware - Secure JWT verification
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            issuer: 'walmart-realty',
            audience: 'walmart-realty-admin',
            algorithms: ['HS256'] // Only allow HS256
        });
        
        // Verify user still exists and is active
        const admin = db.prepare('SELECT id, username, role FROM admins WHERE id = ?').get(decoded.id);
        if (!admin) {
            return res.status(403).json({ error: 'User no longer exists' });
        }
        
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired. Please login again.' });
        }
        return res.status(403).json({ error: 'Invalid token' });
    }
}

// Log activity
function logActivity(adminId, action, entityType, entityId, details) {
    db.prepare('INSERT INTO activity_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
        .run(adminId, action, entityType, entityId, JSON.stringify(details));
}

// ============= INPUT VALIDATION HELPERS =============

// Sanitize string input
function sanitizeInput(str) {
    if (typeof str !== 'string') return '';
    return str.trim().slice(0, 1000); // Limit length
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Password strength validation (Walmart standards)
function validatePassword(password) {
    const errors = [];
    if (password.length < 12) errors.push('Password must be at least 12 characters');
    if (!/[A-Z]/.test(password)) errors.push('Password must contain uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('Password must contain lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('Password must contain a number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Password must contain a special character');
    return errors;
}

// ============= AUTH ROUTES =============

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    // Input validation
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    
    const sanitizedUsername = sanitizeInput(username);
    
    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(sanitizedUsername);
    
    // Use timing-safe comparison to prevent timing attacks
    // Even if user doesn't exist, still do a password comparison
    const dummyHash = '$2a$12$dummy.hash.for.timing.attack.prevention';
    const hashToCompare = admin ? admin.password : dummyHash;
    const passwordValid = bcrypt.compareSync(password, hashToCompare);
    
    if (!admin || !passwordValid) {
        // Log failed login attempt
        console.log(`[SECURITY] Failed login attempt for username: ${sanitizedUsername} at ${new Date().toISOString()}`);
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate secure token
    const token = jwt.sign(
        { 
            id: admin.id, 
            username: admin.username, 
            role: admin.role,
            iat: Math.floor(Date.now() / 1000)
        },
        JWT_SECRET,
        { 
            expiresIn: JWT_EXPIRES_IN,
            issuer: 'walmart-realty',
            audience: 'walmart-realty-admin'
        }
    );
    
    // Log successful login
    logActivity(admin.id, 'LOGIN', 'admin', admin.id, { ip: req.ip });
    
    res.json({ 
        token, 
        user: { 
            id: admin.id, 
            username: admin.username, 
            name: admin.name, 
            role: admin.role 
        },
        expiresIn: JWT_EXPIRES_IN
    });
});

// Change password endpoint
app.post('/api/auth/change-password', authenticateToken, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password required' });
    }
    
    // Validate new password strength
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
        return res.status(400).json({ error: 'Password does not meet requirements', details: passwordErrors });
    }
    
    const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.user.id);
    
    if (!bcrypt.compareSync(currentPassword, admin.password)) {
        return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password with strong rounds
    const hashedPassword = bcrypt.hashSync(newPassword, BCRYPT_ROUNDS);
    db.prepare('UPDATE admins SET password = ? WHERE id = ?').run(hashedPassword, req.user.id);
    
    logActivity(req.user.id, 'PASSWORD_CHANGE', 'admin', req.user.id, {});
    
    res.json({ message: 'Password updated successfully' });
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
        // DB uses property_type, not type
        query += ' AND property_type = ?';
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
        city, state, address, size_acres, price,
        type, property_type,          // accept both; 'type' from admin form
        listing_type,
        status, description, lat, lon,
        image, image_url,             // accept both
        broker_name, broker_email, broker_phone
    } = req.body;

    const resolvedType    = property_type || type || 'land';
    const resolvedListing = listing_type || 'sale';
    const resolvedImage   = image_url || image || null;

    const result = db.prepare(`
        INSERT INTO properties
            (city, state, address, size_acres, price, property_type, listing_type,
             status, description, lat, lon, image_url, broker_name, broker_email, broker_phone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        city, state, address || null,
        size_acres || null, price || null,
        resolvedType, resolvedListing,
        status || 'available',
        description || null,
        lat || null, lon || null,
        resolvedImage,
        broker_name || null, broker_email || null, broker_phone || null
    );

    logActivity(req.user.id, 'CREATE', 'property', result.lastInsertRowid, { city, state });
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

    // Map frontend field names -> actual DB column names, whitelist valid columns only
    const FIELD_MAP = {
        type:         'property_type',
        property_type:'property_type',
        image:        'image_url',
        image_url:    'image_url',
        city:         'city',
        state:        'state',
        address:      'address',
        size_acres:   'size_acres',
        price:        'price',
        listing_type: 'listing_type',
        status:       'status',
        description:  'description',
        lat:          'lat',
        lon:          'lon',
        broker_name:  'broker_name',
        broker_email: 'broker_email',
        broker_phone: 'broker_phone',
        store_number: 'store_number',
        featured:     'featured'
    };

    const mapped = {};
    for (const [k, v] of Object.entries(updates)) {
        if (k === 'id') continue;
        const col = FIELD_MAP[k];
        if (col) mapped[col] = v;
    }

    const fields = Object.keys(mapped);
    if (fields.length > 0) {
        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const values    = fields.map(f => mapped[f]);
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
app.post('/api/loi', upload.single('document'), async (req, res) => {
    const {
        property_id, loi_type, first_name, last_name, email, phone,
        company, company_address, form_data
    } = req.body;
    
    const documentPath = req.file ? `/uploads/${req.file.filename}` : null;
    
    // Get property details to find brokers
    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(property_id);
    
    // Find brokers for this state
    let brokers = [];
    if (property) {
        brokers = db.prepare(`
            SELECT id, name, email, phone, company FROM brokers 
            WHERE is_active = 1 AND states LIKE ?
        `).all(`%${property.state}%`);
    }
    
    const result = db.prepare(`
        INSERT INTO loi_submissions (property_id, loi_type, first_name, last_name, email, phone, company, company_address, form_data, document_path)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(property_id, loi_type, first_name, last_name, email, phone, company, company_address, form_data, documentPath);
    
    // Send email notifications to brokers
    let emailResults = [];
    if (brokers.length > 0) {
        try {
            emailResults = await sendLOINotification({
                brokers,
                property,
                loiData: { loi_type, form_data },
                submitterInfo: {
                    name: `${first_name} ${last_name}`,
                    email,
                    phone,
                    company
                }
            });
        } catch (err) {
            console.error('Failed to send email notifications:', err);
        }
    }
    
    // Return broker info so frontend can show who will receive the LOI
    res.status(201).json({ 
        id: result.lastInsertRowid, 
        message: 'LOI submitted successfully',
        property: property,
        brokers_notified: brokers.map(b => ({ name: b.name, email: b.email })),
        email_results: emailResults
    });
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

// ============= CONTACT INQUIRY ROUTES =============

// Submit contact inquiry (public)
app.post('/api/contact', async (req, res) => {
    const { name, email, phone, company, property_id, message } = req.body;
    
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    
    // Get property details if a property was selected
    let property = null;
    if (property_id) {
        property = db.prepare('SELECT * FROM properties WHERE id = ?').get(property_id);
    }
    
    try {
        // Save to database
        const result = db.prepare(`
            INSERT INTO contact_inquiries (name, email, phone, company, property_id, message)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(name, email, phone || null, company || null, property_id || null, message);
        
        // Send email notification
        const emailResult = await sendContactInquiry({
            inquiry: { name, email, phone, company, message },
            property: property
        });
        
        // Update email status
        if (emailResult.sent) {
            db.prepare('UPDATE contact_inquiries SET email_sent = 1 WHERE id = ?')
                .run(result.lastInsertRowid);
        }
        
        res.json({ 
            success: true, 
            message: 'Your inquiry has been submitted. Our team will respond within 1-2 business days.',
            id: result.lastInsertRowid,
            emailSent: emailResult.sent
        });
    } catch (error) {
        console.error('Contact inquiry error:', error);
        res.status(500).json({ error: 'Failed to submit inquiry. Please try again.' });
    }
});

// Get all contact inquiries (admin only)
app.get('/api/contact', authenticateToken, (req, res) => {
    const inquiries = db.prepare(`
        SELECT c.*, p.title as property_title, p.city as property_city, p.state as property_state
        FROM contact_inquiries c
        LEFT JOIN properties p ON c.property_id = p.id
        ORDER BY c.created_at DESC
    `).all();
    
    res.json(inquiries);
});

// Update contact inquiry status (admin only)
app.patch('/api/contact/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    db.prepare('UPDATE contact_inquiries SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(status, notes || null, id);
    
    logActivity(req.user.id, 'INQUIRY_UPDATE', 'contact_inquiry', id, { status });
    
    res.json({ message: 'Inquiry updated' });
});

// Delete contact inquiry (admin only)
app.delete('/api/contact/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    
    db.prepare('DELETE FROM contact_inquiries WHERE id = ?').run(id);
    logActivity(req.user.id, 'DELETE', 'contact_inquiry', id, {});
    
    res.json({ message: 'Inquiry deleted' });
});

// ============= BROKER ROUTES =============

// Get all brokers (admin only)
app.get('/api/brokers', authenticateToken, (req, res) => {
    const brokers = db.prepare('SELECT * FROM brokers ORDER BY name ASC').all();
    res.json(brokers);
});

// Get brokers by state (for LOI routing)
app.get('/api/brokers/state/:state', (req, res) => {
    const { state } = req.params;
    const brokers = db.prepare(`
        SELECT * FROM brokers 
        WHERE is_active = 1 AND states LIKE ?
    `).all(`%${state.toUpperCase()}%`);
    res.json(brokers);
});

// Add single broker (admin only)
app.post('/api/brokers', authenticateToken, (req, res) => {
    const { name, email, phone, company, states } = req.body;
    
    if (!name || !email || !states) {
        return res.status(400).json({ error: 'Name, email, and states are required' });
    }
    
    const result = db.prepare(`
        INSERT INTO brokers (name, email, phone, company, states)
        VALUES (?, ?, ?, ?, ?)
    `).run(name, email, phone, company, states.toUpperCase());
    
    logActivity(req.user.id, 'CREATE', 'broker', result.lastInsertRowid, { name, email });
    
    res.status(201).json({ id: result.lastInsertRowid, message: 'Broker added successfully' });
});

// Bulk import brokers from CSV (admin only)
app.post('/api/brokers/import', authenticateToken, (req, res) => {
    const { brokers } = req.body;
    
    if (!Array.isArray(brokers) || brokers.length === 0) {
        return res.status(400).json({ error: 'No brokers data provided' });
    }
    
    const insertStmt = db.prepare(`
        INSERT INTO brokers (name, email, phone, company, states)
        VALUES (?, ?, ?, ?, ?)
    `);
    
    let imported = 0;
    let errors = [];
    
    const insertMany = db.transaction((brokersList) => {
        for (const broker of brokersList) {
            try {
                if (!broker.name || !broker.email || !broker.states) {
                    errors.push(`Missing required fields for: ${broker.name || broker.email || 'unknown'}`);
                    continue;
                }
                insertStmt.run(
                    broker.name,
                    broker.email,
                    broker.phone || null,
                    broker.company || null,
                    broker.states.toUpperCase()
                );
                imported++;
            } catch (err) {
                errors.push(`Error importing ${broker.email}: ${err.message}`);
            }
        }
    });
    
    insertMany(brokers);
    
    logActivity(req.user.id, 'BULK_IMPORT', 'broker', null, { imported, errors: errors.length });
    
    res.json({ 
        message: `Imported ${imported} brokers`, 
        imported, 
        errors 
    });
});

// Update broker (admin only)
app.put('/api/brokers/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { name, email, phone, company, states, is_active } = req.body;
    
    db.prepare(`
        UPDATE brokers SET name = ?, email = ?, phone = ?, company = ?, states = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(name, email, phone, company, states?.toUpperCase(), is_active ? 1 : 0, id);
    
    logActivity(req.user.id, 'UPDATE', 'broker', id, { name, email });
    
    res.json({ message: 'Broker updated successfully' });
});

// Delete broker (admin only)
app.delete('/api/brokers/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM brokers WHERE id = ?').run(id);
    logActivity(req.user.id, 'DELETE', 'broker', id, {});
    res.json({ message: 'Broker deleted successfully' });
});

// ============= MARKETING MATERIALS ROUTES =============

// New unified marketing upload endpoint
app.post('/api/marketing/upload', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const propertyId = req.body.property_id;
        
        if (!propertyId) {
            return res.status(400).json({ error: 'Property ID required' });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }
        
        const fileUrl = `/uploads/${req.file.filename}`;
        const fileType = req.file.mimetype;
        const fileName = req.file.originalname;
        
        const result = db.prepare(`
            INSERT INTO marketing_materials (property_id, file_name, file_url, file_type, thumbnail_url)
            VALUES (?, ?, ?, ?, ?)
        `).run(propertyId, fileName, fileUrl, fileType, fileType.startsWith('image/') ? fileUrl : null);
        
        logActivity(req.user.id, 'UPLOAD', 'marketing_material', result.lastInsertRowid, { property_id: propertyId, fileName });
        
        res.status(201).json({ 
            id: result.lastInsertRowid, 
            file_url: fileUrl,
            file_name: fileName,
            file_type: fileType
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// Upload marketing materials for a property (legacy endpoint)
app.post('/api/properties/:id/marketing', authenticateToken, upload.single('file'), (req, res) => {
    const { id } = req.params;
    
    if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    const fileType = req.file.mimetype;
    const fileName = req.body.name || req.file.originalname;
    
    // Generate thumbnail URL (for PDFs, we'll use the same; for images, use the image itself)
    const thumbnailUrl = fileType.startsWith('image/') ? fileUrl : null;
    
    const result = db.prepare(`
        INSERT INTO marketing_materials (property_id, file_name, file_url, file_type, thumbnail_url)
        VALUES (?, ?, ?, ?, ?)
    `).run(id, fileName, fileUrl, fileType, thumbnailUrl);
    
    logActivity(req.user.id, 'UPLOAD', 'marketing_material', result.lastInsertRowid, { property_id: id, fileName });
    
    res.status(201).json({ 
        id: result.lastInsertRowid, 
        file_url: fileUrl,
        file_name: fileName,
        thumbnail_url: thumbnailUrl
    });
});

// Get marketing materials for a property
app.get('/api/properties/:id/marketing', (req, res) => {
    const { id } = req.params;
    const materials = db.prepare('SELECT * FROM marketing_materials WHERE property_id = ? ORDER BY created_at DESC').all(id);
    res.json(materials);
});

// Delete marketing material
app.delete('/api/marketing/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM marketing_materials WHERE id = ?').run(id);
    logActivity(req.user.id, 'DELETE', 'marketing_material', id, {});
    res.json({ message: 'Marketing material deleted' });
});

// ============= LOI TEMPLATES ROUTES =============

// Default LOI templates configuration
const defaultLOITemplates = [
    { id: 1, name: 'Building Lease', file_name: 'Building Lease .docx', file_path: '/loi-documents/Building Lease .docx' },
    { id: 2, name: 'Building Sale', file_name: 'Building Sale LOI docx.docx', file_path: '/loi-documents/Building Sale LOI docx.docx' },
    { id: 3, name: 'Building Sublease', file_name: 'Building Sublease LOI.docx', file_path: '/loi-documents/Building Sublease LOI.docx' },
    { id: 4, name: 'Carveout Ground Lease', file_name: 'Carveout Ground Lease LOI .doc', file_path: '/loi-documents/Carveout Ground Lease LOI .doc' },
    { id: 5, name: 'Carveout Sale', file_name: 'Carveout Sale LOI.docx', file_path: '/loi-documents/Carveout Sale LOI.docx' },
    { id: 6, name: 'Large Tract Land Sale', file_name: 'Large Tract Land Sale LOI.docx', file_path: '/loi-documents/Large Tract Land Sale LOI.docx' },
    { id: 7, name: 'Outlot Ground Lease', file_name: 'Outlot Ground Lease LOI.docx', file_path: '/loi-documents/Outlot Ground Lease LOI.docx' },
    { id: 8, name: 'Outlot Land Sale', file_name: 'Outlot Land Sale LOI .docx', file_path: '/loi-documents/Outlot Land Sale LOI .docx' }
];

// Get all LOI templates
app.get('/api/loi-templates', authenticateToken, (req, res) => {
    try {
        const templates = db.prepare('SELECT * FROM loi_templates ORDER BY id').all();
        if (templates.length === 0) {
            // Return defaults if no templates in DB
            res.json(defaultLOITemplates.map(t => ({ ...t, is_active: true })));
        } else {
            res.json(templates);
        }
    } catch (error) {
        // Table might not exist, return defaults
        res.json(defaultLOITemplates.map(t => ({ ...t, is_active: true })));
    }
});

// Upload/Update LOI template
app.post('/api/loi-templates/:id', authenticateToken, upload.single('template'), (req, res) => {
    const { id } = req.params;
    const { template_name } = req.body;
    
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileName = req.file.originalname;
    const filePath = `/uploads/${req.file.filename}`;
    
    try {
        // Try to update existing or insert new
        const existing = db.prepare('SELECT id FROM loi_templates WHERE id = ?').get(id);
        
        if (existing) {
            db.prepare(`
                UPDATE loi_templates 
                SET name = ?, file_name = ?, file_path = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `).run(template_name, fileName, filePath, id);
        } else {
            db.prepare(`
                INSERT INTO loi_templates (id, name, file_name, file_path, is_active)
                VALUES (?, ?, ?, ?, 1)
            `).run(id, template_name, fileName, filePath);
        }
        
        logActivity(req.user.id, 'UPDATE', 'loi_template', id, { name: template_name, file_name: fileName });
        
        res.json({ 
            message: 'Template uploaded successfully', 
            file_name: fileName,
            file_path: filePath
        });
    } catch (error) {
        console.error('Failed to save LOI template:', error);
        res.status(500).json({ error: 'Failed to save template' });
    }
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

// ============= ADMIN SYNC & EXPORT ROUTES =============

// Sync properties from DB → properties.json → git push (admin only)
app.post('/api/admin/sync-github', authenticateToken, (req, res) => {
    try {
        const repoRoot = path.join(__dirname, '..');
        const propsFile = path.join(repoRoot, 'properties.json');

        // Pull current DB properties
        const dbProps = db.prepare('SELECT * FROM properties ORDER BY id').all();

        // Merge with existing properties.json to preserve extra fields
        // (broker_company, marketingMaterials, store_num, etc.)
        let existingProps = [];
        try {
            existingProps = JSON.parse(fs.readFileSync(propsFile, 'utf8'));
        } catch (_) { /* file missing or invalid — start fresh */ }

        const existingById = {};
        existingProps.forEach(p => { existingById[p.id || p.store_num] = p; });

        const merged = dbProps.map(p => {
            const base = existingById[p.id] || {};
            return {
                ...base,          // preserve extra fields (broker_company, etc.)
                id: p.id,
                city: p.city,
                state: p.state,
                address: p.address,
                size_acres: p.size_acres,
                size_sqft: p.size_sqft || null,
                property_type: p.type || p.property_type || 'land',
                listing_type: p.listing_type || 'sale',
                price: p.price,
                status: p.status || 'available',
                description: p.description,
                lat: p.lat,
                lon: p.lon,
                image_url: p.image || p.image_url || null,
                broker_name: p.broker_name,
                broker_email: p.broker_email,
                broker_phone: p.broker_phone,
                store_number: p.store_number || base.store_number || null,
                updated_at: new Date().toISOString()
            };
        });

        fs.writeFileSync(propsFile, JSON.stringify(merged, null, 2), 'utf8');
        console.log(`[sync-github] Wrote ${merged.length} properties to properties.json`);

        // Attempt git commit + push
        try {
            execSync('git add properties.json', { cwd: repoRoot, stdio: 'pipe' });
            execSync(
                `git commit -m "Admin: Update ${merged.length} properties from admin panel [skip ci]" --no-verify`,
                { cwd: repoRoot, stdio: 'pipe' }
            );
            execSync('git push', { cwd: repoRoot, stdio: 'pipe' });
            logActivity(req.user.id, 'SYNC_GITHUB', 'properties', null, { count: merged.length });
            res.json({
                success: true,
                message: `✅ Synced ${merged.length} properties to GitHub Pages! Live in ~60 seconds.`,
                count: merged.length
            });
        } catch (gitErr) {
            // JSON written OK, but git push failed
            const gitMsg = gitErr.stderr?.toString() || gitErr.message || 'git error';
            console.error('[sync-github] git error:', gitMsg);
            res.json({
                success: true,
                warning: 'properties.json updated locally but git push failed. Run: git add properties.json && git push',
                gitError: gitMsg,
                count: merged.length
            });
        }
    } catch (err) {
        console.error('[sync-github] error:', err);
        res.status(500).json({ error: 'Sync failed: ' + err.message });
    }
});

// Export all LOI submissions as CSV (admin only)
app.get('/api/admin/export-loi', authenticateToken, (req, res) => {
    const rows = db.prepare(`
        SELECT l.*, p.city, p.state, p.address
        FROM loi_submissions l
        LEFT JOIN properties p ON l.property_id = p.id
        ORDER BY l.created_at DESC
    `).all();

    const headers = [
        'id', 'created_at', 'status', 'loi_type',
        'first_name', 'last_name', 'email', 'phone', 'company',
        'city', 'state', 'address'
    ];
    const csvRows = rows.map(r =>
        headers.map(h => JSON.stringify(r[h] ?? '')).join(',')
    );
    const csv = [headers.join(','), ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="loi-submissions-${Date.now()}.csv"`);
    res.send(csv);
});

// Seed DB from properties.json (admin + auto-run on startup when empty)
function seedFromPropertiesJson() {
    const count = db.prepare('SELECT COUNT(*) as n FROM properties').get().n;
    if (count > 0) return;

    const propsFile = path.join(__dirname, '..', 'properties.json');
    if (!fs.existsSync(propsFile)) {
        console.log('[seed] properties.json not found — skipping seed.');
        return;
    }
    try {
        const props = JSON.parse(fs.readFileSync(propsFile, 'utf8'));
        const stmt = db.prepare(`
            INSERT OR IGNORE INTO properties
                (id, city, state, address, size_acres, price, type, listing_type,
                 status, description, lat, lon, image, broker_name, broker_email, broker_phone)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const insertMany = db.transaction((list) => {
            let n = 0;
            for (const p of list) {
                stmt.run(
                    p.id || null,
                    p.city, p.state, p.address || null,
                    p.size_acres || null, p.price || null,
                    p.property_type || p.type || 'land',
                    p.listing_type || 'sale',
                    p.status || 'available',
                    p.description || null,
                    p.lat || null, p.lon || null,
                    p.image_url || p.image || null,
                    p.broker_name || null, p.broker_email || null, p.broker_phone || null
                );
                n++;
            }
            return n;
        });
        const n = insertMany(props);
        console.log(`[seed] Imported ${n} properties from properties.json into local database.`);
    } catch (err) {
        console.error('[seed] Failed to seed from properties.json:', err.message);
    }
}



/** Returns all local IPv4 addresses for LAN access display */
function getLocalIPs() {
    const ifaces = os.networkInterfaces();
    const ips = [];
    for (const iface of Object.values(ifaces)) {
        for (const addr of iface) {
            if (addr.family === 'IPv4' && !addr.internal) ips.push(addr.address);
        }
    }
    return ips;
}

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

// ============= GLOBAL ERROR HANDLING =============

// Handle multer errors
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Too many files. Maximum is 5 files per upload.' });
        }
        return res.status(400).json({ error: err.message });
    }
    next(err);
});

// Handle validation errors
app.use((err, req, res, next) => {
    if (err.message && err.message.includes('File type')) {
        return res.status(400).json({ error: err.message });
    }
    next(err);
});

// Global error handler - don't leak error details in production
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${new Date().toISOString()}:`, err);
    
    // Log security-relevant errors
    if (err.status === 401 || err.status === 403) {
        console.log(`[SECURITY] Unauthorized access attempt: ${req.method} ${req.path} from ${req.ip}`);
    }
    
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(err.status || 500).json({
        error: isDev ? err.message : 'An unexpected error occurred',
        ...(isDev && { stack: err.stack })
    });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

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
        // Auto-seed from properties.json if DB is empty
        seedFromPropertiesJson();

        const port = await findAvailablePort(DEFAULT_PORT);
        const lanIPs = getLocalIPs();

        // Bind to all interfaces so team devices on the same WiFi can connect
        app.listen(port, '0.0.0.0', () => {
            const adminPw = process.env.ADMIN_PASSWORD || 'admin123';
            console.log('\n================================================');
            console.log('   🏪  WALMART REAL ESTATE — ICSC SERVER');
            console.log('================================================');
            console.log(`   ✅  Server running on port: ${port}`);
            console.log('');
            console.log('   💻  YOUR DEVICE (this laptop):');
            console.log(`       Admin:  http://localhost:${port}/admin.html`);
            console.log(`       Public: http://localhost:${port}/index.html`);
            if (lanIPs.length > 0) {
                console.log('');
                console.log('   📱  TEAM DEVICES (same WiFi/hotspot):');
                lanIPs.forEach(ip => {
                    console.log(`       Admin:  http://${ip}:${port}/admin.html`);
                    console.log(`       Public: http://${ip}:${port}/index.html`);
                });
            }
            console.log('');
            console.log('   🔑  Admin login:  admin / ' + adminPw);
            console.log('================================================\n');
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

startServer();
