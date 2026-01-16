"""
Main entry point for Emirates Auction Scraper
"""

import os
import sys
import json
from datetime import datetime

from .api import fetch_current_plates, check_active_auctions
from .tracker import AuctionTracker
from .buynow import scrape_all_buynow, scrape_buynow_emirate
from .config import ALL_EMIRATES, EMIRATES_CONFIG, BUYNOW_EMIRATES


def scrape_emirate(emirate: str) -> dict:
    """Scrape a single emirate auction and return results"""
    display_name = EMIRATES_CONFIG.get(emirate, {}).get("display_name", emirate)
    
    print(f"\n{'='*50}")
    print(f"Auction: {display_name}")
    print(f"{'='*50}")
    
    tracker = AuctionTracker(emirate)
    print(f"Loaded tracking state: {tracker.state.get('auction_id', 'new')}")
    
    if tracker.state.get("status") == "completed":
        print(f"Auction already completed for {display_name}.")
        if "--reset" in sys.argv:
            print("Resetting...")
            tracker.reset_for_new_auction()
        else:
            return {"emirate": emirate, "status": "already_completed", "should_continue": False, "rapid_mode": False}
    
    print(f"Fetching plates from API...")
    api_data = fetch_current_plates(emirate=emirate)
    
    if not api_data.get("is_active", False):
        print(f"No active auction for {display_name}")
        
        # Check if we have a stale active state that needs cleanup
        if tracker.state.get("status") == "active" and tracker.state.get("plates"):
            print("  ⚠️ Active tracking found but API reports no auction. Closing all plates...")
            # Passing empty plates list causes update_from_api to mark all existing active plates as completed
            tracker.update_from_api({"plates": []})
            tracker.save_state()
            
            if tracker.is_auction_complete():
                print(f"  🎉 Auto-archiving completed auction for {display_name}")
                archive_result = tracker.archive_completed_auction()
                print(f"  📦 Archived to {archive_result['csv_path']}")
                return {"emirate": emirate, "status": "completed", "archive": archive_result, "should_continue": False, "rapid_mode": False}
                
        return {"emirate": emirate, "status": "no_auction", "should_continue": False, "rapid_mode": False}
    
    plate_count = len(api_data.get("plates", []))
    print(f"Fetched {plate_count} active plates")
    
    result = tracker.update_from_api(api_data)
    
    print(f"  New: {result['new_plates']}, Updated: {result['updated_plates']}, Completed: {result['completed_plates']}")
    print(f"  Total: {result['total_count']}, Active: {result['active_count']}")
    
    rapid_mode = result.get("is_final_hours", False)
    if rapid_mode:
        print(f"⚡ RAPID MODE: Plates < 2 hours remaining!")
    
    tracker.save_state()
    
    if tracker.is_auction_complete():
        print(f"🎉 ALL PLATES COMPLETED for {display_name}!")
        archive_result = tracker.archive_completed_auction()
        print(f"📦 Archived: CSV at {archive_result['csv_path']}")
        print(f"📦 Archived: JSON at {archive_result['json_path']}")
        return {"emirate": emirate, "status": "completed", "archive": archive_result, "should_continue": False, "rapid_mode": False}
    
    return {
        "emirate": emirate,
        "status": "active",
        "should_continue": True,
        "rapid_mode": rapid_mode,
        "active_plates": result["active_count"],
        "total_plates": result["total_count"],
    }


def main():
    """Main scraping function"""
    print(f"{'='*60}")
    print(f"Emirates Auction Scraper")
    print(f"Run time: {datetime.utcnow().isoformat()}Z")
    print(f"{'='*60}")
    
    # Buy Now mode - scrape Buy Now sections
    if "--buynow" in sys.argv:
        print("\n🛒 BUY NOW MODE")
        
        if "--emirate" in sys.argv:
            idx = sys.argv.index("--emirate")
            if idx + 1 < len(sys.argv):
                emirate = sys.argv[idx + 1]
                if emirate in BUYNOW_EMIRATES:
                    result = scrape_buynow_emirate(emirate)
                    return {"mode": "buynow", "results": {emirate: result}}
                else:
                    print(f"No Buy Now section for {emirate}")
                    return {"mode": "buynow", "status": "no_section"}
        
        result = scrape_all_buynow()
        return {"mode": "buynow", **result}
    
    # Discovery mode
    if "--discover" in sys.argv:
        print("\n🔍 DISCOVERY MODE: Checking all emirates...")
        active_auctions = check_active_auctions()
        
        for emirate, info in active_auctions.items():
            status = "✅ ACTIVE" if info["is_active"] else "❌ No auction"
            count = f"({info['plate_count']} plates)" if info["is_active"] else ""
            print(f"  {info['display_name']}: {status} {count}")
        
        active_list = [e for e, info in active_auctions.items() if info["is_active"]]
        set_github_output("active_emirates", ",".join(active_list))
        set_github_output("has_active", str(len(active_list) > 0).lower())
        
        return {"mode": "discover", "active_emirates": active_list, "details": active_auctions}
    
    # Single emirate mode
    if "--emirate" in sys.argv:
        idx = sys.argv.index("--emirate")
        if idx + 1 < len(sys.argv):
            emirates_to_scrape = [sys.argv[idx + 1]]
        else:
            print("Error: --emirate requires emirate name")
            return {"status": "error"}
    else:
        emirates_to_scrape = ALL_EMIRATES
    
    # Scrape auctions
    results = {}
    any_rapid_mode = any_active = False
    
    for emirate in emirates_to_scrape:
        if emirate not in EMIRATES_CONFIG:
            print(f"Unknown emirate: {emirate}")
            continue
        
        result = scrape_emirate(emirate)
        results[emirate] = result
        
        if result.get("rapid_mode", False):
            any_rapid_mode = True
        if result.get("should_continue", False):
            any_active = True
    
    print(f"\n{'='*60}")
    print("SUMMARY")
    for emirate, result in results.items():
        display_name = EMIRATES_CONFIG.get(emirate, {}).get("display_name", emirate)
        print(f"  {display_name}: {result.get('status')} ({result.get('total_plates', 0)} plates)")
    
    set_github_output("any_rapid_mode", str(any_rapid_mode).lower())
    set_github_output("any_active", str(any_active).lower())
    
    return {"results": results, "any_rapid_mode": any_rapid_mode, "any_active": any_active}


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
    print(f"\n{'='*60}")
    print("Run complete!")
    print(json.dumps(result, indent=2, default=str))
