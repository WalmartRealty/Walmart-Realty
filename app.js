// Real Walmart Property Data - Generated from Non-Earning Land Report
// Store numbers, cities, states, and sizes are REAL data
// Coordinates are based on city centers - actual property locations may vary

// Check for admin-managed properties in localStorage
const STORAGE_KEY = 'walmartRealtyProperties';
function getStoredProperties() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Only use if it's a valid array with properties
            if (Array.isArray(parsed) && parsed.length > 0) {
                console.log('Found', parsed.length, 'properties in localStorage');
                return parsed;
            }
        }
    } catch (e) {
        console.error('Error reading localStorage:', e);
        // Clear corrupted data
        localStorage.removeItem(STORAGE_KEY);
    }
    return null;
}

// Will be populated from properties-data.js
let rawProperties = getStoredProperties() || [];
let properties = [];
let filteredProperties = [];

// Load properties from properties.json file
async function loadPropertiesFromFile() {
    console.log('Attempting to load properties.json...');
    try {
        const response = await fetch('properties.json');
        console.log('Fetch response status:', response.status);
        if (response.ok) {
            const props = await response.json();
            console.log('Parsed', props.length, 'properties from JSON');
            return props.map((p, i) => ({
                ...p,
                id: p.id || p.store_num || (i + 1),
                listingType: 'sale',
                status: 'available'
            }));
        }
    } catch (e) {
        console.error('Failed to load properties from JSON:', e);
    }
    return null;
}

// Fallback properties if file load fails
const fallbackProperties = [
    { id: 51, city: "Rogers", state: "AR", address: "Near Mathis Airport Pkwy", size_acres: 33.38, type: "land", price: 7000000, lat: 36.3371533, lon: -94.2258899, listingType: "sale", status: "available", description: "Prime excess land parcel situated along major commercial corridor. 33.38 acres zoned retail with excellent visibility and traffic counts of 44,700 VPD on Peachtree Pkwy. Adjacent to Laurel Springs Golf Club with nearby retailers including Target, Home Depot, Lidl, CVS, and Five Guys.", features: ["High Traffic Location", "Retail Zoning", "Near Major Retailers", "Golf Course Adjacent", "Utilities Available"], store_number: "4686", broker: { name: "Minh Nguyen", email: "mnguyen@mnguyencre.com", phone: "(832) 555-0173", company: "Commercial Real Estate Broker" }, marketingMaterials: [{ name: "4686 Marketing Materials.pdf", url: "/uploads/4686 Marketing Materials.pdf", type: "application/pdf" }, { name: "Site Aerial Map.png", url: "/uploads/image3.png", type: "image/png" }, { name: "Broker Contact - Minh Nguyen.png", url: "/uploads/image5.png", type: "image/png" }, { name: "Aerial Site View.png", url: "/uploads/image6.png", type: "image/png" }], featured: true },
    { city: "Sherwood", state: "AR", size_acres: 2.43, type: "land", price: 500000, lat: 34.8151, lon: -92.2243 },
    { city: "Newport", state: "AR", size_acres: 1.12, type: "land", price: 300000, lat: 35.6045, lon: -91.2818 },
    { city: "Fort Scott", state: "KS", size_acres: 0.79, type: "land", price: 185000, lat: 37.8395, lon: -94.7085 },
    { city: "Coffeyville", state: "KS", size_acres: 1.28, type: "land", price: 425000, lat: 37.0373, lon: -95.6164 },
    { city: "Booneville", state: "AR", size_acres: 1.3, type: "land", price: 275000, lat: 35.1401, lon: -93.9216 },
    { city: "Osceola", state: "AR", size_acres: 0.7, type: "land", price: 165000, lat: 35.7051, lon: -89.9695 },
    { city: "Bastrop", state: "LA", size_acres: 1.21, type: "land", price: 295000, lat: 32.7782, lon: -91.9085 },
    { city: "Kingfisher", state: "OK", size_acres: 1.03, type: "land", price: 385000, lat: 35.8615, lon: -97.9317 },
    { city: "Chillicothe", state: "MO", size_acres: 0.75, type: "land", price: 195000, lat: 39.7953, lon: -93.5522 },
    { city: "Lonoke", state: "AR", size_acres: 1.88, type: "land", price: 725000, lat: 34.7837, lon: -91.8996 },
    { city: "Lincoln", state: "IL", size_acres: 1.48, type: "land", price: 445000, lat: 40.1484, lon: -89.3648 },
    { city: "Brookfield", state: "MO", size_acres: 1.02, type: "land", price: 285000, lat: 39.7847, lon: -93.0735 },
    { city: "Princeton", state: "KY", size_acres: 0.97, type: "land", price: 225000, lat: 37.1092, lon: -87.8817 },
    { city: "McKinney", state: "TX", size_acres: 0.98, type: "land", price: 875000, lat: 33.1972, lon: -96.6397 },
    { city: "Frisco", state: "TX", size_acres: 23.54, type: "retail", price: 13250000, lat: 33.1507, lon: -96.8236 },
    { city: "Harrisburg", state: "IL", size_acres: 1.0, type: "land", price: 195000, lat: 37.7384, lon: -88.5407 },
    { city: "Frisco", state: "TX", size_acres: 15.2, type: "land", price: 8950000, lat: 33.1557, lon: -96.8050 },
    { city: "Lockhart", state: "TX", size_acres: 64.98, type: "land", price: 11500000, lat: 29.8849, lon: -97.6700 },
    { city: "Navasota", state: "TX", size_acres: 12.5, type: "land", price: 2450000, lat: 30.3880, lon: -96.0877 },
    { city: "Marlin", state: "TX", size_acres: 27.23, type: "retail", price: 7950000, lat: 31.3063, lon: -96.8980 },
    { city: "Winfield", state: "AL", size_acres: 0.99, type: "land", price: 185000, lat: 33.9290, lon: -87.8172 },
    { city: "Parsons", state: "KS", size_acres: 1.12, type: "land", price: 215000, lat: 37.3403, lon: -95.2611 },
    { city: "Wellington", state: "KS", size_acres: 0.57, type: "land", price: 145000, lat: 37.2653, lon: -97.3717 },
    { city: "Chandler", state: "OK", size_acres: 1.27, type: "land", price: 325000, lat: 35.7012, lon: -96.8809 },
    { city: "Wichita Falls", state: "TX", size_acres: 3.42, type: "land", price: 1250000, lat: 33.9137, lon: -98.4934 },
    { city: "Fairbury", state: "NE", size_acres: 4.88, type: "land", price: 895000, lat: 40.1372, lon: -97.1803 },
    { city: "Brent", state: "AL", size_acres: 1.46, type: "land", price: 275000, lat: 32.9376, lon: -87.1647 },
    { city: "Carlyle", state: "IL", size_acres: 1.16, type: "land", price: 225000, lat: 38.6103, lon: -89.3726 },
    { city: "Vidor", state: "TX", size_acres: 1.02, type: "land", price: 285000, lat: 30.1316, lon: -94.0155 },
    { city: "Carthage", state: "TX", size_acres: 0.97, type: "land", price: 245000, lat: 32.1574, lon: -94.3374 },
    { city: "Gainesville", state: "FL", size_acres: 1.31, type: "land", price: 685000, lat: 29.6516, lon: -82.3248 },
    { city: "Columbia", state: "KY", size_acres: 1.0, type: "land", price: 195000, lat: 37.1026, lon: -85.3066 },
    { city: "Lake City", state: "SC", size_acres: 1.13, type: "land", price: 325000, lat: 33.8710, lon: -79.7553 },
    { city: "Norfolk", state: "NE", size_acres: 0.95, type: "land", price: 275000, lat: 42.0285, lon: -97.4170 },
    { city: "Anamosa", state: "IA", size_acres: 1.02, type: "land", price: 215000, lat: 42.1083, lon: -91.2852 },
    { city: "Garden City", state: "KS", size_acres: 0.8, type: "land", price: 185000, lat: 37.9717, lon: -100.8727 },
    { city: "Dade City", state: "FL", size_acres: 23.4, type: "retail", price: 5500000, lat: 28.3647, lon: -82.1959 },
    { city: "Cedartown", state: "GA", size_acres: 1.46, type: "land", price: 395000, lat: 34.0243, lon: -85.2549 },
    { city: "Independence", state: "IA", size_acres: 1.04, type: "land", price: 225000, lat: 42.4686, lon: -91.8893 },
    { city: "Pella", state: "IA", size_acres: 1.05, type: "land", price: 285000, lat: 41.4083, lon: -92.9163 },
    { city: "Columbus", state: "NE", size_acres: 1.49, type: "land", price: 345000, lat: 41.4297, lon: -97.3684 },
    { city: "Peru", state: "IL", size_acres: 0.89, type: "land", price: 265000, lat: 41.3276, lon: -89.1290 },
    { city: "Liberal", state: "KS", size_acres: 0.88, type: "land", price: 195000, lat: 37.0431, lon: -100.9212 },
    { city: "Monroe", state: "WI", size_acres: 2.41, type: "land", price: 575000, lat: 42.6011, lon: -89.6385 },
    { city: "Bogalusa", state: "LA", size_acres: 1.57, type: "land", price: 345000, lat: 30.7910, lon: -89.8487 },
    { city: "Warner Robins", state: "GA", size_acres: 0.77, type: "land", price: 425000, lat: 32.6130, lon: -83.5999 },
    { city: "Dodgeville", state: "WI", size_acres: 2.51, type: "land", price: 485000, lat: 42.9602, lon: -90.1301 },
    { city: "Prairie Du Chien", state: "WI", size_acres: 0.97, type: "land", price: 225000, lat: 43.0517, lon: -91.1418 },
    { city: "Seward", state: "NE", size_acres: 1.42, type: "land", price: 315000, lat: 40.9069, lon: -97.0992 },
    { city: "Sterling", state: "IL", size_acres: 1.55, type: "land", price: 385000, lat: 41.7886, lon: -89.6962 }
];

// Property thumbnail images - Walmart-style commercial real estate photos
// Big-box retail, large parking lots, commercial development
const landImages = [
    // Commercial parking lots and development land
    "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&h=600&fit=crop", // large parking lot
    "https://images.unsplash.com/photo-1567449303078-57ad995bd329?w=800&h=600&fit=crop", // retail exterior
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop", // commercial building
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=600&fit=crop", // warehouse/industrial
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop", // distribution center
];

const retailImages = [
    // Big-box retail stores and supercenters
    "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&h=600&fit=crop", // big box store exterior
    "https://images.unsplash.com/photo-1567449303078-57ad995bd329?w=800&h=600&fit=crop", // retail storefront
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop", // shopping center
    "https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800&h=600&fit=crop", // strip mall
    "https://images.unsplash.com/photo-1519642918688-7e43b19245d8?w=800&h=600&fit=crop", // commercial retail
];

// Get property thumbnail image
function getPropertyImage(index, type) {
    const images = type === 'retail' ? retailImages : landImages;
    return images[index % images.length];
}

