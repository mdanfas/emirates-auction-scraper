# Emirates Auction Number Plate Scraper

Automated scraper for tracking UAE number plate auction prices from [emiratesauction.com](https://www.emiratesauction.com). Runs on GitHub Actions to capture final winning bids even when you're offline.

## Supported Emirates

| Emirate | Auction Type ID |
|---------|-----------------|
| Sharjah | 21 |
| Dubai | 46 |
| Abu Dhabi | 1 |
| Ajman | 25 |
| RAK | 15 |
| UAQ | 7 |
| Fujairah | 12 |

## Features

- 🕐 **Hourly scraping** during active auctions
- ⚡ **Rapid mode** (every 5 minutes) when plates are in final hours
- 🔍 **Discovery mode** to detect new auctions across all emirates
- 💾 **Persistent tracking** - plates preserved after removal
- 📊 **Final CSV export** per emirate when auction ends
- 🌍 **Multi-emirate support** - tracks all 7 emirates independently

## Usage

### Manual Trigger (GitHub Actions)

1. Go to **Actions** tab
2. Select "Scrape Emirates Auction"
3. Click "Run workflow"
4. Options:
   - `scrape` - Scrape all emirates
   - `discover` - Check which emirates have active auctions
   - `sharjah`, `dubai`, etc. - Scrape specific emirate

### Local Development

```bash
pip install -r requirements.txt

# Discovery mode
python -m scraper.main --discover

# Scrape all emirates
python -m scraper.main

# Scrape specific emirate
python -m scraper.main --emirate sharjah

# Reset tracking
python -m scraper.main --emirate sharjah --reset
```

## Output Files

- `data/tracking_<emirate>.json` - Live tracking per emirate
- `data/archive/<emirate>_YYYY-MM-DD.csv` - Final results

## License

MIT
