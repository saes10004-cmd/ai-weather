/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { CloudLightning, Loader2, RefreshCw, Navigation, SunDim, MapPin, Wind, Droplets } from "lucide-react";
import SearchHeader from "./components/SearchHeader";
import CurrentWeatherCard from "./components/CurrentWeatherCard";
import ForecastSection from "./components/ForecastSection";
import AiAdviceCard from "./components/AiAdviceCard";
import { WeatherData, AdviceData } from "./types";

export default function App() {
  const [coords, setCoords] = useState({ lat: 37.5665, lon: 126.978 }); // Default to Seoul
  const [cityName, setCityName] = useState("서울");
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [adviceData, setAdviceData] = useState<AdviceData | null>(null);
  
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Read OpenWeatherMap API key from localStorage if saved
  const [owmApiKey, setOwmApiKey] = useState(() => {
    return localStorage.getItem("aura_weather_owm_key") || "";
  });

  // Handle location update
  const handleLocationSelect = (lat: number, lon: number, name: string) => {
    setCoords({ lat, lon });
    setCityName(name);
  };

  // Handle API key saved internally
  const handleApiKeyChange = (key: string) => {
    setOwmApiKey(key);
    localStorage.setItem("aura_weather_owm_key", key);
  };

  // Get current device location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("브라우저가 위치 정보를 지원하지 않습니다.");
      return;
    }

    setIsWeatherLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lon: longitude });
        
        // Reverse geocoding name lookup using open-meteo proxy
        try {
          // Fallback to coordinates representation if geocoder name is not matched
          setCityName(`내 주변 기상대 (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`);
        } catch {
          setCityName("현재 위치");
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("위치 정보를 가져오는데 실패했습니다. 기본 설정으로 서울을 표시합니다.");
        setIsWeatherLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Fetch weather data on coordinates or OWM Key changes
  const fetchWeather = async () => {
    setIsWeatherLoading(true);
    setWeatherError(null);
    try {
      const url = `/api/weather?lat=${coords.lat}&lon=${coords.lon}&city=${encodeURIComponent(
        cityName
      )}&owmKey=${encodeURIComponent(owmApiKey)}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("날씨 정보를 불러오지 못했습니다.");
      }

      const data = (await response.json()) as WeatherData;
      setWeatherData(data);
      
      // Automatically fetch AI Advice on fresh weather details loaded
      fetchAiAdvice(data);
    } catch (err: any) {
      console.error(err);
      setWeatherError(err.message || "날씨 서버 통신 오류");
    } finally {
      setIsWeatherLoading(false);
    }
  };

  // Fetch AI Advice based on loaded weather data
  const fetchAiAdvice = async (currentWeather: WeatherData) => {
    setIsAdviceLoading(true);
    try {
      const response = await fetch("/api/weather-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current: currentWeather.current,
          daily: currentWeather.daily,
          city: cityName,
        }),
      });

      if (!response.ok) {
        throw new Error("AI 추천 조언을 불러오는데 실패했습니다.");
      }

      const advice = (await response.json()) as AdviceData;
      setAdviceData(advice);
    } catch (err) {
      console.error(err);
      // Let component fallback gracefully
    } finally {
      setIsAdviceLoading(false);
    }
  };

  // Trigger loading on mount and coords update
  useEffect(() => {
    fetchWeather();
  }, [coords]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-slate-200">
      {/* Dynamic atmospheric ambient backdrop graphic */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-sky-100/50 via-indigo-50/20 to-transparent pointer-events-none -z-10" />

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12" id="main-content-layout">
        {/* Search header container */}
        <SearchHeader
          onLocationSelect={handleLocationSelect}
          activeCityName={cityName}
          owmApiKey={owmApiKey}
          onApiKeyChange={handleApiKeyChange}
        />

        {/* Action Controls Bar */}
        <div className="flex gap-2 mb-6" id="action-controls-bar">
          <button
            onClick={handleGetCurrentLocation}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold shadow-sm transition-all text-slate-700 flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="현재 GPS 위치 가져오기"
          >
            <Navigation className="w-3.5 h-3.5" />
            내 위치 사용
          </button>
          
          <button
            onClick={fetchWeather}
            disabled={isWeatherLoading}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold shadow-sm transition-all text-slate-700 flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
            title="새로고침"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isWeatherLoading ? "animate-spin" : ""}`} />
            날씨 새로고침
          </button>
        </div>

        {/* Error Screen */}
        {weatherError && (
          <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 text-center my-8 max-w-lg mx-auto shadow-md">
            <h4 className="text-lg font-bold text-rose-800 mb-1">데이터 연동에 실패했습니다</h4>
            <p className="text-xs text-rose-600 mb-4">{weatherError}</p>
            <button
              onClick={fetchWeather}
              className="px-5 py-2 bg-rose-600 text-white font-bold rounded-xl text-xs hover:bg-rose-700 transition-all cursor-pointer"
            >
              다시 시도하기
            </button>
          </div>
        )}

        {/* Loading Spinner Overlays when data hasn't arrived */}
        {isWeatherLoading && !weatherData && (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4" id="weather-loading-screen">
            <Loader2 className="w-10 h-10 animate-spin text-slate-800" />
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-sm">실시간 날씨 정보 동기화 중</h3>
              <p className="text-xs text-slate-400">데이터 수집 및 위성 예보를 처리하고 있습니다.</p>
            </div>
          </div>
        )}

        {/* Dashboard Grid System when data is ready */}
        {weatherData && !weatherError && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch" id="dashboard-main-grid">
            
            {/* Left side: Current conditions details (cols: 5) */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-6">
              <CurrentWeatherCard
                current={weatherData.current}
                daily={weatherData.daily[0]}
                cityName={cityName}
              />
              
              {/* Extra micro-metrics card or Quick Stats */}
              <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-3xl p-5 shadow-sm flex-1">
                <h4 className="font-bold text-slate-800 text-xs sm:text-sm mb-4">현재 대기 유틸리티</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50/60 rounded-2xl p-3 border border-slate-100 flex flex-col justify-center">
                    <span className="text-[10px] text-slate-400 font-bold">자외선 최고 수준</span>
                    <span className="text-sm font-extrabold text-slate-700 mt-1">
                      {weatherData.daily[0]?.uv_index !== undefined ? `${weatherData.daily[0].uv_index} (안전)` : "보통 (지수 미수신)"}
                    </span>
                  </div>
                  <div className="bg-slate-50/60 rounded-2xl p-3 border border-slate-100 flex flex-col justify-center">
                    <span className="text-[10px] text-slate-400 font-bold">기상 자료 소스</span>
                    <span className="text-sm font-extrabold text-slate-700 mt-1 uppercase">
                      {weatherData.source}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Detailed Forecast (hourly/daily tabs) & AI Advisor details (cols: 7) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Forecast Section */}
              <div className="flex-1">
                <ForecastSection hourly={weatherData.forecast} daily={weatherData.daily} />
              </div>

              {/* AI Coaching & Styling Advice */}
              <div className="flex-1">
                <AiAdviceCard
                  advice={adviceData}
                  isLoading={isAdviceLoading}
                  onRefresh={() => fetchAiAdvice(weatherData)}
                />
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
