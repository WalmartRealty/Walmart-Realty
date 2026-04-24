#!/usr/bin/env python3
"""
Re-geocode all properties in properties.json using Nominatim via Walmart proxy.
Uses stdlib urllib only - no extra packages needed.
Saves every 25 properties in case of interruption.
"""

import json, time, urllib.request, urllib.parse

PROPS_PATH = '/Users/b0m01y5/projects/walmart-realty-github/properties.json'

proxy = urllib.request.ProxyHandler({
    'http':  'http://sysproxy.wal-mart.com:8080',
    'https': 'http://sysproxy.wal-mart.com:8080'
})
opener = urllib.request.build_opener(proxy)
opener.addheaders = [('User-Agent', 'WalmartRealtyGeocoder/1.0 (brett.young@walmart.com)')]


def nominatim(query):
    url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(query)}&format=json&limit=1&countrycodes=us"
    try:
        data = json.loads(opener.open(url, timeout=15).read())
        if data:
            return float(data[0]['lat']), float(data[0]['lon'])
    except Exception as e:
        print(f"    ⚠️  Request error: {e}")
    return None, None


def geocode(address, city, state):
    # Strip hyphens (e.g. "82-491" -> "82491") for better matching
    clean_addr = (address or '').replace('-', '')

    # Try 1: clean address + city + state
    if clean_addr:
        lat, lon = nominatim(f"{clean_addr}, {city}, {state}, USA")
        if lat: return lat, lon, 'full'
        time.sleep(1.1)

    # Try 2: original address + city + state
    if address and address != clean_addr:
        lat, lon = nominatim(f"{address}, {city}, {state}, USA")
        if lat: return lat, lon, 'full'
        time.sleep(1.1)

    # Try 3: city + state only
    lat, lon = nominatim(f"{city}, {state}, USA")
    if lat: return lat, lon, 'city'

    return None, None, 'failed'


def main():
    with open(PROPS_PATH) as f:
        properties = json.load(f)

    total = len(properties)
    print(f"Re-geocoding {total} properties (~{total * 1.2 / 60:.1f} min)...\n")

    full = city_fb = failed = 0

    for i, prop in enumerate(properties):
        address = prop.get('address', '')
        city    = prop.get('city', '')
        state   = prop.get('state', '')
        old_lat = prop.get('lat') or 0
        old_lon = prop.get('lon') or 0

        lat, lon, match = geocode(address, city, state)

        if lat and lon:
            prop['lat'] = round(lat, 7)
            prop['lon'] = round(lon, 7)
            moved_m = (((lat - old_lat)**2 + (lon - old_lon)**2)**0.5) * 111000
            if match == 'full':
                full += 1
                symbol = '✅'
            else:
                city_fb += 1
                symbol = '🌆'
            print(f"[{i+1}/{total}] {symbol} {address}, {city} {state}  →  {lat:.6f}, {lon:.6f}  (~{moved_m:.0f}m moved)")
        else:
            failed += 1
            print(f"[{i+1}/{total}] ❌ FAILED: {address}, {city}, {state} — keeping old coords")

        # Checkpoint save every 25
        if (i + 1) % 25 == 0:
            with open(PROPS_PATH, 'w') as f:
                json.dump(properties, f, indent=2)
            print(f"  💾 Checkpoint saved ({i+1}/{total})\n")

        time.sleep(1.1)  # Nominatim: max 1 req/sec

    # Final save
    with open(PROPS_PATH, 'w') as f:
        json.dump(properties, f, indent=2)

    print(f"\n{'='*55}")
    print(f"GEOCODING COMPLETE")
    print(f"{'='*55}")
    print(f"✅ Full address matches : {full}")
    print(f"🌆 City-level fallbacks : {city_fb}")
    print(f"❌ Failed               : {failed}")
    print(f"Total                  : {total}")
    print(f"\n✅ properties.json updated!")


if __name__ == '__main__':
    main()
