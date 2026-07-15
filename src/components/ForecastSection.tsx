import React, { useState } from "react";
import { Clock, Calendar, Umbrella, Eye, SunDim } from "lucide-react";
import { HourlyWeather, DailyWeather } from "../types";
import { getWeatherIcon, formatKoreanDate, formatTime, getKoreanDayName } from "../utils/weatherUtils";

interface ForecastSectionProps {
  hourly: HourlyWeather[];
  daily: DailyWeather[];
}

export default function ForecastSection({ hourly, daily }: ForecastSectionProps) {
  const [activeTab, setActiveTab] = useState<"hourly" | "daily">("hourly");

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-slate-200/80 shadow-md flex flex-col h-full" id="forecast-section">
      {/* Tabs Switcher Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-extrabold text-slate-800 tracking-tight text-lg">상세 날씨 전망</h3>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/40">
          <button
            onClick={() => setActiveTab("hourly")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "hourly"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            시간별
          </button>
          <button
            onClick={() => setActiveTab("daily")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "daily"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            주간별
          </button>
        </div>
      </div>

      {/* Hourly Tab Panel */}
      {activeTab === "hourly" && (
        <div className="flex-1 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-slate-200" id="hourly-forecast">
          <div className="flex gap-4">
            {hourly.map((item, index) => {
              const HourlyIcon = getWeatherIcon(item.weather_code);
              const isNow = index === 0;

              return (
                <div
                  key={index}
                  className={`flex flex-col items-center min-w-[76px] p-3 rounded-2xl border transition-all ${
                    isNow
                      ? "bg-slate-800 text-white border-slate-800 shadow-md scale-105"
                      : "bg-slate-50/60 hover:bg-white border-slate-200/50 text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <span className="text-[10px] font-bold opacity-75">
                    {isNow ? "지금" : formatTime(item.time)}
                  </span>
                  <HourlyIcon className={`w-7 h-7 my-2.5 ${isNow ? "text-amber-400" : "text-sky-500"}`} />
                  <span className="text-sm font-extrabold">{Math.round(item.temp)}°</span>
                  
                  {/* Precipitation probability if any */}
                  {item.precipitation_prob > 0 && (
                    <span className="text-[10px] mt-1 text-sky-400 flex items-center gap-0.5 font-semibold">
                      <Umbrella className="w-2.5 h-2.5" />
                      {item.precipitation_prob}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily Tab Panel */}
      {activeTab === "daily" && (
        <div className="flex-1 space-y-3 overflow-y-auto" id="daily-forecast">
          {daily.map((item, index) => {
            const DailyIcon = getWeatherIcon(item.weather_code);
            const isToday = index === 0;

            return (
              <div
                key={index}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  isToday
                    ? "bg-sky-50/50 border-sky-100"
                    : "bg-slate-50/40 hover:bg-white border-slate-200/50"
                }`}
              >
                {/* Date column */}
                <div className="flex flex-col min-w-[100px]">
                  <span className="text-sm font-bold text-slate-800">
                    {isToday ? "오늘" : getKoreanDayName(item.date)}
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    {formatKoreanDate(item.date)}
                  </span>
                </div>

                {/* Weather description and Icon */}
                <div className="flex items-center gap-3 flex-1 px-4">
                  <DailyIcon className="w-6 h-6 text-sky-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-600 line-clamp-1">
                    {item.description}
                  </span>
                </div>

                {/* Min-Max temperature bar */}
                <div className="flex items-center gap-4">
                  {item.uv_index !== undefined && (
                    <div className="hidden sm:flex items-center gap-1 text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold border border-amber-100">
                      <SunDim className="w-3 h-3" />
                      UV {Math.round(item.uv_index)}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-right">
                    <span className="text-xs font-semibold text-slate-400">
                      {Math.round(item.temp_min)}°
                    </span>
                    <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden relative hidden xs:block">
                      <div className="absolute left-[30%] right-[20%] top-0 bottom-0 bg-slate-400 rounded-full" />
                    </div>
                    <span className="text-sm font-extrabold text-slate-800">
                      {Math.round(item.temp_max)}°
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
