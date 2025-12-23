'use client';

import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart
} from 'recharts';

// Sample auction history data - will be replaced with real data
const auctionHistory = [
  {
    auction: 'Oct 2024',
    sharjah_3d: 85000, sharjah_2d: 450000, sharjah_4d: 15000,
    ajman_3d: 42000, ajman_2d: 220000, ajman_4d: 8000,
    rak_3d: 35000, rak_2d: 180000, rak_4d: 6500,
  },
  {
    auction: 'Nov 2024',
    sharjah_3d: 92000, sharjah_2d: 480000, sharjah_4d: 16500,
    ajman_3d: 45000, ajman_2d: 235000, ajman_4d: 8500,
    rak_3d: 38000, rak_2d: 195000, rak_4d: 7000,
  },
  {
    auction: 'Dec 2024',
    sharjah_3d: 105000, sharjah_2d: 520000, sharjah_4d: 18000,
    ajman_3d: 52000, ajman_2d: 260000, ajman_4d: 9500,
    rak_3d: 42000, rak_2d: 210000, rak_4d: 7800,
  },
];

// Percentage change data per emirate per digit category
const percentageChanges = [
  { emirate: 'Sharjah', digit2: 15.6, digit3: 23.5, digit4: 20.0, digit5: 12.3 },
  { emirate: 'Ajman', digit2: 18.2, digit3: 23.8, digit4: 18.8, digit5: 14.5 },
  { emirate: 'RAK', digit2: 16.7, digit3: 20.0, digit4: 20.0, digit5: 15.2 },
  { emirate: 'UAQ', digit2: 14.3, digit3: 19.5, digit4: 17.2, digit5: 11.8 },
  { emirate: 'Fujairah', digit2: 12.8, digit3: 18.2, digit4: 15.5, digit5: 10.5 },
];

// Value growth journey example
const valueGrowthData = [
  { month: 'Jan 2023', value: 30000, market: 32000 },
  { month: 'Apr 2023', value: 35000, market: 38000 },
  { month: 'Jul 2023', value: 45000, market: 48000 },
  { month: 'Oct 2023', value: 55000, market: 58000 },
  { month: 'Jan 2024', value: 68000, market: 72000 },
  { month: 'Apr 2024', value: 78000, market: 82000 },
  { month: 'Jul 2024', value: 88000, market: 92000 },
  { month: 'Oct 2024', value: 95000, market: 98000 },
  { month: 'Dec 2024', value: 100000, market: 105000 },
];

const buynowData = [
  { emirate: 'Ajman', available: 84, sold: 12, avgPrice: 8500 },
  { emirate: 'RAK', available: 96, sold: 8, avgPrice: 7200 },
  { emirate: 'UAQ', available: 69, sold: 5, avgPrice: 6800 },
  { emirate: 'Fujairah', available: 82, sold: 15, avgPrice: 5500 },
];

const EMIRATE_COLORS: Record<string, string> = {
  sharjah: '#FF6B6B',
  ajman: '#4ECDC4',
  rak: '#45B7D1',
  uaq: '#96CEB4',
  fujairah: '#FFEAA7',
  dubai: '#DDA0DD',
  abudhabi: '#98D8C8',
};

const DIGIT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

function formatPrice(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
}

