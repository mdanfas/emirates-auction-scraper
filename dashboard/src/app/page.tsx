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

// Filter & Sort Controls Component
function FilterSortBar({
  digitFilter,
  setDigitFilter,
  sortBy,
  setSortBy,
  showBidsSort = false
}: {
  digitFilter: DigitFilter;
  setDigitFilter: (f: DigitFilter) => void;
  sortBy: SortOption;
  setSortBy: (s: SortOption) => void;
  showBidsSort?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-4 p-3 bg-white/5 rounded-lg">
      {/* Digit Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Digits:</span>
        <div className="flex gap-1">
          {(['all', '1', '2', '3', '4', '5+'] as DigitFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setDigitFilter(f)}
              className={`px-2 py-1 text-xs rounded ${digitFilter === f ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
            >
              {f === 'all' ? 'All' : f === '5+' ? '5+' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-xs text-gray-400">Sort:</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="bg-white/10 text-white text-xs rounded px-2 py-1 border border-white/10"
        >
          <option value="price_desc">Price: High to Low</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="plate_asc">Plate: A-Z</option>
          <option value="plate_desc">Plate: Z-A</option>
          {showBidsSort && <option value="bids_desc">Most Bids</option>}
        </select>
      </div>
    </div>
  );
}

// Plate Detail Modal
function PlateDetailModal({ plate, onClose }: { plate: Plate; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#12121a] border border-white/10 rounded-2xl p-4 sm:p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold font-mono">{plate.plate_number}</h3>
            <div className="flex gap-2 mt-1">
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">{plate.plate_code}</span>
              {plate.emirate && <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">{plate.emirate}</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl p-2">&times;</button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Price</p>
              <p className="text-emerald-400 text-lg font-semibold">AED {formatPrice(plate.final_price || plate.price)}</p>
            </div>
            {plate.bid_count !== undefined && (
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Bids</p>
                <p className="text-white text-lg font-semibold">{plate.bid_count}</p>
              </div>
            )}
          </div>

          {plate.price_history && plate.price_history.length > 1 && (
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-2">Price History ({plate.price_history.length} updates)</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {plate.price_history.map((h, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-emerald-400">AED {formatPrice(h.price)}</span>
                    <span className="text-gray-500 text-xs">{formatDate(h.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
  showBids?: boolean;
  subtitle?: string;
}) {
  const filteredPlates = useMemo(() => {
    const filtered = filterByDigits(plates, digitFilter);
    return sortPlates(filtered, sortBy);
  }, [plates, digitFilter, sortBy]);

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full bg-white/5 px-4 py-3 flex justify-between items-center hover:bg-white/10 transition-colors"
      >
        <div className="text-left">
          <h3 className="font-semibold text-lg">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">
            {filteredPlates.length} {digitFilter !== 'all' ? `(${plates.length} total)` : ''}
          </span>
          <span className="text-gray-400 text-xl">{isExpanded ? '−' : '+'}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="p-4">
          {filteredPlates.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No plates match your filter</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {filteredPlates.map((plate, idx) => (
                <div
                  key={idx}
                  onClick={() => onPlateClick(plate)}
                  className="p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-base font-bold">{plate.plate_number}</span>
                    <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">{plate.plate_code}</span>
                  </div>
                  <div className="text-emerald-400 font-semibold text-sm">AED {formatPrice(plate.final_price || plate.price)}</div>
                  {showBids && plate.bid_count !== undefined && (
                    <div className="text-gray-500 text-xs mt-1">{plate.bid_count} bids</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      {selectedPlate && <PlateDetailModal plate={selectedPlate} onClose={() => setSelectedPlate(null)} />}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h1 className="text-lg sm:text-xl font-bold">🚗 UAE Plate Auction Data</h1>
          <p className="text-gray-400 text-xs">Updated: {formatDate(data.generated_at)}</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-[57px] z-40 bg-[#0a0a0f] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 flex gap-2 sm:gap-4 overflow-x-auto">
          {[
            { id: 'auctions' as const, icon: '🔴', label: 'Live', count: data.summary.auctions_total },
            { id: 'buynow' as const, icon: '🛒', label: 'Buy Now', count: data.summary.buynow_available },
            { id: 'history' as const, icon: '📜', label: 'History', count: historyCount },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === tab.id
                  ? tab.id === 'auctions' ? 'border-red-500 text-red-400'
                    : tab.id === 'buynow' ? 'border-emerald-500 text-emerald-400'
                      : 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400'
                }`}
            >
              <span className="hidden sm:inline">{tab.icon} </span>{tab.label}
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/10 text-xs">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Filter & Sort Bar */}
        <FilterSortBar
          digitFilter={digitFilter}
          setDigitFilter={setDigitFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          showBidsSort={activeTab === 'auctions'}
        />

        {/* Live Auctions */}
        {activeTab === 'auctions' && (
          <div className="space-y-3">
            {auctionsList.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-lg mb-2">No active auctions</p>
                <p className="text-sm">Check History for past auctions</p>
              </div>
            ) : (
              auctionsList.map(([key, auction]) => (
                <EmirateSection
                  key={key}
                  title={`${auction.emirate} Auction`}
                  subtitle={`Started: ${formatDate(auction.start_date)}`}
                  plates={auction.plates}
                  isExpanded={expandedSections.has(`auction-${key}`)}
                  onToggle={() => toggleSection(`auction-${key}`)}
                  onPlateClick={setSelectedPlate}
                  sortBy={sortBy}
                  digitFilter={digitFilter}
                  showBids={true}
                />
              ))
            )}
          </div>
        )}

        {/* Buy Now */}
        {activeTab === 'buynow' && (
          <div className="space-y-3">
            {buynowList.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-lg">No Buy Now plates available</p>
              </div>
            ) : (
              buynowList.map(([key, emirateData]) => (
                <EmirateSection
                  key={key}
                  title={emirateData.emirate}
                  subtitle={`Updated: ${formatDate(emirateData.lastUpdated)}`}
                  plates={emirateData.available}
                  isExpanded={expandedSections.has(`buynow-${key}`)}
                  onToggle={() => toggleSection(`buynow-${key}`)}
                  onPlateClick={setSelectedPlate}
                  sortBy={sortBy}
                  digitFilter={digitFilter}
                />
              ))
            )}
          </div>
        )}

        {/* History */}
        {activeTab === 'history' && (
          <div>
            {/* History Sub-tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {[
                { id: 'auctions' as const, label: 'Past Auctions', count: archivedTracking.length },
                { id: 'buynow' as const, label: 'Buy Now Archives', count: archivedBuynow.length },
                { id: 'sold' as const, label: 'Sold Plates', count: Object.values(soldByEmirate).flat().length },
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setHistoryView(sub.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${historyView === sub.id ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'
                    }`}
                >
                  {sub.label} ({sub.count})
                </button>
              ))}
            </div>

            {/* Past Auctions - Grouped by Emirates */}
            {historyView === 'auctions' && (
              <div className="space-y-3">
                {archivedTracking.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-lg">No archived auctions yet</p>
                    <p className="text-sm">Completed auctions will appear here</p>
                  </div>
                ) : (
                  archivedTracking.map((archive, idx) => (
                    <EmirateSection
                      key={idx}
                      title={`${archive.emirate} - ${archive.auction_id || archive.date}`}
                      subtitle={`Archived: ${formatDate(archive.archived_at || archive.date)} • Total: AED ${formatPrice(archive.total_value)}`}
                      plates={archive.plates.map(p => ({ ...p, emirate: archive.emirate }))}
                      isExpanded={expandedSections.has(`archived-${archive.filename}`)}
                      onToggle={() => toggleSection(`archived-${archive.filename}`)}
                      onPlateClick={setSelectedPlate}
                      sortBy={sortBy}
                      digitFilter={digitFilter}
                      showBids={true}
                    />
                  ))
                )}
              </div>
            )}

            {/* Buy Now Archives - Grouped by Emirates */}
            {historyView === 'buynow' && (
              <div className="space-y-3">
                {archivedBuynow.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-lg">No Buy Now archives yet</p>
                    <p className="text-sm">Data is archived when all plates are sold or listing is cleared</p>
                  </div>
                ) : (
                  archivedBuynow.map((archive, idx) => (
                    <EmirateSection
                      key={idx}
                      title={`${archive.emirate} - ${archive.date}`}
                      subtitle={`${archive.sold_count || 0} sold • Total: AED ${formatPrice(archive.total_value)}`}
                      plates={archive.plates.map(p => ({ ...p, emirate: archive.emirate }))}
                      isExpanded={expandedSections.has(`buynow-archive-${archive.filename}`)}
                      onToggle={() => toggleSection(`buynow-archive-${archive.filename}`)}
                      onPlateClick={setSelectedPlate}
                      sortBy={sortBy}
                      digitFilter={digitFilter}
                    />
                  ))
                )}
              </div>
            )}

            {/* Sold Plates - Grouped by Emirates */}
            {historyView === 'sold' && (
              <div className="space-y-3">
                {Object.keys(soldByEmirate).length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-lg">No sold plates yet</p>
                  </div>
                ) : (
                  Object.entries(soldByEmirate).map(([key, plates]) => {
                    const emirateName = data.buynow[key]?.emirate || key;
                    return (
                      <EmirateSection
                        key={key}
                        title={`${emirateName} - Sold`}
                        subtitle={`${plates.length} plates sold`}
                        plates={plates}
                        isExpanded={expandedSections.has(`sold-${key}`)}
                        onToggle={() => toggleSection(`sold-${key}`)}
                        onPlateClick={setSelectedPlate}
                        sortBy={sortBy}
                        digitFilter={digitFilter}
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
      <footer className="border-t border-white/10 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-gray-500 text-xs">
          <a href="https://github.com/mdanfas/emirates-auction-scraper" className="text-emerald-400 hover:underline" target="_blank">
            View on GitHub
          </a>
        </div>
      </footer>
    </main>
  );
}
