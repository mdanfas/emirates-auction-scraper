"""
Buy Now plates scraper module - uses API endpoint
"""

import os
import csv
import requests
from datetime import datetime
from typing import List, Dict, Optional
from .config import (
    EMIRATES_CONFIG,
    BUYNOW_EMIRATES,
    BUYNOW_DIR,
    BUYNOW_ARCHIVE_DIR,
    PLATES_BUYNOW_ENDPOINT,
    REQUEST_TIMEOUT,
    USER_AGENT,
    get_buynow_file,
)


class BuyNowScraper:
    """Scraper for Buy Now plates section using API"""

    def __init__(self, emirate: str):
        self.emirate = emirate
        config = EMIRATES_CONFIG.get(emirate, {})
        self.buynow_type_id = config.get("buynow_type_id")
        self.display_name = config.get("display_name", emirate)
        self.url_slug = config.get("url_slug", emirate)
        
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
            "Accept": "application/json",
            "Referer": f"https://www.emiratesauction.com/plates/{self.url_slug}/buy-now",
            "Origin": "https://www.emiratesauction.com",
        })

    def fetch_plates(self) -> dict:
        """
        Fetch Buy Now plates from API.
        
        Returns:
            dict with keys:
                - plates: list of plate data
                - total_count: total number of plates
                - is_available: whether there are plates available
        """
        if not self.buynow_type_id:
            return {"plates": [], "total_count": 0, "is_available": False}
        
        # Correct payload structure for Buy Now API
        payload = {
            "PlateFilterRequest": {
                "AuctionTypeId": self.buynow_type_id
            },
            "PageSize": 200,  # Get all plates
            "PageIndex": 0
        }
        
        try:
            response = self.session.post(
                PLATES_BUYNOW_ENDPOINT,
                json=payload,
                timeout=REQUEST_TIMEOUT
            )
            
            # Handle 400 errors (no active Buy Now list)
            if response.status_code == 400:
                return {"plates": [], "total_count": 0, "is_available": False}
            
            response.raise_for_status()
            data = response.json()
            
            return self._parse_response(data)
            
        except requests.RequestException as e:
            print(f"Error fetching Buy Now plates for {self.emirate}: {e}")
            return {"plates": [], "total_count": 0, "is_available": False}

    def _parse_response(self, data: dict) -> dict:
        """Parse API response into structured format"""
        plates = []
        items = data.get("Data", [])
        total_count = data.get("TotalCount", len(items))
        
        for item in items:
            plate = self._parse_plate(item)
            if plate:
                plates.append(plate)
        
        return {
            "plates": plates,
            "total_count": len(plates),
            "is_available": len(plates) > 0,
        }

    def _parse_plate(self, item: dict) -> Optional[Dict]:
        """Parse a single plate item from API response"""
        try:
            plate_id = item.get("Id")
            if not plate_id:
                return None
            
            plate_number = item.get("PlateNumber", "")
            plate_code = item.get("PlateCode", "")
            
            # Get price
            current_price_str = item.get("CurrentPriceStr", "0")
            try:
                price = int(str(current_price_str).replace(",", "").replace(" ", ""))
            except (ValueError, AttributeError):
                price = item.get("CurrentPrice", 0) or 0

            return {
                "id": str(plate_id),
                "plate_number": str(plate_number),
                "plate_code": str(plate_code),
                "price": price,
                "emirate": self.display_name,
            }
            
        except Exception as e:
            print(f"Error parsing plate: {e}")
            return None

    def save_to_csv(self, plates: List[Dict]) -> dict:
        """
        Save plates to CSV file for this emirate.
        
        Returns: dict with csv_path, should_archive flag, and stats
        """
        os.makedirs(BUYNOW_DIR, exist_ok=True)
        
        csv_path = get_buynow_file(self.emirate)
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        # Load existing plates to track history
        existing_plates = {}
        had_existing_data = False
        if os.path.exists(csv_path):
            with open(csv_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    key = f"{row['plate_code']}_{row['plate_number']}"
                    existing_plates[key] = row
                    had_existing_data = True
        
        # Count available plates before update
        available_before = sum(1 for p in existing_plates.values() if p.get("status") == "available")
        
        # Update with new plates
        for plate in plates:
            key = f"{plate['plate_code']}_{plate['plate_number']}"
            if key not in existing_plates:
                # New plate
                existing_plates[key] = {
                    "emirate": self.display_name,
                    "plate_number": plate["plate_number"],
                    "plate_code": plate["plate_code"],
                    "price": plate["price"],
                    "first_seen": timestamp,
                    "last_seen": timestamp,
                    "status": "available",
                    "sold_at": "",
                }
            else:
                # Update existing
                existing_plates[key]["last_seen"] = timestamp
                existing_plates[key]["price"] = plate["price"]
                if existing_plates[key].get("status") == "sold":
                    existing_plates[key]["status"] = "available"
                    existing_plates[key]["sold_at"] = ""
        
        # Mark disappeared plates as sold
        current_keys = {f"{p['plate_code']}_{p['plate_number']}" for p in plates}
        for key, data in existing_plates.items():
            if key not in current_keys and data.get("status") == "available":
                data["status"] = "sold"
                data["sold_at"] = timestamp
        
        # Check archive conditions
        available_after = sum(1 for p in existing_plates.values() if p.get("status") == "available")
        all_sold = had_existing_data and available_after == 0
        list_empty = had_existing_data and len(plates) == 0
        should_archive = all_sold or list_empty
        
        # Write CSV
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            fieldnames = ["emirate", "plate_number", "plate_code", "price", "first_seen", "last_seen", "status", "sold_at"]
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
            writer.writeheader()
            
            sorted_plates = sorted(
                existing_plates.values(), 
                key=lambda x: int(x.get("price", 0) or 0), 
                reverse=True
            )
            for plate in sorted_plates:
                writer.writerow(plate)
        
        return {
            "csv_path": csv_path,
            "should_archive": should_archive,
            "available_before": available_before,
            "available_after": available_after,
            "total_plates": len(existing_plates),
            "archive_reason": "all_sold" if all_sold else ("list_empty" if list_empty else None)
        }

    def archive_buynow_data(self) -> Optional[str]:
        """
        Archive the Buy Now CSV file to archive directory.
        Called when all plates are sold or list goes empty.
        
        Returns: archive path or None if no file to archive
        """
        csv_path = get_buynow_file(self.emirate)
        if not os.path.exists(csv_path):
            return None
        
        os.makedirs(BUYNOW_ARCHIVE_DIR, exist_ok=True)
        timestamp_str = datetime.utcnow().strftime("%Y-%m-%d_%H%M%S")
        archive_path = os.path.join(BUYNOW_ARCHIVE_DIR, f"{self.emirate}_buynow_{timestamp_str}.csv")
        
        # Copy to archive (keep original for tracking new plates)
        import shutil
        shutil.copy(csv_path, archive_path)
        
        print(f"📦 Archived Buy Now data to: {archive_path}")
        return archive_path


def scrape_buynow_emirate(emirate: str) -> dict:
    """Scrape Buy Now plates for a single emirate"""
    display_name = EMIRATES_CONFIG.get(emirate, {}).get("display_name", emirate)
    
    print(f"\n{'='*50}")
    print(f"Buy Now: {display_name}")
    print(f"{'='*50}")
    
    scraper = BuyNowScraper(emirate)
    
    if not scraper.buynow_type_id:
        print(f"No Buy Now section for {display_name}")
        return {"emirate": emirate, "status": "no_section", "count": 0}
    
    print(f"Fetching Buy Now plates from API...")
    data = scraper.fetch_plates()
    
    plate_count = data.get("total_count", 0)
    print(f"Found {plate_count} plates from API")
    
    # Always call save_to_csv to track sold plates even when list is empty
    save_result = scraper.save_to_csv(data.get("plates", []))
    print(f"Saved to: {save_result['csv_path']}")
    print(f"Available: {save_result['available_after']} / Total tracked: {save_result['total_plates']}")
    
    if plate_count > 0:
        # Show sample
        for plate in data["plates"][:5]:
            print(f"  - Plate {plate['plate_number']} ({plate['plate_code']}): AED {plate['price']:,}")
        if plate_count > 5:
            print(f"  ... and {plate_count - 5} more")
    else:
        print(f"No Buy Now plates currently available for {display_name}")
    
    # Check if we should archive (all sold or list empty)
    archive_path = None
    if save_result.get("should_archive"):
        reason = save_result.get("archive_reason", "unknown")
        print(f"🎉 ARCHIVE TRIGGERED: {reason}")
        archive_path = scraper.archive_buynow_data()
    
    return {
        "emirate": emirate,
        "status": "success" if plate_count > 0 else "empty",
        "count": plate_count,
        "available": save_result.get("available_after", 0),
        "total_tracked": save_result.get("total_plates", 0),
        "archived": archive_path is not None,
        "archive_path": archive_path,
    }


def scrape_all_buynow() -> dict:
    """Scrape Buy Now plates for all supported emirates"""
    print(f"\n{'='*60}")
    print("BUY NOW PLATES SCRAPER")
    print(f"{'='*60}")
    print(f"Checking: {', '.join([EMIRATES_CONFIG[e]['display_name'] for e in BUYNOW_EMIRATES])}")
    
    results = {}
    total_plates = 0
    
    for emirate in BUYNOW_EMIRATES:
        result = scrape_buynow_emirate(emirate)
        results[emirate] = result
        total_plates += result.get("count", 0)
    
    print(f"\n{'='*60}")
    print(f"BUY NOW SUMMARY: {total_plates} plates across {len(BUYNOW_EMIRATES)} emirates")
    print(f"{'='*60}")
    
    return {
        "results": results,
        "total_plates": total_plates,
    }