// Transform raw data into full property objects
function transformProperties(rawProps) {
    return rawProps.map((p, index) => {
        const isRetail = p.type === 'retail';
        
        // Get thumbnail image
        const image = getPropertyImage(index, p.type);
        
        // Calculate price per acre for land
        const pricePerAcre = p.size_acres ? Math.round((p.price || 0) / p.size_acres) : null;
        
        // If property already has full data, preserve it
        if (p.id && p.marketingMaterials) {
            return {
                ...p,
                title: p.title || (isRetail 
                    ? `Former Retail Location - ${p.city}, ${p.state}`
                    : `Development Land - ${p.city}, ${p.state}`),
                pricePerAcre: pricePerAcre,
                sizeAcres: p.size_acres,
                image: image,
                zip: p.zip || getZipForState(p.state),
                lotSize: `${p.size_acres} acres`,
                zoning: p.zoning || 'Commercial'
            };
        }
        
        return {
            id: p.id || p.store_num || (index + 1),
            store_num: p.store_num,
            title: isRetail 
                ? `Former Retail Location - ${p.city}, ${p.state}`
                : `Development Land - ${p.city}, ${p.state}`,
            type: p.type || 'land',
            listingType: p.listingType || 'sale',
            price: p.price,
            pricePerAcre: pricePerAcre,
            sizeAcres: p.size_acres,
            size: isRetail ? Math.round(p.size_acres * 43560 * 0.15) : null,
            address: p.address || `Commercial Property`,
            city: p.city,
            state: p.state,
            zip: p.zip || getZipForState(p.state),
            lat: p.lat,
            lon: p.lon,
            image: image,
            description: p.description || (isRetail
                ? `Former retail location in ${p.city}, ${p.state}. Prime commercial property with excellent visibility and established traffic patterns. ${p.size_acres} acre site ready for redevelopment or continued retail use.`
                : `Development-ready land parcel in ${p.city}, ${p.state}. ${p.size_acres} acres of commercial-zoned land ideal for retail, restaurant, or service businesses. Excellent location with strong demographics.`),
        features: p.features || (isRetail
            ? [`${p.size_acres} Acre Site`, 'Established Location', 'High Traffic Area', 'Utilities In Place', 'Signalized Access']
            : [`${p.size_acres} Acres`, 'Commercial Zoning', 'Utilities Available', 'Pad-Ready', 'Strong Demographics']),
        yearBuilt: null,
        lotSize: `${p.size_acres} acres`,
        zoning: p.zoning || 'Commercial',
        broker: p.broker || (p.broker_name ? {
            name: p.broker_name,
            email: p.broker_email,
            phone: p.broker_phone,
            company: p.broker_company || 'Walmart Realty'
        } : null),
        // Keep raw broker fields for fallback
        broker_name: p.broker_name || null,
        broker_email: p.broker_email || null,
        broker_phone: p.broker_phone || null,
        broker_company: p.broker_company || null,
        marketingMaterials: p.marketingMaterials || null,
        store_number: p.store_number || p.store_num || null,
        featured: p.featured || false
    };
    });
}

// Helper function to generate plausible ZIP codes
function getZipForState(state) {
    const stateZips = {
        'AR': '72', 'KS': '66', 'LA': '70', 'OK': '73', 'MO': '64', 'IL': '62',
        'KY': '42', 'TX': '75', 'AL': '35', 'NE': '68', 'FL': '32', 'SC': '29',
        'IA': '52', 'GA': '30', 'WI': '53'
    };
    const prefix = stateZips[state] || '70';
    return prefix + String(Math.floor(Math.random() * 900) + 100);
}

// Current view state
let currentView = 'grid';

// Fetch properties from API, file, or localStorage
async function fetchPropertiesFromAPI() {
    console.log('fetchPropertiesFromAPI called');
    
    // 1. Check localStorage first (admin-managed properties)
    const stored = getStoredProperties();
    if (stored && stored.length > 0) {
        console.log(`Loading ${stored.length} properties from localStorage`);
        rawProperties = stored;
        properties.length = 0;
        properties.push(...transformProperties(rawProperties));
        filteredProperties = [...properties];
        console.log('Properties loaded from localStorage:', properties.length);
        return;
    }
    
    // 2. Try loading from properties.json file (GitHub Pages)
    console.log('No localStorage data, trying properties.json...');
    try {
        const fileProps = await loadPropertiesFromFile();
        if (fileProps && fileProps.length > 0) {
            console.log(`Loaded ${fileProps.length} properties from properties.json`);
            rawProperties = fileProps;
            properties.length = 0;
            try {
                const transformed = transformProperties(rawProperties);
                console.log('Transformed', transformed.length, 'properties');
                properties.push(...transformed);
            } catch (transformError) {
                console.error('Error in transformProperties:', transformError);
                // Fallback: just use raw properties directly
                properties.push(...rawProperties.map((p, i) => ({
                    ...p,
                    id: p.id || p.store_num || (i + 1),
                    title: `Property in ${p.city}, ${p.state}`,
                    image: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&h=600&fit=crop',
                    listingType: 'sale',
                    status: 'available',
                    sizeAcres: p.size_acres,
                    lotSize: `${p.size_acres} acres`
                })));
            }
            filteredProperties = [...properties];
            console.log('Final properties count:', properties.length);
            console.log('Final filteredProperties count:', filteredProperties.length);
            return;
        }
    } catch (e) {
        console.error('Error loading from file:', e);
    }
    
    // 3. Try API (backend server mode)
    try {
        const response = await fetch(`${window.location.origin}/api/properties`);
        if (response.ok) {
            const apiProps = await response.json();
            properties.length = 0;
            apiProps.forEach(p => {
                properties.push({
                    id: p.id,
                    city: p.city || '',
                    state: p.state || '',
                    address: p.address || '',
                    size_acres: p.size_acres || 0,
                    lotSize: p.size_acres ? `${p.size_acres} acres` : 'N/A',
                    type: p.property_type || 'land',
                    listingType: p.listing_type || 'sale',
                    price: p.price || 0,
                    status: p.status || 'available',
                    description: p.description || `Marketable property in ${p.city}, ${p.state}`,
                    lat: p.lat || 0,
                    lon: p.lon || 0,
                    store_number: p.store_number || '',
                    broker_name: p.broker_name || '',
                    features: ['Commercial Zoning', 'Utilities Available'],
                    featured: false,
                    zip: getZipForState(p.state)
                });
            });
            console.log(`Loaded ${properties.length} properties from API`);
            filteredProperties = [...properties];
            return;
        }
    } catch (error) {
        console.log('API not available, using fallback');
    }
    
    // 4. Fallback to hardcoded properties
    console.log(`Using ${fallbackProperties.length} fallback properties`);
    rawProperties = fallbackProperties;
    properties.length = 0;
    properties.push(...transformProperties(rawProperties));
    filteredProperties = [...properties];
}

// Format price for display
function formatPrice(price, listingType) {
    // Handle null/undefined prices
    if (price === null || price === undefined) {
        return 'Contact for Pricing';
    }
    if (listingType === 'lease') {
        return `$${price.toLocaleString()}/SF/YR`;
    }
    if (price >= 1000000) {
        return `$${(price / 1000000).toFixed(1)}M`;
    }
    return `$${price.toLocaleString()}`;
}

// Format size for display
function formatSize(size) {
    if (!size) return 'N/A';
    return `${size.toLocaleString()} SF`;
}

// Get property type label
function getTypeLabel(type) {
    const labels = {
        land: 'Land',
        outlots: 'Outlots',
        'dark-stores': 'Dark Stores',
        retail: 'Retail',
        warehouse: 'Warehouse',
        office: 'Office',
        industrial: 'Industrial'
    };
    return labels[type] || type;
}

// Get listing type badge color
function getListingBadgeClass(listingType) {
    return listingType === 'sale' 
        ? 'bg-green-500 text-white' 
        : 'bg-walmart-blue text-white';
}

