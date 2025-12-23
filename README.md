# Emirates Auction Scraper

Automated scraper for UAE number plate auctions from [emiratesauction.com](https://www.emiratesauction.com).

## Features

- 🕐 **Hourly auction scraping** with rapid mode (5min) in final hours
- 🛒 **Buy Now scraping** every 4 days for direct-sale plates
- 📊 **Per-emirate CSVs** for organized data storage
- 🤖 **GitHub Actions** for reliable automation

## Emirates

| Emirate | Auction ID | Buy Now ID |
|---------|------------|------------|
| Sharjah | 21 | 23 |
| Dubai | 46 | - |
| Abu Dhabi | 1 | - |
| Ajman | 25 | 27 |
| RAK | 15 | 16 |
| UAQ | 7 | 18 |
| Fujairah | 12 | 14 |

## Usage

```bash
# Auction scraping (all emirates)
python -m scraper.main

# Single emirate
python -m scraper.main --emirate sharjah

# Discovery mode
python -m scraper.main --discover

# Buy Now scraping
python -m scraper.main --buynow
python -m scraper.main --buynow --emirate ajman
```

## Output

- `data/tracking_<emirate>.json` - Live auction tracking
- `data/archive/<emirate>_YYYY-MM-DD.csv` - Completed auctions
- `data/buynow/<emirate>_buynow.csv` - Buy Now plates

## Schedule

| Schedule | Action |
|----------|--------|
| Hourly | Auction scraping |
| Every 4 days | Buy Now scraping |
| 5 minutes | Rapid mode (final hours) |
