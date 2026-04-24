#!/usr/bin/env python3
"""
Geocode all properties using Nominatim (OpenStreetMap) through Walmart proxy.
This will get accurate lat/lon coordinates based on actual addresses.
"""

import requests
import sqlite3
import time
import urllib.parse

DB_PATH = '/Users/b0m01y5/projects/walmart-real-estate/server/walmart-realty.db'

# Walmart proxy
proxies = {
    'http': 'http://sysproxy.wal-mart.com:8080',
    'https': 'http://sysproxy.wal-mart.com:8080'
}

def geocode_address(address, city, state):
    """Geocode using Nominatim (OpenStreetMap)"""
    # Try full address first
    query = f"{address}, {city}, {state}, USA"
    url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(query)}&format=json&limit=1&countrycodes=us"
    
    try:
        resp = requests.get(url, proxies=proxies, timeout=15, 
                           headers={'User-Agent': 'WalmartRealtyGeocoder/1.0 (brett.young@walmart.com)'})
        if resp.status_code == 200:
            data = resp.json()
            if data:
                return float(data[0]['lat']), float(data[0]['lon']), 'full'
    except Exception as e:
        pass
    
    # Fallback: try without street address (just city, state)
    query = f"{city}, {state}, USA"
    url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(query)}&format=json&limit=1&countrycodes=us"
    
    try:
        resp = requests.get(url, proxies=proxies, timeout=15,
                           headers={'User-Agent': 'WalmartRealtyGeocoder/1.0 (brett.young@walmart.com)'})
        if resp.status_code == 200:
            data = resp.json()
            if data:
                return float(data[0]['lat']), float(data[0]['lon']), 'city'
    except Exception as e:
        pass
    
    return None, None, 'failed'

def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get all properties
    properties = cursor.execute('''
        SELECT id, address, city, state FROM properties ORDER BY state, city
    ''').fetchall()
    
    print(f"Geocoding {len(properties)} properties...")
    print("This will take approximately {:.1f} minutes (1 request/second rate limit)\n".format(len(properties) * 1.1 / 60))
    
    full_matches = 0
    city_matches = 0
    failed = 0
    
    for i, (prop_id, address, city, state) in enumerate(properties):
        lat, lon, match_type = geocode_address(address, city, state)
        
        if lat and lon:
            cursor.execute('UPDATE properties SET lat = ?, lon = ? WHERE id = ?',
                          (lat, lon, prop_id))
            
            if match_type == 'full':
                full_matches += 1
                symbol = '✓'
            else:
                city_matches += 1
                symbol = '~'
        else:
            failed += 1
            symbol = '✗'
        
        # Progress update
        progress = i + 1
        if progress % 10 == 0 or progress == len(properties):
            print(f"[{progress}/{len(properties)}] {symbol} {city}, {state}: {lat}, {lon} ({match_type})")
        
        # Commit every 50 records
        if progress % 50 == 0:
            conn.commit()
        
        # Rate limit: 1 request per second (Nominatim policy)
        time.sleep(1.1)
    
    conn.commit()
    conn.close()
    
    print(f"\n{'='*50}")
    print(f"GEOCODING COMPLETE")
    print(f"{'='*50}")
    print(f"Full address matches: {full_matches}")
    print(f"City-level matches:   {city_matches}")
    print(f"Failed:               {failed}")
    print(f"Total:                {len(properties)}")

if __name__ == '__main__':
    main()