// Gallery scroll helper
function scrollGallery(button, direction) {
    const gallery = button.closest('.relative').querySelector('.overflow-x-auto');
    const scrollAmount = gallery.offsetWidth;
    gallery.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

// Open image in lightbox
function openImageLightbox(imageUrl, imageName) {
    // Create lightbox overlay
    const lightbox = document.createElement('div');
    lightbox.id = 'image-lightbox';
    lightbox.className = 'fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4';
    lightbox.onclick = (e) => { if (e.target === lightbox) lightbox.remove(); };
    
    lightbox.innerHTML = `
        <div class="relative max-w-6xl max-h-full">
            <button onclick="document.getElementById('image-lightbox').remove()" 
                    class="absolute -top-12 right-0 text-white hover:text-gray-300 p-2">
                <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
            <img src="${imageUrl}" alt="${imageName}" class="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl">
            <p class="text-white text-center mt-4 text-lg">${imageName}</p>
        </div>
    `;
    
    document.body.appendChild(lightbox);
    
    // Close on escape key
    const closeOnEscape = (e) => {
        if (e.key === 'Escape') {
            lightbox.remove();
            document.removeEventListener('keydown', closeOnEscape);
        }
    };
    document.addEventListener('keydown', closeOnEscape);
}

// Create property card HTML
// Generate satellite map thumbnail URL from coordinates
function getSatelliteThumbUrl(lat, lon) {
    // Using ESRI World Imagery tile server - free, no API key needed
    // Calculate tile coordinates for zoom level 15
    const zoom = 15;
    const n = Math.pow(2, zoom);
    const x = Math.floor((lon + 180) / 360 * n);
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
    return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;
}

function createPropertyCard(property) {
    const priceDisplay = formatPrice(property.price, property.listingType);
    const listingLabel = property.listingType === 'sale' ? 'For Sale' : 'For Lease';
    const satelliteUrl = getSatelliteThumbUrl(property.lat, property.lon);
    
    return `
        <article class="property-card bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg" 
                 onclick="openPropertyModal(${property.id})"
                 tabindex="0"
                 role="button"
                 aria-label="View details for ${property.title}"
                 onkeydown="if(event.key==='Enter') openPropertyModal(${property.id})">
            <div class="p-5 border-b border-gray-100">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <div class="h-14 w-14 rounded-xl overflow-hidden shadow-sm border-2 border-gray-200 flex-shrink-0">
                            <img src="${satelliteUrl}" 
                                 alt="Satellite view of ${property.city}, ${property.state}" 
                                 class="h-full w-full object-cover"
                                 loading="lazy"
                                 onerror="this.parentElement.innerHTML='<div class=\'h-full w-full bg-gray-200 flex items-center justify-center text-gray-400\'><svg class=\'h-6 w-6\' fill=\'none\' stroke=\'currentColor\' viewBox=\'0 0 24 24\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z\'/><path stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M15 11a3 3 0 11-6 0 3 3 0 016 0z\'/></svg></div>'">
                        </div>
                        <div>
                            <div class="flex gap-2 mb-1">
                                <span class="px-2 py-0.5 rounded-full text-xs font-semibold ${getListingBadgeClass(property.listingType)}">
                                    ${listingLabel}
                                </span>
                                <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                    ${getTypeLabel(property.type)}
                                </span>
                            </div>
                            <h4 class="text-lg font-bold text-gray-900 line-clamp-1">${property.city}, ${property.state}</h4>
                        </div>
                    </div>
                    <img src="spark-logo.png" alt="Walmart" class="h-7 w-7 object-contain">
                </div>
                <p class="text-gray-600 text-sm flex items-center gap-1">
                    <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    ${property.lotSize} · ${property.zoning || 'Commercial'} Zoning
                </p>
            </div>
            <div class="p-5 bg-gray-50">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-lg font-semibold text-walmart-blue">View Details</p>
                    </div>
                    <button class="p-2 rounded-full hover:bg-white transition-colors focus-visible shadow-sm bg-white" 
                            aria-label="${isPropertySaved(property.id) ? 'Remove from saved' : 'Save property'}"
                            onclick="event.stopPropagation(); toggleSave(${property.id})">
                        <svg data-heart-id="${property.id}" class="h-6 w-6 ${isPropertySaved(property.id) ? 'text-red-500' : 'text-gray-400'} hover:text-red-500 transition-colors" fill="${isPropertySaved(property.id) ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </article>
    `;
}

// Render properties
function renderProperties() {
    const container = document.getElementById('property-grid');
    
    if (filteredProperties.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-16">
                <svg class="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">No properties found</h3>
                <p class="text-gray-500">Try adjusting your search criteria</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredProperties.map(createPropertyCard).join('');
    
    // Update results count
    const countEl = document.getElementById('results-count');
    if (countEl) {
        countEl.innerHTML = `Showing <span class="font-semibold">${filteredProperties.length}</span> ${filteredProperties.length === 1 ? 'property' : 'properties'}`;
    }
}

// Set view mode
function setView(view) {
    currentView = view;
    const gridBtn = document.getElementById('grid-view-btn');
    const listBtn = document.getElementById('list-view-btn');
    const container = document.getElementById('property-grid');
    
    if (view === 'grid') {
        gridBtn.className = 'p-2 bg-walmart-blue text-white focus-visible';
        gridBtn.setAttribute('aria-pressed', 'true');
        listBtn.className = 'p-2 bg-white text-gray-600 hover:bg-gray-100 focus-visible';
        listBtn.setAttribute('aria-pressed', 'false');
        container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    } else {
        listBtn.className = 'p-2 bg-walmart-blue text-white focus-visible';
        listBtn.setAttribute('aria-pressed', 'true');
        gridBtn.className = 'p-2 bg-white text-gray-600 hover:bg-gray-100 focus-visible';
        gridBtn.setAttribute('aria-pressed', 'false');
        container.className = 'grid grid-cols-1 gap-4';
    }
}

// Filter properties
function filterProperties() {
    const propertyType = document.getElementById('property-type').value;
    const listingType = document.getElementById('listing-type').value;
    const stateFilter = document.getElementById('state-filter').value;
    const priceRange = document.getElementById('price-range').value;
    const sizeRange = document.getElementById('size-range').value;
    
    filteredProperties = properties.filter(property => {
        // Property type filter - map dropdown values to data types
        if (propertyType) {
            const acres = property.size_acres || property.sizeAcres || 0;
            if (propertyType === 'land' && property.type !== 'land') return false;
            if (propertyType === 'outlots' && (property.type !== 'land' || acres >= 5)) return false;
            if (propertyType === 'dark-stores' && property.type !== 'retail') return false;
        }
        
        // Listing type filter
        if (listingType && property.listingType !== listingType) return false;
        
        // State filter
        if (stateFilter && property.state !== stateFilter) return false;
        
        // Price filter
        if (priceRange) {
            const [min, max] = priceRange.split('-').map(p => {
                if (p.includes('+')) return Infinity;
                return parseInt(p);
            });
            if (property.price < min || property.price > max) return false;
        }
        
        // Size filter (acres)
        if (sizeRange) {
            const acres = property.size_acres || property.sizeAcres || 0;
            if (sizeRange === '0-1' && acres >= 1) return false;
            if (sizeRange === '1-5' && (acres < 1 || acres >= 5)) return false;
            if (sizeRange === '5-20' && (acres < 5 || acres >= 20)) return false;
            if (sizeRange === '20+' && acres < 20) return false;
        }
        
        return true;
    });
    
    // Sort and render
    sortProperties();
    renderProperties();
    updateMapMarkers();
}

// Perform keyword search from the main search bar
function performSearch() {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (!searchTerm) {
        // If empty, just run the filter with current dropdown values
        filterProperties();
        return;
    }
    
    // Get current filter values
    const propertyType = document.getElementById('property-type').value;
    const listingType = document.getElementById('listing-type').value;
    const stateFilter = document.getElementById('state-filter').value;
    const priceRange = document.getElementById('price-range').value;
    const sizeRange = document.getElementById('size-range').value;
    
    filteredProperties = properties.filter(property => {
        // Keyword search - check multiple fields
        const searchFields = [
            property.title,
            property.city,
            property.state,
            property.address,
            property.description,
            property.zoning,
            String(property.price),
            property.features?.join(' ')
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchFields.includes(searchTerm)) return false;
        
        // Apply other filters too
        // Property type filter
        if (propertyType) {
            const acres = property.size_acres || property.sizeAcres || 0;
            if (propertyType === 'land' && property.type !== 'land') return false;
            if (propertyType === 'outlots' && (property.type !== 'land' || acres >= 5)) return false;
            if (propertyType === 'dark-stores' && property.type !== 'retail') return false;
        }
        
        // Listing type filter
        if (listingType && property.listingType !== listingType) return false;
        
        // State filter
        if (stateFilter && property.state !== stateFilter) return false;
        
        // Price filter
        if (priceRange) {
            const [min, max] = priceRange.split('-').map(p => {
                if (p.includes('+')) return Infinity;
                return parseInt(p);
            });
            if (property.price < min || property.price > max) return false;
        }
        
        // Size filter
        if (sizeRange) {
            const acres = property.size_acres || property.sizeAcres || 0;
            if (sizeRange === '0-1' && acres >= 1) return false;
            if (sizeRange === '1-5' && (acres < 1 || acres >= 5)) return false;
            if (sizeRange === '5-20' && (acres < 5 || acres >= 20)) return false;
            if (sizeRange === '20+' && acres < 20) return false;
        }
        
        return true;
    });
    
    sortProperties();
    renderProperties();
    updateMapMarkers();
}

// Filter by listing type (For Sale / For Lease) - called from nav links
function filterByType(type) {
    const listingTypeSelect = document.getElementById('listing-type');
    listingTypeSelect.value = type;
    filterProperties();
}

// Filter by property type - called from footer links
function filterByPropertyType(type) {
    const propertyTypeSelect = document.getElementById('property-type');
    propertyTypeSelect.value = type;
    filterProperties();
}

// Sort properties
function sortProperties() {
    const sortValue = document.getElementById('sort').value;
    
    filteredProperties.sort((a, b) => {
        const aSize = a.size_acres || a.sizeAcres || 0;
        const bSize = b.size_acres || b.sizeAcres || 0;
        
        switch (sortValue) {
            case 'price-low':
                return a.price - b.price;
            case 'price-high':
                return b.price - a.price;
            case 'size-high':
                return bSize - aSize;
            case 'size-low':
                return aSize - bSize;
            case 'state':
                return a.state.localeCompare(b.state);
            case 'newest':
            default:
                return b.id - a.id; // Higher ID = newer
        }
    });
}

// Open property modal
function openPropertyModal(id) {
    const property = properties.find(p => p.id === id);
    if (!property) return;
    
    const modal = document.getElementById('property-modal');
    const content = document.getElementById('modal-content');
    const priceDisplay = formatPrice(property.price, property.listingType);
    const listingLabel = property.listingType === 'sale' ? 'For Sale' : 'For Lease';
    
    // Google Maps embed URL for satellite view (free, no API key needed)
    const mapsLink = `https://www.google.com/maps/@${property.lat},${property.lon},500m/data=!3m1!1e3`;
    
    content.innerHTML = `
        <div class="relative">
            <!-- Interactive Map Container -->
            <div id="property-map" class="w-full h-64 md:h-80 bg-gray-200 z-0"></div>
            <button onclick="closePropertyModal()" 
                    class="absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white transition-colors focus-visible z-10"
                    aria-label="Close modal">
                <svg class="h-6 w-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
            <div class="absolute bottom-4 left-4 flex gap-2 z-10">
                <span class="px-4 py-2 rounded-full text-sm font-semibold ${getListingBadgeClass(property.listingType)}">
                    ${listingLabel}
                </span>
                <span class="px-4 py-2 rounded-full text-sm font-semibold bg-gray-800 text-white">
                    ${getTypeLabel(property.type)}
                </span>
            </div>
            <a href="${mapsLink}" target="_blank" rel="noopener noreferrer" 
               class="absolute bottom-4 right-4 px-4 py-2 rounded-full text-sm font-semibold bg-white text-gray-800 hover:bg-gray-100 transition-colors z-10 flex items-center gap-2">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
                Open in Google Maps
            </a>
        </div>
        <div class="p-6 md:p-8">
            <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                <div>
                    <h2 id="modal-title" class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">${property.title}</h2>
                    <p class="text-gray-600 flex items-center gap-2">
                        <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        ${property.city}, ${property.state} ${property.zip}
                    </p>
                    <p class="text-gray-400 text-sm mt-1">Coordinates: ${property.lat}, ${property.lon}</p>
                </div>
                <div class="text-right">
                    <p class="text-2xl font-bold text-walmart-blue">Contact for Pricing</p>
                </div>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-gray-50 p-4 rounded-lg text-center">
                    <p class="text-2xl font-bold text-gray-900">${property.lotSize}</p>
                    <p class="text-sm text-gray-500">Lot Size</p>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg text-center">
                    <p class="text-2xl font-bold text-gray-900">${property.zoning}</p>
                    <p class="text-sm text-gray-500">Zoning</p>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg text-center">
                    <p class="text-2xl font-bold text-gray-900">${property.state}</p>
                    <p class="text-sm text-gray-500">State</p>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg text-center">
                    <p class="text-2xl font-bold text-walmart-blue">${property.type === 'retail' ? 'Retail' : 'Land'}</p>
                    <p class="text-sm text-gray-500">Property Type</p>
                </div>
            </div>
            
            <!-- Contact Button - Centered -->
            <div class="flex justify-center mb-6">
                <button onclick="openLOIModal(${property.id})" 
                   class="bg-walmart-blue hover:bg-walmart-dark text-white text-center font-semibold py-3 px-8 rounded-lg transition-colors focus-visible text-lg">
                    Contact About Property
                </button>
            </div>
            
            ${property.description ? `
            <div class="mb-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p class="text-gray-600">${property.description}</p>
            </div>
            ` : ''}
            
            ${property.features && property.features.length > 0 ? `
            <div class="mb-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-3">Features</h3>
                <ul class="grid grid-cols-1 md:grid-cols-2 gap-2">
                    ${property.features.map(feature => `
                        <li class="flex items-center gap-2 text-gray-600">
                            <svg class="h-5 w-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            ${feature}
                        </li>
                    `).join('')}
                </ul>
            </div>
            ` : ''}
            
            <!-- Marketing Materials Section -->
            <div id="marketing-materials-section" class="mb-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-3">📎 Marketing Materials</h3>
                <div id="marketing-materials-container" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <p class="text-gray-500">Loading materials...</p>
                </div>
            </div>
            
            <!-- Broker Contact Section -->
            <div id="broker-contact-section" class="mb-8 p-8 bg-blue-50 rounded-xl border-2 border-blue-200 shadow-md text-center">
                <h3 class="text-2xl font-bold text-gray-900 mb-6">Broker Contact</h3>
                <div id="broker-contact-container">
                    ${property.broker_name ? `
                        <p class="font-bold text-gray-900 text-3xl mb-2">${property.broker_name}</p>
                        <p class="text-xl text-gray-600 mb-4">${property.broker_company || 'Walmart Realty'}</p>
                        ${property.broker_phone ? `<p class="mb-3"><a href="tel:${property.broker_phone.replace(/[^0-9+]/g, '')}" class="text-2xl font-bold text-walmart-blue hover:underline">${property.broker_phone}</a></p>` : ''}
                        ${property.broker_email ? `<p><a href="mailto:${property.broker_email}" class="text-xl text-walmart-blue hover:underline font-medium">${property.broker_email}</a></p>` : ''}
                    ` : `
                        <p class="text-gray-600 text-lg">Contact us for information about this property.</p>
                        <p class="mt-3"><a href="mailto:realestate@walmart.com" class="text-xl text-walmart-blue hover:underline">realestate@walmart.com</a></p>
                    `}
                </div>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
    
    // Initialize Leaflet map after modal is visible
    setTimeout(() => {
        const mapContainer = document.getElementById('property-map');
        if (mapContainer && typeof L !== 'undefined') {
            // Clear any existing map
            mapContainer.innerHTML = '';
            
            // Create the map
            const map = L.map('property-map').setView([property.lat, property.lon], 17);
            
            // Add satellite tile layer (ESRI World Imagery - free, no API key)
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri',
                maxZoom: 19
            }).addTo(map);
            
            // Add a marker for the property
            const marker = L.marker([property.lat, property.lon]).addTo(map);
            marker.bindPopup(`<b>${property.title}</b><br>${property.city}, ${property.state}`).openPopup();
            
            // Store map reference for cleanup
            mapContainer._leafletMap = map;
        }
    }, 100);
    
    // Auto-load marketing materials and broker info
    loadMarketingMaterials(property.id);
    loadBrokerContact(property.state, property.id);
    
    // Setup dynamic scrollbar sizing
    setupDynamicScrollbar();
    
    // Focus trap
    modal.querySelector('button').focus();
}

// Dynamic scrollbar that shrinks as you scroll down
function setupDynamicScrollbar() {
    const scrollContainer = document.getElementById('modal-scroll-container');
    if (!scrollContainer) return;
    
    scrollContainer.addEventListener('scroll', function() {
        const scrollTop = this.scrollTop;
        const scrollHeight = this.scrollHeight - this.clientHeight;
        const scrollPercent = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
        
        // Scrollbar width: starts at 10px, shrinks to 4px at bottom
        const maxWidth = 10;
        const minWidth = 4;
        const width = maxWidth - (scrollPercent * (maxWidth - minWidth));
        
        this.style.setProperty('--scrollbar-width', `${width}px`);
    });
    
    // Reset scrollbar width when modal opens
    scrollContainer.style.setProperty('--scrollbar-width', '10px');
    scrollContainer.scrollTop = 0;
}

// Close property modal
function closePropertyModal() {
    const modal = document.getElementById('property-modal');
    
    // Clean up Leaflet map
    const mapContainer = document.getElementById('property-map');
    if (mapContainer && mapContainer._leafletMap) {
        mapContainer._leafletMap.remove();
        mapContainer._leafletMap = null;
    }
    
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
}

// Show marketing materials for a property
async function showMarketingMaterials(propertyId) {
    await loadMarketingMaterials(propertyId);
}

// Render a PDF page to canvas and return as image
async function renderPdfPageAsImage(pdfUrl, pageNum) {
    const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
    const page = await pdf.getPage(pageNum);
    const scale = 2.0;
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');
    
    await page.render({ canvasContext: context, viewport }).promise;
    return canvas.toDataURL('image/png');
}

// Render all PDF pages as images
async function renderPdfAsImages(pdfUrl, fileName, container) {
    try {
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        const numPages = pdf.numPages;
        
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const scale = 2.0;
            const viewport = page.getViewport({ scale });
            
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const context = canvas.getContext('2d');
            
            await page.render({ canvasContext: context, viewport }).promise;
            const imageDataUrl = canvas.toDataURL('image/png');
            
            const pageLabel = numPages > 1 ? ` (Page ${pageNum}/${numPages})` : '';
            const div = document.createElement('div');
            div.className = 'rounded-lg overflow-hidden border border-gray-200 shadow-sm';
            div.innerHTML = `
                <img src="${imageDataUrl}" 
                     alt="${fileName}${pageLabel}" 
                     class="w-full h-auto cursor-pointer hover:opacity-95 transition-opacity"
                     onclick="openImageLightbox('${imageDataUrl}', '${fileName.replace(/'/g, "\\'")}${pageLabel}')">
                <div class="bg-gray-50 px-3 py-2 flex items-center justify-between">
                    <span class="text-sm text-gray-700 font-medium">${fileName}${pageLabel}</span>
                    <a href="${pdfUrl}" download class="text-walmart-blue hover:underline text-sm flex items-center gap-1">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                        </svg>
                        Download PDF
                    </a>
                </div>
            `;
            container.appendChild(div);
        }
    } catch (error) {
        console.error('Error rendering PDF:', error);
        // Fallback to download link
        const div = document.createElement('div');
        div.innerHTML = `
            <a href="${pdfUrl}" target="_blank" rel="noopener noreferrer"
               class="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
                <span class="text-2xl">📄</span>
                <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-900 truncate group-hover:text-walmart-blue text-sm">${fileName}</p>
                    <p class="text-xs text-gray-500">PDF Document</p>
                </div>
            </a>
        `;
        container.appendChild(div);
    }
}

// Load marketing materials for a property (auto-called when modal opens)
async function loadMarketingMaterials(propertyId) {
    const container = document.getElementById('marketing-materials-container');
    if (!container) return;
    
    container.innerHTML = '<p class="text-gray-500 col-span-2">Loading materials...</p>';
    
    // First check if property has embedded marketing materials
    const property = properties.find(p => p.id === propertyId);
    if (property && property.marketingMaterials && property.marketingMaterials.length > 0) {
        const materials = property.marketingMaterials;
        const images = materials.filter(m => m.type?.startsWith('image/'));
        const pdfs = materials.filter(m => m.type?.includes('pdf'));
        const otherDocs = materials.filter(m => !m.type?.startsWith('image/') && !m.type?.includes('pdf'));
        
        container.innerHTML = '';
        const galleryDiv = document.createElement('div');
        galleryDiv.className = 'col-span-2 space-y-4';
        
        // Show images inline
        images.forEach(img => {
            const div = document.createElement('div');
            div.className = 'rounded-lg overflow-hidden border border-gray-200 shadow-sm';
            div.innerHTML = `
                <img src="${img.url}" 
                     alt="${img.name}" 
                     class="w-full h-auto cursor-pointer hover:opacity-95 transition-opacity"
                     onclick="openImageLightbox('${img.url}', '${img.name.replace(/'/g, "\\'")}')">
                <div class="bg-gray-50 px-3 py-2 flex items-center justify-between">
                    <span class="text-sm text-gray-700 font-medium">${img.name}</span>
                    <a href="${img.url}" download class="text-walmart-blue hover:underline text-sm flex items-center gap-1">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                        </svg>
                        Download
                    </a>
                </div>
            `;
            galleryDiv.appendChild(div);
        });
        
        // Render PDFs as images
        for (const pdf of pdfs) {
            await renderPdfAsImages(pdf.url, pdf.name, galleryDiv);
        }
        
        container.appendChild(galleryDiv);
        
        // Show other docs as download links
        if (otherDocs.length > 0) {
            const docsDiv = document.createElement('div');
            docsDiv.className = 'col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t';
            otherDocs.forEach(doc => {
                docsDiv.innerHTML += `
                    <a href="${doc.url}" target="_blank" rel="noopener noreferrer"
                       class="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
                        <span class="text-2xl">📎</span>
                        <div class="flex-1 min-w-0">
                            <p class="font-medium text-gray-900 truncate group-hover:text-walmart-blue text-sm">${doc.name}</p>
                            <p class="text-xs text-gray-500">Document</p>
                        </div>
                    </a>
                `;
            });
            container.appendChild(docsDiv);
        }
        
        if (container.children.length === 0) {
            container.innerHTML = '<p class="text-gray-500 col-span-2">No materials available.</p>';
        }
        return;
    }
    
    // Fallback to API
    try {
        const response = await fetch(`${window.location.origin}/api/properties/${propertyId}/marketing`);
        if (response.ok) {
            const materials = await response.json();
            
            if (materials.length === 0) {
                container.innerHTML = `
                    <div class="col-span-2 text-center py-4 bg-gray-50 rounded-lg">
                        <p class="text-gray-500">No marketing materials available yet.</p>
                    </div>
                `;
            } else {
                const images = materials.filter(m => m.file_type?.startsWith('image/'));
                const pdfs = materials.filter(m => m.file_type?.includes('pdf'));
                const otherDocs = materials.filter(m => !m.file_type?.startsWith('image/') && !m.file_type?.includes('pdf'));
                
                container.innerHTML = '';
                const galleryDiv = document.createElement('div');
                galleryDiv.className = 'col-span-2 space-y-4';
                
                // Show images inline
                images.forEach(img => {
                    const div = document.createElement('div');
                    div.className = 'rounded-lg overflow-hidden border border-gray-200 shadow-sm';
                    div.innerHTML = `
                        <img src="${img.file_url}" 
                             alt="${img.file_name}" 
                             class="w-full h-auto cursor-pointer hover:opacity-95 transition-opacity"
                             onclick="openImageLightbox('${img.file_url}', '${img.file_name.replace(/'/g, "\\'")}')">
                        <div class="bg-gray-50 px-3 py-2 flex items-center justify-between">
                            <span class="text-sm text-gray-700 font-medium">${img.file_name}</span>
                            <a href="${img.file_url}" download class="text-walmart-blue hover:underline text-sm flex items-center gap-1">
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                                </svg>
                                Download
                            </a>
                        </div>
                    `;
                    galleryDiv.appendChild(div);
                });
                
                // Render PDFs as images
                for (const pdf of pdfs) {
                    await renderPdfAsImages(pdf.file_url, pdf.file_name, galleryDiv);
                }
                
                container.appendChild(galleryDiv);
                
                // Show other docs as download links
                if (otherDocs.length > 0) {
                    const docsDiv = document.createElement('div');
                    docsDiv.className = 'col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t';
                    otherDocs.forEach(doc => {
                        docsDiv.innerHTML += `
                            <a href="${doc.file_url}" target="_blank" rel="noopener noreferrer"
                               class="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
                                <span class="text-2xl">📎</span>
                                <div class="flex-1 min-w-0">
                                    <p class="font-medium text-gray-900 truncate group-hover:text-walmart-blue text-sm">${doc.file_name}</p>
                                    <p class="text-xs text-gray-500">Document</p>
                                </div>
                            </a>
                        `;
                    });
                    container.appendChild(docsDiv);
                }
            }
        } else {
            container.innerHTML = '<p class="text-gray-500 col-span-2">No materials available.</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="text-gray-500 col-span-2">No materials available.</p>';
    }
}

// Load broker contact info for a state (with optional propertyId for embedded data)
async function loadBrokerContact(state, propertyId) {
    const container = document.getElementById('broker-contact-container');
    if (!container) return;
    
    console.log('loadBrokerContact called with state:', state, 'propertyId:', propertyId);
    
    // First check if property has embedded broker info
    if (propertyId) {
        const property = properties.find(p => p.id === propertyId || p.id === parseInt(propertyId));
        console.log('Found property:', property ? 'yes' : 'no');
        console.log('Property broker:', property?.broker);
        console.log('Property broker_name:', property?.broker_name);
        
        // Check for broker object first
        if (property && property.broker && property.broker.name) {
            const b = property.broker;
            container.innerHTML = `
                <div class="text-left">
                    <p class="font-semibold text-gray-900 text-lg">${b.name}</p>
                    <p class="text-sm text-gray-600 mb-2">${b.company || 'Walmart Realty'}</p>
                    ${b.email ? `<p class="mb-1"><a href="mailto:${b.email}" class="text-walmart-blue hover:underline">${b.email}</a></p>` : ''}
                    ${b.phone ? `<p class="text-gray-700">${b.phone}</p>` : ''}
                </div>
            `;
            return;
        }
        
        // Fallback: check for broker_name, broker_email, etc. fields directly
        if (property && property.broker_name) {
            container.innerHTML = `
                <div class="text-left">
                    <p class="font-semibold text-gray-900 text-lg">${property.broker_name}</p>
                    <p class="text-sm text-gray-600 mb-2">${property.broker_company || 'Walmart Realty'}</p>
                    ${property.broker_email ? `<p class="mb-1"><a href="mailto:${property.broker_email}" class="text-walmart-blue hover:underline">${property.broker_email}</a></p>` : ''}
                    ${property.broker_phone ? `<p class="text-gray-700">${property.broker_phone}</p>` : ''}
                </div>
            `;
            return;
        }
    }
    
    // Fallback message for GitHub Pages (no API)
    container.innerHTML = `
        <p class="text-gray-600">Contact us for information about properties in ${state}.</p>
        <p class="text-sm text-gray-500 mt-2">Email: <a href="mailto:realestate@walmart.com" class="text-walmart-blue hover:underline">realestate@walmart.com</a></p>
    `;
}

// LOI Documents available
const loiDocuments = [
    { id: 1, name: 'Building Lease', file: 'loi-documents/Building Lease .docx', description: 'For leasing building space', icon: '🏢' },
    { id: 2, name: 'Building Sale', file: 'loi-documents/Building Sale LOI docx.docx', description: 'For purchasing a building', icon: '🏪' },
    { id: 3, name: 'Building Sublease', file: 'loi-documents/Building Sublease LOI.docx', description: 'For subleasing building space', icon: '🔄' },
    { id: 6, name: 'Large Tract Land Sale', file: 'loi-documents/Large Tract Land Sale LOI.docx', description: 'For purchasing large land tracts', icon: '🌾' },
    { id: 7, name: 'Outlot Ground Lease', file: 'loi-documents/Outlot Ground Lease LOI.docx', description: 'For ground lease on outlot parcels', icon: '📍' },
    { id: 8, name: 'Outlot Land Sale', file: 'loi-documents/Outlot Land Sale LOI .docx', description: 'For purchasing outlot parcels', icon: '🏞️' }
];

// Current property for LOI
let currentLOIPropertyId = null;

// Open LOI Modal
function openLOIModal(propertyId) {
    currentLOIPropertyId = propertyId;
    const property = properties.find(p => p.id === propertyId);
    const modal = document.getElementById('loi-modal');
    const content = document.getElementById('loi-modal-content');
    
    content.innerHTML = `
        <div class="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <div>
                <h2 id="loi-modal-title" class="text-xl font-bold text-gray-900">Submit Letter of Intent</h2>
                <p class="text-sm text-gray-600">${property.city}, ${property.state} - ${property.lotSize}</p>
            </div>
            <button onclick="closeLOIModal()" class="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Close modal">
                <svg class="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>
        
        <div class="p-6">
            <p class="text-gray-700 mb-6">Select the appropriate Letter of Intent document for your transaction:</p>
            
            <div class="grid gap-3">
                ${loiDocuments.map(loi => `
                    <button onclick="openLOIForm(${loi.id})" 
                            class="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-walmart-blue hover:bg-blue-50 transition-all text-left group">
                        <div class="text-3xl">${loi.icon}</div>
                        <div class="flex-1">
                            <h3 class="font-semibold text-gray-900 group-hover:text-walmart-blue">${loi.name}</h3>
                            <p class="text-sm text-gray-600">${loi.description}</p>
                        </div>
                        <svg class="h-5 w-5 text-gray-400 group-hover:text-walmart-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                    </button>
                `).join('')}
            </div>
            
            <div class="mt-6 pt-6 border-t">
                <p class="text-sm text-gray-500 text-center">
                    Need help choosing? Contact us at <a href="mailto:realestate@walmart.com" class="text-walmart-blue hover:underline">realestate@walmart.com</a>
                </p>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

