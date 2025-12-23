"""
API client for Emirates Auction
"""

import requests
from datetime import datetime
from typing import Optional
from .config import (
    PLATES_ENDPOINT,
    EMIRATES_CONFIG,
    REQUEST_TIMEOUT,
    USER_AGENT,
)


class EmiratesAuctionAPI:
    """Client for interacting with Emirates Auction API"""

    def __init__(self, emirate: str):
        self.emirate = emirate
        config = EMIRATES_CONFIG.get(emirate, {})
        self.auction_type_id = config.get("auction_type_id", 0)
        self.display_name = config.get("display_name", emirate)
        
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
            "Accept": "application/json",
            "Referer": "https://www.emiratesauction.com/",
            "Origin": "https://www.emiratesauction.com",
        })

    def fetch_plates(self) -> dict:
        """
        Fetch all active plates from the auction.
        
        Returns:
            dict with keys:
                - plates: list of plate data
                - total_count: total number of plates
                - auction_info: auction metadata
                - is_active: whether there's an active auction
        """
        payload = {
            "PlateFilterRequest": {
                "PlateTypeIds": {"Filter": [], "IsSelected": False},
                "PlateNumberDigitsCount": {"Filter": [], "IsSelected": False},
                "Codes": {"Filter": [], "IsSelected": False},
                "EndDates": {"Filter": [], "IsSelected": False},
                "Prices": {},
                "IsExactSearch": False,
                "AuctionTypeId": self.auction_type_id
            },
            "PageSize": 150,
            "PageIndex": 0,
            "IsDesc": False
        }

        try:
            response = self.session.post(
                PLATES_ENDPOINT,
                json=payload,
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code == 400:
                error_data = response.json()
                if "invalid.typeid" in str(error_data):
                    return {
                        "plates": [],
                        "total_count": 0,
                        "auction_info": {
                            "auction_type_id": self.auction_type_id,
                            "emirate": self.emirate,
                            "display_name": self.display_name,
                        },
                        "is_active": False,
                    }
                print(f"API Error for {self.emirate}: {error_data}")
                return {"plates": [], "total_count": 0, "auction_info": None, "is_active": False}
            
            response.raise_for_status()
            data = response.json()
            
            return self._parse_response(data)
            
        except requests.RequestException as e:
            print(f"Error fetching plates for {self.emirate}: {e}")
            return {"plates": [], "total_count": 0, "auction_info": None, "is_active": False}

    def _parse_response(self, data: dict) -> dict:
        """Parse API response into structured format"""
        plates = []
        items = data.get("Data", [])
        total_count = data.get("TotalCount", len(items))
        
        for item in items:
            plate = self._parse_plate(item)
            if plate:
                plates.append(plate)
        
        is_active = len(plates) > 0
        
        auction_info = {
            "auction_type_id": self.auction_type_id,
            "emirate": self.emirate,
            "display_name": self.display_name,
            "total_count": total_count,
        }
        
        return {
            "plates": plates,
            "total_count": total_count,
            "auction_info": auction_info,
            "is_active": is_active,
        }

    def _parse_plate(self, item: dict) -> Optional[dict]:
        """Parse a single plate item from API response"""
        try:
            lot_id = item.get("Id")
            if not lot_id:
                return None
            
            plate_number = item.get("PlateNumber", "")
            plate_code = item.get("PlateCode", "")
            
            current_price_str = item.get("CurrentPriceStr", "0")
            try:
                current_price = int(str(current_price_str).replace(",", "").replace(" ", ""))
            except (ValueError, AttributeError):
                current_price = item.get("CurrentPrice", 0) or 0
            
            bid_count = item.get("Bids", 0) or 0
            
            end_date_timestamp = item.get("EndDateTimestamp")
            time_remaining_seconds = None
            end_date = None
            
            if end_date_timestamp:
                try:
                    end_date = datetime.fromtimestamp(end_date_timestamp)
                    now = datetime.now()
                    delta = end_date - now
                    time_remaining_seconds = max(0, int(delta.total_seconds()))
                    end_date = end_date.isoformat()
                except (ValueError, TypeError, OSError):
                    pass
            
            status = item.get("Status", 1)

            return {
                "lot_id": str(lot_id),
                "plate_number": str(plate_number),
                "plate_code": str(plate_code),
                "current_price": current_price,
                "bid_count": int(bid_count),
                "time_remaining_seconds": time_remaining_seconds,
                "end_date": end_date,
                "status": status,
            }
            
        except Exception as e:
            print(f"Error parsing plate: {e}")
            return None


def fetch_current_plates(emirate: str) -> dict:
    """Convenience function to fetch current plates for an emirate"""
    api = EmiratesAuctionAPI(emirate=emirate)
    return api.fetch_plates()


def check_active_auctions() -> dict:
    """Check which emirates have active auctions."""
    results = {}
    
    for emirate in EMIRATES_CONFIG.keys():
        api = EmiratesAuctionAPI(emirate=emirate)
        data = api.fetch_plates()
        results[emirate] = {
            "is_active": data.get("is_active", False),
            "plate_count": data.get("total_count", 0),
            "display_name": EMIRATES_CONFIG[emirate].get("display_name", emirate),
        }
    
    return results
