"""
Configuration constants for Emirates Auction Scraper
"""

# API Endpoints
API_BASE_URL = "https://apiv8.emiratesauction.net/api"
PLATES_ENDPOINT = f"{API_BASE_URL}/Plates"

# Emirate IDs
EMIRATES = {
    "dubai": 1,
    "abudhabi": 2,
    "sharjah": 3,
    "ajman": 4,
    "umm_al_quwain": 5,
    "ras_al_khaimah": 6,
    "fujairah": 7,
}

# Current active emirate (will expand later)
ACTIVE_EMIRATE = "sharjah"
EMIRATE_ID = EMIRATES[ACTIVE_EMIRATE]

# Auction settings
CLASSIFICATION_ID = 1  # Standard plates
LOT_STATUS_ID = 1      # Active auctions
PAGE_SIZE = 100        # Max plates per request

# Timing thresholds
FINAL_HOURS_THRESHOLD_MINUTES = 120  # 2 hours - switch to rapid mode

# File paths (relative to repo root)
DATA_DIR = "data"
TRACKING_FILE = f"{DATA_DIR}/tracking.json"
ARCHIVE_DIR = f"{DATA_DIR}/archive"

# Request settings
REQUEST_TIMEOUT = 30
USER_AGENT = "EmiratesAuctionScraper/1.0"