// Close LOI Modal
function closeLOIModal() {
    const modal = document.getElementById('loi-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// Get LOI-specific form fields
function getLOIFormFields(loiId, property) {
    const commonFields = `
        <h3 class="text-lg font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input type="text" name="firstName" required 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input type="text" name="lastName" required 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue">
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input type="email" name="email" required 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input type="tel" name="phone" required 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue">
            </div>
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Company / Entity Name *</label>
            <input type="text" name="company" required 
                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue">
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Company Address *</label>
            <input type="text" name="companyAddress" required 
                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue"
                   placeholder="Street, City, State, ZIP">
        </div>
    `;
    
    // LOI-specific fields based on type
    const loiSpecificFields = {
        1: `<!-- Building Lease -->
            <h3 class="text-lg font-semibold text-gray-900 border-b pb-2 mt-6">Lease Terms</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Proposed Lease Rate ($/SF/Year) *</label>
                    <input type="text" name="leaseRate" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue"
                           placeholder="e.g., $15.00">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Lease Term (Years) *</label>
                    <input type="text" name="leaseTerm" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue"
                           placeholder="e.g., 10 years">
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Desired Square Footage *</label>
                    <input type="text" name="squareFootage" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Proposed Commencement Date *</label>
                    <input type="date" name="commencementDate" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Intended Use *</label>
                <input type="text" name="intendedUse" required 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue"
                       placeholder="e.g., Retail, Restaurant, Office">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Renewal Options</label>
                <input type="text" name="renewalOptions" 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue"
                       placeholder="e.g., Two 5-year options">
            </div>`,
        
        2: `<!-- Building Sale -->
            <h3 class="text-lg font-semibold text-gray-900 border-b pb-2 mt-6">Purchase Terms</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Offer Price *</label>
                    <input type="text" name="offerPrice" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue"
                           placeholder="e.g., $1,500,000">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Earnest Money Deposit *</label>
                    <input type="text" name="earnestMoney" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue"
                           placeholder="e.g., $50,000">
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Due Diligence Period (Days) *</label>
                    <input type="number" name="dueDiligencePeriod" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue"
                           placeholder="e.g., 45">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Proposed Closing Date *</label>
                    <input type="date" name="closingDate" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Financing Type *</label>
                <select name="financingType" required 
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue">
                    <option value="">Select financing type...</option>
                    <option value="cash">All Cash</option>
                    <option value="conventional">Conventional Financing</option>
                    <option value="sba">SBA Loan</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Intended Use *</label>
                <input type="text" name="intendedUse" required 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue">
            </div>`,
        
        3: `<!-- Building Sublease -->
            <h3 class="text-lg font-semibold text-gray-900 border-b pb-2 mt-6">Sublease Terms</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Proposed Sublease Rate ($/SF/Year) *</label>
                    <input type="text" name="subleaseRate" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Sublease Term *</label>
                    <input type="text" name="subleaseTerm" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue"
                           placeholder="e.g., 5 years">
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Desired Square Footage *</label>
                    <input type="text" name="squareFootage" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Proposed Start Date *</label>
                    <input type="date" name="startDate" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Intended Use *</label>
                <input type="text" name="intendedUse" required 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue">
            </div>`,
        
        6: `<!-- Large Tract Land Sale -->
            <h3 class="text-lg font-semibold text-gray-900 border-b pb-2 mt-6">Purchase Terms</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Offer Price *</label>
                    <input type="text" name="offerPrice" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Price Per Acre</label>
                    <input type="text" name="pricePerAcre" 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue">
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Earnest Money Deposit *</label>
                    <input type="text" name="earnestMoney" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Total Acreage *</label>
                    <input type="text" name="acreage" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue"
                           value="${property.size_acres} acres">
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Due Diligence Period (Days) *</label>
                    <input type="number" name="dueDiligencePeriod" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue"
                           placeholder="e.g., 90">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Proposed Closing Date *</label>
                    <input type="date" name="closingDate" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Financing Type *</label>
                <select name="financingType" required 
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue">
                    <option value="">Select...</option>
                    <option value="cash">All Cash</option>
                    <option value="conventional">Conventional Financing</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Proposed Development / Use *</label>
                <textarea name="proposedUse" required rows="2"
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue"
                          placeholder="Describe your intended development plans..."></textarea>
            </div>`,
        
        7: `<!-- Outlot Ground Lease -->
            <h3 class="text-lg font-semibold text-gray-900 border-b pb-2 mt-6">Ground Lease Terms</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Proposed Annual Rent *</label>
                    <input type="text" name="annualRent" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Lease Term (Years) *</label>
                    <input type="text" name="leaseTerm" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue"
                           placeholder="e.g., 15 years">
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Outlot Size (Acres) *</label>
                    <input type="text" name="acreage" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue"
                           value="${property.size_acres} acres">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Proposed Commencement Date *</label>
                    <input type="date" name="commencementDate" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Proposed Use / Tenant *</label>
                <input type="text" name="proposedUse" required 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue"
                       placeholder="e.g., Starbucks, Chick-fil-A, Bank">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Rent Escalations</label>
                <input type="text" name="rentEscalations" 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue"
                       placeholder="e.g., 10% every 5 years">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Renewal Options</label>
                <input type="text" name="renewalOptions" 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue"
                       placeholder="e.g., Four 5-year options">
            </div>`,
        
        8: `<!-- Outlot Land Sale -->
            <h3 class="text-lg font-semibold text-gray-900 border-b pb-2 mt-6">Purchase Terms</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Offer Price *</label>
                    <input type="text" name="offerPrice" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Earnest Money Deposit *</label>
                    <input type="text" name="earnestMoney" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue">
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Outlot Size (Acres) *</label>
                    <input type="text" name="acreage" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue"
                           value="${property.size_acres} acres">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Due Diligence Period (Days) *</label>
                    <input type="number" name="dueDiligencePeriod" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue"
                           placeholder="e.g., 45">
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Proposed Closing Date *</label>
                    <input type="date" name="closingDate" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Financing Type *</label>
                    <select name="financingType" required 
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue">
                        <option value="">Select...</option>
                        <option value="cash">All Cash</option>
                        <option value="conventional">Conventional Financing</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Proposed Use / Tenant *</label>
                <input type="text" name="proposedUse" required 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue">
            </div>`
    };
    
    return commonFields + (loiSpecificFields[loiId] || '');
}

// Open LOI Form
function openLOIForm(loiId) {
    const loi = loiDocuments.find(l => l.id === loiId);
    const property = properties.find(p => p.id === currentLOIPropertyId);
    const modal = document.getElementById('loi-form-modal');
    const content = document.getElementById('loi-form-content');
    
    content.innerHTML = `
        <div class="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
            <div>
                <h2 id="loi-form-title" class="text-xl font-bold text-gray-900">${loi.icon} ${loi.name} LOI</h2>
                <p class="text-sm text-gray-600">${property.city}, ${property.state} - ${property.lotSize}</p>
            </div>
            <button onclick="closeLOIFormModal()" class="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Close modal">
                <svg class="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>
        
        <form id="loi-submission-form" class="p-6 space-y-4" onsubmit="submitLOI(event, ${loiId})">
            <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div class="flex items-start gap-3">
                    <svg class="h-5 w-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <div>
                        <p class="text-sm text-green-800 font-medium">Complete this form to submit your Letter of Intent</p>
                        <p class="text-sm text-green-700">Your submission will be sent directly to our broker team for immediate review.</p>
                    </div>
                </div>
            </div>
            
            ${getLOIFormFields(loiId, property)}
            
            <h3 class="text-lg font-semibold text-gray-900 border-b pb-2 mt-6">Upload Your Completed LOI</h3>
            <div class="mb-4">
                <p class="text-sm text-gray-600 mb-3">If you've already filled out the LOI document, drag and drop it here or click to upload:</p>
                
                <div id="loi-dropzone" 
                     class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer transition-all hover:border-walmart-blue hover:bg-blue-50"
                     ondragover="handleDragOver(event)"
                     ondragleave="handleDragLeave(event)"
                     ondrop="handleFileDrop(event)"
                     onclick="document.getElementById('loi-file-input').click()">
                    
                    <input type="file" id="loi-file-input" name="loiFile" class="hidden" 
                           accept=".doc,.docx,.pdf" onchange="handleFileSelect(event)">
                    
                    <div id="dropzone-content">
                        <svg class="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                        </svg>
                        <p class="text-gray-700 font-medium">Drag & drop your LOI document here</p>
                        <p class="text-gray-500 text-sm mt-1">or click to browse</p>
                        <p class="text-gray-400 text-xs mt-2">Accepts: .doc, .docx, .pdf (max 10MB)</p>
                    </div>
                    
                    <div id="dropzone-file-info" class="hidden">
                        <svg class="mx-auto h-12 w-12 text-green-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <p class="text-green-700 font-medium" id="uploaded-file-name"></p>
                        <p class="text-gray-500 text-sm mt-1" id="uploaded-file-size"></p>
                        <button type="button" onclick="event.stopPropagation(); removeUploadedFile()" 
                                class="mt-3 text-red-600 hover:text-red-800 text-sm font-medium">
                            Remove file
                        </button>
                    </div>
                </div>
                
                <div class="flex items-center gap-2 mt-3">
                    <a href="${loi.file}" download 
                       class="text-walmart-blue hover:underline text-sm font-medium flex items-center gap-1"
                       onclick="event.stopPropagation()">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                        </svg>
                        Download blank ${loi.name} template
                    </a>
                </div>
            </div>
            
            <h3 class="text-lg font-semibold text-gray-900 border-b pb-2 mt-6">Additional Information</h3>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Additional Comments or Contingencies</label>
                <textarea name="additionalComments" rows="3" 
                          placeholder="Any other terms, conditions, or questions..."
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-walmart-blue"></textarea>
            </div>
            
            <div class="bg-gray-50 rounded-lg p-4 mt-6">
                <h4 class="font-medium text-gray-900 mb-2">Property Summary</h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div><span class="text-gray-500">Location:</span><br><span class="font-medium">${property.city}, ${property.state}</span></div>
                    <div><span class="text-gray-500">Size:</span><br><span class="font-medium">${property.lotSize}</span></div>
                    <div><span class="text-gray-500">Type:</span><br><span class="font-medium">${property.type}</span></div>
                    <div><span class="text-gray-500">LOI Type:</span><br><span class="font-medium">${loi.name}</span></div>
                </div>
            </div>
            
            <div class="flex flex-col sm:flex-row gap-3 pt-4">
                <button type="submit" id="loi-submit-btn"
                        class="flex-1 bg-walmart-blue hover:bg-walmart-dark text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                    </svg>
                    Submit LOI to Broker
                </button>
                <a href="${loi.file}" download 
                   class="sm:w-auto border-2 border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                    Download Template
                </a>
            </div>
        </form>
    `;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

// Close LOI Form Modal
function closeLOIFormModal() {
    const modal = document.getElementById('loi-form-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// Uploaded LOI file storage
let uploadedLOIFile = null;

// Drag and drop handlers
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    const dropzone = document.getElementById('loi-dropzone');
    dropzone.classList.add('border-walmart-blue', 'bg-blue-50', 'scale-[1.02]');
    dropzone.classList.remove('border-gray-300');
}

function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    const dropzone = document.getElementById('loi-dropzone');
    dropzone.classList.remove('border-walmart-blue', 'bg-blue-50', 'scale-[1.02]');
    dropzone.classList.add('border-gray-300');
}

function handleFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const dropzone = document.getElementById('loi-dropzone');
    dropzone.classList.remove('border-walmart-blue', 'bg-blue-50', 'scale-[1.02]');
    dropzone.classList.add('border-gray-300');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        processUploadedFile(files[0]);
    }
}

function handleFileSelect(event) {
    const files = event.target.files;
    if (files.length > 0) {
        processUploadedFile(files[0]);
    }
}

function processUploadedFile(file) {
    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const validExtensions = ['.pdf', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
        showToast('Please upload a .doc, .docx, or .pdf file');
        return;
    }
    
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        showToast('File size must be less than 10MB');
        return;
    }
    
    // Store the file
    uploadedLOIFile = file;
    
    // Update UI
    const dropzoneContent = document.getElementById('dropzone-content');
    const fileInfo = document.getElementById('dropzone-file-info');
    const fileName = document.getElementById('uploaded-file-name');
    const fileSize = document.getElementById('uploaded-file-size');
    
    dropzoneContent.classList.add('hidden');
    fileInfo.classList.remove('hidden');
    
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    
    // Update dropzone styling
    const dropzone = document.getElementById('loi-dropzone');
    dropzone.classList.add('border-green-500', 'bg-green-50');
    dropzone.classList.remove('border-gray-300');
    
    showToast('File uploaded successfully!');
}

