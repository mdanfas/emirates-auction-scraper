"""
State management and tracking logic for auction data
"""

import json
import csv
import os
from datetime import datetime
from typing import Optional
from .config import (
    DATA_DIR,
    ARCHIVE_DIR,
    FINAL_HOURS_THRESHOLD_MINUTES,
    EMIRATES_CONFIG,
    get_tracking_file,
)


class AuctionTracker:
    """Manages auction state and tracks plate prices over time"""

    def __init__(self, emirate: str):
        self.emirate = emirate
        self.tracking_file = get_tracking_file(emirate)
        self.display_name = EMIRATES_CONFIG.get(emirate, {}).get("display_name", emirate)
        self.state = self._load_state()

    def _load_state(self) -> dict:
        """Load existing state from tracking file or create new"""
        if os.path.exists(self.tracking_file):
            try:
                with open(self.tracking_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError) as e:
                print(f"Error loading state for {self.emirate}: {e}")
        return self._create_new_state()

    def _create_new_state(self) -> dict:
        """Create a fresh tracking state"""
        now = datetime.utcnow().isoformat() + "Z"
        month_str = datetime.utcnow().strftime("%Y-%m")
        
        return {
            "auction_id": f"{self.emirate}_{month_str}",
            "emirate": self.emirate,
            "display_name": self.display_name,
            "start_date": now,
            "last_updated": now,
            "status": "active",
            "plates": {},
            "stats": {"total_plates_seen": 0, "completed_plates": 0, "active_plates": 0}
        }

    def save_state(self):
        """Save current state to tracking file"""
        os.makedirs(os.path.dirname(self.tracking_file), exist_ok=True)
        self.state["last_updated"] = datetime.utcnow().isoformat() + "Z"
        with open(self.tracking_file, "w", encoding="utf-8") as f:
            json.dump(self.state, f, indent=2, ensure_ascii=False)

    def update_from_api(self, api_data: dict) -> dict:
        """Update tracking state with fresh API data."""
        now = datetime.utcnow().isoformat() + "Z"
        api_plates = api_data.get("plates", [])
        api_lot_ids = {p["lot_id"] for p in api_plates}
        
        new_plates = updated_plates = completed_plates = 0
        min_time_remaining = float("inf")
        
        for plate in api_plates:
            lot_id = plate["lot_id"]
            
            if lot_id not in self.state["plates"]:
                self.state["plates"][lot_id] = {
                    "plate_number": plate["plate_number"],
                    "plate_code": plate["plate_code"],
                    "current_price": plate["current_price"],
                    "bid_count": plate["bid_count"],
                    "first_seen": now,
                    "last_seen": now,
                    "status": "active",
                    "final_price": None,
                    "completed_at": None,
                    "price_history": [{"price": plate["current_price"], "timestamp": now}],
                }
                new_plates += 1
            else:
                existing = self.state["plates"][lot_id]
                if existing["status"] == "completed":
                    continue
                
                if existing["current_price"] != plate["current_price"]:
                    existing["price_history"].append({"price": plate["current_price"], "timestamp": now})
                    updated_plates += 1
                
                existing["current_price"] = plate["current_price"]
                existing["bid_count"] = plate["bid_count"]
                existing["last_seen"] = now
            
            if plate.get("time_remaining_seconds") is not None:
                min_time_remaining = min(min_time_remaining, plate["time_remaining_seconds"])
        
        for lot_id, plate_data in self.state["plates"].items():
            if plate_data["status"] == "active" and lot_id not in api_lot_ids:
                plate_data["status"] = "completed"
                plate_data["final_price"] = plate_data["current_price"]
                plate_data["completed_at"] = now
                completed_plates += 1
        
        active_count = sum(1 for p in self.state["plates"].values() if p["status"] == "active")
        completed_count = sum(1 for p in self.state["plates"].values() if p["status"] == "completed")
        
        self.state["stats"] = {
            "total_plates_seen": len(self.state["plates"]),
            "completed_plates": completed_count,
            "active_plates": active_count,
        }
        
        is_final_hours = min_time_remaining < (FINAL_HOURS_THRESHOLD_MINUTES * 60)
        
        return {
            "new_plates": new_plates,
            "updated_plates": updated_plates,
            "completed_plates": completed_plates,
            "is_final_hours": is_final_hours,
            "min_time_remaining_seconds": min_time_remaining if min_time_remaining != float("inf") else None,
            "active_count": active_count,
            "total_count": len(self.state["plates"]),
        }

    def is_auction_complete(self) -> bool:
        """Check if all tracked plates have completed"""
        if not self.state["plates"]:
            return False
        return all(p["status"] == "completed" for p in self.state["plates"].values())

    def generate_final_csv(self) -> str:
        """Generate final CSV with all auction results."""
        os.makedirs(ARCHIVE_DIR, exist_ok=True)
        date_str = datetime.utcnow().strftime("%Y-%m-%d")
        csv_path = os.path.join(ARCHIVE_DIR, f"{self.emirate}_{date_str}.csv")
        
        sorted_plates = sorted(
            self.state["plates"].values(),
            key=lambda x: x.get("final_price") or x.get("current_price") or 0,
            reverse=True
        )
        
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["emirate", "plate_number", "plate_code", "final_price", "bid_count", "first_seen", "completed_at", "price_changes"])
            
            for plate in sorted_plates:
                final_price = plate.get("final_price") or plate.get("current_price", 0)
                price_changes = len(plate.get("price_history", [])) - 1
                writer.writerow([
                    self.display_name,
                    plate["plate_number"],
                    plate["plate_code"],
                    final_price,
                    plate["bid_count"],
                    plate["first_seen"],
                    plate.get("completed_at", ""),
                    max(0, price_changes),
                ])
        
        self.state["status"] = "completed"
        self.state["csv_generated"] = csv_path
        return csv_path

    def archive_completed_auction(self) -> dict:
        """
        Archive the completed auction data.
        Called when all plates in the auction have completed.
        
        Returns dict with archive paths for CSV and JSON.
        """
        os.makedirs(ARCHIVE_DIR, exist_ok=True)
        date_str = datetime.utcnow().strftime("%Y-%m-%d")
        timestamp_str = datetime.utcnow().strftime("%Y-%m-%d_%H%M%S")
        
        # Generate final CSV
        csv_path = self.generate_final_csv()
        
        # Archive the tracking JSON
        json_archive_path = os.path.join(ARCHIVE_DIR, f"tracking_{self.emirate}_{timestamp_str}.json")
        if os.path.exists(self.tracking_file):
            # Save final state before archiving
            self.state["status"] = "archived"
            self.state["archived_at"] = datetime.utcnow().isoformat() + "Z"
            self.save_state()
            
            os.rename(self.tracking_file, json_archive_path)
        
        # Create fresh state for next auction
        self.state = self._create_new_state()
        self.save_state()
        
        return {
            "csv_path": csv_path,
            "json_path": json_archive_path,
            "archived_at": datetime.utcnow().isoformat() + "Z"
        }

    def reset_for_new_auction(self):
        """Reset tracking for new auction (use archive_completed_auction if auction completed)"""
        self.state = self._create_new_state()
        self.save_state()
