'use client';

import { useState, useEffect } from 'react';

// Types for our data
interface Plate {
  plate_number: string;
  plate_code: string;
  price: number;
  status: string;
  emirate?: string;
  bid_count?: number;
  first_seen?: string;
  last_seen?: string;
}

interface AuctionData {
  auction_id: string;
  emirate: string;
  display_name: string;
  start_date: string;
  last_updated: string;
  status: string;
  plates: Record<string, Plate>;
}

interface BuyNowData {
  emirate: string;
  plates: Plate[];
  lastUpdated: string;
}

// Sample data (will be replaced with real data from files)
const sampleAuctionData: AuctionData = {
  auction_id: "sharjah_2025-12",
  emirate: "sharjah",
  display_name: "Sharjah",
  start_date: "2025-12-23T20:16:40Z",
  last_updated: "2025-12-23T21:21:43Z",
  status: "active",
  plates: {
    "1907": { plate_number: "18", plate_code: "4", price: 1000000, bid_count: 8, status: "active" },
    "1908": { plate_number: "77", plate_code: "4", price: 1000000, bid_count: 26, status: "active" },
    "1915": { plate_number: "444", plate_code: "4", price: 951000, bid_count: 126, status: "active" },
    "1910": { plate_number: "121", plate_code: "4", price: 250000, bid_count: 43, status: "active" },
    "1941": { plate_number: "8888", plate_code: "4", price: 221000, bid_count: 46, status: "active" },
    "1914": { plate_number: "401", plate_code: "3", price: 201000, bid_count: 25, status: "active" },
    "1920": { plate_number: "900", plate_code: "4", price: 300000, bid_count: 25, status: "active" },
    "1923": { plate_number: "2000", plate_code: "4", price: 300000, bid_count: 30, status: "active" },
    "1948": { plate_number: "14444", plate_code: "4", price: 61000, bid_count: 75, status: "active" },
    "1944": { plate_number: "10001", plate_code: "4", price: 86500, bid_count: 31, status: "active" },
  }
};