function removeUploadedFile() {
    uploadedLOIFile = null;
    
    // Reset file input
    const fileInput = document.getElementById('loi-file-input');
    if (fileInput) fileInput.value = '';
    
    // Update UI
    const dropzoneContent = document.getElementById('dropzone-content');
    const fileInfo = document.getElementById('dropzone-file-info');
    
    if (dropzoneContent) dropzoneContent.classList.remove('hidden');
    if (fileInfo) fileInfo.classList.add('hidden');
    
    // Reset dropzone styling
    const dropzone = document.getElementById('loi-dropzone');
    if (dropzone) {
        dropzone.classList.remove('border-green-500', 'bg-green-50');
        dropzone.classList.add('border-gray-300');
    }
    
    showToast('File removed');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Broker email mapping by state/region (to be configured)
const brokerEmails = {
    default: 'realestate@walmart.com',
    // Add market-specific emails here later
    // 'TX': 'texas.broker@walmart.com',
    // 'AR': 'arkansas.broker@walmart.com',
};

// Get broker email for property
function getBrokerEmail(state) {
    return brokerEmails[state] || brokerEmails.default;
}

// Submit LOI
async function submitLOI(event, loiId) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = document.getElementById('loi-submit-btn');
    const loi = loiDocuments.find(l => l.id === loiId);
    const property = properties.find(p => p.id === currentLOIPropertyId);
    
    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Submitting...
    `;
    
    // Collect all form data
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });
    
    // Build comprehensive LOI submission content
    const submissionDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
    
    const brokerEmail = getBrokerEmail(property.state);
    
    // Format the LOI data based on type
    let loiDetails = '';
    
    // Common fields
    loiDetails += `
═══════════════════════════════════════════════════════════════
                    LETTER OF INTENT SUBMISSION
                         ${loi.name.toUpperCase()}
═══════════════════════════════════════════════════════════════

Submission Date: ${submissionDate}

───────────────────────────────────────────────────────────────
PROPERTY INFORMATION
───────────────────────────────────────────────────────────────
Location:        ${property.city}, ${property.state}
Property Size:   ${property.lotSize}
Property Type:   ${property.type}
Listing Price:   ${formatPrice(property.price, property.listingType)}
LOI Type:        ${loi.name}

───────────────────────────────────────────────────────────────
BUYER/LESSEE INFORMATION  
───────────────────────────────────────────────────────────────
Name:            ${data.firstName} ${data.lastName}
Company:         ${data.company}
Address:         ${data.companyAddress || 'Not provided'}
Email:           ${data.email}
Phone:           ${data.phone}

───────────────────────────────────────────────────────────────
PROPOSED TERMS
───────────────────────────────────────────────────────────────`;
    
    // Add LOI-specific details
    if (data.offerPrice) loiDetails += `\nOffer Price:         ${data.offerPrice}`;
    if (data.earnestMoney) loiDetails += `\nEarnest Money:       ${data.earnestMoney}`;
    if (data.leaseRate) loiDetails += `\nLease Rate:          ${data.leaseRate}`;
    if (data.subleaseRate) loiDetails += `\nSublease Rate:       ${data.subleaseRate}`;
    if (data.annualRent) loiDetails += `\nAnnual Rent:         ${data.annualRent}`;
    if (data.leaseTerm) loiDetails += `\nLease Term:          ${data.leaseTerm}`;
    if (data.subleaseTerm) loiDetails += `\nSublease Term:       ${data.subleaseTerm}`;
    if (data.squareFootage) loiDetails += `\nSquare Footage:      ${data.squareFootage}`;
    if (data.acreage) loiDetails += `\nAcreage:             ${data.acreage}`;
    if (data.pricePerAcre) loiDetails += `\nPrice Per Acre:      ${data.pricePerAcre}`;
    if (data.dueDiligencePeriod) loiDetails += `\nDue Diligence:       ${data.dueDiligencePeriod} days`;
    if (data.closingDate) loiDetails += `\nClosing Date:        ${data.closingDate}`;
    if (data.commencementDate) loiDetails += `\nCommencement Date:   ${data.commencementDate}`;
    if (data.startDate) loiDetails += `\nStart Date:          ${data.startDate}`;
    if (data.financingType) loiDetails += `\nFinancing:           ${data.financingType}`;
    if (data.intendedUse) loiDetails += `\nIntended Use:        ${data.intendedUse}`;
    if (data.proposedUse) loiDetails += `\nProposed Use:        ${data.proposedUse}`;
    if (data.rentEscalations) loiDetails += `\nRent Escalations:    ${data.rentEscalations}`;
    if (data.renewalOptions) loiDetails += `\nRenewal Options:     ${data.renewalOptions}`;
    
    // Add uploaded file info
    if (uploadedLOIFile) {
        loiDetails += `\n\nATTACHED LOI DOCUMENT:  ${uploadedLOIFile.name} (${formatFileSize(uploadedLOIFile.size)})`;
        loiDetails += `\n** Please note: The attached LOI document was uploaded but may need to be sent separately. **`;
    }
    
    loiDetails += `\n\n───────────────────────────────────────────────────────────────
ADDITIONAL COMMENTS
───────────────────────────────────────────────────────────────
${data.additionalComments || 'None provided'}

═══════════════════════════════════════════════════════════════
              Submitted via Walmart Real Estate Website
                     https://realty.walmart.com
═══════════════════════════════════════════════════════════════`;
    
    try {
        // Try EmailJS first if configured
        if (typeof emailjs !== 'undefined' && window.EMAILJS_PUBLIC_KEY) {
            await emailjs.send(
                window.EMAILJS_SERVICE_ID,
                window.EMAILJS_TEMPLATE_ID,
                {
                    to_email: brokerEmail,
                    from_name: `${data.firstName} ${data.lastName}`,
                    from_email: data.email,
                    subject: `LOI Submission: ${loi.name} - ${property.city}, ${property.state}`,
                    message: loiDetails,
                    property_location: `${property.city}, ${property.state}`,
                    loi_type: loi.name,
                    company: data.company
                }
            );
            
            showSuccessModal(data, loi, property);
        } else {
            // Fallback: Open email client with pre-filled data
            const subject = `LOI Submission: ${loi.name} - ${property.city}, ${property.state}`;
            const mailtoLink = `mailto:${brokerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(loiDetails)}`;
            
            // Open mailto
            window.location.href = mailtoLink;
            
            // Show success after a delay
            setTimeout(() => {
                showSuccessModal(data, loi, property);
            }, 500);
        }
    } catch (error) {
        console.error('Error submitting LOI:', error);
        
        // Fallback to mailto
        const subject = `LOI Submission: ${loi.name} - ${property.city}, ${property.state}`;
        const mailtoLink = `mailto:${brokerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(loiDetails)}`;
        window.location.href = mailtoLink;
        
        setTimeout(() => {
            showSuccessModal(data, loi, property);
        }, 500);
    }
}

// Show success modal after submission
function showSuccessModal(data, loi, property) {
    const modal = document.getElementById('loi-form-modal');
    const content = document.getElementById('loi-form-content');
    
    content.innerHTML = `
        <div class="p-8 text-center">
            <div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
            </div>
            
            <h2 class="text-2xl font-bold text-gray-900 mb-2">LOI Submitted Successfully!</h2>
            <p class="text-gray-600 mb-6">Your Letter of Intent has been sent to our broker team.</p>
            
            <div class="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h4 class="font-semibold text-gray-900 mb-3">Submission Summary</h4>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-500">LOI Type:</span>
                        <span class="font-medium">${loi.name}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Property:</span>
                        <span class="font-medium">${property.city}, ${property.state}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Submitted By:</span>
                        <span class="font-medium">${data.firstName} ${data.lastName}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Company:</span>
                        <span class="font-medium">${data.company}</span>
                    </div>
                    ${uploadedLOIFile ? `
                    <div class="flex justify-between">
                        <span class="text-gray-500">Attached File:</span>
                        <span class="font-medium text-green-600">✓ ${uploadedLOIFile.name}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p class="text-sm text-blue-800">
                    <strong>What's Next?</strong><br>
                    A broker will review your LOI and contact you within 1-2 business days at <strong>${data.email}</strong> or <strong>${data.phone}</strong>.
                </p>
            </div>
            
            <div class="flex flex-col sm:flex-row gap-3">
                <button onclick="closeAllModals()" 
                        class="flex-1 bg-walmart-blue hover:bg-walmart-dark text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                    Back to Properties
                </button>
                <button onclick="window.print()" 
                        class="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                    </svg>
                    Print Confirmation
                </button>
            </div>
        </div>
    `;
}

// Close all modals
function closeAllModals() {
    uploadedLOIFile = null; // Reset uploaded file
    closeLOIFormModal();
    closeLOIModal();
    closePropertyModal();
}

// Saved properties management (localStorage-based, no login required)
function getSavedProperties() {
    const saved = localStorage.getItem('walmartRealtySavedProperties');
    return saved ? JSON.parse(saved) : [];
}

function saveToLocalStorage(savedIds) {
    localStorage.setItem('walmartRealtySavedProperties', JSON.stringify(savedIds));
}

function isPropertySaved(id) {
    const saved = getSavedProperties();
    return saved.includes(id);
}

// Toggle save property
function toggleSave(id) {
    let saved = getSavedProperties();
    const heartIcon = document.querySelector(`[data-heart-id="${id}"]`);
    
    if (saved.includes(id)) {
        // Remove from saved
        saved = saved.filter(savedId => savedId !== id);
        if (heartIcon) {
            heartIcon.setAttribute('fill', 'none');
            heartIcon.classList.remove('text-red-500');
            heartIcon.classList.add('text-gray-400');
        }
        showToast('Property removed from saved');
    } else {
        // Add to saved
        saved.push(id);
        if (heartIcon) {
            heartIcon.setAttribute('fill', 'currentColor');
            heartIcon.classList.remove('text-gray-400');
            heartIcon.classList.add('text-red-500');
        }
        showToast('Property saved!');
    }
    
    saveToLocalStorage(saved);
    updateSavedCount();
}

// Show toast notification
function showToast(message) {
    // Remove existing toast
    const existingToast = document.getElementById('toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

// Update saved count in header
function updateSavedCount() {
    const saved = getSavedProperties();
    const countEl = document.getElementById('saved-count');
    if (countEl) {
        countEl.textContent = saved.length;
        countEl.style.display = saved.length > 0 ? 'flex' : 'none';
    }
}

// Filter to show only saved properties
function showSavedProperties() {
    const saved = getSavedProperties();
    if (saved.length === 0) {
        showToast('No saved properties yet!');
        return;
    }
    filteredProperties = properties.filter(p => saved.includes(p.id));
    renderProperties();
    updateMapMarkers();
    showToast(`Showing ${saved.length} saved properties`);
}

// Show all properties
function showAllProperties() {
    filteredProperties = [...properties];
    sortProperties();
    renderProperties();
    updateMapMarkers();
}

// Toggle mobile menu
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
}

// Main map instance
let mainMap = null;
let mainMapMarkers = [];
let currentTileLayer = null;

// Initialize the main property map
function initMainMap() {
    const mapContainer = document.getElementById('main-map');
    if (!mapContainer || typeof L === 'undefined') return;
    
    // Calculate center of all properties
    const lats = properties.map(p => p.lat);
    const lons = properties.map(p => p.lon);
    const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const centerLon = lons.reduce((a, b) => a + b, 0) / lons.length;
    
    // Create map centered on all properties
    mainMap = L.map('main-map').setView([centerLat, centerLon], 5);
    
    // Add default satellite tile layer
    currentTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19
    }).addTo(mainMap);
    
    // Add markers for all properties
    addPropertyMarkers(properties);
    
    // Fit bounds to show all markers
    if (mainMapMarkers.length > 0) {
        const group = L.featureGroup(mainMapMarkers);
        mainMap.fitBounds(group.getBounds().pad(0.1));
    }
}

