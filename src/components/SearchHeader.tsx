import React, { useState, useEffect, useRef } from "react";
import { Search, Star, Key, Settings, X, Check, MapPin, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GeocodeResult, SavedCity } from "../types";

interface SearchHeaderProps {
  onLocationSelect: (lat: number, lon: number, cityName: string) => void;
  activeCityName: string;
  owmApiKey: string;
  onApiKeyChange: (key: string) => void;
}

const PRELOADED_CITIES: SavedCity[] = [
  { name: "서울", lat: 37.5665, lon: 126.978, country: "대한민국" },
  { name: "도쿄", lat: 35.6895, lon: 139.6917, country: "일본" },
  { name: "뉴욕", lat: 40.7128, lon: -74.0059, country: "미국" },
  { name: "런던", lat: 51.5074, lon: -0.1278, country: "영국" },
  { name: "시드니", lat: -33.8688, lon: 151.2093, country: "호주" },
];

export default function SearchHeader({
  onLocationSelect,
  activeCityName,
  owmApiKey,
  onApiKeyChange,
}: SearchHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [savedCities, setSavedCities] = useState<SavedCity[]>(PRELOADED_CITIES);
  const [showSettings, setShowSettings] = useState(false);
  const [inputKey, setInputKey] = useState(owmApiKey);
  const [isKeySaved, setIsKeySaved] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load saved cities from localStorage
  useEffect(() => {
    const cached = localStorage.getItem("aura_weather_saved_cities");
    if (cached) {
      try {
        setSavedCities(JSON.parse(cached));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save key status
  useEffect(() => {
    setInputKey(owmApiKey);
  }, [owmApiKey]);

  // Click outside to close geocomplete dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search geocoding
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/geocode?name=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.results || []);
        }
      } catch (err) {
        console.error("Geocoding fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleCitySelect = (lat: number, lon: number, name: string, country?: string) => {
    onLocationSelect(lat, lon, name);
    setSearchQuery("");
    setSearchResults([]);
    setIsFocused(false);

    // Save search to list if not already present
    const cityExists = savedCities.some(
      (c) => Math.abs(c.lat - lat) < 0.05 && Math.abs(c.lon - lon) < 0.05
    );
    if (!cityExists) {
      const updated = [{ name, lat, lon, country }, ...savedCities.slice(0, 7)];
      setSavedCities(updated);
      localStorage.setItem("aura_weather_saved_cities", JSON.stringify(updated));
    }
  };

  const removeCity = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const updated = savedCities.filter((_, i) => i !== index);
    setSavedCities(updated);
    localStorage.setItem("aura_weather_saved_cities", JSON.stringify(updated));
  };

  const handleSaveKey = () => {
    onApiKeyChange(inputKey);
    setIsKeySaved(true);
    setTimeout(() => setIsKeySaved(false), 2000);
  };

  return (
    <div className="w-full space-y-4 mb-6 z-30 relative" id="search-header-container">
      {/* Top Bar with Title and Settings Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-amber-500 animate-pulse" />
            AI 날씨 예보
          </h1>
          <p className="text-sm text-slate-500">실시간 날씨 검색 및 맞춤형 AI 조언 서비스</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Key/Config Status indicator */}
          <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200/80 font-medium flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            {owmApiKey ? "OpenWeatherMap 연동 중" : "무료 Open-Meteo 작동 중"}
          </span>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2.5 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-slate-200/60 text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
            title="설정 (API 키 관리)"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Panel (Collapsible) */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-slate-200/80 shadow-md space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-500" />
                  <h3 className="font-semibold text-slate-800 text-sm sm:text-base">OpenWeatherMap API 설정 (선택사항)</h3>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                OpenWeatherMap API 키를 입력하시면 더 정교한 현지 어구 검색과 실시간 오염 정보를 받아볼 수 있습니다. 
                비워두시면 가입 없이 완전히 무료로 제공되는 <strong>Open-Meteo 기상망</strong>으로 자동 기동됩니다.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="API Key (e.g. 8f72aefd...)"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50/50"
                />
                <button
                  onClick={handleSaveKey}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isKeySaved ? <Check className="w-4 h-4 text-emerald-400" /> : <Key className="w-4 h-4" />}
                  {isKeySaved ? "저장됨" : "적용하기"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Search and Autocomplete Field */}
      <div className="relative w-full" ref={dropdownRef}>
        <div className="flex items-center bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm px-4 py-3 gap-2.5 transition-all focus-within:ring-2 focus-within:ring-slate-800 focus-within:border-transparent">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="도시 이름을 검색하세요 (예: 서울, 제주, New York, Tokyo)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            className="flex-1 bg-transparent text-slate-800 text-sm focus:outline-none placeholder-slate-400 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown List */}
        <AnimatePresence>
          {isFocused && (searchResults.length > 0 || isLoading) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute left-0 right-0 mt-1.5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto"
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                  <span className="text-sm font-medium">위치 탐색 중...</span>
                </div>
              ) : (
                searchResults.map((city) => (
                  <button
                    key={city.id}
                    onClick={() =>
                      handleCitySelect(
                        city.latitude,
                        city.longitude,
                        city.name,
                        city.country || city.admin1
                      )
                    }
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4.5 h-4.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{city.name}</div>
                        <div className="text-xs text-slate-500">
                          {city.admin1 ? `${city.admin1}, ` : ""}
                          {city.country || ""}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md font-mono">
                      {city.latitude.toFixed(2)}, {city.longitude.toFixed(2)}
                    </span>
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bookmarked / Saved Cities Bar */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none" id="saved-cities-container">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0">
          <Star className="w-3.5 h-3.5 fill-slate-300 stroke-slate-400" />
          즐겨찾기:
        </span>
        <div className="flex gap-2">
          {savedCities.map((city, index) => {
            const isActive = activeCityName === city.name;
            return (
              <button
                key={`${city.lat}-${city.lon}`}
                onClick={() => onLocationSelect(city.lat, city.lon, city.name)}
                className={`group px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-slate-800 border-slate-800 text-white shadow-sm"
                    : "bg-white/60 hover:bg-white border-slate-200/80 text-slate-600 hover:text-slate-800 shadow-sm"
                }`}
              >
                <span>{city.name}</span>
                {/* Prevent deleting preloaded values to maintain healthy list or allow custom deletes */}
                <span
                  onClick={(e) => removeCity(e, index)}
                  className={`opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-slate-200/50 hover:text-rose-500 transition-all ${
                    isActive ? "hover:text-white hover:bg-slate-700 text-slate-300" : "text-slate-400"
                  }`}
                  title="삭제"
                >
                  <X className="w-3 h-3" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
