# Emirates Auction Number Plate Scraper

Automated scraper for tracking UAE number plate auction prices from [emiratesauction.com](https://www.emiratesauction.com). Runs on GitHub Actions to capture final winning bids even when you're offline.

## Features

- 🕐 **Hourly scraping** during normal auction periods
- ⚡ **Rapid mode** (every 5 minutes) when plates are in final hours
- 💾 **Persistent tracking** - plates are preserved even after removal from auction
- 📊 **Final CSV export** with all winning bids when auction ends
- 🔄 **Fully automated** via GitHub Actions

## Quick Start

### 1. Fork or Clone this Repository

```bash
git clone https://github.com/YOUR_USERNAME/emirates-auction-scraper.git
cd emirates-auction-scraper
```

### 2. Enable GitHub Actions

Go to your repository's **Settings** → **Actions** → **General** and ensure:
- "Allow all actions and reusable workflows" is selected
- "Read and write permissions" is enabled under "Workflow permissions"

### 3. That's it!

The scraper will automatically run every hour. You can also trigger it manually:
1. Go to the **Actions** tab
2. Select "Scrape Emirates Auction"
3. Click "Run workflow"

## How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  GitHub Action  │────▶│  Scraper Script  │────▶│  Emirates API   │
│  (scheduled)    │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │  tracking.json   │
                    │  (auction state) │
                    └──────────────────┘
                               │
                               ▼ (when complete)
                    ┌──────────────────┐
                    │  sharjah_DATE.csv│
                    │  (final results) │
                    └──────────────────┘
```

### Tracking Logic

1. **Active plates** are updated with latest prices on each run
2. **When a plate disappears** from the API, it's marked as "completed" with its last known price preserved
3. **When all plates complete**, a final CSV is generated with all results
4. The CSV is **sorted by final price** (highest first)

### Rapid Mode

When any plate has less than 2 hours remaining:
- The workflow triggers itself every 5 minutes
- This ensures final bids are captured accurately
- Returns to hourly once no plates are in final hours

## Output Files

### `data/tracking.json`

Live tracking state with all plates:

```json
{
  "auction_id": "sharjah_2024-12",
  "status": "active",
  "plates": {
    "1907": {
      "plate_number": "18",
      "plate_code": "4",
      "current_price": 1000000,
      "bid_count": 45,
      "status": "active"
    }
  }
}
```

### `data/archive/sharjah_YYYY-MM-DD.csv`

Final results when auction ends:

| plate_number | plate_code | final_price | bid_count | first_seen | completed_at | price_changes |
|--------------|------------|-------------|-----------|------------|--------------|---------------|
| 18           | 4          | 1,250,000   | 67        | 2024-12-20 | 2024-12-24   | 15            |
| 77           | 2          | 850,000     | 34        | 2024-12-20 | 2024-12-24   | 8             |

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run scraper
python -m scraper.main

# Reset for new auction
python -m scraper.main --reset
```

## Configuration

Edit `scraper/config.py` to change:
- `ACTIVE_EMIRATE`: Which emirate to track (default: "sharjah")
- `FINAL_HOURS_THRESHOLD_MINUTES`: When to switch to rapid mode (default: 120)

## Future Emirates

Currently configured for Sharjah only. Support for other emirates can be added:
- Dubai (ID: 1)
- Abu Dhabi (ID: 2)
- Ajman (ID: 4)
- Umm Al Quwain (ID: 5)
- Ras Al Khaimah (ID: 6)
- Fujairah (ID: 7)

## License

MIT License - feel free to use and modify!
