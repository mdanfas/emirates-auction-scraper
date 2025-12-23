'use client';

import { useState, useEffect } from 'react';

// Types
interface Plate {
  plate_number: string;
  plate_code: string;
  price: number;
  status: string;
  bid_count?: number;
}

interface BuyNowEmirate {
  emirate: string;
  plates: Plate[];
  count: number;
  lastUpdated: string;
}

interface AuctionEmirate {
  auction_id: string;
  emirate: string;
  start_date: string;
  last_updated: string;
  status: string;
  plates: Plate[];
  count: number;
}

interface DashboardData {
  generated_at: string;
  buynow: Record<string, BuyNowEmirate>;
  auctions: Record<string, AuctionEmirate>;
  summary: {
    buynow_total: number;
    auctions_total: number;
  };
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-AE').format(price);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDigitCount(plateNumber: string): number {
  return String(plateNumber).length;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'auctions' | 'buynow'>('buynow');
  const [sortBy, setSortBy] = useState<'price' | 'bids' | 'digits'>('price');
  const [filterDigits, setFilterDigits] = useState<string>('all');

  // Load data from GitHub raw URL (auto-updates with repo)
  useEffect(() => {
    const GITHUB_RAW = 'https://raw.githubusercontent.com/mdanfas/emirates-auction-scraper/main/dashboard/public/data.json';
    const LOCAL_PATH = '/emirates-auction-scraper/data.json';

    // Try GitHub first for fresh data, fallback to local
    fetch(GITHUB_RAW)
      .then(res => {
        if (!res.ok) throw new Error('GitHub fetch failed');
        return res.json();
      })
      .catch(() => fetch(LOCAL_PATH).then(res => res.json()))
      .then(json => {
        setData(json);
        setLoading(false);
        if (Object.keys(json.auctions || {}).length > 0) {
          setActiveTab('auctions');
        }
      })
      .catch(err => {
        console.error('Error loading data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading auction data...</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <p className="text-red-400">Failed to load data</p>
      </main>
    );
  }

  // Get sorted and filtered plates for auction
  const getAuctionPlates = (plates: Plate[]) => {
    let filtered = filterDigits === 'all'
      ? plates
      : plates.filter(p => getDigitCount(p.plate_number) === parseInt(filterDigits));

    return filtered.sort((a, b) => {
      if (sortBy === 'price') return b.price - a.price;
      if (sortBy === 'bids') return (b.bid_count || 0) - (a.bid_count || 0);
      return getDigitCount(a.plate_number) - getDigitCount(b.plate_number);
    });
  };

  const auctionsList = Object.values(data.auctions || {});
  const buynowList = Object.values(data.buynow || {});

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl sm:text-2xl font-bold">🚗 UAE Plate Auction Data</h1>
          <p className="text-gray-400 text-sm">
            Updated: {formatDate(data.generated_at)}
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-[73px] z-40 bg-[#0a0a0f] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('auctions')}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'auctions'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-gray-400 hover:text-white'
                }`}
            >
              🔴 Live Auctions
              <span className="ml-2 px-2 py-0.5 rounded-full bg-white/10 text-xs">
                {data.summary.auctions_total}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('buynow')}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'buynow'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-white'
                }`}
            >
              🛒 Buy Now
              <span className="ml-2 px-2 py-0.5 rounded-full bg-white/10 text-xs">
                {data.summary.buynow_total}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Auctions Tab */}
        {activeTab === 'auctions' && (
          <div>
            {auctionsList.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-xl mb-2">No active auctions</p>
                <p className="text-sm">Check back later or view Buy Now listings</p>
              </div>
            ) : (
              auctionsList.map((auction) => (
                <div key={auction.auction_id} className="mb-8">
                  {/* Auction Info */}
                  <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30">
                    <div className="flex flex-wrap items-center gap-4 justify-between">
                      <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                          {auction.emirate} Auction
                        </h2>
                        <p className="text-sm text-gray-400">
                          Started: {formatDate(auction.start_date)} •
                          Updated: {formatDate(auction.last_updated)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-red-400">{auction.count} Plates</p>
                      </div>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="mb-4 flex flex-wrap gap-3 items-center">
                    <label className="text-sm text-gray-400">Filter:</label>
                    <select
                      value={filterDigits}
                      onChange={(e) => setFilterDigits(e.target.value)}
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="all">All Digits</option>
                      <option value="2">2-Digit</option>
                      <option value="3">3-Digit</option>
                      <option value="4">4-Digit</option>
                      <option value="5">5-Digit</option>
                    </select>

                    <label className="text-sm text-gray-400 ml-4">Sort:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'price' | 'bids' | 'digits')}
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="price">Price</option>
                      <option value="bids">Bids</option>
                      <option value="digits">Digits</option>
                    </select>
                  </div>

                  {/* Plates Table */}
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Plate</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Code</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Price</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Bids</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {getAuctionPlates(auction.plates).map((plate, idx) => (
                          <tr key={idx} className="hover:bg-white/5">
                            <td className="py-3 px-4 font-mono text-lg font-bold">{plate.plate_number}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">
                                {plate.plate_code}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right text-emerald-400 font-semibold">
                              AED {formatPrice(plate.price)}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-400">{plate.bid_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Buy Now Tab */}
        {activeTab === 'buynow' && (
          <div className="space-y-6">
            {buynowList.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-xl mb-2">No Buy Now listings</p>
              </div>
            ) : (
              buynowList.map((emirateData) => (
                <div key={emirateData.emirate} className="rounded-xl border border-white/10 overflow-hidden">
                  {/* Emirate Header */}
                  <div className="bg-white/5 px-4 py-3 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">{emirateData.emirate}</h3>
                      <p className="text-xs text-gray-500">
                        Updated: {formatDate(emirateData.lastUpdated)}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                      {emirateData.count} plates
                    </span>
                  </div>

                  {/* Plates Grid */}
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {emirateData.plates.map((plate, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-mono text-lg font-bold">{plate.plate_number}</span>
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                            {plate.plate_code}
                          </span>
                        </div>
                        <div className="text-emerald-400 font-semibold">
                          AED {formatPrice(plate.price)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>Data from Emirates Auction</p>
          <a
            href="https://github.com/mdanfas/emirates-auction-scraper"
            className="text-emerald-400 hover:underline"
            target="_blank"
          >
            View on GitHub
          </a>
        </div>
      </footer>
    </main>
  );
}
