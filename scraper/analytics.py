"""
Analytics module - Process auction data for dashboard
"""

import os
import json
import csv
from datetime import datetime
from typing import Dict, List, Any
from collections import defaultdict

from .config import DATA_DIR, ARCHIVE_DIR, BUYNOW_DIR, EMIRATES_CONFIG


def get_digit_count(plate_number: str) -> int:
    """Get the number of digits in a plate number"""
    return len(str(plate_number).strip())


def load_archived_auctions() -> List[Dict]:
    """Load all archived auction CSV files"""
    auctions = []
    
    if not os.path.exists(ARCHIVE_DIR):
        return auctions
    
    for filename in os.listdir(ARCHIVE_DIR):
        if filename.endswith('.csv') and not filename.startswith('tracking'):
            filepath = os.path.join(ARCHIVE_DIR, filename)
            
            # Parse emirate and date from filename (e.g., sharjah_2024-12-24.csv)
            parts = filename.replace('.csv', '').split('_')
            emirate = parts[0] if parts else 'unknown'
            date_str = parts[1] if len(parts) > 1 else ''
            
            plates = []
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        plates.append(row)
            except Exception as e:
                print(f"Error reading {filepath}: {e}")
                continue
            
            auctions.append({
                'emirate': emirate,
                'date': date_str,
                'filename': filename,
                'plates': plates,
                'count': len(plates),
            })
    
    return sorted(auctions, key=lambda x: x['date'])


def load_buynow_data() -> Dict[str, List[Dict]]:
    """Load all Buy Now CSV files"""
    data = {}
    
    if not os.path.exists(BUYNOW_DIR):
        return data
    
    for filename in os.listdir(BUYNOW_DIR):
        if filename.endswith('_buynow.csv'):
            emirate = filename.replace('_buynow.csv', '')
            filepath = os.path.join(BUYNOW_DIR, filename)
            
            plates = []
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        plates.append(row)
            except Exception as e:
                print(f"Error reading {filepath}: {e}")
                continue
            
            data[emirate] = plates
    
    return data


def calculate_auction_stats(plates: List[Dict]) -> Dict:
    """Calculate statistics for a list of plates"""
    if not plates:
        return {}
    
    # Group by digit count
    by_digits = defaultdict(list)
    all_prices = []
    
    for plate in plates:
        try:
            price = int(str(plate.get('final_price', 0) or plate.get('price', 0) or 0).replace(',', ''))
            plate_num = str(plate.get('plate_number', ''))
            digits = get_digit_count(plate_num)
            
            if price > 0:
                by_digits[digits].append(price)
                all_prices.append(price)
        except (ValueError, TypeError):
            continue
    
    stats = {
        'total_plates': len(plates),
        'total_value': sum(all_prices),
        'avg_price': int(sum(all_prices) / len(all_prices)) if all_prices else 0,
        'min_price': min(all_prices) if all_prices else 0,
        'max_price': max(all_prices) if all_prices else 0,
        'by_digits': {},
    }
    
    for digits, prices in sorted(by_digits.items()):
        stats['by_digits'][str(digits)] = {
            'count': len(prices),
            'avg': int(sum(prices) / len(prices)),
            'min': min(prices),
            'max': max(prices),
        }
    
    return stats


def generate_dashboard_data() -> Dict[str, Any]:
    """Generate all data needed for the dashboard"""
    print("Generating dashboard data...")
    
    # Load all data
    auctions = load_archived_auctions()
    buynow = load_buynow_data()
    
    # Auction trends by emirate
    auction_trends = defaultdict(list)
    for auction in auctions:
        emirate = auction['emirate']
        stats = calculate_auction_stats(auction['plates'])
        auction_trends[emirate].append({
            'date': auction['date'],
            'count': auction['count'],
            **stats,
        })
    
    # Buy Now summary
    buynow_summary = {}
    for emirate, plates in buynow.items():
        available = [p for p in plates if p.get('status') == 'available']
        sold = [p for p in plates if p.get('status') == 'sold']
        buynow_summary[emirate] = {
            'available': len(available),
            'sold': len(sold),
            'total': len(plates),
            'stats': calculate_auction_stats(available),
        }
    
    # Emirates info
    emirates_info = {
        key: {'display_name': cfg['display_name'], 'url_slug': cfg['url_slug']}
        for key, cfg in EMIRATES_CONFIG.items()
    }
    
    dashboard_data = {
        'generated_at': datetime.utcnow().isoformat() + 'Z',
        'emirates': emirates_info,
        'auction_trends': dict(auction_trends),
        'buynow': buynow_summary,
        'summary': {
            'total_auctions': len(auctions),
            'emirates_with_data': list(set(a['emirate'] for a in auctions)),
            'buynow_emirates': list(buynow.keys()),
        },
    }
    
    return dashboard_data


def export_dashboard_json(output_path: str = None) -> str:
    """Export dashboard data to JSON file"""
    if output_path is None:
        output_path = os.path.join(DATA_DIR, 'dashboard_data.json')
    
    data = generate_dashboard_data()
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Dashboard data exported to: {output_path}")
    return output_path


if __name__ == '__main__':
    export_dashboard_json()
