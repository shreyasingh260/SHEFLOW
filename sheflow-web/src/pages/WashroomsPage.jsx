import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapPin,
  ArrowLeft,
  Accessibility,
  Clock,
  Sparkles,
  Navigation,
  LocateFixed,
  Search,
  Star,
  ShieldCheck,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Map,
  Compass,
  X,
  Layers
} from 'lucide-react';
import { washroomsApi } from '../api/backendApi';

// Instant local geocoding dictionary for popular Indian hubs
const POPULAR_LOCATIONS = [
  { name: 'Koramangala, Bengaluru', lat: 12.9352, lng: 77.6245 },
  { name: 'Indiranagar, Bengaluru', lat: 12.9784, lng: 77.6408 },
  { name: 'HSR Layout, Bengaluru', lat: 12.9121, lng: 77.6446 },
  { name: 'Whitefield, Bengaluru', lat: 12.9698, lng: 77.7500 },
  { name: 'Connaught Place, New Delhi', lat: 28.6315, lng: 77.2167 },
  { name: 'Hauz Khas, New Delhi', lat: 28.5494, lng: 77.2001 },
  { name: 'Bandra West, Mumbai', lat: 19.0596, lng: 72.8295 },
  { name: 'Andheri West, Mumbai', lat: 19.1363, lng: 72.8277 },
  { name: 'Cyber Hub, Gurugram', lat: 28.4986, lng: 77.0898 },
  { name: 'Sector 62, Noida', lat: 28.6258, lng: 77.3653 },
  { name: 'Park Street, Kolkata', lat: 22.5518, lng: 88.3524 },
  { name: 'T. Nagar, Chennai', lat: 13.0418, lng: 80.2341 },
  { name: 'Banjara Hills, Hyderabad', lat: 17.4156, lng: 78.4357 },
  { name: 'Koregaon Park, Pune', lat: 18.5362, lng: 73.8940 }
];