const sampleBuyNowData: BuyNowData[] = [
  {
    emirate: "Ajman",
    lastUpdated: "2025-12-23T20:41:23Z",
    plates: [
      { plate_number: "1081", plate_code: "K", price: 17900, status: "available" },
      { plate_number: "2340", plate_code: "H", price: 16900, status: "available" },
      { plate_number: "6760", plate_code: "H", price: 16400, status: "available" },
      { plate_number: "3530", plate_code: "K", price: 15900, status: "available" },
      { plate_number: "2343", plate_code: "K", price: 15900, status: "available" },
      { plate_number: "1143", plate_code: "H", price: 14400, status: "available" },
      { plate_number: "13324", plate_code: "K", price: 4900, status: "available" },
    ]
  },
  {
    emirate: "RAK",
    lastUpdated: "2025-12-23T20:41:23Z",
    plates: [
      { plate_number: "1234", plate_code: "A", price: 12500, status: "available" },
      { plate_number: "5678", plate_code: "B", price: 9800, status: "available" },
    ]
  },
  {
    emirate: "UAQ",
    lastUpdated: "2025-12-23T20:41:23Z",
    plates: [
      { plate_number: "4321", plate_code: "X", price: 8500, status: "available" },
    ]
  },
  {
    emirate: "Fujairah",
    lastUpdated: "2025-12-23T20:41:23Z",
    plates: [
      { plate_number: "9876", plate_code: "F", price: 7200, status: "available" },
    ]
  },
];

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-AE').format(price);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDigitCount(plateNumber: string): number {
  return plateNumber.length;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'auctions' | 'buynow'>('auctions');
  const [selectedEmirate, setSelectedEmirate] = useState<string>('sharjah');
  const [sortBy, setSortBy] = useState<'price' | 'bids' | 'digits'>('price');
  const [filterDigits, setFilterDigits] = useState<string>('all');

  // Get sorted and filtered plates for auction
  const getAuctionPlates = () => {
    const plates = Object.values(sampleAuctionData.plates);
    let filtered = filterDigits === 'all'
      ? plates
      : plates.filter(p => getDigitCount(p.plate_number) === parseInt(filterDigits));

    return filtered.sort((a, b) => {
      if (sortBy === 'price') return b.price - a.price;
      if (sortBy === 'bids') return (b.bid_count || 0) - (a.bid_count || 0);
      return getDigitCount(a.plate_number) - getDigitCount(b.plate_number);
    });
  };

  const tabs = [
    { id: 'auctions', label: '🔴 Live Auctions', count: Object.keys(sampleAuctionData.plates).length },
    { id: 'buynow', label: '🛒 Buy Now', count: sampleBuyNowData.reduce((sum, d) => sum + d.plates.length, 0) },
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl sm:text-2xl font-bold">
            🚗 UAE Plate Auction Data
          </h1>
          <p className="text-gray-400 text-sm">Raw auction results & listings</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-[73px] z-40 bg-[#0a0a0f] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'auctions' | 'buynow')}
                className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                  }`}
              >
                {tab.label}
                <span className="ml-2 px-2 py-0.5 rounded-full bg-white/10 text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Auctions Tab */}
        {activeTab === 'auctions' && (
          <div>
            {/* Auction Info */}
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30">
              <div className="flex flex-wrap items-center gap-4 justify-between">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    {sampleAuctionData.display_name} Auction
                  </h2>
                  <p className="text-sm text-gray-400">
                    Started: {formatDate(sampleAuctionData.start_date)} •
                    Updated: {formatDate(sampleAuctionData.last_updated)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-400">
                    {Object.keys(sampleAuctionData.plates).length} Plates
                  </p>
                  <p className="text-sm text-gray-400">Active in auction</p>
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

              <label className="text-sm text-gray-400 ml-4">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'price' | 'bids' | 'digits')}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm"
              >
                <option value="price">Price (High → Low)</option>
                <option value="bids">Bids (Most)</option>
                <option value="digits">Digits (Fewest)</option>
              </select>
            </div>

            {/* Plates Table */}
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Plate</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Code</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Current Price</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Bids</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Digits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {getAuctionPlates().map((plate, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-lg font-bold">{plate.plate_number}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm font-medium">
                          {plate.plate_code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-emerald-400 font-semibold">
                          AED {formatPrice(plate.price)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-400">
                        {plate.bid_count}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getDigitCount(plate.plate_number) <= 2 ? 'bg-yellow-500/20 text-yellow-400' :
                            getDigitCount(plate.plate_number) === 3 ? 'bg-purple-500/20 text-purple-400' :
                              'bg-gray-500/20 text-gray-400'
                          }`}>
                          {getDigitCount(plate.plate_number)}D
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Buy Now Tab */}
        {activeTab === 'buynow' && (
          <div className="space-y-6">
            {sampleBuyNowData.map((emirate) => (
              <div key={emirate.emirate} className="rounded-xl border border-white/10 overflow-hidden">
                {/* Emirate Header */}
                <div className="bg-white/5 px-4 py-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">{emirate.emirate}</h3>
                    <p className="text-xs text-gray-500">
                      Last updated: {formatDate(emirate.lastUpdated)}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                    {emirate.plates.length} plates
                  </span>
                </div>

                {/* Plates Grid */}
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {emirate.plates.map((plate, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono text-xl font-bold">{plate.plate_number}</span>
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                          {plate.plate_code}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-400 font-semibold">
                          AED {formatPrice(plate.price)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${plate.status === 'available'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                          }`}>
                          {plate.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>Data scraped from Emirates Auction • Auto-updated hourly</p>
          <a
            href="https://github.com/mdanfas/emirates-auction-scraper"
            className="text-emerald-400 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </div>
      </footer>
    </main>
  );
}