// Add markers for properties
function addPropertyMarkers(propertiesToShow) {
    // Clear existing markers
    mainMapMarkers.forEach(marker => mainMap.removeLayer(marker));
    mainMapMarkers = [];
    
    // Create custom Walmart icon
    const walmartIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: #0071CE; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFC220">
                    <circle cx="12" cy="12" r="4"/>
                </svg>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
    
    // Add markers for each property
    propertiesToShow.forEach(property => {
        const marker = L.marker([property.lat, property.lon], { icon: walmartIcon })
            .addTo(mainMap);
        
        // Create popup content
        const popupContent = `
            <div class="property-popup" style="min-width: 220px;">
                <img src="${property.image}" alt="${property.title}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;">
                <h4 style="font-weight: bold; margin-bottom: 4px; font-size: 14px;">${property.title}</h4>
                <p style="color: #666; font-size: 12px; margin-bottom: 4px;">${property.city}, ${property.state}</p>
                <p style="color: #0071CE; font-weight: bold; font-size: 14px; margin-bottom: 8px;">Contact for Pricing</p>
                <p style="color: #666; font-size: 12px; margin-bottom: 8px;">${property.lotSize}</p>
                <button onclick="openPropertyModal(${property.id})" style="background-color: #0071CE; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; width: 100%; font-weight: 600;">View Details</button>
            </div>
        `;
        
        marker.bindPopup(popupContent, { 
            maxWidth: 280,
            autoPan: true,
            autoPanPadding: [50, 50],
            keepInView: true
        });
        mainMapMarkers.push(marker);
    });
}