export default function WashroomsPage({ onBack }) {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('DISTANCE'); // 'DISTANCE' | 'CLEANLINESS' | 'RATING'
  const [facilitySearch, setFacilitySearch] = useState('');

  // Location and Map states
  const [userCoords, setUserCoords] = useState({ lat: 28.6315, lng: 77.2167 }); // Default: Connaught Place
  const [locationName, setLocationName] = useState('Connaught Place, New Delhi');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [locationSuccess, setLocationSuccess] = useState(false);

  // Map Locator interactive inputs & autocomplete
  const [writtenLocation, setWrittenLocation] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [activeFacilityId, setActiveFacilityId] = useState(null);

  // Expanded reviews accordion state (set of facility IDs)
  const [expandedReviews, setExpandedReviews] = useState({ 'wash-1': true });

  // Condition reporting modal state
  const [reportModalFac, setReportModalFac] = useState(null);
  const [reportSuccessMsg, setReportSuccessMsg] = useState('');

  const searchContainerRef = useRef(null);

  // Load facilities near given coordinates
  const loadWashrooms = async (coords = userCoords, locMeta = {}) => {
    setLoading(true);
    try {
      const list = await washroomsApi.getNearby({
        lat: coords?.lat,
        lng: coords?.lng,
        areaName: locMeta.areaName || locationName,
        locality: locMeta.locality,
        city: locMeta.city
      });
      setFacilities(list);
    } catch (err) {
      console.error('Error loading washrooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWashrooms(userCoords, { areaName: locationName });
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autocomplete typing with debounce
  useEffect(() => {
    if (!writtenLocation || writtenLocation.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      const query = writtenLocation.trim().toLowerCase();

      // 1. Check local instant dictionary
      const localMatches = POPULAR_LOCATIONS.filter((item) =>
        item.name.toLowerCase().includes(query)
      ).map((item) => ({
        display_name: item.name,
        lat: item.lat,
        lon: item.lng,
        source: 'local'
      }));

      // 2. Fetch from OpenStreetMap Nominatim for real-time worldwide search
      let remoteMatches = [];
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            writtenLocation
          )}&limit=5`,
          { signal: controller.signal }
        );
        clearTimeout(timeout);
        const data = await res.json();
        if (Array.isArray(data)) {
          remoteMatches = data.map((d) => ({
            display_name: d.display_name,
            lat: parseFloat(d.lat),
            lon: parseFloat(d.lon),
            source: 'remote'
          }));
        }
      } catch {
        // use local matches on error
      }

      // Combine unique suggestions
      const combined = [...localMatches];
      for (const rm of remoteMatches) {
        if (!combined.some((c) => Math.abs(c.lat - rm.lat) < 0.005 && Math.abs(c.lon - rm.lon) < 0.005)) {
          combined.push(rm);
        }
      }

      setSuggestions(combined.slice(0, 5));
      setShowSuggestions(true);
      setIsSearchingLocation(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [writtenLocation]);

  // Apply location selected from input or suggestions
  const handleApplyLocation = async (lat, lng, name) => {
    const coords = { lat: parseFloat(lat), lng: parseFloat(lng) };
    setUserCoords(coords);
    setLocationName(name);
    setWrittenLocation('');
    setShowSuggestions(false);
    setLocationError(null);
    setLocationSuccess(true);

    const parts = name.split(',');
    const locality = parts[0]?.trim() || name;
    const city = parts[1]?.trim() || '';

    await loadWashrooms(coords, {
      areaName: name,
      locality,
      city
    });
  };

  // Submit written location directly on Enter
  const handleWrittenSubmit = async (e) => {
    e.preventDefault();
    if (!writtenLocation.trim()) return;

    if (suggestions.length > 0) {
      const top = suggestions[0];
      handleApplyLocation(top.lat, top.lon, top.display_name);
      return;
    }

    // Direct geocoding fallback
    setIsSearchingLocation(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          writtenLocation
        )}&limit=1`
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        handleApplyLocation(item.lat, item.lon, item.display_name);
      } else {
        setLocationError(`Could not find "${writtenLocation}". Try another city or locality name.`);
      }
    } catch {
      setLocationError('Could not connect to map geocoder. Please select from popular locations.');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Browser Geolocation Trigger
  const handleGetMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    setLocationSuccess(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setUserCoords(coords);

        let detectedArea = `GPS Location (${coords.lat.toFixed(3)}°N, ${coords.lng.toFixed(3)}°E)`;
        let localityPart = 'Your Area';
        let cityPart = '';

        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 2500);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=16`,
            { signal: controller.signal }
          );
          clearTimeout(timeout);
          const data = await res.json();
          if (data && data.address) {
            localityPart =
              data.address.suburb ||
              data.address.neighbourhood ||
              data.address.quarter ||
              data.address.road ||
              data.address.city_district ||
              data.address.city ||
              'Your Area';
            cityPart = data.address.city || data.address.town || data.address.state || '';
            detectedArea = cityPart && localityPart !== cityPart ? `${localityPart}, ${cityPart}` : localityPart;
          }
        } catch {
          // fallback
        }

        setLocationName(detectedArea);
        setLocationSuccess(true);
        setIsLocating(false);

        await loadWashrooms(coords, {
          areaName: detectedArea,
          locality: localityPart,
          city: cityPart
        });
      },
      (err) => {
        setIsLocating(false);
        let msg = 'Could not retrieve your location. Please check browser permissions.';
        if (err.code === 1) msg = 'Location access was denied. You can write your location above or pick from presets!';
        else if (err.code === 2) msg = 'Location position is currently unavailable.';
        else if (err.code === 3) msg = 'Location request timed out.';
        setLocationError(msg);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  // Toggle reviews accordion
  const toggleReviews = (facId) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [facId]: !prev[facId]
    }));
  };

  // Scroll to and highlight specific facility from map chip
  const handleFocusFacility = (id) => {
    setActiveFacilityId(id);
    const element = document.getElementById(`facility-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => setActiveFacilityId(null), 2500);
  };

  // Filter & Sort computation
  const filteredFacilities = useMemo(() => {
    return facilities
      .filter((fac) => {
        if (facilitySearch.trim()) {
          const q = facilitySearch.toLowerCase();
          const matchName = fac.name.toLowerCase().includes(q);
          const matchAddr = fac.address.toLowerCase().includes(q);
          const matchType = fac.type.toLowerCase().includes(q);
          if (!matchName && !matchAddr && !matchType) return false;
        }

        if (activeFilter === 'PADS') return fac.sanitaryPadsAvailable;
        if (activeFilter === 'CLEAN') return fac.cleanlinessScore >= 9.2;
        if (activeFilter === 'WHEELCHAIR') return fac.wheelchairAccessible;
        if (activeFilter === 'FREE') return fac.cost?.toLowerCase().includes('free');
        if (activeFilter === '24_HOURS') return fac.openingHours?.toLowerCase().includes('24');
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'DISTANCE') return a.distanceKm - b.distanceKm;
        if (sortBy === 'CLEANLINESS') return b.cleanlinessScore - a.cleanlinessScore;
        if (sortBy === 'RATING') return b.googleRating - a.googleRating;
        return 0;
      });
  }, [facilities, activeFilter, sortBy, facilitySearch]);

  const handleReportSubmit = (e) => {
    e.preventDefault();
    setReportSuccessMsg('Thank you for helping keep SheFlow washroom conditions verified!');
    setTimeout(() => {
      setReportSuccessMsg('');
      setReportModalFac(null);
    }, 1800);
  };

  // Google Maps interactive embed URL
  const mapEmbedUrl = `https://maps.google.com/maps?q=${userCoords.lat},${userCoords.lng}+(${encodeURIComponent(
    locationName
  )})&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in select-text">
      {/* ── TOP NAV HEADER ── */}
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
            Clean Washroom & Map Locator
          </h1>
          <p className="text-xs sm:text-sm text-[#7C6A75] mt-0.5">
            Write your location or use GPS to locate clean restrooms, sanitary pad stations & authentic Google reviews
          </p>
        </div>
      </div>

      {/* ── MAP LOCATOR & WRITE LOCATION BAR ── */}
      <div className="bg-gradient-to-br from-white via-[#FFF7F9] to-[#FFE8EE] rounded-3xl p-5 sm:p-7 border border-[#FFD3DF] shadow-md space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-[#E83D6F] bg-[#FFE1E8] px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              Interactive Map Locator
            </span>
            <div className="flex items-center gap-2 pt-1">
              <MapPin className="w-5 h-5 text-[#E83D6F] shrink-0" />
              <h2 className="text-lg sm:text-xl font-bold text-[#2D1420] truncate max-w-lg">
                {locationName}
              </h2>
              {locationSuccess && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  Located
                </span>
              )}
            </div>
            <p className="text-xs text-[#7C6A75]">
              Lat: {userCoords.lat.toFixed(4)}°, Lng: {userCoords.lng.toFixed(4)}° • {filteredFacilities.length} clean washrooms mapped nearby
            </p>
          </div>

          {/* Action buttons: GPS Detect + Toggle Map */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleGetMyLocation}
              disabled={isLocating}
              className="px-4 py-2.5 bg-[#E83D6F] hover:bg-[#D4265A] active:scale-95 disabled:opacity-75 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              title="Use current GPS location"
            >
              <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Detecting GPS...' : 'My GPS Location'}</span>
            </button>

            <button
              onClick={() => setShowMap(!showMap)}
              className="px-4 py-2.5 bg-white hover:bg-[#FFF0F3] border border-[#FFD3DF] text-[#685361] hover:text-[#E83D6F] rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Map className="w-4 h-4 text-[#E83D6F]" />
              <span>{showMap ? 'Hide Map' : 'Show Map'}</span>
            </button>
          </div>
        </div>

        {/* ── WRITE LOCATION INPUT FORM WITH LIVE AUTOCOMPLETE ── */}
        <div ref={searchContainerRef} className="relative">
          <form onSubmit={handleWrittenSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <MapPin className="w-4 h-4 text-[#E83D6F] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={writtenLocation}
                onChange={(e) => setWrittenLocation(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                placeholder="Write your location (e.g. Koramangala, Connaught Place, Bandra West, Sector 62)..."
                className="w-full pl-11 pr-10 py-3.5 rounded-2xl border border-[#FFD3DF] text-xs sm:text-sm font-semibold text-[#2D1420] bg-white placeholder-[#B89DAA] outline-none focus:ring-2 focus:ring-[#E83D6F]/30 focus:border-[#E83D6F] transition-all shadow-xs"
              />
              {writtenLocation && (
                <button
                  type="button"
                  onClick={() => {
                    setWrittenLocation('');
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9A7A85] hover:text-[#2D1420]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSearchingLocation || !writtenLocation.trim()}
              className="px-6 py-3.5 bg-[#2D1420] hover:bg-[#483742] active:scale-95 disabled:opacity-50 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>{isSearchingLocation ? 'Locating...' : 'Locate on Map'}</span>
            </button>
          </form>

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-30 left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-[#FFE4EC] shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 bg-[#FFF7F9] border-b border-[#FFE4EC] text-[10px] font-extrabold uppercase tracking-wider text-[#E83D6F]">
                Matching Locations
              </div>
              <div className="divide-y divide-[#FFF0F4]">
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyLocation(sug.lat, sug.lon, sug.display_name)}
                    className="w-full px-4 py-3 text-left hover:bg-[#FFF5F7] transition-colors flex items-start gap-2.5 text-xs text-[#2D1420] group cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-[#E83D6F] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="font-bold text-[#2D1420] group-hover:text-[#E83D6F] transition-colors">
                        {sug.display_name.split(',')[0]}
                      </p>
                      <p className="text-[11px] text-[#8E7582] truncate max-w-xl">
                        {sug.display_name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Location Error alert if any */}
        {locationError && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{locationError}</span>
          </div>
        )}

        {/* ── POPULAR PRESETS ROW ── */}
        <div className="pt-2 border-t border-[#FFE4EC] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#8E7582] mr-1">Popular:</span>
            {POPULAR_LOCATIONS.slice(0, 6).map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleApplyLocation(preset.lat, preset.lng, preset.name)}
                className="text-[11px] font-semibold px-3 py-1 bg-white hover:bg-[#FFF0F3] border border-[#FFD3DF] hover:border-[#E83D6F] text-[#685361] hover:text-[#E83D6F] rounded-full transition-all cursor-pointer"
              >
                {preset.name.split(',')[0]}
              </button>
            ))}
          </div>

          <a
            href={`https://www.google.com/maps/search/public+toilets+near+me/@${userCoords.lat},${userCoords.lng},15z`}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-bold text-[#4285F4] hover:text-[#2A65CC] hover:underline inline-flex items-center gap-1 shrink-0"
          >
            <span>Search Live Public Toilets on Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* ── EMBEDDED INTERACTIVE MAP VIEW ── */}
      {showMap && (
        <div className="bg-white rounded-3xl border border-[#FFE4EC] shadow-soft overflow-hidden space-y-0 animate-in fade-in duration-300">
          {/* Map Header Bar */}
          <div className="px-5 py-3.5 bg-[#FFF9FA] border-b border-[#FFE4EC] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#2D1420]">
              <Map className="w-4 h-4 text-[#E83D6F]" />
              <span>Map View Centered on:</span>
              <span className="text-[#E83D6F] bg-[#FFE1E8] px-2.5 py-0.5 rounded-full truncate max-w-xs">
                {locationName.split(',')[0]}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${userCoords.lat},${userCoords.lng}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-[#4285F4] hover:underline inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-[#D2E3FC]"
              >
                <span>Fullscreen Map</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Live Google Maps Iframe Embed */}
          <div className="relative w-full h-[280px] sm:h-[340px] bg-[#E5E3DF]">
            <iframe
              title="Washroom Locator Map"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight="0"
              marginWidth="0"
              src={mapEmbedUrl}
              className="w-full h-full filter saturate-[1.05]"
              loading="lazy"
            />
          </div>

          {/* Clickable Quick Jump Chips on Map Footer */}
          <div className="p-3 bg-[#FFF9FA] border-t border-[#FFE4EC] flex flex-wrap items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-extrabold text-[#8E7582] uppercase tracking-wider shrink-0">
              Nearby Pins:
            </span>
            {filteredFacilities.map((fac, idx) => (
              <button
                key={fac.id}
                onClick={() => handleFocusFacility(fac.id)}
                className="text-xs font-bold px-3 py-1 bg-white hover:bg-[#FFE1E8] border border-[#FFD3DF] hover:border-[#E83D6F] text-[#2D1420] hover:text-[#E83D6F] rounded-xl transition-all flex items-center gap-1 shrink-0 shadow-xs cursor-pointer"
              >
                <span className="w-4 h-4 rounded-full bg-[#E83D6F] text-white text-[9px] font-black flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="truncate max-w-[130px]">{fac.name.split(' ')[0]} {fac.name.split(' ')[1] || ''}</span>
                <span className="text-[10px] text-[#8E7582]">({fac.distanceKm} km)</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── FILTER & SORT BAR ── */}
      <div className="space-y-3">
        {/* Search within facilities */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#B89DAA] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={facilitySearch}
            onChange={(e) => setFacilitySearch(e.target.value)}
            placeholder="Search facility name, facility type, or feature..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#FFD3DF] text-xs sm:text-sm font-medium text-[#2D1420] bg-white placeholder-[#B89DAA] outline-none focus:ring-2 focus:ring-[#E83D6F]/30 focus:border-[#E83D6F] transition-all shadow-xs"
          />
          {facilitySearch && (
            <button
              onClick={() => setFacilitySearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#9A7A85] hover:text-[#2D1420] bg-[#FFF0F4] px-2 py-0.5 rounded-full"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills and Sort Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: 'All Washrooms' },
              { id: 'PADS', label: '🌸 Pads Stocked' },
              { id: 'CLEAN', label: '✨ Cleanliness 9.0+' },
              { id: 'WHEELCHAIR', label: '♿ Wheelchair Access' },
              { id: 'FREE', label: '🆓 Free Access' },
              { id: '24_HOURS', label: '🕒 Open 24/7' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === tab.id
                    ? 'bg-[#E83D6F] text-white shadow-xs'
                    : 'bg-white text-[#685361] border border-[#FFE4EC] hover:bg-[#FFF7F9]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0 text-xs">
            <span className="font-bold text-[#8E7582]">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-[#FFD3DF] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#2D1420] outline-none focus:border-[#E83D6F]"
            >
              <option value="DISTANCE">Nearest First</option>
              <option value="CLEANLINESS">Cleanliness Score</option>
              <option value="RATING">Google Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── FACILITIES LIST ── */}
      {loading ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-[#FFE4EC]">
          <div className="w-10 h-10 rounded-full border-3 border-[#FFC2D1] border-t-[#E83D6F] animate-spin mx-auto" />
          <p className="text-xs font-bold text-[#E83D6F] uppercase tracking-wider">
            Scanning nearest verified washrooms...
          </p>
        </div>
      ) : filteredFacilities.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#FFE4EC] space-y-3">
          <p className="text-3xl">🚻</p>
          <h3 className="text-base font-bold text-[#2D1420]">No washrooms match this criteria</h3>
          <p className="text-xs text-[#7C6A75] max-w-sm mx-auto">
            Try resetting your search filter or selecting "All Washrooms" to view all nearest facilities.
          </p>
          <button
            onClick={() => {
              setActiveFilter('ALL');
              setFacilitySearch('');
            }}
            className="px-5 py-2 bg-[#FFE1E8] text-[#E83D6F] rounded-full text-xs font-bold hover:bg-[#FFD1DE] transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredFacilities.map((fac, idx) => {
            const reviewsOpen = !!expandedReviews[fac.id];
            const isHighlighted = activeFacilityId === fac.id;
            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              fac.name + ' ' + fac.address
            )}&center=${fac.latitude},${fac.longitude}`;
            const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${fac.latitude},${fac.longitude}`;

            return (
              <div
                key={fac.id}
                id={`facility-${fac.id}`}
                className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden ${
                  isHighlighted
                    ? 'border-[#E83D6F] ring-4 ring-[#E83D6F]/20 shadow-xl scale-[1.01]'
                    : 'border-[#FFE4EC] shadow-soft hover:border-[#FF5983]'
                }`}
              >
                {/* CARD TOP SECTION */}
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Status Badges Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#E83D6F] text-white text-[10px] font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-[10px] font-extrabold text-[#E83D6F] bg-[#FFE1E8] px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {fac.type.replace('_', ' ')}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        Cleanliness: {fac.cleanlinessScore}/10 · {fac.hygieneBadge}
                      </span>
                      <span className="text-[10px] font-bold text-[#685361] bg-[#F5F2F4] px-2 py-0.5 rounded-full">
                        {fac.cost}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#E83D6F] bg-[#FFF0F4] px-3 py-1 rounded-full border border-[#FFD3DF]">
                      <Navigation className="w-3.5 h-3.5" />
                      <span>{fac.distanceKm} km away</span>
                      <span className="text-[#9A7A85] font-normal">
                        (~{fac.walkingTimeMins} mins walk)
                      </span>
                    </div>
                  </div>

                  {/* Title & Basic Info */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold font-display text-[#2D1420]">
                        {fac.name}
                      </h3>
                      <p className="text-xs text-[#7C6A75] flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#E83D6F] shrink-0" />
                        <span>{fac.address}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#8E7582] pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#E83D6F]" />
                          {fac.openingHours}
                        </span>
                        <span>•</span>
                        <span>Cleaned: <strong>{fac.lastCleaned}</strong></span>
                        {fac.wheelchairAccessible && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-[#0288D1] font-semibold">
                              <Accessibility className="w-3 h-3" />
                              Wheelchair Accessible
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Google Star Rating Pill */}
                    <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-1 bg-[#FFF9EA] border border-[#FFE7A8] p-2.5 rounded-2xl">
                      <div className="flex items-center gap-1">
                        <span className="text-amber-500 font-extrabold text-sm sm:text-base">
                          ★ {fac.googleRating}
                        </span>
                        <div className="flex text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(fac.googleRating)
                                  ? 'fill-amber-400'
                                  : 'text-amber-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#8C6D1F]">
                        {fac.googleReviewCount} Google Reviews
                      </span>
                    </div>
                  </div>

                  {/* ── VERIFIED CONDITIONS GRID ── */}
                  <div className="bg-[#FFF7F9] rounded-2xl p-4 border border-[#FFE4EC] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#E83D6F] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Live Hygiene & Condition Audit
                      </span>
                      <span className="text-[10px] text-[#8E7582] font-semibold">
                        Inspected Today
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-[#FFE4EC]">
                        <span className="text-base">🌸</span>
                        <div>
                          <p className="font-bold text-[#2D1420]">Pad Dispenser</p>
                          <p className="text-[11px] text-emerald-700 font-semibold">
                            {fac.padMachineStock}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-[#FFE4EC]">
                        <span className="text-base">💧</span>
                        <div>
                          <p className="font-bold text-[#2D1420]">Water & Soap</p>
                          <p className="text-[11px] text-[#685361]">
                            {fac.conditions.waterSupply}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-[#FFE4EC]">
                        <span className="text-base">🔒</span>
                        <div>
                          <p className="font-bold text-[#2D1420]">Privacy & Lock</p>
                          <p className="text-[11px] text-[#685361]">
                            {fac.conditions.lockCondition}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-[#FFE4EC]">
                        <span className="text-base">🗑️</span>
                        <div>
                          <p className="font-bold text-[#2D1420]">Sanitary Bin</p>
                          <p className="text-[11px] text-[#685361]">
                            {fac.conditions.sanitaryBin}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-[#FFE4EC]">
                        <span className="text-base">🛡️</span>
                        <div>
                          <p className="font-bold text-[#2D1420]">Women Safety</p>
                          <p className="text-[11px] text-[#685361]">
                            {fac.conditions.lightingAndSecurity}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-[#FFE4EC]">
                        <span className="text-base">🚻</span>
                        <div>
                          <p className="font-bold text-[#2D1420]">Cubicle Types</p>
                          <p className="text-[11px] text-[#685361]">
                            {fac.conditions.cubicleType}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── ACTION BUTTONS ── */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <button
                      onClick={() => toggleReviews(fac.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FFF0F4] hover:bg-[#FFE1E8] text-[#E83D6F] rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 fill-[#E83D6F]" />
                      <span>
                        {reviewsOpen ? 'Hide' : 'Read'} Google Reviews ({fac.googleReviews?.length || 0})
                      </span>
                      {reviewsOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReportModalFac(fac)}
                        className="px-3.5 py-2 bg-white border border-[#FFD3DF] text-[#7C6A75] hover:text-[#E83D6F] hover:bg-[#FFF5F7] rounded-xl text-xs font-bold transition-all cursor-pointer"
                        title="Update condition / report empty pad machine"
                      >
                        Report Condition
                      </button>

                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E83D6F] hover:bg-[#D4265A] active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Get Directions</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* ── EXPANDABLE GOOGLE REVIEWS SECTION ── */}
                {reviewsOpen && (
                  <div className="bg-[#FAFAFB] border-t border-[#FFE4EC] p-5 sm:p-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs uppercase tracking-wider text-[#2D1420]">
                          Verified Google Visitor Reviews
                        </span>
                        <span className="text-[10px] font-extrabold bg-[#4285F4]/10 text-[#4285F4] px-2 py-0.5 rounded-full">
                          Google Maps Source
                        </span>
                      </div>
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-[#4285F4] hover:underline inline-flex items-center gap-1"
                      >
                        <span>View all on Google Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="space-y-3">
                      {fac.googleReviews?.map((rev) => (
                        <div
                          key={rev.id}
                          className="bg-white p-4 rounded-2xl border border-[#E9E4E6] shadow-xs space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF94B1] to-[#E83D6F] text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                                {rev.author.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-bold text-[#2D1420]">
                                    {rev.author}
                                  </h4>
                                  {rev.isLocalGuide && (
                                    <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md">
                                      {rev.guideLevel || 'Local Guide'}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-[#8E7582] pt-0.5">
                                  <div className="flex text-amber-400">
                                    {Array.from({ length: rev.rating }).map((_, i) => (
                                      <span key={i}>★</span>
                                    ))}
                                  </div>
                                  <span>•</span>
                                  <span>{rev.date}</span>
                                </div>
                              </div>
                            </div>

                            <span className="text-[10px] text-[#8E7582] flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3 text-[#B89DAA]" />
                              {rev.helpfulCount}
                            </span>
                          </div>

                          <p className="text-xs text-[#483742] leading-relaxed pl-10">
                            "{rev.text}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── REPORT CONDITION MODAL ── */}
      {reportModalFac && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#FFE4EC] shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#E83D6F] bg-[#FFE1E8] px-2.5 py-0.5 rounded-full uppercase">
                  Community Sanitation Check
                </span>
                <h3 className="text-base font-bold text-[#2D1420] mt-1">
                  Report Condition for {reportModalFac.name}
                </h3>
              </div>
              <button
                onClick={() => setReportModalFac(null)}
                className="w-8 h-8 rounded-full bg-[#FFF0F4] text-[#8E7582] hover:text-[#E83D6F] font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {reportSuccessMsg ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-[#2D1420]">{reportSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#2D1420] mb-1">
                    Pad Vending Machine Stock Status:
                  </label>
                  <select className="w-full p-2.5 rounded-xl border border-[#FFD3DF] outline-none">
                    <option>Fully Stocked & Working</option>
                    <option>Few Pads Left (Low Stock)</option>
                    <option>Out of Stock / Coin Jammed</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#2D1420] mb-1">
                    Cleanliness Condition Right Now:
                  </label>
                  <select className="w-full p-2.5 rounded-xl border border-[#FFD3DF] outline-none">
                    <option>Clean & Fresh (9 - 10 / 10)</option>
                    <option>Acceptable Hygiene (7 - 8 / 10)</option>
                    <option>Needs Urgent Cleaning / No Water</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#2D1420] mb-1">
                    Optional notes or feedback:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Guard was present, hot water available..."
                    className="w-full p-2.5 rounded-xl border border-[#FFD3DF] outline-none placeholder-[#B89DAA]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportModalFac(null)}
                    className="flex-1 py-2.5 rounded-xl border border-[#FFD3DF] font-bold text-[#7C6A75] hover:bg-[#FFF5F7] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#E83D6F] hover:bg-[#D4265A] text-white font-bold shadow-xs cursor-pointer"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
