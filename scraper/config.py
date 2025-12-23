"""
Configuration constants for Emirates Auction Scraper
"""

# API Endpoints
API_BASE_URL = "https://apiv8.emiratesauction.net/api"
PLATES_ENDPOINT = f"{API_BASE_URL}/Plates"

# Emirate configurations with their Auction Type IDs for online plates
# These IDs are used in the PlateFilterRequest.AuctionTypeId field
EMIRATES_CONFIG = {
    "sharjah": {
        "auction_type_id": 21,
        "url_slug": "sharjah",
        "display_name": "Sharjah",
    },
    "dubai": {
        "auction_type_id": 46,
        "url_slug": "dubai",
        "display_name": "Dubai",
    },
    "abudhabi": {
        "auction_type_id": 1,
        "url_slug": "abu-dhabi",
        "display_name": "Abu Dhabi",
    },
    "ajman": {
        "auction_type_id": 25,
        "url_slug": "ajman",
        "display_name": "Ajman",
    },
    "rak": {
        "auction_type_id": 15,
        "url_slug": "rak",
        "display_name": "Ras Al Khaimah",
    },
    "uaq": {
        "auction_type_id": 7,
        "url_slug": "uaq",
        "display_name": "Umm Al Quwain",
    },
    "fujairah": {
        "auction_type_id": 12,
        "url_slug": "fujairah",
        "display_name": "Fujairah",
    },
}

# List of all emirate keys for iteration
ALL_EMIRATES = list(EMIRATES_CONFIG.keys())

# Timing thresholds
FINAL_HOURS_THRESHOLD_MINUTES = 120  # 2 hours - switch to rapid mode

# File paths (relative to repo root)
DATA_DIR = "data"
ARCHIVE_DIR = f"{DATA_DIR}/archive"

# Request settings
REQUEST_TIMEOUT = 30
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"


def get_tracking_file(emirate: str) -> str:
    """Get the tracking file path for a specific emirate"""
    return f"{DATA_DIR}/tracking_{emirate}.json"


def get_auction_type_id(emirate: str) -> int:
    """Get the auction type ID for a specific emirate"""
    config = EMIRATES_CONFIG.get(emirate, {})
    return config.get("auction_type_id", 0)


def get_emirate_url(emirate: str) -> str:
    """Get the URL for a specific emirate's online plates page"""
    slug = EMIRATES_CONFIG.get(emirate, {}).get("url_slug", emirate)
    return f"https://www.emiratesauction.com/plates/{slug}/online"
