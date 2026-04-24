#!/usr/bin/env python3
"""
Bundle Walmart Realty site into self-contained HTML for Puppy Share.
Inlines JavaScript and base64 encodes images.
"""
import base64
import re
from pathlib import Path

PROJECT_DIR = Path(__file__).parent

def read_file(path):
    """Read file content."""
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def read_binary_file(path):
    """Read binary file and return base64."""
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

def get_spark_logo_data_url():
    """Get the spark logo as a data URL."""
    logo_path = PROJECT_DIR / 'spark-logo.png'
    b64 = read_binary_file(logo_path)
    return f'data:image/png;base64,{b64}'

def bundle_main_page():
    """Bundle index.html with inlined JavaScript."""
    html = read_file(PROJECT_DIR / 'index.html')
    app_js = read_file(PROJECT_DIR / 'app.js')
    spark_logo_data_url = get_spark_logo_data_url()
    
    # Replace spark-logo.png references with data URL
    html = html.replace('src="spark-logo.png"', f'src="{spark_logo_data_url}"')
    html = re.sub(r'src=["\']spark-logo\.png["\']', f'src="{spark_logo_data_url}"', html)
    
    # Replace the external app.js reference with inline script
    html = html.replace('<script src="app.js"></script>', f'<script>\n{app_js}\n</script>')
    
    # Update relative paths for uploads to note they won't work
    # (Marketing materials PDFs referenced in properties-data.js)
    html = html.replace(
        '<title>Walmart Real Estate',
        '<!-- BUNDLED FOR PUPPY SHARE - Marketing material PDFs not available in bundled version -->\n    <title>Walmart Real Estate'
    )
    
    return html

def bundle_admin_page():
    """Bundle admin.html with inlined assets."""
    html = read_file(PROJECT_DIR / 'admin.html')
    spark_logo_data_url = get_spark_logo_data_url()
    
    # Replace spark-logo.png references with data URL
    html = html.replace('src="spark-logo.png"', f'src="{spark_logo_data_url}"')
    html = re.sub(r'src=["\']spark-logo\.png["\']', f'src="{spark_logo_data_url}"', html)
    
    # Note about bundled version
    html = html.replace(
        '<title>Admin Panel',
        '<!-- BUNDLED FOR PUPPY SHARE -->\n    <title>Admin Panel'
    )
    
    return html

def main():
    """Generate bundled HTML files."""
    print("🔨 Bundling Walmart Realty for Puppy Share...")
    
    # Bundle main page
    print("  📄 Bundling index.html...")
    main_html = bundle_main_page()
    output_main = PROJECT_DIR / 'bundled-index.html'
    with open(output_main, 'w', encoding='utf-8') as f:
        f.write(main_html)
    print(f"  ✅ Created {output_main} ({len(main_html):,} bytes)")
    
    # Bundle admin page
    print("  📄 Bundling admin.html...")
    admin_html = bundle_admin_page()
    output_admin = PROJECT_DIR / 'bundled-admin.html'
    with open(output_admin, 'w', encoding='utf-8') as f:
        f.write(admin_html)
    print(f"  ✅ Created {output_admin} ({len(admin_html):,} bytes)")
    
    print("\n✨ Bundling complete!")
    print("\nNotes:")
    print("  - JavaScript is inlined in the HTML")
    print("  - Spark logo is base64 encoded")
    print("  - Marketing material PDFs (uploads/) are NOT included")
    print("  - LOI document templates (loi-documents/) are NOT included")
    print("  - For full functionality, host the complete project on GitHub Pages")

if __name__ == '__main__':
    main()
