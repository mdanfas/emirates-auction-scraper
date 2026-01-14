'use client';

import { useState, useEffect, useMemo } from 'react';

// Types
interface Plate {
  plate_number: string;
  plate_code: string;
  price: number;
  final_price?: number;
  status: string;
  bid_count?: number;
  sold_at?: string;
  first_seen?: string;
  completed_at?: string;
  price_history?: { price: number; timestamp: string }[];
  emirate?: string;
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
  sold_count?: number;
  auction_id?: string;
  archived_at?: string;
}

interface DashboardData {
  generated_at: string;
  buynow: Record<string, BuyNowEmirate>;
  auctions: Record<string, AuctionEmirate>;
  archives: ArchiveEntry[];
  archived_buynow: ArchiveEntry[];
  archived_tracking: ArchiveEntry[];
  summary: {
    buynow_available: number;
    buynow_sold: number;
    buynow_total: number;
    auctions_total: number;
    archives_count: number;
    archived_buynow_count: number;
    archived_tracking_count: number;
  };
}

type SortOption = 'price_desc' | 'price_asc' | 'plate_asc' | 'plate_desc' | 'bids_desc';
type DigitFilter = 'all' | '1' | '2' | '3' | '4' | '5+';

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
  return plateNumber.replace(/\D/g, '').length;
}

function filterByDigits(plates: Plate[], filter: DigitFilter): Plate[] {
  if (filter === 'all') return plates;
  return plates.filter(p => {
    const digits = getDigitCount(p.plate_number);
    if (filter === '5+') return digits >= 5;
    return digits === parseInt(filter);
  });
}

function searchPlates(plates: Plate[], query: string): Plate[] {
  if (!query) return plates;
  const lowerQuery = query.toLowerCase();
  return plates.filter(p =>
    p.plate_number.includes(lowerQuery) ||
    p.plate_code.toLowerCase().includes(lowerQuery)
  );
}

function sortPlates(plates: Plate[], sortBy: SortOption): Plate[] {
  const sorted = [...plates];
  switch (sortBy) {
    case 'price_desc':
      return sorted.sort((a, b) => (b.final_price || b.price) - (a.final_price || a.price));
    case 'price_asc':
      return sorted.sort((a, b) => (a.final_price || a.price) - (b.final_price || b.price));
    case 'plate_asc':
      return sorted.sort((a, b) => a.plate_number.localeCompare(b.plate_number, undefined, { numeric: true }));
    case 'plate_desc':
      return sorted.sort((a, b) => b.plate_number.localeCompare(a.plate_number, undefined, { numeric: true }));
    case 'bids_desc':
      return sorted.sort((a, b) => (b.bid_count || 0) - (a.bid_count || 0));
    default:
      return sorted;
  }
}

// Market Overview Component
function MarketOverview({ data }: { data: DashboardData }) {
  const allLivePlates = Object.values(data.auctions || {}).flatMap(a => a.plates);
  const highestBid = allLivePlates.reduce((max, p) => (p.price > max.price ? p : max), { price: 0 } as Plate);
  const mostBids = allLivePlates.reduce((max, p) => ((p.bid_count || 0) > (max.bid_count || 0) ? p : max), { bid_count: 0 } as Plate);
  const totalValue = allLivePlates.reduce((sum, p) => sum + p.price, 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-4">
        <p className="text-xs text-indigo-300 uppercase tracking-wider mb-1">Total Live Value</p>
        <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
          AED {(totalValue / 1000000).toFixed(1)}M
        </p>
      </div>
      <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4">
        <p className="text-xs text-emerald-300 uppercase tracking-wider mb-1">Highest Live Bid</p>
        <div className="flex justify-between items-end">
          <p className="text-xl sm:text-2xl font-bold text-emerald-400">AED {formatPrice(highestBid.price)}</p>
        </div>
        {highestBid.plate_number && (
          <p className="text-xs text-emerald-500/70 mt-1">Plate {highestBid.plate_number} ({highestBid.plate_code})</p>
        )}
      </div>
      <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-4">
        <p className="text-xs text-orange-300 uppercase tracking-wider mb-1">Hot Item</p>
        <p className="text-xl sm:text-2xl font-bold text-orange-400">{mostBids.bid_count} Bids</p>
        {mostBids.plate_number && (
          <p className="text-xs text-orange-500/70 mt-1">Plate {mostBids.plate_number} ({mostBids.plate_code})</p>
        )}
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Active Plates</p>
        <p className="text-xl sm:text-2xl font-bold text-white">{data.summary.auctions_total + data.summary.buynow_available}</p>
      </div>
    </div>
  );
}

