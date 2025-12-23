"""
Export auction data to JSON for the dashboard
"""

import os
import json
import csv
from datetime import datetime
from .config import DATA_DIR, ARCHIVE_DIR, BUYNOW_DIR, EMIRATES_CONFIG


def load_buynow_csvs() -> dict:
    """Load all Buy Now CSV files"""
    data = {}
    
    if not os.path.exists(BUYNOW_DIR):
        return data
    
    for filename in os.listdir(BUYNOW_DIR):
        if filename.endswith('_buynow.csv'):
            emirate_key = filename.replace('_buynow.csv', '')
            filepath = os.path.join(BUYNOW_DIR, filename)
            
            plates = []
            last_updated = None
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        plates.append({
                            'plate_number': row.get('plate_number', ''),
                            'plate_code': row.get('plate_code', ''),
                            'price': int(row.get('price', 0) or 0),
                            'status': row.get('status', 'available'),
                            'first_seen': row.get('first_seen', ''),
                            'last_seen': row.get('last_seen', ''),
                        })
                        if row.get('last_seen'):
                            last_updated = row.get('last_seen')
            except Exception as e:
                print(f"Error reading {filepath}: {e}")
                continue
            
            # Get display name
            display_name = EMIRATES_CONFIG.get(emirate_key, {}).get('display_name', emirate_key.title())
            
            data[emirate_key] = {
                'emirate': display_name,
                'plates': sorted(plates, key=lambda x: x['price'], reverse=True),
                'count': len(plates),
                'lastUpdated': last_updated or datetime.utcnow().isoformat() + 'Z',
            }
    
    return data


def load_tracking_files() -> dict:
    """Load all tracking JSON files for active auctions"""
    data = {}
    
    for filename in os.listdir(DATA_DIR):
        if filename.startswith('tracking_') and filename.endswith('.json'):
            emirate = filename.replace('tracking_', '').replace('.json', '')
            filepath = os.path.join(DATA_DIR, filename)
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    tracking = json.load(f)
                
                # Only include if active
                if tracking.get('status') == 'active':
                    plates = []
                    for plate_id, plate_data in tracking.get('plates', {}).items():
                        plates.append({
                            'id': plate_id,
                            'plate_number': plate_data.get('plate_number', ''),
                            'plate_code': plate_data.get('plate_code', ''),
                            'price': plate_data.get('current_price', 0),
                            'bid_count': plate_data.get('bid_count', 0),
                            'status': plate_data.get('status', 'active'),
                        })
                    
                    data[emirate] = {
                        'auction_id': tracking.get('auction_id', ''),
                        'emirate': tracking.get('display_name', emirate.title()),
                        'start_date': tracking.get('start_date', ''),
                        'last_updated': tracking.get('last_updated', ''),
                        'status': tracking.get('status', 'active'),
                        'plates': sorted(plates, key=lambda x: x['price'], reverse=True),
                        'count': len(plates),
                    }
            except Exception as e:
                print(f"Error reading {filepath}: {e}")
                continue
    
    return data


def export_dashboard_data():
    """Export all data for dashboard consumption"""
    print("Exporting dashboard data...")
    
    buynow = load_buynow_csvs()
    auctions = load_tracking_files()
    
    dashboard_data = {
        'generated_at': datetime.utcnow().isoformat() + 'Z',
        'buynow': buynow,
        'auctions': auctions,
        'summary': {
            'buynow_total': sum(d['count'] for d in buynow.values()),
            'auctions_total': sum(d['count'] for d in auctions.values()),
            'buynow_emirates': list(buynow.keys()),
            'auction_emirates': list(auctions.keys()),
        }
    }
    
    # Save to dashboard public folder
    output_path = os.path.join('dashboard', 'public', 'data.json')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(dashboard_data, f, indent=2, ensure_ascii=False)
    
    print(f"Exported to: {output_path}")
    print(f"  Buy Now: {dashboard_data['summary']['buynow_total']} plates")
    print(f"  Auctions: {dashboard_data['summary']['auctions_total']} plates")
    
    return output_path


if __name__ == '__main__':
    export_dashboard_data()
