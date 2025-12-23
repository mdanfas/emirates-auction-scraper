'use client';

import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

// Sample data structure - will be replaced with real data from JSON
const sampleAuctionData = [
  { date: '2024-10', sharjah: 125000, ajman: 45000, rak: 35000, uaq: 28000, fujairah: 22000 },
  { date: '2024-11', sharjah: 132000, ajman: 48000, rak: 38000, uaq: 30000, fujairah: 25000 },
  { date: '2024-12', sharjah: 145000, ajman: 52000, rak: 42000, uaq: 32000, fujairah: 28000 },
];

const sampleDigitData = [
  { digits: '1', avg: 2500000, min: 1500000, max: 4000000, count: 5 },
  { digits: '2', avg: 450000, min: 200000, max: 800000, count: 45 },
  { digits: '3', avg: 85000, min: 25000, max: 250000, count: 120 },
  { digits: '4', avg: 15000, min: 5000, max: 45000, count: 200 },
  { digits: '5', avg: 4500, min: 2000, max: 12000, count: 180 },
];

const sampleBuynowData = [
  { emirate: 'Ajman', available: 84, sold: 12 },
  { emirate: 'RAK', available: 96, sold: 8 },
  { emirate: 'UAQ', available: 69, sold: 5 },
  { emirate: 'Fujairah', available: 82, sold: 15 },
];

const COLORS = ['#e94560', '#0f3460', '#16213e', '#1a1a2e', '#533483', '#2b2d42'];
const EMIRATE_COLORS: Record<string, string> = {
  sharjah: '#e94560',
  ajman: '#0f3460',
  rak: '#533483',
  uaq: '#2b2d42',
  fujairah: '#16213e',
  dubai: '#ff6b6b',
  abudhabi: '#4ecdc4',
};

function formatPrice(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
}

function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <div className="card">
      <h3 className="text-sm text-gray-400 uppercase tracking-wide">{title}</h3>
      <p className="stat-value">{typeof value === 'number' ? formatPrice(value) : value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function EmirateFilter({ selected, onChange }: { selected: string[]; onChange: (emirates: string[]) => void }) {
  const emirates = ['sharjah', 'ajman', 'rak', 'uaq', 'fujairah'];

  const toggle = (emirate: string) => {
    if (selected.includes(emirate)) {
      onChange(selected.filter(e => e !== emirate));
    } else {
      onChange([...selected, emirate]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {emirates.map(emirate => (
        <button
          key={emirate}
          onClick={() => toggle(emirate)}
          className={`px-3 py-1 rounded-full text-sm capitalize transition-all ${selected.includes(emirate)
            ? 'bg-[#e94560] text-white'
            : 'bg-[#1a1a2e] text-gray-400 hover:bg-[#16213e]'
            }`}
        >
          {emirate}
        </button>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [selectedEmirates, setSelectedEmirates] = useState(['sharjah', 'ajman', 'rak']);
  const [selectedDigits, setSelectedDigits] = useState<string | null>(null);

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            🚗 UAE Plate Auction Analytics
          </h1>
          <p className="text-gray-400">
            Track price trends across all UAE emirates
          </p>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Auctions" value={15} subtitle="Since tracking began" />
          <StatCard title="Plates Tracked" value={2450} subtitle="Across all emirates" />
          <StatCard title="Avg 3-Digit Price" value={85000} subtitle="AED" />
          <StatCard title="Buy Now Available" value={331} subtitle="4 emirates" />
        </section>

        {/* Filters */}
        <section className="card mb-8">
          <h2 className="text-lg font-semibold mb-4">Filter by Emirate</h2>
          <EmirateFilter selected={selectedEmirates} onChange={setSelectedEmirates} />
        </section>

        {/* Price Trends Chart */}
        <section className="chart-container mb-8">
          <h2 className="text-lg font-semibold mb-4">📈 Average Price Trends</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={sampleAuctionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" />
              <YAxis stroke="#888" tickFormatter={formatPrice} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [`AED ${formatPrice(Number(value))}`, '']}
              />
              <Legend />
              {selectedEmirates.map(emirate => (
                <Line
                  key={emirate}
                  type="monotone"
                  dataKey={emirate}
                  name={emirate.charAt(0).toUpperCase() + emirate.slice(1)}
                  stroke={EMIRATE_COLORS[emirate]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </section>

        {/* Price by Digits */}
        <section className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="chart-container">
            <h2 className="text-lg font-semibold mb-4">📊 Average Price by Digit Count</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sampleDigitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="digits" stroke="#888" label={{ value: 'Digits', position: 'bottom' }} />
                <YAxis stroke="#888" tickFormatter={formatPrice} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [`AED ${formatPrice(Number(value))}`, '']}
                />
                <Bar dataKey="avg" fill="#e94560" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <h2 className="text-lg font-semibold mb-4">🔢 Plates by Digit Count</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sampleDigitData}
                  dataKey="count"
                  nameKey="digits"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}D: ${value}`}
                >
                  {sampleDigitData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Buy Now Section */}
        <section className="chart-container mb-8">
          <h2 className="text-lg font-semibold mb-4">🛒 Buy Now Plates</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sampleBuynowData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" stroke="#888" />
              <YAxis type="category" dataKey="emirate" stroke="#888" width={80} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }}
              />
              <Legend />
              <Bar dataKey="available" fill="#0f3460" name="Available" radius={[0, 4, 4, 0]} />
              <Bar dataKey="sold" fill="#e94560" name="Sold" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* Digit Price Table */}
        <section className="card mb-8">
          <h2 className="text-lg font-semibold mb-4">💰 Price Breakdown by Digits</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-3 px-4">Digits</th>
                  <th className="py-3 px-4">Count</th>
                  <th className="py-3 px-4">Avg Price</th>
                  <th className="py-3 px-4">Min</th>
                  <th className="py-3 px-4">Max</th>
                </tr>
              </thead>
              <tbody>
                {sampleDigitData.map(row => (
                  <tr key={row.digits} className="border-b border-gray-800 hover:bg-[#16213e]">
                    <td className="py-3 px-4 font-medium">{row.digits}-Digit</td>
                    <td className="py-3 px-4">{row.count}</td>
                    <td className="py-3 px-4 text-[#e94560]">AED {formatPrice(row.avg)}</td>
                    <td className="py-3 px-4">AED {formatPrice(row.min)}</td>
                    <td className="py-3 px-4">AED {formatPrice(row.max)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm py-8">
          <p>Data from Emirates Auction • Auto-updated hourly</p>
          <p className="mt-1">
            <a
              href="https://github.com/mdanfas/emirates-auction-scraper"
              className="text-[#e94560] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