// Filter & Sort Controls Component
function FilterSortBar({
  digitFilter,
  setDigitFilter,
  sortBy,
  setSortBy,
  searchQuery,
  setSearchQuery,
  showBidsSort = false
}: {
  digitFilter: DigitFilter;
  setDigitFilter: (f: DigitFilter) => void;
  sortBy: SortOption;
  setSortBy: (s: SortOption) => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  showBidsSort?: boolean;
}) {
  return (
    <div className="space-y-4 mb-6 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
      {/* Search Bar */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
        <input
          type="text"
          placeholder="Search plate number (e.g. 1234)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {/* Digit Filter */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Digits</span>
          <div className="flex flex-wrap gap-1">
            {(['all', '1', '2', '3', '4', '5+'] as DigitFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setDigitFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${digitFilter === f
                    ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)] transform scale-105'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
              >
                {f === 'all' ? 'All' : f === '5+' ? '5+' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Sort By</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-white/5 text-white text-sm rounded-lg px-4 py-2 pr-8 border border-white/10 hover:border-white/20 focus:outline-none focus:border-emerald-500/50 appearance-none min-w-[180px] cursor-pointer"
            >
              <option value="price_desc">Price: High to Low</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="plate_asc">Plate: A-Z</option>
              <option value="plate_desc">Plate: Z-A</option>
              {showBidsSort && <option value="bids_desc">Most Bids</option>}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">▼</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Plate Detail Modal
function PlateDetailModal({ plate, onClose }: { plate: Plate; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-[#12121a] border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl scale-100 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-white text-black px-4 py-2 rounded-lg border-2 border-black font-mono font-bold text-3xl shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              {plate.plate_number}
              <span className="text-lg ml-2 border-l-2 border-black pl-2 text-red-600">{plate.plate_code}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Price</p>
              <p className="text-emerald-400 text-2xl font-bold">AED {formatPrice(plate.final_price || plate.price)}</p>
            </div>
            {plate.bid_count !== undefined && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Bids</p>
                <p className="text-white text-2xl font-bold">{plate.bid_count}</p>
              </div>
            )}
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Price History</p>
            {plate.price_history && plate.price_history.length > 1 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {plate.price_history.map((h, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-white/5 last:border-0">
                    <span className="text-emerald-400 font-medium">AED {formatPrice(h.price)}</span>
                    <span className="text-gray-500 text-xs">{formatDate(h.timestamp)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No history available</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <span className="block mb-1">First Seen</span>
              <span className="text-gray-300">{formatDate(plate.first_seen || '')}</span>
            </div>
            <div>
              <span className="block mb-1">Sold At</span>
              <span className="text-gray-300">{formatDate(plate.sold_at || plate.completed_at || '')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Emirate Section Component (Collapsed by default)
function EmirateSection({
  title,
  plates,
  isExpanded,
  onToggle,
  onPlateClick,
  sortBy,
  digitFilter,
  searchQuery,
  showBids = false,
  subtitle
}: {
  title: string;
  plates: Plate[];
  isExpanded: boolean;
  onToggle: () => void;
  onPlateClick: (p: Plate) => void;
  sortBy: SortOption;
  digitFilter: DigitFilter;
  searchQuery: string;
  showBids?: boolean;
  subtitle?: string;
}) {
  const filteredPlates = useMemo(() => {
    let filtered = filterByDigits(plates, digitFilter);
    filtered = searchPlates(filtered, searchQuery);
    return sortPlates(filtered, sortBy);
  }, [plates, digitFilter, searchQuery, sortBy]);

  if (filteredPlates.length === 0 && searchQuery) return null;

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden bg-[#12121a] shadow-lg transition-all duration-300 hover:border-white/20">
      <button
        onClick={onToggle}
        className="w-full bg-gradient-to-r from-white/5 to-transparent px-4 py-4 flex justify-between items-center hover:from-white/10 transition-all duration-300"
      >
        <div className="text-left">
          <h3 className="font-bold text-lg text-white">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5 font-medium">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${filteredPlates.length > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-500'
            }`}>
            {filteredPlates.length} items
          </span>
          <div className={`w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </div>
        </div>
      </button>

      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4 border-t border-white/5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredPlates.map((plate, idx) => (
              <div
                key={idx}
                onClick={() => onPlateClick(plate)}
                className="group p-3 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] hover:from-white/10 hover:to-white/5 border border-white/5 hover:border-emerald-500/30 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-gray-500">#{idx + 1}</span>
                </div>

                {/* Plate Visual */}
                <div className="mb-3 mt-1 flex justify-center">
                  <div className="bg-white text-black px-3 py-1 rounded border border-gray-300 shadow-sm flex items-center gap-2 min-w-[80px] justify-center">
                    <span className="font-mono text-xl font-bold tracking-tight">{plate.plate_number}</span>
                    <span className="text-sm font-bold border-l border-gray-400 pl-2 text-red-600 block">{plate.plate_code}</span>
                  </div>
                </div>

                <div className="space-y-1 text-center">
                  <div className="text-emerald-400 font-bold text-sm">AED {formatPrice(plate.final_price || plate.price)}</div>
                  {showBids && plate.bid_count !== undefined && (
                    <div className="text-xs text-indigo-300/80 font-medium bg-indigo-500/10 rounded-full px-2 py-0.5 inline-block">
                      {plate.bid_count} Bids
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'auctions' | 'buynow' | 'history'>('buynow');
  const [historyView, setHistoryView] = useState<'auctions' | 'buynow' | 'sold'>('auctions');
  const [selectedPlate, setSelectedPlate] = useState<Plate | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('price_desc');
  const [digitFilter, setDigitFilter] = useState<DigitFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]"></div>
          <p className="text-gray-400 animate-pulse text-sm uppercase tracking-widest">Loading Market Data...</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">Failed to load data</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white/10 rounded hover:bg-white/20">Retry</button>
        </div>
      </main>
    );
  }

  const auctionsList = Object.entries(data.auctions || {});
  const buynowList = Object.entries(data.buynow || {});
  const archivedTracking = data.archived_tracking || [];
  const archivedBuynow = data.archived_buynow || [];

  // Group sold plates by emirate
  const soldByEmirate = buynowList.reduce((acc, [key, emirateData]) => {
    if (emirateData.sold.length > 0) {
      acc[key] = emirateData.sold.map(p => ({ ...p, emirate: emirateData.emirate }));
    }
    return acc;
  }, {} as Record<string, Plate[]>);

  const historyCount = archivedTracking.length + archivedBuynow.length + Object.values(soldByEmirate).flat().length;

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white font-sans">
      {selectedPlate && <PlateDetailModal plate={selectedPlate} onClose={() => setSelectedPlate(null)} />}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              UAE Plate Auction
            </h1>
            <p className="text-gray-500 text-xs mt-0.5">Live Market Analytics</p>
          </div>
          <p className="text-gray-600 text-[10px] hidden sm:block font-mono">
            UPDATED: {formatDate(data.generated_at)}
          </p>
        </div>
      </header>

      {/* Market Overview (Only on Dashboard) */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <MarketOverview data={data} />
      </div>

      {/* Tabs */}
      <div className="sticky top-[73px] z-40 bg-[#0a0a0f]/95 border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 flex gap-6 overflow-x-auto no-scrollbar">
          {[
            { id: 'auctions' as const, icon: '🔴', label: 'Live Auctions', count: data.summary.auctions_total },
            { id: 'buynow' as const, icon: '🛒', label: 'Buy Now Market', count: data.summary.buynow_available },
            { id: 'history' as const, icon: '📜', label: 'Historical Data', count: historyCount },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-2 text-sm font-medium border-b-2 whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${activeTab === tab.id
                  ? tab.id === 'auctions' ? 'border-red-500 text-red-400'
                    : tab.id === 'buynow' ? 'border-emerald-500 text-emerald-400'
                      : 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
            >
              <span className="opacity-80 text-lg">{tab.icon}</span>
              <span className="font-semibold tracking-wide">{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.id ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-600'
                }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 min-h-[60vh]">
        {/* Filter & Sort Bar */}
        <FilterSortBar
          digitFilter={digitFilter}
          setDigitFilter={setDigitFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showBidsSort={activeTab === 'auctions'}
        />

        {/* Live Auctions */}
        {activeTab === 'auctions' && (
          <div className="space-y-4">
            {auctionsList.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <div className="text-4xl mb-4 opacity-30">🔕</div>
                <p className="text-xl font-medium">No live auctions happening</p>
                <p className="text-sm mt-2">Check the History tab for past results</p>
              </div>
            ) : (
              auctionsList.map(([key, auction]) => (
                <EmirateSection
                  key={key}
                  title={`${auction.emirate} Auction`}
                  subtitle={`Started: ${formatDate(auction.start_date)} • ${auction.count} Plates`}
                  plates={auction.plates}
                  isExpanded={expandedSections.has(`auction-${key}`)}
                  onToggle={() => toggleSection(`auction-${key}`)}
                  onPlateClick={setSelectedPlate}
                  sortBy={sortBy}
                  digitFilter={digitFilter}
                  searchQuery={searchQuery}
                  showBids={true}
                />
              ))
            )}
          </div>
        )}

        {/* Buy Now */}
        {activeTab === 'buynow' && (
          <div className="space-y-4">
            {buynowList.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <div className="text-4xl mb-4 opacity-30">🛒</div>
                <p className="text-xl font-medium">Marketplace Empty</p>
                <p className="text-sm mt-2">No plates available for Buy Now</p>
              </div>
            ) : (
              buynowList.map(([key, emirateData]) => (
                <EmirateSection
                  key={key}
                  title={emirateData.emirate}
                  subtitle={`Last Update: ${formatDate(emirateData.lastUpdated)}`}
                  plates={emirateData.available}
                  isExpanded={expandedSections.has(`buynow-${key}`)}
                  onToggle={() => toggleSection(`buynow-${key}`)}
                  onPlateClick={setSelectedPlate}
                  sortBy={sortBy}
                  digitFilter={digitFilter}
                  searchQuery={searchQuery}
                />
              ))
            )}
          </div>
        )}

        {/* History */}
        {activeTab === 'history' && (
          <div>
            {/* History Sub-tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
              {[
                { id: 'auctions' as const, label: 'Past Auctions', count: archivedTracking.length },
                { id: 'buynow' as const, label: 'Buy Now Archives', count: archivedBuynow.length },
                { id: 'sold' as const, label: 'Sold Plates', count: Object.values(soldByEmirate).flat().length },
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setHistoryView(sub.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${historyView === sub.id
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(147,51,234,0.1)]'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-transparent'
                    }`}
                >
                  {sub.label} <span className="opacity-50 ml-1">({sub.count})</span>
                </button>
              ))}
            </div>

            {/* Past Auctions */}
            {historyView === 'auctions' && (
              <div className="space-y-4">
                {archivedTracking.length === 0 ? (
                  <div className="text-center py-20 text-gray-500">
                    <p className="text-xl">No archived auctions found</p>
                  </div>
                ) : (
                  archivedTracking.map((archive, idx) => (
                    <EmirateSection
                      key={idx}
                      title={`${archive.emirate} - ${archive.auction_id || archive.date}`}
                      subtitle={`Archived: ${formatDate(archive.archived_at || archive.date)} • Revenue: AED ${formatPrice(archive.total_value)}`}
                      plates={archive.plates.map(p => ({ ...p, emirate: archive.emirate }))}
                      isExpanded={expandedSections.has(`archived-${archive.filename}`)}
                      onToggle={() => toggleSection(`archived-${archive.filename}`)}
                      onPlateClick={setSelectedPlate}
                      sortBy={sortBy}
                      digitFilter={digitFilter}
                      searchQuery={searchQuery}
                      showBids={true}
                    />
                  ))
                )}
              </div>
            )}

            {/* Buy Now Archives */}
            {historyView === 'buynow' && (
              <div className="space-y-4">
                {archivedBuynow.length === 0 ? (
                  <div className="text-center py-20 text-gray-500">
                    <p className="text-xl">No Buy Now archives found</p>
                  </div>
                ) : (
                  archivedBuynow.map((archive, idx) => (
                    <EmirateSection
                      key={idx}
                      title={`${archive.emirate} - ${archive.date}`}
                      subtitle={`${archive.sold_count || 0} sold • Snapshot Value: AED ${formatPrice(archive.total_value)}`}
                      plates={archive.plates.map(p => ({ ...p, emirate: archive.emirate }))}
                      isExpanded={expandedSections.has(`buynow-archive-${archive.filename}`)}
                      onToggle={() => toggleSection(`buynow-archive-${archive.filename}`)}
                      onPlateClick={setSelectedPlate}
                      sortBy={sortBy}
                      digitFilter={digitFilter}
                      searchQuery={searchQuery}
                    />
                  ))
                )}
              </div>
            )}

            {/* Sold Plates */}
            {historyView === 'sold' && (
              <div className="space-y-4">
                {Object.keys(soldByEmirate).length === 0 ? (
                  <div className="text-center py-20 text-gray-500">
                    <p className="text-xl">No sold plates recorded</p>
                  </div>
                ) : (
                  Object.entries(soldByEmirate).map(([key, plates]) => {
                    const emirateName = data.buynow[key]?.emirate || key;
                    return (
                      <EmirateSection
                        key={key}
                        title={`${emirateName} - Recently Sold`}
                        subtitle={`${plates.length} plates sold successfully`}
                        plates={plates}
                        isExpanded={expandedSections.has(`sold-${key}`)}
                        onToggle={() => toggleSection(`sold-${key}`)}
                        onPlateClick={setSelectedPlate}
                        sortBy={sortBy}
                        digitFilter={digitFilter}
                        searchQuery={searchQuery}
                      />
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-12 bg-black/20 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-500 text-sm">
            UAE Plate Auction Analytics Dashboard
          </p>
          <a href="https://github.com/mdanfas/emirates-auction-scraper" className="text-emerald-500/50 hover:text-emerald-400 text-xs mt-2 inline-block transition-colors" target="_blank">
            Open Source Project
          </a>
        </div>
      </footer>
    </main>
  );
}
