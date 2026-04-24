#!/usr/bin/env python3
"""
Load marketable properties from Excel into the database.
Uses state center coordinates as defaults (can be updated later).
"""

import pandas as pd
import sqlite3

# Configuration
EXCEL_PATH = '/Users/b0m01y5/Library/CloudStorage/OneDrive-SharedLibraries-WalmartInc/RealtyMgmt2 - Dispositions/Excess Property Classification and Marketing Strategy/Excess Property List (2026) Master.xlsm'
DB_PATH = '/Users/b0m01y5/projects/walmart-real-estate/server/walmart-realty.db'

# State center coordinates (approximate)
STATE_COORDS = {
    'AL': (32.806671, -86.791130), 'AK': (61.370716, -152.404419), 'AZ': (33.729759, -111.431221),
    'AR': (34.969704, -92.373123), 'CA': (36.116203, -119.681564), 'CO': (39.059811, -105.311104),
    'CT': (41.597782, -72.755371), 'DE': (39.318523, -75.507141), 'FL': (27.766279, -81.686783),
    'GA': (33.040619, -83.643074), 'HI': (21.094318, -157.498337), 'ID': (44.240459, -114.478828),
    'IL': (40.349457, -88.986137), 'IN': (39.849426, -86.258278), 'IA': (42.011539, -93.210526),
    'KS': (38.526600, -96.726486), 'KY': (37.668140, -84.670067), 'LA': (31.169546, -91.867805),
    'ME': (44.693947, -69.381927), 'MD': (39.063946, -76.802101), 'MA': (42.230171, -71.530106),
    'MI': (43.326618, -84.536095), 'MN': (45.694454, -93.900192), 'MS': (32.741646, -89.678696),
    'MO': (38.456085, -92.288368), 'MT': (46.921925, -110.454353), 'NE': (41.125370, -98.268082),
    'NV': (38.313515, -117.055374), 'NH': (43.452492, -71.563896), 'NJ': (40.298904, -74.521011),
    'NM': (34.840515, -106.248482), 'NY': (42.165726, -74.948051), 'NC': (35.630066, -79.806419),
    'ND': (47.528912, -99.784012), 'OH': (40.388783, -82.764915), 'OK': (35.565342, -96.928917),
    'OR': (44.572021, -122.070938), 'PA': (40.590752, -77.209755), 'RI': (41.680893, -71.511780),
    'SC': (33.856892, -80.945007), 'SD': (44.299782, -99.438828), 'TN': (35.747845, -86.692345),
    'TX': (31.054487, -97.563461), 'UT': (40.150032, -111.862434), 'VT': (44.045876, -72.710686),
    'VA': (37.769337, -78.169968), 'WA': (47.400902, -121.490494), 'WV': (38.491226, -80.954453),
    'WI': (44.268543, -89.616508), 'WY': (42.755966, -107.302490), 'DC': (38.897438, -77.026817),
    'PR': (18.220833, -66.590149), 'VI': (18.335765, -64.896335)
}

def load_marketable_sites():
    """Load marketable sites from Excel."""
    df = pd.read_excel(EXCEL_PATH, sheet_name='Excess Property List', header=1)
    marketable = df[df['Status'] == 'Marketable'].copy()
    
    # Clean up the data
    marketable = marketable.dropna(subset=['Store #', 'City', 'State'])
    
    print(f"Found {len(marketable)} marketable sites")
    return marketable

def insert_properties(marketable_df):
    """Insert properties into the database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Clear existing properties
    cursor.execute('DELETE FROM properties')
    cursor.execute('DELETE FROM property_images')
    print("Cleared existing properties")
    
    inserted = 0
    for idx, row in marketable_df.iterrows():
        # Handle store number (can be "912/8260" or regular number)
        store_val = row['Store #']
        if pd.notna(store_val):
            store_num = str(store_val).split('/')[0].strip()  # Take first number if split
            try:
                store_num = str(int(float(store_num)))
            except ValueError:
                store_num = str(store_val)
        else:
            store_num = ''
        prop_type = str(row['Property Type']) if pd.notna(row['Property Type']) else 'Land'
        address = str(row['Address']) if pd.notna(row['Address']) else ''
        city = str(row['City']).title() if pd.notna(row['City']) else ''
        state = str(row['State']).upper().strip() if pd.notna(row['State']) else ''
        # Parse size (handle special cases like "~1")
        size_val = row['Size']
        if pd.notna(size_val):
            try:
                size = float(str(size_val).replace('~', '').replace(',', '').strip())
            except ValueError:
                size = 0
        else:
            size = 0
        uom = str(row['UoM']) if pd.notna(row['UoM']) else 'acres'
        contact = str(row['Contact']) if pd.notna(row['Contact']) else ''
        
        # Get state coordinates
        lat, lon = STATE_COORDS.get(state, (39.8283, -98.5795))  # Default to US center
        
        # Normalize size to acres
        if 'sf' in uom.lower() or 'sq' in uom.lower():
            size_acres = size / 43560  # Convert sq ft to acres
        else:
            size_acres = size
        
        # Default to "sale" for land
        listing_type = 'sale'
        
        cursor.execute('''
            INSERT INTO properties (
                description, address, city, state,
                lat, lon, property_type, listing_type, size_acres,
                store_number, broker_name, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ''', (
            f"Marketable property - Store #{store_num}",
            address,
            city,
            state,
            lat,
            lon,
            prop_type.lower(),
            listing_type,
            round(size_acres, 2),
            store_num,
            contact,
            'available'
        ))
        inserted += 1
    
    conn.commit()
    conn.close()
    print(f"Inserted {inserted} properties")
    return inserted

def main():
    print("Loading marketable properties from Excel...")
    marketable = load_marketable_sites()
    
    print(f"\nInserting into database...")
    count = insert_properties(marketable)
    
    print(f"\n✅ Done! {count} properties loaded successfully.")

if __name__ == '__main__':
    main()
