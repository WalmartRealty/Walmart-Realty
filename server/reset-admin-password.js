/**
 * reset-admin-password.js
 *
 * One-time script to update the admin user credentials in the database
 * from whatever is currently set in your .env file.
 *
 * Usage:
 *   cd server
 *   node reset-admin-password.js
 *
 * ⚠️  Run this from the server/ directory so .env is found correctly.
 * ⚠️  This script is safe to re-run — it will not duplicate users.
 */

'use strict';

require('dotenv').config();
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const path = require('path');

// ── Validate env vars before touching the database ───────────────────────────
const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;

if (!username || !password) {
    console.error('\n❌ ADMIN_USERNAME and ADMIN_PASSWORD must both be set in your .env file.');
    console.error('   Open server/.env and fill in those values, then re-run this script.\n');
    process.exit(1);
}

if (password.length < 12) {
    console.error('\n❌ ADMIN_PASSWORD must be at least 12 characters long.\n');
    process.exit(1);
}

// ── Connect to the database ───────────────────────────────────────────────────
const dbPath = path.join(__dirname, 'walmart-realty.db');
let db;

try {
    db = new Database(dbPath);
} catch (err) {
    console.error(`\n❌ Could not open database at ${dbPath}`);
    console.error('   Make sure you have run the server at least once to create the DB.\n');
    process.exit(1);
}

// ── Hash the new password ─────────────────────────────────────────────────────
console.log('\n🔒 Hashing password...');
const passwordHash = bcrypt.hashSync(password, 12);

// ── Upsert the admin user ─────────────────────────────────────────────────────
const existing = db.prepare('SELECT id FROM admin_users WHERE username = ?').get(username);

if (existing) {
    // User exists — update password only
    db.prepare(`
        UPDATE admin_users
        SET password_hash = ?
        WHERE username = ?
    `).run(passwordHash, username);

    console.log(`✅ Password updated for existing user: "${username}"`);
} else {
    // User doesn't exist yet — create them
    db.prepare(`
        INSERT INTO admin_users (username, password_hash, name, role)
        VALUES (?, ?, 'Administrator', 'super_admin')
    `).run(username, passwordHash);

    console.log(`✅ New admin user created: "${username}"`);
}

console.log('\n🎉 Done! You can now log in with your new credentials.');
console.log('   Make sure your server is running, then visit /admin.\n');

db.close();
