// Seed the database with existing property data
const { db, initializeDatabase } = require('./database');

initializeDatabase();

// Real Walmart Property Data - from Non-Earning Land Report
const properties = [
    { city: "Sherwood", state: "AR", size_acres: 2.43, property_type: "land", listing_type: "sale", price: 500000, lat: 34.8151, lon: -92.2243 },
    { city: "Newport", state: "AR", size_acres: 1.12, property_type: "land", listing_type: "sale", price: 300000, lat: 35.6045, lon: -91.2818 },
    { city: "Fort Scott", state: "KS", size_acres: 0.79, property_type: "land", listing_type: "sale", price: 185000, lat: 37.8395, lon: -94.7085 },
    { city: "Coffeyville", state: "KS", size_acres: 1.28, property_type: "land", listing_type: "sale", price: 425000, lat: 37.0373, lon: -95.6164 },
    { city: "Booneville", state: "AR", size_acres: 1.3, property_type: "land", listing_type: "sale", price: 275000, lat: 35.1401, lon: -93.9216 },
    { city: "Osceola", state: "AR", size_acres: 0.7, property_type: "land", listing_type: "sale", price: 165000, lat: 35.7051, lon: -89.9695 },
    { city: "Bastrop", state: "LA", size_acres: 1.21, property_type: "land", listing_type: "sale", price: 295000, lat: 32.7782, lon: -91.9085 },
    { city: "Kingfisher", state: "OK", size_acres: 1.03, property_type: "land", listing_type: "sale", price: 385000, lat: 35.8615, lon: -97.9317 },
    { city: "Chillicothe", state: "MO", size_acres: 0.75, property_type: "land", listing_type: "sale", price: 195000, lat: 39.7953, lon: -93.5522 },
    { city: "Lonoke", state: "AR", size_acres: 1.88, property_type: "land", listing_type: "sale", price: 725000, lat: 34.7837, lon: -91.8996 },
    { city: "Lincoln", state: "IL", size_acres: 1.48, property_type: "land", listing_type: "sale", price: 445000, lat: 40.1484, lon: -89.3648 },
    { city: "Brookfield", state: "MO", size_acres: 1.02, property_type: "land", listing_type: "sale", price: 285000, lat: 39.7847, lon: -93.0735 },
    { city: "Princeton", state: "KY", size_acres: 0.97, property_type: "land", listing_type: "sale", price: 225000, lat: 37.1092, lon: -87.8817 },
    { city: "McKinney", state: "TX", size_acres: 0.98, property_type: "land", listing_type: "sale", price: 875000, lat: 33.1972, lon: -96.6397 },
    { city: "Frisco", state: "TX", size_acres: 23.54, property_type: "retail", listing_type: "sale", price: 13250000, lat: 33.1507, lon: -96.8236 },
    { city: "Harrisburg", state: "IL", size_acres: 1.0, property_type: "land", listing_type: "sale", price: 195000, lat: 37.7384, lon: -88.5407 },
    { city: "Frisco", state: "TX", size_acres: 15.2, property_type: "land", listing_type: "sale", price: 8950000, lat: 33.1557, lon: -96.8050 },
    { city: "Lockhart", state: "TX", size_acres: 64.98, property_type: "land", listing_type: "sale", price: 11500000, lat: 29.8849, lon: -97.6700 },
    { city: "Navasota", state: "TX", size_acres: 12.5, property_type: "land", listing_type: "sale", price: 2450000, lat: 30.3880, lon: -96.0877 },
    { city: "Marlin", state: "TX", size_acres: 27.23, property_type: "retail", listing_type: "sale", price: 7950000, lat: 31.3063, lon: -96.8980 },
    { city: "Winfield", state: "AL", size_acres: 0.99, property_type: "land", listing_type: "sale", price: 185000, lat: 33.9290, lon: -87.8172 },
    { city: "Parsons", state: "KS", size_acres: 1.12, property_type: "land", listing_type: "sale", price: 215000, lat: 37.3403, lon: -95.2611 },
    { city: "Wellington", state: "KS", size_acres: 0.57, property_type: "land", listing_type: "sale", price: 145000, lat: 37.2653, lon: -97.3717 },
    { city: "Chandler", state: "OK", size_acres: 1.27, property_type: "land", listing_type: "sale", price: 325000, lat: 35.7012, lon: -96.8809 },
    { city: "Lindsay", state: "OK", size_acres: 0.82, property_type: "land", listing_type: "sale", price: 175000, lat: 34.8348, lon: -97.6017 },
    { city: "Vinita", state: "OK", size_acres: 1.18, property_type: "land", listing_type: "sale", price: 355000, lat: 36.6387, lon: -95.1541 },
    { city: "Wilburton", state: "OK", size_acres: 0.94, property_type: "land", listing_type: "sale", price: 195000, lat: 34.9190, lon: -95.3091 },
    { city: "Heavener", state: "OK", size_acres: 1.35, property_type: "land", listing_type: "sale", price: 285000, lat: 34.8893, lon: -94.6010 },
    { city: "Hugo", state: "OK", size_acres: 0.88, property_type: "land", listing_type: "sale", price: 165000, lat: 34.0106, lon: -95.5094 },
    { city: "Hominy", state: "OK", size_acres: 0.72, property_type: "land", listing_type: "sale", price: 135000, lat: 36.4145, lon: -96.3953 },
    { city: "Atoka", state: "OK", size_acres: 1.05, property_type: "land", listing_type: "sale", price: 255000, lat: 34.3860, lon: -96.1283 },
    { city: "Blackwell", state: "OK", size_acres: 0.91, property_type: "land", listing_type: "sale", price: 185000, lat: 36.8045, lon: -97.2831 },
    { city: "Grove", state: "OK", size_acres: 1.43, property_type: "land", listing_type: "sale", price: 475000, lat: 36.5937, lon: -94.7691 },
    { city: "Bristow", state: "OK", size_acres: 1.08, property_type: "land", listing_type: "sale", price: 295000, lat: 35.8309, lon: -96.3911 },
    { city: "Holdenville", state: "OK", size_acres: 0.79, property_type: "land", listing_type: "sale", price: 155000, lat: 35.0812, lon: -96.3989 },
    { city: "Wewoka", state: "OK", size_acres: 0.84, property_type: "land", listing_type: "sale", price: 145000, lat: 35.1573, lon: -96.4928 },
    { city: "Pauls Valley", state: "OK", size_acres: 1.22, property_type: "land", listing_type: "sale", price: 375000, lat: 34.7401, lon: -97.2223 },
    { city: "Henryetta", state: "OK", size_acres: 0.93, property_type: "land", listing_type: "sale", price: 195000, lat: 35.4398, lon: -95.9820 },
    { city: "Madill", state: "OK", size_acres: 1.15, property_type: "land", listing_type: "sale", price: 345000, lat: 34.0901, lon: -96.7714 },
    { city: "Hobart", state: "OK", size_acres: 0.87, property_type: "land", listing_type: "sale", price: 165000, lat: 35.0298, lon: -99.0931 },
    { city: "Drumright", state: "OK", size_acres: 0.68, property_type: "land", listing_type: "sale", price: 125000, lat: 35.9884, lon: -96.5986 },
    { city: "Coalgate", state: "OK", size_acres: 0.74, property_type: "land", listing_type: "sale", price: 135000, lat: 34.5376, lon: -96.2186 },
    { city: "Idabel", state: "OK", size_acres: 1.31, property_type: "land", listing_type: "sale", price: 295000, lat: 33.8957, lon: -94.8260 },
    { city: "Sallisaw", state: "OK", size_acres: 1.17, property_type: "land", listing_type: "lease", price: 8500, lat: 35.4598, lon: -94.7874 },
    { city: "Checotah", state: "OK", size_acres: 0.96, property_type: "land", listing_type: "lease", price: 6500, lat: 35.4701, lon: -95.5233 },
    { city: "Coweta", state: "OK", size_acres: 1.28, property_type: "land", listing_type: "lease", price: 12000, lat: 35.9515, lon: -95.6508 },
    { city: "Jay", state: "OK", size_acres: 0.89, property_type: "land", listing_type: "lease", price: 7500, lat: 36.4212, lon: -94.7899 },
    { city: "Pryor", state: "OK", size_acres: 1.45, property_type: "land", listing_type: "lease", price: 14500, lat: 36.3084, lon: -95.3169 },
    { city: "Tahlequah", state: "OK", size_acres: 1.67, property_type: "land", listing_type: "ground_lease", price: 18000, lat: 35.9154, lon: -94.9699 },
    { city: "Wagoner", state: "OK", size_acres: 1.23, property_type: "land", listing_type: "ground_lease", price: 13500, lat: 35.9598, lon: -95.3694 }
];

// Insert properties
const stmt = db.prepare(`
    INSERT INTO properties (
        city, state, size_acres, property_type, listing_type, price, lat, lon, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available')
`);

console.log('Seeding database with properties...');

let count = 0;
for (const p of properties) {
    stmt.run(p.city, p.state, p.size_acres, p.property_type, p.listing_type, p.price, p.lat, p.lon);
    count++;
}

console.log(`Successfully seeded ${count} properties!`);
console.log('Database ready.');
