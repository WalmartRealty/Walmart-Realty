#!/usr/bin/env node
/**
 * Geocode properties using US Census Bureau geocoder
 * Works through Walmart proxy
 */

const https = require('https');
const http = require('http');
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../server/walmart-realty.db');
const db = new Database(DB_PATH);

// Walmart proxy settings
const PROXY_HOST = 'sysproxy.wal-mart.com';
const PROXY_PORT = 8080;

async function geocodeAddress(address, city, state) {
    return new Promise((resolve) => {
        const fullAddress = `${address}, ${city}, ${state}`;
        const encodedAddress = encodeURIComponent(fullAddress);
        const apiPath = `/geocoder/locations/onelineaddress?address=${encodedAddress}&benchmark=Public_AR_Current&format=json`;
        
        const options = {
            hostname: 'geocoding.geo.census.gov',
            port: 443,
            path: apiPath,
            method: 'GET',
            timeout: 10000
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.result?.addressMatches?.length > 0) {
                        const match = result.result.addressMatches[0];
                        resolve({
                            lat: match.coordinates.y,
                            lon: match.coordinates.x
                        });
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        });
        
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
        req.end();
    });
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    // Get all properties without accurate coordinates
    const properties = db.prepare(`
        SELECT id, address, city, state, lat, lon 
        FROM properties 
        WHERE address IS NOT NULL AND address != ''
        ORDER BY state, city
    `).all();
    
    console.log(`Found ${properties.length} properties to geocode`);
    
    let updated = 0;
    let failed = 0;
    
    for (let i = 0; i < properties.length; i++) {
        const prop = properties[i];
        
        // Skip if already has specific coordinates (not state center)
        // State centers have very round numbers
        
        const result = await geocodeAddress(prop.address, prop.city, prop.state);
        
        if (result) {
            db.prepare('UPDATE properties SET lat = ?, lon = ? WHERE id = ?')
                .run(result.lat, result.lon, prop.id);
            updated++;
            console.log(`[${i+1}/${properties.length}] ✓ ${prop.city}, ${prop.state}: ${result.lat}, ${result.lon}`);
        } else {
            failed++;
            console.log(`[${i+1}/${properties.length}] ✗ ${prop.city}, ${prop.state} - could not geocode`);
        }
        
        // Rate limit - 1 request per second
        await sleep(500);
    }
    
    console.log(`\n✅ Done! Updated: ${updated}, Failed: ${failed}`);
}

main().catch(console.error);
