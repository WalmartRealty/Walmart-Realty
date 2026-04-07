/**
 * Database Initialization Script
 * Creates SQLite database with all required tables
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

console.log('🗄️  Initializing Walmart Real Estate Database...');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  -- Users table (for admin access)
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT DEFAULT 'admin' CHECK(role IN ('admin', 'broker', 'viewer')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Property status enum table
  CREATE TABLE IF NOT EXISTS property_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    color TEXT NOT NULL,
    description TEXT
  );

  -- Properties table
  CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_number TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    address TEXT,
    zip_code TEXT,
    latitude REAL,
    longitude REAL,
    size_acres REAL,
    size_sqft REAL,
    property_type TEXT DEFAULT 'land' CHECK(property_type IN ('land', 'retail', 'warehouse', 'office', 'mixed')),
    listing_type TEXT DEFAULT 'sale' CHECK(listing_type IN ('sale', 'lease', 'ground_lease', 'sublease')),
    price REAL,
    price_per_sqft REAL,
    price_per_acre REAL,
    status_id INTEGER DEFAULT 1,
    description TEXT,
    features TEXT,
    images TEXT,
    documents TEXT,
    broker_id INTEGER,
    broker_name TEXT,
    broker_email TEXT,
    broker_phone TEXT,
    is_featured INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (status_id) REFERENCES property_statuses(id),
    FOREIGN KEY (broker_id) REFERENCES users(id)
  );

  -- LOI Submissions table
  CREATE TABLE IF NOT EXISTS loi_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    loi_type TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    company TEXT NOT NULL,
    company_address TEXT,
    offer_price TEXT,
    earnest_money TEXT,
    lease_rate TEXT,
    lease_term TEXT,
    proposed_use TEXT,
    additional_comments TEXT,
    uploaded_file TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'reviewed', 'accepted', 'rejected', 'countered')),
    broker_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id)
  );

  -- Activity log for audit trail
  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

console.log('✅ Tables created');

// Insert default property statuses
const statuses = [
  { name: 'Available', color: '#22c55e', description: 'Property is available for sale or lease' },
  { name: 'Under Contract', color: '#f59e0b', description: 'Property has an accepted offer pending closing' },
  { name: 'Sold', color: '#3b82f6', description: 'Property has been sold' },
  { name: 'Leased', color: '#8b5cf6', description: 'Property has been leased' },
  { name: 'Pending', color: '#6b7280', description: 'Property listing is pending approval' },
  { name: 'Off Market', color: '#ef4444', description: 'Property has been removed from the market' }
];

const insertStatus = db.prepare(`
  INSERT OR IGNORE INTO property_statuses (name, color, description) VALUES (?, ?, ?)
`);

for (const status of statuses) {
  insertStatus.run(status.name, status.color, status.description);
}
console.log('✅ Property statuses created');

// Create default admin user
const adminEmail = 'admin@walmart.com';
const adminPassword = bcrypt.hashSync('WalmartRealty2024!', 10);

const insertAdmin = db.prepare(`
  INSERT OR IGNORE INTO users (email, password, first_name, last_name, role)
  VALUES (?, ?, ?, ?, ?)
`);

insertAdmin.run(adminEmail, adminPassword, 'Admin', 'User', 'admin');
console.log('✅ Default admin user created');
console.log('   Email: admin@walmart.com');
console.log('   Password: WalmartRealty2024!');

// Sample properties
const existingProperties = [
  { city: "Sherwood", state: "AR", size_acres: 2.43, type: "land", price: 500000, lat: 34.8151, lon: -92.2243 },
  { city: "Newport", state: "AR", size_acres: 1.12, type: "land", price: 300000, lat: 35.6045, lon: -91.2818 },
  { city: "Fort Scott", state: "KS", size_acres: 0.79, type: "land", price: 185000, lat: 37.8395, lon: -94.7085 },
  { city: "Coffeyville", state: "KS", size_acres: 1.28, type: "land", price: 425000, lat: 37.0373, lon: -95.6164 },
  { city: "Frisco", state: "TX", size_acres: 23.54, type: "retail", price: 13250000, lat: 33.1507, lon: -96.8236 },
  { city: "Lockhart", state: "TX", size_acres: 64.98, type: "land", price: 11500000, lat: 29.8849, lon: -97.6700 }
];

const insertProperty = db.prepare(`
  INSERT INTO properties (
    city, state, size_acres, property_type, listing_type, price, 
    latitude, longitude, status_id, is_active
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
`);

const propertyCount = db.prepare('SELECT COUNT(*) as count FROM properties').get();

if (propertyCount.count === 0) {
  for (const prop of existingProperties) {
    const listingType = Math.random() > 0.5 ? 'sale' : 'lease';
    insertProperty.run(prop.city, prop.state, prop.size_acres, prop.type, listingType, prop.price, prop.lat, prop.lon);
  }
  console.log(`✅ Imported ${existingProperties.length} sample properties`);
}

db.close();
console.log('\n🎉 Database initialization complete!');