// Toggle between map and satellite view
function toggleMapView(view) {
    if (!mainMap) return;
    
    const mapBtn = document.getElementById('map-view-btn');
    const satBtn = document.getElementById('satellite-view-btn');
    
    // Remove current tile layer
    if (currentTileLayer) {
        mainMap.removeLayer(currentTileLayer);
    }
    
    if (view === 'map') {
        // Standard map view
        currentTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(mainMap);
        
        mapBtn.className = 'px-4 py-2 rounded-lg bg-walmart-blue text-white text-sm font-medium';
        satBtn.className = 'px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300';
    } else {
        // Satellite view
        currentTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri',
            maxZoom: 19
        }).addTo(mainMap);
        
        satBtn.className = 'px-4 py-2 rounded-lg bg-walmart-blue text-white text-sm font-medium';
        mapBtn.className = 'px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300';
    }
}

// Update map markers when filters change
function updateMapMarkers() {
    if (mainMap) {
        addPropertyMarkers(filteredProperties);
    }
}

// Populate state filter dropdown
function populateStateFilter() {
    const stateFilter = document.getElementById('state-filter');
    if (!stateFilter) return;
    
    // Get unique states from properties
    const states = [...new Set(properties.map(p => p.state))].sort();
    
    // Clear existing options except the first one
    stateFilter.innerHTML = '<option value="">All States</option>';
    
    // Add state options
    states.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        stateFilter.appendChild(option);
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Fetch properties from API first
    await fetchPropertiesFromAPI();
    
    renderProperties();
    initMainMap();
    updateSavedCount();
    populateStateFilter();
    
    // Main search bar - Enter key support
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                hideAutocomplete();
                performSearch();
                saveRecentSearch(searchInput.value.trim());
            }
        });
        
        // Show autocomplete on input
        searchInput.addEventListener('input', () => {
            updateAutocomplete(searchInput.value.trim());
        });
        
        // Show recent searches on focus (if empty)
        searchInput.addEventListener('focus', () => {
            if (!searchInput.value.trim()) {
                showRecentSearches();
            } else {
                updateAutocomplete(searchInput.value.trim());
            }
        });
        
        // Hide autocomplete on blur (with delay for clicks)
        searchInput.addEventListener('blur', () => {
            setTimeout(hideAutocomplete, 200);
        });
    }
    
    document.getElementById('search-form').addEventListener('submit', (e) => {
        e.preventDefault();
        filterProperties();
    });
    
    // Add change listeners to all filter dropdowns
    ['property-type', 'listing-type', 'state-filter', 'price-range', 'size-range'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', filterProperties);
        }
    });
    
    document.getElementById('sort').addEventListener('change', () => {
        sortProperties();
        renderProperties();
    });
    
    document.getElementById('property-modal').addEventListener('click', (e) => {
        if (e.target.id === 'property-modal') {
            closePropertyModal();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLOIFormModal();
            closeLOIModal();
            closePropertyModal();
        }
    });
    
    // LOI modal click outside to close
    document.getElementById('loi-modal').addEventListener('click', (e) => {
        if (e.target.id === 'loi-modal') {
            closeLOIModal();
        }
    });
    
    document.getElementById('loi-form-modal').addEventListener('click', (e) => {
        if (e.target.id === 'loi-form-modal') {
            closeLOIFormModal();
        }
    });
    
    // Populate contact form state dropdown
    populateContactStateDropdown();
    
    // Contact form submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactFormSubmit);
    }
});

