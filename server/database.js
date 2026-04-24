const Database = require('better-sqlite3');
const path = require('path');

// Initialize database
const db = new Database(path.join(__dirname, 'walmart-realty.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
function initializeDatabase() {
    // Properties table
    db.exec(`
        CREATE TABLE IF NOT EXISTS properties (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            city TEXT NOT NULL,
            state TEXT NOT NULL,
            address TEXT,
            size_acres REAL,
            size_sqft INTEGER,
            property_type TEXT DEFAULT 'land',
            listing_type TEXT DEFAULT 'sale',
            price REAL,
            status TEXT DEFAULT 'available',
            description TEXT,
            features TEXT,
            lat REAL,
            lon REAL,
            image_url TEXT,
            broker_name TEXT,
            broker_email TEXT,
            broker_phone TEXT,
            store_number TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Property images table
    db.exec(`
        CREATE TABLE IF NOT EXISTS property_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            property_id INTEGER NOT NULL,
            image_url TEXT NOT NULL,
            is_primary INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
        )
    `);

    // Property documents table
    db.exec(`
        CREATE TABLE IF NOT EXISTS property_documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            property_id INTEGER NOT NULL,
            document_name TEXT NOT NULL,
            document_url TEXT NOT NULL,
            document_type TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
        )
    `);

    // LOI submissions table
    db.exec(`
        CREATE TABLE IF NOT EXISTS loi_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            property_id INTEGER NOT NULL,
            loi_type TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            company TEXT,
            company_address TEXT,
            form_data TEXT,
            file_name TEXT,
            status TEXT DEFAULT 'pending',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
        )
    `);

    // Admin users table
    db.exec(`
        CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT,
            email TEXT,
            role TEXT DEFAULT 'admin',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME
        )
    `);

    // Activity log table
    db.exec(`
        CREATE TABLE IF NOT EXISTS activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            entity_type TEXT,
            entity_id INTEGER,
            details TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('Database initialized successfully');
}

// Property status options
const PROPERTY_STATUSES = [
    'available',
    'under_contract',
    'sold',
    'leased',
    'pending',
    'off_market',
    'coming_soon'
];

const PROPERTY_TYPES = [
    'land',
    'retail',
    'warehouse',
    'office',
    'mixed_use',
    'industrial'
];

const LISTING_TYPES = [
    'sale',
    'lease',
    'sublease',
    'ground_lease'
];

module.exports = {
    db,
    initializeDatabase,
    PROPERTY_STATUSES,
    PROPERTY_TYPES,
    LISTING_TYPES
};
