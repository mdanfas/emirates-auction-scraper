"""
API client for Emirates Auction
"""

import requests
from datetime import datetime
from typing import Optional
from .config import (
    PLATES_ENDPOINT,
    EMIRATE_ID,
    REQUEST_TIMEOUT,
    USER_AGENT,
    ACTIVE_EMIRATE,
)


# Auction Type IDs for each emirate (these map to online auctions)
AUCTION_TYPE_IDS = {
    "sharjah": 21,
    "dubai": 1,  # May need to verify
    "abudhabi": 2,  # May need to verify
    "ajman": 4,
    "umm_al_quwain": 5,
    "ras_al_khaimah": 6,
    "fujairah": 7,
}


class EmiratesAuctionAPI:
    """Client for interacting with Emirates Auction API"""

    def __init__(self, emirate: str = ACTIVE_EMIRATE):
        self.emirate = emirate
        self.auction_type_id = AUCTION_TYPE_IDS.get(emirate, 21)
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
        """
        # Correct payload structure discovered from browser inspection
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
            "PageSize": 150,  # Get all plates in one request
            "PageIndex": 0,
            "IsDesc": False
        }

        try:
            response = self.session.post(
                PLATES_ENDPOINT,
                json=payload,
                timeout=REQUEST_TIMEOUT
            )
            response.raise_for_status()
            data = response.json()
            
            return self._parse_response(data)
            
        except requests.RequestException as e:
            print(f"Error fetching plates: {e}")
            return {"plates": [], "total_count": 0, "auction_info": None}

    def _parse_response(self, data: dict) -> dict:
        """Parse API response into structured format"""
        plates = []
        
        # Data is in the "Data" key
        items = data.get("Data", [])
        total_count = data.get("TotalCount", len(items))
        
        for item in items:
            plate = self._parse_plate(item)
            if plate:
                plates.append(plate)
        
        # Extract auction info
        auction_info = {
            "auction_type_id": self.auction_type_id,
            "emirate": self.emirate,
            "total_count": total_count,
        }
        
        return {
            "plates": plates,
            "total_count": total_count,
            "auction_info": auction_info,
        }

    def _parse_plate(self, item: dict) -> Optional[dict]:
        """Parse a single plate item from API response"""
        try:
            # The API uses these exact field names
            lot_id = item.get("Id")
            
            if not lot_id:
                return None
            
            plate_number = item.get("PlateNumber", "")
            plate_code = item.get("PlateCode", "")
            
            # Price can be in different formats
            current_price_str = item.get("CurrentPriceStr", "0")
            # Remove commas and convert to int
            try:
                current_price = int(current_price_str.replace(",", "").replace(" ", ""))
            except (ValueError, AttributeError):
                current_price = item.get("CurrentPrice", 0) or 0
            
            bid_count = item.get("Bids", 0) or 0
            
            # End date timestamp (Unix seconds)
            end_date_timestamp = item.get("EndDateTimestamp")
            time_remaining_seconds = None
            end_date = None
            
            if end_date_timestamp:
                try:
                    # Convert timestamp to datetime
                    end_date = datetime.fromtimestamp(end_date_timestamp)
                    now = datetime.now()
                    delta = end_date - now
                    time_remaining_seconds = max(0, int(delta.total_seconds()))
                    end_date = end_date.isoformat()
                except (ValueError, TypeError, OSError):
                    pass
            
            # Status: 1 = active, others may mean completed
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


def fetch_current_plates(emirate: str = ACTIVE_EMIRATE) -> dict:
    """Convenience function to fetch current plates"""
    api = EmiratesAuctionAPI(emirate=emirate)
    return api.fetch_plates()
