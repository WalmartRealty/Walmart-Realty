#!/usr/bin/env python3
"""Export all properties from SQLite database to properties-data.js for GitHub Pages."""

import sqlite3
import json
import os

# Path to the database with all properties
DB_PATH = "../walmart-real-estate/server/walmart-realty.db"
OUTPUT_PATH = "properties-data.js"

def export_properties():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            store_number,
            city,
            state,
            address,
            size_acres,
            property_type,
            price,
            lat,
            lon,
            description,
            features,
            broker_name,
            broker_email,
            broker_phone
        FROM properties 
        ORDER BY state, city
    """)
    
    properties = []
    for row in cursor.fetchall():
        prop = {
            "store_num": int(row["store_number"]) if row["store_number"] else None,
            "city": row["city"],
            "state": row["state"],
            "address": row["address"],
            "size_acres": row["size_acres"],
            "type": row["property_type"] or "land",
            "price": row["price"],
            "lat": row["lat"],
            "lon": row["lon"],
            "description": row["description"],
        }
        
        # Parse features if present
        if row["features"]:
            try:
                prop["features"] = json.loads(row["features"])
            except:
                prop["features"] = [f.strip() for f in row["features"].split(",") if f.strip()]
        
        # Add broker info if present
        if row["broker_name"]:
            prop["broker"] = {
                "name": row["broker_name"],
                "email": row["broker_email"],
                "phone": row["broker_phone"],
                "company": "Walmart Realty"
            }
        
        # Remove None values to keep the file clean
        prop = {k: v for k, v in prop.items() if v is not None}
        
        properties.append(prop)
    
    conn.close()
    
    # Generate JavaScript file
    js_content = """// Real Walmart Property Data - Generated from SQLite Database
// Total Properties: {}

const properties = {};

export default properties;
""".format(len(properties), json.dumps(properties, indent=2))
    
    with open(OUTPUT_PATH, "w") as f:
        f.write(js_content)
    
    print(f"✅ Exported {len(properties)} properties to {OUTPUT_PATH}")

if __name__ == "__main__":
    export_properties()
