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
    TRACKING_FILE,
    ARCHIVE_DIR,
    ACTIVE_EMIRATE,
    FINAL_HOURS_THRESHOLD_MINUTES,
)


class AuctionTracker:
    """Manages auction state and tracks plate prices over time"""

    def __init__(self, tracking_file: str = TRACKING_FILE):
        self.tracking_file = tracking_file
        self.state = self._load_state()

    def _load_state(self) -> dict:
        """Load existing state from tracking file or create new"""
        if os.path.exists(self.tracking_file):
            try:
                with open(self.tracking_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError) as e:
                print(f"Error loading state: {e}, creating new state")
        
        return self._create_new_state()

    def _create_new_state(self) -> dict:
        """Create a fresh tracking state"""
        now = datetime.utcnow().isoformat() + "Z"
        month_str = datetime.utcnow().strftime("%Y-%m")
        
        return {
            "auction_id": f"{ACTIVE_EMIRATE}_{month_str}",
            "emirate": ACTIVE_EMIRATE,
            "start_date": now,
            "last_updated": now,
            "status": "active",
            "plates": {},
            "stats": {
                "total_plates_seen": 0,
                "completed_plates": 0,
                "active_plates": 0,
            }
        }

    def save_state(self):
        """Save current state to tracking file"""
        # Ensure directory exists
        os.makedirs(os.path.dirname(self.tracking_file), exist_ok=True)
        
        self.state["last_updated"] = datetime.utcnow().isoformat() + "Z"
        
        with open(self.tracking_file, "w", encoding="utf-8") as f:
            json.dump(self.state, f, indent=2, ensure_ascii=False)

    def update_from_api(self, api_data: dict) -> dict:
        """
        Update tracking state with fresh API data.
        
        Returns dict with:
            - new_plates: count of newly discovered plates
            - updated_plates: count of plates with price changes
            - completed_plates: count of plates that just completed
            - is_final_hours: bool if any plate is in final hours
        """
        now = datetime.utcnow().isoformat() + "Z"
        
        api_plates = api_data.get("plates", [])
        api_lot_ids = {p["lot_id"] for p in api_plates}
        
        new_plates = 0
        updated_plates = 0
        completed_plates = 0
        min_time_remaining = float("inf")
        
        # Update existing plates and add new ones
        for plate in api_plates:
            lot_id = plate["lot_id"]
            
            if lot_id not in self.state["plates"]:
                # New plate discovered
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
                    "price_history": [
                        {"price": plate["current_price"], "timestamp": now}
                    ],
                }
                new_plates += 1
                
            else:
                # Existing plate - update if still active
                existing = self.state["plates"][lot_id]
                
                if existing["status"] == "completed":
                    # Already completed, don't modify
                    continue
                
                # Check for price change
                if existing["current_price"] != plate["current_price"]:
                    existing["price_history"].append({
                        "price": plate["current_price"],
                        "timestamp": now,
                    })
                    updated_plates += 1
                
                existing["current_price"] = plate["current_price"]
                existing["bid_count"] = plate["bid_count"]
                existing["last_seen"] = now
            
            # Track minimum time remaining
            if plate.get("time_remaining_seconds") is not None:
                min_time_remaining = min(min_time_remaining, plate["time_remaining_seconds"])
        
        # Check for plates that disappeared (completed)
        for lot_id, plate_data in self.state["plates"].items():
            if plate_data["status"] == "active" and lot_id not in api_lot_ids:
                # Plate no longer in API - mark as completed
                plate_data["status"] = "completed"
                plate_data["final_price"] = plate_data["current_price"]
                plate_data["completed_at"] = now
                completed_plates += 1
        
        # Update stats
        active_count = sum(
            1 for p in self.state["plates"].values() 
            if p["status"] == "active"
        )
        completed_count = sum(
            1 for p in self.state["plates"].values() 
            if p["status"] == "completed"
        )
        
        self.state["stats"] = {
            "total_plates_seen": len(self.state["plates"]),
            "completed_plates": completed_count,
            "active_plates": active_count,
        }
        
        # Check if in final hours (any plate < threshold)
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
        
        return all(
            p["status"] == "completed" 
            for p in self.state["plates"].values()
        )

    def generate_final_csv(self) -> str:
        """
        Generate final CSV with all auction results.
        
        Returns: path to generated CSV file
        """
        os.makedirs(ARCHIVE_DIR, exist_ok=True)
        
        date_str = datetime.utcnow().strftime("%Y-%m-%d")
        csv_path = os.path.join(ARCHIVE_DIR, f"{ACTIVE_EMIRATE}_{date_str}.csv")
        
        # Sort plates by final price (descending)
        sorted_plates = sorted(
            self.state["plates"].values(),
            key=lambda x: x.get("final_price") or x.get("current_price") or 0,
            reverse=True
        )
        
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            
            # Header
            writer.writerow([
                "plate_number",
                "plate_code",
                "final_price",
                "bid_count",
                "first_seen",
                "completed_at",
                "price_changes",
            ])
            
            # Data rows
            for plate in sorted_plates:
                final_price = plate.get("final_price") or plate.get("current_price", 0)
                price_changes = len(plate.get("price_history", [])) - 1
                
                writer.writerow([
                    plate["plate_number"],
                    plate["plate_code"],
                    final_price,
                    plate["bid_count"],
                    plate["first_seen"],
                    plate.get("completed_at", ""),
                    max(0, price_changes),
                ])
        
        # Update state
        self.state["status"] = "completed"
        self.state["csv_generated"] = csv_path
        
        return csv_path

    def reset_for_new_auction(self):
        """Archive current state and reset for new auction"""
        # Archive current tracking file
        if os.path.exists(self.tracking_file):
            archive_path = os.path.join(
                ARCHIVE_DIR,
                f"tracking_{datetime.utcnow().strftime('%Y-%m-%d_%H%M%S')}.json"
            )
            os.makedirs(ARCHIVE_DIR, exist_ok=True)
            os.rename(self.tracking_file, archive_path)
        
        # Create fresh state
        self.state = self._create_new_state()
        self.save_state()

    def get_summary(self) -> str:
        """Get a human-readable summary of current state"""
        stats = self.state.get("stats", {})
        
        return (
            f"Auction: {self.state.get('auction_id', 'Unknown')}\n"
            f"Status: {self.state.get('status', 'unknown')}\n"
            f"Total plates: {stats.get('total_plates_seen', 0)}\n"
            f"Active: {stats.get('active_plates', 0)}\n"
            f"Completed: {stats.get('completed_plates', 0)}\n"
            f"Last updated: {self.state.get('last_updated', 'Never')}"
        )