// Populate state dropdown in contact form
function populateContactStateDropdown() {
    const select = document.getElementById('contact-state');
    if (!select) return;
    
    // Get unique states sorted alphabetically
    const states = [...new Set(properties.map(p => p.state))].sort();
    
    select.innerHTML = '<option value="">Select a state (optional)</option>';
    states.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        select.appendChild(option);
    });
}

// Update property dropdown based on selected state
function updateContactPropertyDropdown() {
    const stateSelect = document.getElementById('contact-state');
    const propertySelect = document.getElementById('contact-property');
    if (!stateSelect || !propertySelect) return;
    
    const selectedState = stateSelect.value;
    
    if (!selectedState) {
        propertySelect.innerHTML = '<option value="">Select a state first</option>';
        propertySelect.disabled = true;
        return;
    }
    
    // Filter properties by state and sort by city
    const stateProperties = properties
        .filter(p => p.state === selectedState)
        .sort((a, b) => a.city.localeCompare(b.city));
    
    propertySelect.disabled = false;
    propertySelect.innerHTML = '<option value="">Select a property (optional)</option>';
    
    stateProperties.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.city} - ${p.lotSize || p.size_acres + ' acres'}`;
        propertySelect.appendChild(option);
    });
}

// Handle contact form submission
async function handleContactFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Get form data
    const formData = {
        name: document.getElementById('contact-name').value.trim(),
        email: document.getElementById('contact-email').value.trim(),
        phone: document.getElementById('contact-phone').value.trim(),
        company: document.getElementById('contact-company').value.trim(),
        property_id: document.getElementById('contact-property').value || null,
        message: document.getElementById('contact-message').value.trim()
    };
    
    // Validation
    if (!formData.name || !formData.email || !formData.message) {
        showToast('Please fill in all required fields');
        return;
    }
    
    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Success!
            showContactSuccess();
            form.reset();
        } else {
            showToast(result.error || 'Failed to submit inquiry');
        }
    } catch (error) {
        console.error('Contact  error:', error);
        showToast('Connection error. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Show contact form success message
function showContactSuccess() {
    const form = document.getElementById('contact-form');
    const container = form.parentElement;
    
    // Replace form with success message
    container.innerHTML = `
        <div class="text-center py-8">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-2">Thank You!</h3>
            <p class="text-gray-600 mb-6">Your inquiry has been submitted successfully.<br>Our team will respond within 1-2 business days.</p>
            <button onclick="location.reload()" class="bg-walmart-blue hover:bg-walmart-dark text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                Submit Another Inquiry
            </button>
        </div>
    `;
    
    // Scroll to success message
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ============= SEARCH AUTOCOMPLETE =============

const RECENT_SEARCHES_KEY = 'walmartRealtyRecentSearches';
const MAX_RECENT_SEARCHES = 5;

// Get recent searches from localStorage
function getRecentSearches() {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
}

// Save a search term to recent searches
function saveRecentSearch(term) {
    if (!term || term.length < 2) return;
    
    let recent = getRecentSearches();
    // Remove if already exists
    recent = recent.filter(s => s.toLowerCase() !== term.toLowerCase());
    // Add to beginning
    recent.unshift(term);
    // Keep only MAX
    recent = recent.slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
}

// Clear recent searches
function clearRecentSearches() {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    hideAutocomplete();
}

// Show the autocomplete dropdown
function showAutocomplete() {
    const dropdown = document.getElementById('search-autocomplete');
    if (dropdown) dropdown.classList.remove('hidden');
}

// Hide the autocomplete dropdown
function hideAutocomplete() {
    const dropdown = document.getElementById('search-autocomplete');
    if (dropdown) dropdown.classList.add('hidden');
}

// Show recent searches (when input is focused but empty)
function showRecentSearches() {
    const recent = getRecentSearches();
    const recentSection = document.getElementById('recent-searches-section');
    const recentList = document.getElementById('recent-searches-list');
    const statesSection = document.getElementById('states-section');
    const citiesSection = document.getElementById('cities-section');
    const noResults = document.getElementById('no-results-section');
    
    // Hide other sections
    statesSection.classList.add('hidden');
    citiesSection.classList.add('hidden');
    noResults.classList.add('hidden');
    
    if (recent.length === 0) {
        recentSection.classList.add('hidden');
        hideAutocomplete();
        return;
    }
    
    recentSection.classList.remove('hidden');
    recentList.innerHTML = recent.map(term => `
        <div class="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-100 last:border-0"
             onclick="selectRecentSearch('${term.replace(/'/g, "\\'")}')"
             role="option">
            <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="text-gray-700">${term}</span>
        </div>
    `).join('') + `
        <div class="px-4 py-2 bg-gray-50 border-t">
            <button onclick="clearRecentSearches()" class="text-xs text-gray-500 hover:text-red-600">Clear recent searches</button>
        </div>
    `;
    
    showAutocomplete();
}

// Select a recent search
function selectRecentSearch(term) {
    const searchInput = document.getElementById('search-input');
    searchInput.value = term;
    hideAutocomplete();
    performSearch();
}

// Update autocomplete based on search term
function updateAutocomplete(term) {
    const dropdown = document.getElementById('search-autocomplete');
    const recentSection = document.getElementById('recent-searches-section');
    const statesSection = document.getElementById('states-section');
    const statesList = document.getElementById('states-list');
    const citiesSection = document.getElementById('cities-section');
    const citiesList = document.getElementById('cities-list');
    const noResults = document.getElementById('no-results-section');
    
    // If empty, show recent searches instead
    if (!term) {
        showRecentSearches();
        return;
    }
    
    // Hide recent searches when typing
    recentSection.classList.add('hidden');
    
    const termLower = term.toLowerCase();
    
    // Find matching states
    const stateMatches = [];
    const stateCounts = {};
    properties.forEach(p => {
        if (!stateCounts[p.state]) stateCounts[p.state] = 0;
        stateCounts[p.state]++;
    });
    
    Object.keys(stateCounts).forEach(state => {
        if (state.toLowerCase().includes(termLower)) {
            stateMatches.push({ state, count: stateCounts[state] });
        }
    });
    stateMatches.sort((a, b) => a.state.localeCompare(b.state));
    
    // Find matching cities
    const cityMatches = [];
    const cityCounts = {};
    properties.forEach(p => {
        const key = `${p.city}, ${p.state}`;
        if (!cityCounts[key]) cityCounts[key] = { city: p.city, state: p.state, count: 0 };
        cityCounts[key].count++;
    });
    
    Object.values(cityCounts).forEach(item => {
        if (item.city.toLowerCase().includes(termLower)) {
            cityMatches.push(item);
        }
    });
    cityMatches.sort((a, b) => a.city.localeCompare(b.city));
    
    // Update UI
    const hasStates = stateMatches.length > 0;
    const hasCities = cityMatches.length > 0;
    
    if (!hasStates && !hasCities) {
        statesSection.classList.add('hidden');
        citiesSection.classList.add('hidden');
        noResults.classList.remove('hidden');
        showAutocomplete();
        return;
    }
    
    noResults.classList.add('hidden');
    
    // Render states
    if (hasStates) {
        statesSection.classList.remove('hidden');
        statesList.innerHTML = stateMatches.slice(0, 5).map(item => `
            <div class="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between border-b border-gray-100 last:border-0"
                 onclick="selectStateSearch('${item.state}')"
                 role="option">
                <div class="flex items-center gap-3">
                    <svg class="h-4 w-4 text-walmart-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    </svg>
                    <span class="font-medium text-gray-900">${item.state}</span>
                </div>
                <span class="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">${item.count} ${item.count === 1 ? 'property' : 'properties'}</span>
            </div>
        `).join('');
    } else {
        statesSection.classList.add('hidden');
    }
    
    // Render cities
    if (hasCities) {
        citiesSection.classList.remove('hidden');
        citiesList.innerHTML = cityMatches.slice(0, 8).map(item => `
            <div class="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between border-b border-gray-100 last:border-0"
                 onclick="selectCitySearch('${item.city}', '${item.state}')"
                 role="option">
                <div class="flex items-center gap-3">
                    <svg class="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                    <span class="text-gray-900">${item.city}, <span class="text-gray-500">${item.state}</span></span>
                </div>
                <span class="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">${item.count} ${item.count === 1 ? 'property' : 'properties'}</span>
            </div>
        `).join('');
    } else {
        citiesSection.classList.add('hidden');
    }
    
    showAutocomplete();
}

// Select a state from autocomplete
function selectStateSearch(state) {
    const searchInput = document.getElementById('search-input');
    const stateFilter = document.getElementById('state-filter');
    
    // Set state filter dropdown
    stateFilter.value = state;
    searchInput.value = '';
    
    hideAutocomplete();
    filterProperties();
    saveRecentSearch(state);
}

// Select a city from autocomplete
function selectCitySearch(city, state) {
    const searchInput = document.getElementById('search-input');
    const stateFilter = document.getElementById('state-filter');
    
    // Set state filter and search for city
    stateFilter.value = state;
    searchInput.value = city;
    
    hideAutocomplete();
    performSearch();
    saveRecentSearch(`${city}, ${state}`);
}
