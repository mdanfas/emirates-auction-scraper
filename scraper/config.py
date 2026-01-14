"""
Configuration constants for Emirates Auction Scraper
"""

# API Endpoints
API_BASE_URL = "https://apiv8.emiratesauction.net/api"
PLATES_ENDPOINT = f"{API_BASE_URL}/Plates"
PLATES_BUYNOW_ENDPOINT = f"{API_BASE_URL}/PlatesBuyNow"

# Emirate configurations with their Auction Type IDs
# auction_type_id = for online auctions
# buynow_type_id = for buy now section (None if not available)
EMIRATES_CONFIG = {
    "sharjah": {
        "auction_type_id": 21,
        "buynow_type_id": 23,  # Available after auction ends
        "url_slug": "sharjah",
        "display_name": "Sharjah",
    },
    "dubai": {
        "auction_type_id": 46,
        "buynow_type_id": None,  # No Buy Now section
        "url_slug": "dubai",
        "display_name": "Dubai",
    },
    "abudhabi": {
        "auction_type_id": 1,
        "buynow_type_id": None,  # No Buy Now section
        "url_slug": "abu-dhabi",
        "display_name": "Abu Dhabi",
    },
    "ajman": {
        "auction_type_id": 25,
        "buynow_type_id": 27,
        "url_slug": "ajman",
        "display_name": "Ajman",
    },
    "rak": {
        "auction_type_id": 15,
        "buynow_type_id": 16,
        "url_slug": "rak",
        "display_name": "Ras Al Khaimah",
    },
    "uaq": {
        "auction_type_id": 7,
        "buynow_type_id": 18,
        "url_slug": "uaq",
        "display_name": "Umm Al Quwain",
    },
    "fujairah": {
        "auction_type_id": 12,
        "buynow_type_id": 14,
        "url_slug": "fujairah",
        "display_name": "Fujairah",
    },
}

# List of all emirate keys
ALL_EMIRATES = list(EMIRATES_CONFIG.keys())

# Emirates with Buy Now sections (Ajman, RAK, UAQ, Fujairah only)
BUYNOW_EMIRATES = [e for e, c in EMIRATES_CONFIG.items() if c.get("buynow_type_id")]

# Timing thresholds
FINAL_HOURS_THRESHOLD_MINUTES = 120  # 2 hours - switch to rapid mode

# File paths (relative to repo root)
DATA_DIR = "data"
ARCHIVE_DIR = f"{DATA_DIR}/archive"
BUYNOW_DIR = f"{DATA_DIR}/buynow"
BUYNOW_ARCHIVE_DIR = f"{ARCHIVE_DIR}/buynow"

# Request settings
REQUEST_TIMEOUT = 30
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"


def get_tracking_file(emirate: str) -> str:
    """Get the tracking file path for a specific emirate"""
    return f"{DATA_DIR}/tracking_{emirate}.json"


def get_buynow_file(emirate: str) -> str:
    """Get the Buy Now CSV file path for a specific emirate"""
    return f"{BUYNOW_DIR}/{emirate}_buynow.csv"


def get_auction_type_id(emirate: str) -> int:
    """Get the auction type ID for a specific emirate"""
    config = EMIRATES_CONFIG.get(emirate, {})
    return config.get("auction_type_id", 0)


def get_buynow_type_id(emirate: str) -> int:
    """Get the Buy Now type ID for a specific emirate"""
    config = EMIRATES_CONFIG.get(emirate, {})
    return config.get("buynow_type_id") or 0
