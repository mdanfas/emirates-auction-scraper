"""
Export auction data to JSON for the dashboard
"""

import os
import json
import csv
from datetime import datetime
from .config import DATA_DIR, ARCHIVE_DIR, BUYNOW_DIR, BUYNOW_ARCHIVE_DIR, EMIRATES_CONFIG


def load_buynow_csvs() -> dict:
    """Load all Buy Now CSV files - separates available and sold"""
    data = {}
    
    if not os.path.exists(BUYNOW_DIR):
        return data
    
    for filename in os.listdir(BUYNOW_DIR):
        if filename.endswith('_buynow.csv'):
            emirate_key = filename.replace('_buynow.csv', '')
            filepath = os.path.join(BUYNOW_DIR, filename)
            
            available = []
            sold = []
            last_updated = None
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        plate = {
                            'plate_number': row.get('plate_number', ''),
                            'plate_code': row.get('plate_code', ''),
                            'price': int(row.get('price', 0) or 0),
                            'status': row.get('status', 'available'),
                            'first_seen': row.get('first_seen', ''),
                            'last_seen': row.get('last_seen', ''),
                            'sold_at': row.get('sold_at', ''),
                        }
                        
                        if plate['status'] == 'sold':
                            sold.append(plate)
                        else:
                            available.append(plate)
                        
                        if row.get('last_seen'):
                            last_updated = row.get('last_seen')
            except Exception as e:
                print(f"Error reading {filepath}: {e}")
                continue
            
            display_name = EMIRATES_CONFIG.get(emirate_key, {}).get('display_name', emirate_key.title())
            
            data[emirate_key] = {
                'emirate': display_name,
                'available': sorted(available, key=lambda x: x['price'], reverse=True),
                'sold': sorted(sold, key=lambda x: x.get('sold_at', ''), reverse=True),
                'available_count': len(available),
                'sold_count': len(sold),
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


def load_archive_csvs() -> list:
    """Load archived auction results (CSV only)"""
    archives = []
    
    if not os.path.exists(ARCHIVE_DIR):
        return archives
    
    for filename in os.listdir(ARCHIVE_DIR):
        if filename.endswith('.csv') and not filename.startswith('.'):
            filepath = os.path.join(ARCHIVE_DIR, filename)
            
            # Parse filename: emirate_YYYY-MM-DD.csv
            parts = filename.replace('.csv', '').split('_')
            if len(parts) >= 2:
                emirate = parts[0]
                date = '_'.join(parts[1:])
            else:
                emirate = 'unknown'
                date = filename.replace('.csv', '')
            
            plates = []
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        plates.append({
                            'plate_number': row.get('plate_number', ''),
                            'plate_code': row.get('plate_code', ''),
                            'final_price': int(row.get('final_price', 0) or row.get('current_price', 0) or 0),
                            'bid_count': int(row.get('bid_count', 0) or 0),
                        })
            except Exception as e:
                print(f"Error reading {filepath}: {e}")
                continue
            
            display_name = EMIRATES_CONFIG.get(emirate, {}).get('display_name', emirate.title())
            
            archives.append({
                'filename': filename,
                'emirate': display_name,
                'emirate_key': emirate,
                'date': date,
                'plates': sorted(plates, key=lambda x: x['final_price'], reverse=True),
                'count': len(plates),
                'total_value': sum(p['final_price'] for p in plates),
            })
    
    # Sort by date descending
    archives.sort(key=lambda x: x['date'], reverse=True)
    return archives


def load_archived_buynow() -> list:
    """Load archived Buy Now CSV files"""
    archives = []
    
    if not os.path.exists(BUYNOW_ARCHIVE_DIR):
        return archives
    
    for filename in os.listdir(BUYNOW_ARCHIVE_DIR):
        if filename.endswith('.csv'):
            filepath = os.path.join(BUYNOW_ARCHIVE_DIR, filename)
            
            # Parse filename: emirate_buynow_YYYY-MM-DD_HHMMSS.csv
            parts = filename.replace('.csv', '').split('_')
            if len(parts) >= 4:
                emirate = parts[0]
                date = '_'.join(parts[2:])  # YYYY-MM-DD_HHMMSS
            else:
                emirate = 'unknown'
                date = filename.replace('.csv', '')
            
            plates = []
            total_value = 0
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        price = int(row.get('price', 0) or 0)
                        plates.append({
                            'plate_number': row.get('plate_number', ''),
                            'plate_code': row.get('plate_code', ''),
                            'price': price,
                            'status': row.get('status', ''),
                            'first_seen': row.get('first_seen', ''),
                            'sold_at': row.get('sold_at', ''),
                        })
                        total_value += price
            except Exception as e:
                print(f"Error reading {filepath}: {e}")
                continue
            
            display_name = EMIRATES_CONFIG.get(emirate, {}).get('display_name', emirate.title())
            
            archives.append({
                'filename': filename,
                'emirate': display_name,
                'emirate_key': emirate,
                'date': date,
                'plates': sorted(plates, key=lambda x: x['price'], reverse=True),
                'count': len(plates),
                'total_value': total_value,
                'sold_count': sum(1 for p in plates if p['status'] == 'sold'),
            })
    
    archives.sort(key=lambda x: x['date'], reverse=True)
    return archives


def load_archived_tracking() -> list:
    """Load archived auction tracking JSONs with full price history"""
    archives = []
    
    if not os.path.exists(ARCHIVE_DIR):
        return archives
    
    for filename in os.listdir(ARCHIVE_DIR):
        if filename.startswith('tracking_') and filename.endswith('.json'):
            filepath = os.path.join(ARCHIVE_DIR, filename)
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    tracking = json.load(f)
                
                # Extract emirate from filename: tracking_emirate_YYYY-MM-DD_HHMMSS.json
                parts = filename.replace('.json', '').split('_')
                if len(parts) >= 2:
                    emirate = parts[1]
                    date = '_'.join(parts[2:]) if len(parts) > 2 else ''
                else:
                    emirate = 'unknown'
                    date = ''
                
                plates = []
                for plate_id, plate_data in tracking.get('plates', {}).items():
                    final_price = plate_data.get('final_price') or plate_data.get('current_price', 0)
                    plates.append({
                        'id': plate_id,
                        'plate_number': plate_data.get('plate_number', ''),
                        'plate_code': plate_data.get('plate_code', ''),
                        'final_price': final_price,
                        'bid_count': plate_data.get('bid_count', 0),
                        'status': plate_data.get('status', ''),
                        'first_seen': plate_data.get('first_seen', ''),
                        'completed_at': plate_data.get('completed_at', ''),
                        'price_history': plate_data.get('price_history', []),
                    })
                
                display_name = tracking.get('display_name') or EMIRATES_CONFIG.get(emirate, {}).get('display_name', emirate.title())
                
                archives.append({
                    'filename': filename,
                    'auction_id': tracking.get('auction_id', ''),
                    'emirate': display_name,
                    'emirate_key': emirate,
                    'date': date,
                    'start_date': tracking.get('start_date', ''),
                    'last_updated': tracking.get('last_updated', ''),
                    'archived_at': tracking.get('archived_at', ''),
                    'plates': sorted(plates, key=lambda x: x['final_price'], reverse=True),
                    'count': len(plates),
                    'total_value': sum(p['final_price'] for p in plates),
                })
            except Exception as e:
                print(f"Error reading {filepath}: {e}")
                continue
    
    archives.sort(key=lambda x: x['date'], reverse=True)
    return archives


def export_dashboard_data():
    """Export all data for dashboard consumption"""
    print("Exporting dashboard data...")
    
    buynow = load_buynow_csvs()
    auctions = load_tracking_files()
    archives = load_archive_csvs()
    archived_buynow = load_archived_buynow()
    archived_tracking = load_archived_tracking()
    
    # Calculate totals
    buynow_available = sum(d['available_count'] for d in buynow.values())
    buynow_sold = sum(d['sold_count'] for d in buynow.values())
    
    dashboard_data = {
        'generated_at': datetime.utcnow().isoformat() + 'Z',
        'buynow': buynow,
        'auctions': auctions,
        'archives': archives,
        'archived_buynow': archived_buynow,
        'archived_tracking': archived_tracking,
        'summary': {
            'buynow_available': buynow_available,
            'buynow_sold': buynow_sold,
            'buynow_total': buynow_available + buynow_sold,
            'auctions_total': sum(d['count'] for d in auctions.values()),
            'archives_count': len(archives),
            'archived_buynow_count': len(archived_buynow),
            'archived_tracking_count': len(archived_tracking),
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
    print(f"  Buy Now: {buynow_available} available, {buynow_sold} sold")
    print(f"  Auctions: {dashboard_data['summary']['auctions_total']} plates")
    print(f"  Archives: {len(archives)} past auctions (CSV)")
    print(f"  Archived Buy Now: {len(archived_buynow)} snapshots")
    print(f"  Archived Tracking: {len(archived_tracking)} auction records")
    
    return output_path


if __name__ == '__main__':
    export_dashboard_data()
