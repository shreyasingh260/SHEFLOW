import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Star,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowLeft,
  Clock,
  Sparkles,
  Tag,
  CheckCircle2,
  TrendingDown,
  ArrowUpDown
} from 'lucide-react';
import { productsApi } from '../api/backendApi';

export default function ProductsPage({ onBack }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');
  const [sortBy, setSortBy] = useState('RATING');
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const list = await productsApi.getProducts('ALL', sortBy);
        setAllProducts(list);
      } catch (err) {
        console.error('Error loading products:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sortBy]);

  // Derive filtered list from allProducts
  const products = useMemo(() => {
    let result = [...allProducts];
    if (selectedCategory !== 'ALL') result = result.filter(p => p.category === selectedCategory);
    if (selectedBrand !== 'ALL') result = result.filter(p => p.brand === selectedBrand);
    if (selectedPlatform !== 'ALL') {
      result = result.filter(p => p.platforms.some(pl => pl.platformName === selectedPlatform));
    }
    return result;
  }, [allProducts, selectedCategory, selectedBrand, selectedPlatform]);

  const categories = [
    { id: 'ALL', label: 'All Products' },
    { id: 'PADS', label: 'Sanitary Pads' },
    { id: 'MENSTRUAL_CUPS', label: 'Menstrual Cups' },
    { id: 'TAMPONS', label: 'Tampons' },
    { id: 'PAIN_RELIEF', label: 'Pain Relief' },
    { id: 'INTIMATE_CARE', label: 'Intimate Care' }
  ];

  const brands = ['ALL', 'Nua', 'Whisper', 'Stayfree', 'Sirona', 'Pee Safe', 'Carmesi', 'Sofy', 'Sanfe', 'Kotex', 'Meftal-Spas', 'Everteen', 'Azah', 'JuJu'];
  const platforms = ['ALL', 'Blinkit', 'Nykaa'];

  // Helper to format platform store name
  const getStoreBadgeColor = (name) => {
    const n = name.toLowerCase();
    if (n.includes('blinkit')) return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    if (n.includes('amazon')) return 'bg-amber-50 text-amber-800 border-amber-200';
    if (n.includes('apollo')) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (n.includes('nykaa')) return 'bg-pink-50 text-pink-800 border-pink-200';
    if (n.includes('flipkart')) return 'bg-blue-50 text-blue-800 border-blue-200';
    return 'bg-purple-50 text-purple-800 border-purple-200';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in select-text">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-white border border-[#FFE4EC] text-[#8E7582] hover:text-[#E83D6F] hover:bg-[#FFF5F7] transition-all shadow-xs cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#2D1420] tracking-tight">
              Hygiene Essentials & Price Compare
            </h1>
            <p className="text-xs sm:text-sm text-[#7C6A75] mt-0.5">
              Price compare across Blinkit & Nykaa · 13 brands · 27+ products.
            </p>
          </div>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-[#FFD3DF] shadow-xs self-start sm:self-auto">
          <ArrowUpDown className="w-4 h-4 text-[#E83D6F]" />
          <span className="text-xs font-bold text-[#8E7582]">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-bold text-[#2D1420] bg-transparent outline-none cursor-pointer"
          >
            <option value="RATING">Highest Rating (Nua Top Pick ★ 5.0)</option>
            <option value="PRICE_LOW">Lowest Price (Best Deal)</option>
          </select>
        </div>
      </div>

      {/* ── CATEGORY PILLS ── */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === c.id
                ? 'bg-[#E83D6F] text-white shadow-xs'
                : 'bg-white text-[#685361] border border-[#FFE4EC] hover:bg-[#FFF7F9]'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* ── BRAND FILTER ── */}
      <div className="space-y-2">
        <p className="text-[11px] font-extrabold text-[#8E7582] uppercase tracking-wider">Filter by Brand</p>
        <div className="flex flex-wrap gap-2">
          {brands.map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBrand(b)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${
                selectedBrand === b
                  ? 'bg-[#2D1420] text-white border-[#2D1420]'
                  : 'bg-white text-[#685361] border-[#FFE4EC] hover:bg-[#FFF0F4] hover:border-[#FFADC4]'
              }`}
            >
              {b === 'ALL' ? '🛍 All Brands' : b}
            </button>
          ))}
        </div>
      </div>

      {/* ── PLATFORM FILTER ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-[11px] font-extrabold text-[#8E7582] uppercase tracking-wider">Platform:</span>
        {platforms.map((pl) => {
          const icon = pl === 'Blinkit' ? '⚡' : pl === 'Nykaa' ? '🩷' : '🌐';
          const sublabel = pl === 'Blinkit' ? ' (10-min delivery)' : pl === 'Nykaa' ? ' (2-day delivery)' : '';
          return (
            <button
              key={pl}
              onClick={() => setSelectedPlatform(pl)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                selectedPlatform === pl
                  ? pl === 'Blinkit'
                    ? 'bg-yellow-400 text-yellow-900 border-yellow-400'
                    : pl === 'Nykaa'
                    ? 'bg-pink-500 text-white border-pink-500'
                    : 'bg-[#E83D6F] text-white border-[#E83D6F]'
                  : 'bg-white text-[#685361] border-[#FFE4EC] hover:bg-[#FFF0F4]'
              }`}
            >
              <span>{icon}</span>
              <span>{pl === 'ALL' ? 'All Stores' : pl}{sublabel}</span>
            </button>
          );
        })}

        {/* Results count */}
        <span className="ml-auto text-[11px] text-[#8E7582] font-semibold">
          {products.length} product{products.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* ── PRODUCTS GRID ── */}
      {loading ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-[#FFE4EC]">
          <div className="w-10 h-10 rounded-full border-3 border-[#FFC2D1] border-t-[#E83D6F] animate-spin mx-auto" />
          <p className="text-xs font-bold text-[#E83D6F] uppercase tracking-wider">
            Loading 27+ products from Blinkit & Nykaa...
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-[#FFE4EC]">
          <p className="text-2xl">🔍</p>
          <p className="text-sm font-bold text-[#2D1420]">No products match your filters</p>
          <button
            onClick={() => { setSelectedCategory('ALL'); setSelectedBrand('ALL'); setSelectedPlatform('ALL'); }}
            className="text-xs font-bold text-[#E83D6F] underline cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((prod, idx) => {
            // For platform filter: show only matching platforms or all
            const visiblePlatforms = selectedPlatform === 'ALL'
              ? prod.platforms
              : prod.platforms.filter(p => p.platformName === selectedPlatform);
            const bestPlatform = visiblePlatforms.find((p) => p.bestPrice) || visiblePlatforms[0];
            const primaryStoreUrl =
              bestPlatform?.storeUrl || productsApi.getStoreUrl(bestPlatform?.platformName, prod.name);

            return (
              <div
                key={prod.id}
                className={`bg-white rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between hover:shadow-lg ${
                  idx === 0 && sortBy === 'RATING'
                    ? 'border-[#E83D6F] ring-2 ring-[#E83D6F]/20'
                    : 'border-[#FFE4EC] hover:border-[#FF5983]'
                }`}
              >
                <div>
                  {/* Top Header: Badge, Category, Rating */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold text-[#E83D6F] bg-[#FFE1E8] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {prod.category?.replace(/_/g, ' ')}
                        </span>
                        {prod.brand && (
                          <span className="text-[10px] font-bold text-[#685361] bg-[#F5F0F3] px-2.5 py-0.5 rounded-full border border-[#EEE0E8]">
                            {prod.brand}
                          </span>
                        )}
                        {prod.badge && (
                          <span className="text-[10px] font-black text-white bg-gradient-to-r from-[#FF5983] to-[#E83D6F] px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            {prod.badge}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold font-display text-[#2D1420] mt-1">
                        {prod.name}
                      </h3>
                      <p className="text-xs text-[#7C6A75] leading-relaxed">
                        {prod.description}
                      </p>
                    </div>

                    {/* Star Rating Badge */}
                    <div className="flex items-center gap-1.5 bg-[#FFF9EA] border border-[#FFE7A8] px-3 py-1.5 rounded-2xl shrink-0">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-black text-[#2D1420]">
                        {Number(prod.rating).toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* ── PLATFORM PRICES COMPARISON TABLE ── */}
                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-[#8E7582] uppercase tracking-wider block">
                        Live Store Prices (Compare & Buy)
                      </span>
                      <span className="text-[10px] text-[#2D1420] font-semibold">
                        Instant Delivery Available
                      </span>
                    </div>

                    <div className="space-y-2">
                      {visiblePlatforms.map((p, pIdx) => {
                        const directUrl =
                          p.storeUrl || productsApi.getStoreUrl(p.platformName, prod.name);

                        return (
                          <div
                            key={pIdx}
                            className={`flex items-center justify-between p-3 rounded-2xl text-xs transition-all ${
                              p.bestPrice
                                ? 'bg-[#E8F5E9] border-2 border-[#A5D6A7] shadow-xs'
                                : 'bg-[#FFF7F9] border border-[#FFE8EE] hover:bg-[#FFF0F4]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${getStoreBadgeColor(
                                  p.platformName
                                )}`}
                              >
                                {p.platformName}
                              </span>

                              {p.bestPrice && (
                                <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                  <TrendingDown className="w-3 h-3" />
                                  Best Price
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-[#7C6A75] flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[#8E7582]" />
                                {p.deliveryTime}
                              </span>

                              <span className="font-black text-sm text-[#2D1420]">
                                ₹{p.price}
                              </span>

                              {/* Direct Store Buy Link */}
                              <a
                                href={directUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-[#E83D6F] text-[#E83D6F] hover:text-white border border-[#FFD3DF] hover:border-[#E83D6F] rounded-xl text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                                title={`Buy on ${p.platformName}`}
                              >
                                <span>Buy</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── CARD FOOTER WITH WORKING STORE LINK ── */}
                <div className="mt-6 pt-4 border-t border-[#FFE8EE] flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] text-[#7C6A75] flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Verified Authentic · {prod.reviewCount || '500+'} Ratings</span>
                  </span>

                  {/* Primary "View on Store" / "Buy Best Price" button */}
                  <a
                    href={primaryStoreUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E83D6F] hover:bg-[#D4265A] active:scale-95 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <span>View on {bestPlatform.platformName} (₹{bestPlatform.price})</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
