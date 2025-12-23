"""
Main entry point for Emirates Auction Scraper
"""

import os
import sys
import json
from datetime import datetime

from .api import fetch_current_plates
from .tracker import AuctionTracker
from .config import ACTIVE_EMIRATE, EMIRATE_ID


def main():
    """Main scraping function"""
    print(f"=" * 60)
    print(f"Emirates Auction Scraper - {ACTIVE_EMIRATE.upper()}")
    print(f"Run time: {datetime.utcnow().isoformat()}Z")
    print(f"=" * 60)
    
    # Initialize tracker
    tracker = AuctionTracker()
    print(f"\nLoaded tracking state: {tracker.state.get('auction_id', 'new')}")
    print(f"Current status: {tracker.state.get('status', 'unknown')}")
    
    # Check if auction already completed
    if tracker.state.get("status") == "completed":
        print("\nAuction already marked as completed.")
        print("Run with --reset to start tracking a new auction.")
        
        if "--reset" in sys.argv:
            print("Resetting for new auction...")
            tracker.reset_for_new_auction()
        else:
            return {
                "status": "already_completed",
                "should_continue": False,
                "rapid_mode": False,
            }
    
    # Fetch latest data from API
    print(f"\nFetching plates from API (Emirate: {ACTIVE_EMIRATE})...")
    api_data = fetch_current_plates(emirate=ACTIVE_EMIRATE)
    
    plate_count = len(api_data.get("plates", []))
    print(f"Fetched {plate_count} active plates from API")
    
    if plate_count == 0 and len(tracker.state.get("plates", {})) > 0:
        print("WARNING: API returned 0 plates but we have tracked plates.")
        print("This might indicate the auction has ended or an API issue.")
    
    # Update tracker with new data
    result = tracker.update_from_api(api_data)
    
    print(f"\nUpdate Results:")
    print(f"  - New plates discovered: {result['new_plates']}")
    print(f"  - Plates with price changes: {result['updated_plates']}")
    print(f"  - Plates just completed: {result['completed_plates']}")
    print(f"  - Total tracked plates: {result['total_count']}")
    print(f"  - Still active: {result['active_count']}")
    
    if result.get("min_time_remaining_seconds") is not None:
        mins = result["min_time_remaining_seconds"] // 60
        hours = mins // 60
        mins = mins % 60
        print(f"  - Min time remaining: {hours}h {mins}m")
    
    # Check if in rapid mode
    rapid_mode = result.get("is_final_hours", False)
    if rapid_mode:
        print(f"\n⚡ RAPID MODE: Some plates have < 2 hours remaining!")
    
    # Save updated state
    tracker.save_state()
    print(f"\nTracking state saved.")
    
    # Check if auction is complete
    if tracker.is_auction_complete():
        print(f"\n🎉 ALL PLATES COMPLETED!")
        print("Generating final CSV...")
        
        csv_path = tracker.generate_final_csv()
        tracker.save_state()
        
        print(f"Final results saved to: {csv_path}")
        
        # Print summary of top 10 plates
        print(f"\nTop 10 Plates by Final Price:")
        print("-" * 50)
        
        sorted_plates = sorted(
            tracker.state["plates"].values(),
            key=lambda x: x.get("final_price", 0) or 0,
            reverse=True
        )[:10]
        
        for i, plate in enumerate(sorted_plates, 1):
            price = plate.get("final_price", 0) or plate.get("current_price", 0)
            print(f"  {i}. Plate {plate['plate_number']} (Code {plate['plate_code']}): AED {price:,}")
        
        return {
            "status": "completed",
            "csv_path": csv_path,
            "should_continue": False,
            "rapid_mode": False,
        }
    
    # Return status for GitHub Actions
    return {
        "status": "active",
        "should_continue": True,
        "rapid_mode": rapid_mode,
        "active_plates": result["active_count"],
        "total_plates": result["total_count"],
    }


def set_github_output(key: str, value: str):
    """Set output variable for GitHub Actions"""
    github_output = os.environ.get("GITHUB_OUTPUT")
    if github_output:
        with open(github_output, "a") as f:
            f.write(f"{key}={value}\n")
    else:
        print(f"[OUTPUT] {key}={value}")


if __name__ == "__main__":
    result = main()
    
    # Set outputs for GitHub Actions
    set_github_output("status", result.get("status", "unknown"))
    set_github_output("should_continue", str(result.get("should_continue", False)).lower())
    set_github_output("rapid_mode", str(result.get("rapid_mode", False)).lower())
    
    print(f"\n" + "=" * 60)
    print("Run complete!")
    print(json.dumps(result, indent=2))
