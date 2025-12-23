'use client';

import { useState, useEffect } from 'react';

// Types
interface Plate {
  plate_number: string;
  plate_code: string;
  price: number;
  final_price?: number;
  status: string;
  bid_count?: number;
  sold_at?: string;
}

interface BuyNowEmirate {
  emirate: string;
  available: Plate[];
  sold: Plate[];
  available_count: number;
  sold_count: number;
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

interface ArchiveEntry {
  filename: string;
  emirate: string;
  emirate_key: string;
  date: string;
  plates: Plate[];
  count: number;
  total_value: number;
}

interface DashboardData {
  generated_at: string;
  buynow: Record<string, BuyNowEmirate>;
  auctions: Record<string, AuctionEmirate>;
  archives: ArchiveEntry[];
  summary: {
    buynow_available: number;
    buynow_sold: number;
    buynow_total: number;
    auctions_total: number;
    archives_count: number;
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

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'auctions' | 'buynow' | 'history'>('buynow');
  const [historyView, setHistoryView] = useState<'archives' | 'sold'>('sold');

  useEffect(() => {
    const GITHUB_RAW = 'https://raw.githubusercontent.com/mdanfas/emirates-auction-scraper/main/dashboard/public/data.json';
    const LOCAL_PATH = '/emirates-auction-scraper/data.json';

    fetch(GITHUB_RAW)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .catch(() => fetch(LOCAL_PATH).then(res => res.json()))
      .then(json => {
        setData(json);
        setLoading(false);
        if (Object.keys(json.auctions || {}).length > 0) setActiveTab('auctions');
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
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

  const auctionsList = Object.values(data.auctions || {});
  const buynowList = Object.values(data.buynow || {});
  const soldPlates = buynowList.flatMap(e => e.sold.map(p => ({ ...p, emirate: e.emirate })));

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl sm:text-2xl font-bold">🚗 UAE Plate Auction Data</h1>
          <p className="text-gray-400 text-sm">Updated: {formatDate(data.generated_at)}</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-[73px] z-40 bg-[#0a0a0f] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 flex gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('auctions')}
            className={`py-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === 'auctions' ? 'border-red-500 text-red-400' : 'border-transparent text-gray-400'
              }`}
          >
            🔴 Live Auctions
            <span className="ml-2 px-2 py-0.5 rounded-full bg-white/10 text-xs">
              {data.summary.auctions_total}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('buynow')}
            className={`py-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === 'buynow' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-400'
              }`}
          >
            🛒 Buy Now
            <span className="ml-2 px-2 py-0.5 rounded-full bg-white/10 text-xs">
              {data.summary.buynow_available}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === 'history' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400'
              }`}
          >
            📜 History
            <span className="ml-2 px-2 py-0.5 rounded-full bg-white/10 text-xs">
              {data.summary.buynow_sold + data.summary.archives_count}
            </span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Live Auctions */}
        {activeTab === 'auctions' && (
          <div>
            {auctionsList.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-xl mb-2">No active auctions</p>
                <p className="text-sm">Check back later</p>
              </div>
            ) : (
              auctionsList.map((auction) => (
                <div key={auction.auction_id} className="mb-8">
                  <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      {auction.emirate} Auction
                    </h2>
                    <p className="text-sm text-gray-400">
                      Started: {formatDate(auction.start_date)} • {auction.count} plates
                    </p>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="text-left py-3 px-4 text-sm text-gray-400">Plate</th>
                          <th className="text-left py-3 px-4 text-sm text-gray-400">Code</th>
                          <th className="text-right py-3 px-4 text-sm text-gray-400">Price</th>
                          <th className="text-right py-3 px-4 text-sm text-gray-400">Bids</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {auction.plates.slice(0, 50).map((plate, idx) => (
                          <tr key={idx} className="hover:bg-white/5">
                            <td className="py-3 px-4 font-mono text-lg font-bold">{plate.plate_number}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">{plate.plate_code}</span>
                            </td>
                            <td className="py-3 px-4 text-right text-emerald-400 font-semibold">AED {formatPrice(plate.price)}</td>
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

        {/* Buy Now */}
        {activeTab === 'buynow' && (
          <div className="space-y-6">
            {buynowList.map((emirateData) => (
              <div key={emirateData.emirate} className="rounded-xl border border-white/10 overflow-hidden">
                <div className="bg-white/5 px-4 py-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">{emirateData.emirate}</h3>
                    <p className="text-xs text-gray-500">Updated: {formatDate(emirateData.lastUpdated)}</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">
                    {emirateData.available_count} available
                  </span>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {emirateData.available.map((plate, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono text-lg font-bold">{plate.plate_number}</span>
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">{plate.plate_code}</span>
                      </div>
                      <div className="text-emerald-400 font-semibold">AED {formatPrice(plate.price)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History */}
        {activeTab === 'history' && (
          <div>
            {/* Sub-tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setHistoryView('sold')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${historyView === 'sold' ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-400'
                  }`}
              >
                Sold Plates ({data.summary.buynow_sold})
              </button>
              <button
                onClick={() => setHistoryView('archives')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${historyView === 'archives' ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-400'
                  }`}
              >
                Past Auctions ({data.summary.archives_count})
              </button>
            </div>

            {/* Sold Plates */}
            {historyView === 'sold' && (
              <div>
                {soldPlates.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p>No sold plates yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="text-left py-3 px-4 text-sm text-gray-400">Plate</th>
                          <th className="text-left py-3 px-4 text-sm text-gray-400">Emirate</th>
                          <th className="text-right py-3 px-4 text-sm text-gray-400">Price</th>
                          <th className="text-right py-3 px-4 text-sm text-gray-400">Sold At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {soldPlates.map((plate, idx) => (
                          <tr key={idx} className="hover:bg-white/5">
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold">{plate.plate_number}</span>
                              <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">{plate.plate_code}</span>
                            </td>
                            <td className="py-3 px-4 text-gray-400">{plate.emirate}</td>
                            <td className="py-3 px-4 text-right text-emerald-400">AED {formatPrice(plate.price)}</td>
                            <td className="py-3 px-4 text-right text-gray-500 text-sm">{formatDate(plate.sold_at || '')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Past Auctions */}
            {historyView === 'archives' && (
              <div className="space-y-4">
                {data.archives.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p>No archived auctions yet</p>
                    <p className="text-sm">Completed auctions will appear here</p>
                  </div>
                ) : (
                  data.archives.map((archive, idx) => (
                    <div key={idx} className="rounded-xl border border-white/10 overflow-hidden">
                      <div className="bg-white/5 px-4 py-3 flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{archive.emirate}</h3>
                          <p className="text-xs text-gray-500">{archive.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-400 font-semibold">AED {formatPrice(archive.total_value)}</p>
                          <p className="text-xs text-gray-500">{archive.count} plates</p>
                        </div>
                      </div>
                      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {archive.plates.slice(0, 12).map((plate, pidx) => (
                          <div key={pidx} className="p-2 rounded bg-white/5 text-sm">
                            <span className="font-mono font-bold">{plate.plate_number}</span>
                            <span className="text-gray-400 ml-1">({plate.plate_code})</span>
                            <div className="text-emerald-400">AED {formatPrice(plate.final_price || 0)}</div>
                          </div>
                        ))}
                        {archive.plates.length > 12 && (
                          <div className="p-2 rounded bg-white/5 text-sm text-gray-400 flex items-center justify-center">
                            +{archive.plates.length - 12} more
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <a href="https://github.com/mdanfas/emirates-auction-scraper" className="text-emerald-400 hover:underline" target="_blank">
            View on GitHub
          </a>
        </div>
      </footer>
    </main>
  );
}
