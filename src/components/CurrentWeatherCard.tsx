import React from "react";
import { Wind, Droplets, Gauge, Sun, Compass } from "lucide-react";
import { CurrentWeather, DailyWeather } from "../types";
import { getWeatherStyle, getWeatherIcon, formatKoreanDate } from "../utils/weatherUtils";

interface CurrentWeatherCardProps {
  current: CurrentWeather;
  daily?: DailyWeather;
  cityName: string;
}

export default function CurrentWeatherCard({ current, daily, cityName }: CurrentWeatherCardProps) {
  const style = getWeatherStyle(current.weather_code, current.is_day);
  const IconComponent = getWeatherIcon(current.weather_code, current.is_day);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-6 md:p-8 transition-all duration-500 shadow-xl ${style.bgGradient} ${style.cardBg} ${style.textColor} ${style.glowColor}`}
      id="current-weather-card"
    >
      {/* Decorative ambient glow or graphic in background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

      {/* Main Top Header */}
      <div className="flex justify-between items-start relative z-10">
        <div>
          <span className="text-xs uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1 rounded-full font-bold">
            현재 날씨
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-3">{cityName}</h2>
          <p className="text-sm opacity-80 mt-1 font-medium">
            {formatKoreanDate(new Date().toISOString())}
          </p>
        </div>

        {/* Big Beautiful Weather Icon */}
        <div className="relative group">
          <div className={`absolute inset-0 bg-current opacity-0 group-hover:opacity-10 rounded-full blur-lg transition-opacity duration-300`} />
          <IconComponent className={`w-16 h-16 md:w-20 md:h-20 drop-shadow-md transform group-hover:scale-105 transition-transform duration-300 ${style.accentColor}`} />
        </div>
      </div>

      {/* Temperature Display */}
      <div className="mt-8 md:mt-10 flex items-baseline gap-2 relative z-10">
        <span className="text-6xl md:text-7xl font-black tracking-tighter leading-none">
          {Math.round(current.temp)}°
        </span>
        <div className="flex flex-col">
          <span className="text-base font-bold">C</span>
          <span className="text-xs opacity-75 font-semibold">체감 {Math.round(current.feels_like)}°</span>
        </div>
      </div>

      {/* Weather Description */}
      <div className="mt-2 text-lg md:text-xl font-bold flex items-center gap-2 relative z-10">
        <span className="px-2 py-0.5 rounded-lg bg-white/15 text-sm font-semibold">
          {style.name}
        </span>
        <span>{current.description}</span>
        {daily && (
          <span className="text-xs opacity-80 font-medium ml-2">
            최고 {Math.round(daily.temp_max)}° · 최저 {Math.round(daily.temp_min)}°
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-current opacity-15 my-6 relative z-10" />

      {/* Secondary Weather Stats Grid */}
      <div className="grid grid-cols-3 gap-4 relative z-10">
        <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5">
          <Droplets className="w-5 h-5 mb-1.5 opacity-80" />
          <span className="text-[10px] md:text-xs opacity-75 font-semibold">습도</span>
          <span className="text-sm md:text-base font-bold mt-0.5">{current.humidity}%</span>
        </div>

        <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5">
          <Wind className="w-5 h-5 mb-1.5 opacity-80" />
          <span className="text-[10px] md:text-xs opacity-75 font-semibold">풍속</span>
          <span className="text-sm md:text-base font-bold mt-0.5">{current.wind_speed} m/s</span>
        </div>

        <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5">
          <Gauge className="w-5 h-5 mb-1.5 opacity-80" />
          <span className="text-[10px] md:text-xs opacity-75 font-semibold">기압</span>
          <span className="text-sm md:text-base font-bold mt-0.5">{Math.round(current.pressure)} hPa</span>
        </div>
      </div>

      {/* Sunset & Sunrise (Optional metrics if present) */}
      {daily && (daily.sunrise || daily.sunset) && (
        <div className="mt-4 flex justify-between px-2 text-xs opacity-75 font-medium relative z-10">
          {daily.sunrise && (
            <span className="flex items-center gap-1">
              <Sun className="w-3.5 h-3.5" /> 일출 {daily.sunrise}
            </span>
          )}
          {daily.sunset && (
            <span className="flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" /> 일몰 {daily.sunset}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