function formatPercent(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

// Stat Card Component
function StatCard({ title, value, change, icon }: {
  title: string;
  value: string | number;
  change?: number;
  icon: string;
}) {
  return (
    <div className="glass-card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {change !== undefined && (
          <span className={`text-xs sm:text-sm font-medium px-2 py-1 rounded-full ${change >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
            {formatPercent(change)}
          </span>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-bold gradient-text">
        {typeof value === 'number' ? formatPrice(value) : value}
      </p>
      <p className="text-xs sm:text-sm text-gray-400 mt-1">{title}</p>
    </div>
  );
}

// Tab Component
function Tabs({ tabs, active, onChange }: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void
}) {
  return (
    <div className="flex gap-1 p-1 bg-white/5 rounded-xl overflow-x-auto">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${active === tab.id
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
            : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// Emirate Selector
function EmirateSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const emirates = ['sharjah', 'ajman', 'rak', 'uaq', 'fujairah'];
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
    >
      {emirates.map(e => (
        <option key={e} value={e} className="bg-gray-900">{e.charAt(0).toUpperCase() + e.slice(1)}</option>
      ))}
    </select>
  );
}

// Digit Selector
function DigitSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const digits = ['2', '3', '4', '5'];
  return (
    <div className="flex gap-2">
      {digits.map(d => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={`w-10 h-10 rounded-lg font-bold transition-all ${value === d
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
            : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
        >
          {d}D
        </button>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('trends');
  const [selectedEmirate, setSelectedEmirate] = useState('sharjah');
  const [selectedDigit, setSelectedDigit] = useState('3');

  // Get data for selected digit comparison across emirates
  const digitComparisonData = auctionHistory.map(row => ({
    auction: row.auction,
    Sharjah: row[`sharjah_${selectedDigit}d` as keyof typeof row] as number,
    Ajman: row[`ajman_${selectedDigit}d` as keyof typeof row] as number,
    RAK: row[`rak_${selectedDigit}d` as keyof typeof row] as number,
  }));

  // Get data for selected emirate across all digits
  const emirateDigitData = auctionHistory.map(row => ({
    auction: row.auction,
    '2-Digit': row[`${selectedEmirate}_2d` as keyof typeof row] as number,
    '3-Digit': row[`${selectedEmirate}_3d` as keyof typeof row] as number,
    '4-Digit': row[`${selectedEmirate}_4d` as keyof typeof row] as number,
  }));

  return (
    <main className="min-h-screen p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-2">
            <span className="gradient-text">UAE Plate Analytics</span> 🚗
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Track value growth & price trends across emirates
          </p>
        </header>

        {/* Quick Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard icon="📊" title="Avg 3-Digit Price" value={85000} change={23.5} />
          <StatCard icon="📈" title="YoY Growth" value="233%" />
          <StatCard icon="🛒" title="Buy Now Available" value={331} />
          <StatCard icon="💎" title="Highest Sold" value={4200000} />
        </section>

        {/* Navigation Tabs */}
        <Tabs
          tabs={[
            { id: 'trends', label: '📈 Price Trends' },
            { id: 'compare', label: '🔄 Compare' },
            { id: 'growth', label: '💰 Value Journey' },
            { id: 'buynow', label: '🛒 Buy Now' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />

        {/* Tab Content */}
        <div className="mt-6">
          {/* Price Trends Tab */}
          {activeTab === 'trends' && (
            <div className="space-y-6">
              {/* Digit Price Comparison */}
              <div className="glass-card p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold">
                    {selectedDigit}-Digit Plate Prices Across Emirates
                  </h2>
                  <DigitSelect value={selectedDigit} onChange={setSelectedDigit} />
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={digitComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="auction" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} tickFormatter={formatPrice} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(0,0,0,0.9)', border: '1px solid #333', borderRadius: '8px' }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => [`AED ${formatPrice(Number(value))}`, '']}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="Sharjah" stroke={EMIRATE_COLORS.sharjah} strokeWidth={3} dot={{ r: 5 }} />
                    <Line type="monotone" dataKey="Ajman" stroke={EMIRATE_COLORS.ajman} strokeWidth={3} dot={{ r: 5 }} />
                    <Line type="monotone" dataKey="RAK" stroke={EMIRATE_COLORS.rak} strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Percentage Change by Category */}
              <div className="glass-card p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-6">
                  Price Change % by Digit Category (Last Auction)
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={percentageChanges} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis type="number" stroke="#888" fontSize={12} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="emirate" stroke="#888" fontSize={12} width={70} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(0,0,0,0.9)', border: '1px solid #333', borderRadius: '8px' }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => [`${value}%`, '']}
                    />
                    <Legend />
                    <Bar dataKey="digit2" name="2-Digit" fill="#FF6B6B" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="digit3" name="3-Digit" fill="#4ECDC4" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="digit4" name="4-Digit" fill="#45B7D1" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="digit5" name="5-Digit" fill="#96CEB4" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Compare Tab */}
          {activeTab === 'compare' && (
            <div className="space-y-6">
              <div className="glass-card p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold">
                    All Digit Categories for {selectedEmirate.charAt(0).toUpperCase() + selectedEmirate.slice(1)}
                  </h2>
                  <EmirateSelect value={selectedEmirate} onChange={setSelectedEmirate} />
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={emirateDigitData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="auction" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} tickFormatter={formatPrice} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(0,0,0,0.9)', border: '1px solid #333', borderRadius: '8px' }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => [`AED ${formatPrice(Number(value))}`, '']}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="2-Digit" fill="#FF6B6B33" stroke="#FF6B6B" strokeWidth={2} />
                    <Line type="monotone" dataKey="3-Digit" stroke="#4ECDC4" strokeWidth={3} dot={{ r: 5 }} />
                    <Bar dataKey="4-Digit" fill="#45B7D1" radius={[4, 4, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {['3', '4', '5'].map(digit => {
                  const latest = auctionHistory[auctionHistory.length - 1];
                  const previous = auctionHistory[auctionHistory.length - 2];
                  const latestPrice = latest[`${selectedEmirate}_${digit}d` as keyof typeof latest] as number || 0;
                  const prevPrice = previous[`${selectedEmirate}_${digit}d` as keyof typeof previous] as number || 0;
                  const change = prevPrice ? ((latestPrice - prevPrice) / prevPrice) * 100 : 0;

                  return (
                    <div key={digit} className="glass-card p-4">
                      <p className="text-gray-400 text-sm">{digit}-Digit Avg</p>
                      <p className="text-2xl font-bold">AED {formatPrice(latestPrice)}</p>
                      <p className={`text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercent(change)} vs last auction
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Value Journey Tab */}
          {activeTab === 'growth' && (
            <div className="space-y-6">
              <div className="glass-card p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-2">Your Plate Value Journey</h2>
                <p className="text-gray-400 text-sm mb-6">
                  Track how your 3-digit plate grew from AED 30K to AED 100K (+233%)
                </p>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={valueGrowthData}>
                    <defs>
                      <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ECDC4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4ECDC4" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="marketGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} tickFormatter={formatPrice} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(0,0,0,0.9)', border: '1px solid #333', borderRadius: '8px' }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => [`AED ${formatPrice(Number(value))}`, '']}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="value" name="Your Plate" stroke="#4ECDC4" fill="url(#valueGradient)" strokeWidth={3} />
                    <Area type="monotone" dataKey="market" name="Market Avg" stroke="#FF6B6B" fill="url(#marketGradient)" strokeWidth={2} strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Growth Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-4 text-center">
                  <p className="text-3xl font-bold text-green-400">+233%</p>
                  <p className="text-sm text-gray-400">Total Growth</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-3xl font-bold text-purple-400">24 mo</p>
                  <p className="text-sm text-gray-400">Hold Period</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-3xl font-bold text-blue-400">+70K</p>
                  <p className="text-sm text-gray-400">Value Added</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-400">9.7%</p>
                  <p className="text-sm text-gray-400">Monthly Avg</p>
                </div>
              </div>
            </div>
          )}

          {/* Buy Now Tab */}
          {activeTab === 'buynow' && (
            <div className="space-y-6">
              <div className="glass-card p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-6">Buy Now Inventory</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={buynowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="emirate" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(0,0,0,0.9)', border: '1px solid #333', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar dataKey="available" name="Available" fill="#4ECDC4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="sold" name="Sold" fill="#FF6B6B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Buy Now Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {buynowData.map(item => (
                  <div key={item.emirate} className="glass-card p-4">
                    <h3 className="font-semibold text-lg mb-2">{item.emirate}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Available</span>
                        <span className="text-green-400">{item.available}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Sold</span>
                        <span className="text-red-400">{item.sold}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg Price</span>
                        <span>AED {formatPrice(item.avgPrice)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-xs sm:text-sm py-8 mt-8">
          <p>Data from Emirates Auction • Auto-updated hourly</p>
          <a
            href="https://github.com/mdanfas/emirates-auction-scraper"
            className="text-purple-400 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </footer>
      </div>
    </main>
  );
}
