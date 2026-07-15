import React from "react";
import {
  Sun,
  Moon,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  Snowflake,
  CloudLightning,
  LucideIcon,
} from "lucide-react";

export interface WeatherStyle {
  id: string;
  name: string;
  bgGradient: string;
  cardBg: string;
  textColor: string;
  accentColor: string;
  glowColor: string;
}

export function getWeatherStyle(code: number, is_day: number = 1): WeatherStyle {
  // If we are dealing with OpenWeatherMap codes (e.g. 2xx, 3xx, 5xx, 6xx, 7xx, 8xx)
  if (code > 100) {
    if (code >= 200 && code < 300) {
      // Thunderstorm
      return {
        id: "storm",
        name: "뇌우",
        bgGradient: "from-slate-900 via-gray-800 to-indigo-950",
        cardBg: "bg-slate-900/40 border-indigo-500/20",
        textColor: "text-slate-100",
        accentColor: "text-amber-400",
        glowColor: "shadow-amber-500/10",
      };
    }
    if (code >= 300 && code < 600) {
      // Drizzle & Rain
      return {
        id: "rain",
        name: "비",
        bgGradient: "from-blue-950 via-slate-900 to-slate-800",
        cardBg: "bg-slate-900/30 border-blue-500/20",
        textColor: "text-blue-100",
        accentColor: "text-blue-400",
        glowColor: "shadow-blue-500/10",
      };
    }
    if (code >= 600 && code < 700) {
      // Snow
      return {
        id: "snow",
        name: "눈",
        bgGradient: "from-sky-900 via-slate-800 to-blue-950",
        cardBg: "bg-slate-800/30 border-sky-300/20",
        textColor: "text-sky-100",
        accentColor: "text-sky-300",
        glowColor: "shadow-sky-300/10",
      };
    }
    if (code >= 700 && code < 800) {
      // Atmosphere (Fog, etc)
      return {
        id: "fog",
        name: "안개",
        bgGradient: "from-zinc-800 via-slate-800 to-zinc-900",
        cardBg: "bg-zinc-900/40 border-zinc-500/20",
        textColor: "text-zinc-100",
        accentColor: "text-zinc-400",
        glowColor: "shadow-zinc-500/10",
      };
    }
    if (code === 800) {
      // Clear
      if (is_day === 0) {
        return {
          id: "night",
          name: "맑은 밤",
          bgGradient: "from-slate-950 via-indigo-950 to-slate-900",
          cardBg: "bg-slate-900/40 border-indigo-400/10",
          textColor: "text-indigo-100",
          accentColor: "text-violet-400",
          glowColor: "shadow-violet-500/15",
        };
      }
      return {
        id: "sunny",
        name: "맑음",
        bgGradient: "from-amber-500/10 via-orange-100 to-sky-100", // Soft, stylish daytime light gradient
        cardBg: "bg-white/70 border-amber-500/10",
        textColor: "text-slate-800",
        accentColor: "text-amber-500",
        glowColor: "shadow-amber-500/10",
      };
    }
    // Cloudy (801 - 804)
    return {
      id: "cloudy",
      name: "구름 많음",
      bgGradient: is_day ? "from-sky-100 via-slate-100 to-zinc-200" : "from-slate-950 via-slate-900 to-slate-850",
      cardBg: is_day ? "bg-white/60 border-slate-200/50" : "bg-slate-900/40 border-slate-700/30",
      textColor: is_day ? "text-slate-800" : "text-slate-100",
      accentColor: "text-sky-500",
      glowColor: "shadow-sky-500/5",
    };
  }

  // WMO Codes (Open-Meteo)
  switch (code) {
    case 0: // Clear sky
      if (is_day === 0) {
        return {
          id: "night",
          name: "맑은 밤",
          bgGradient: "from-slate-950 via-indigo-950 to-slate-900",
          cardBg: "bg-slate-900/40 border-indigo-400/15",
          textColor: "text-indigo-100",
          accentColor: "text-violet-400",
          glowColor: "shadow-violet-500/15",
        };
      }
      return {
        id: "sunny",
        name: "맑음",
        bgGradient: "from-amber-200/30 via-orange-50/20 to-sky-100/50",
        cardBg: "bg-white/70 border-amber-500/15",
        textColor: "text-slate-800",
        accentColor: "text-amber-500",
        glowColor: "shadow-amber-500/10",
      };

    case 1: // Mainly clear
    case 2: // Partly cloudy
      if (is_day === 0) {
        return {
          id: "night-cloudy",
          name: "구름 조금",
          bgGradient: "from-slate-950 via-slate-900 to-slate-900",
          cardBg: "bg-slate-900/40 border-indigo-400/10",
          textColor: "text-indigo-100",
          accentColor: "text-indigo-300",
          glowColor: "shadow-indigo-500/5",
        };
      }
      return {
        id: "cloudy-light",
        name: "대체로 맑음",
        bgGradient: "from-sky-100/70 via-slate-50 to-indigo-100/40",
        cardBg: "bg-white/70 border-slate-200/50",
        textColor: "text-slate-800",
        accentColor: "text-sky-400",
        glowColor: "shadow-sky-500/5",
      };

    case 3: // Overcast
      return {
        id: "overcast",
        name: "흐림",
        bgGradient: is_day
          ? "from-slate-200 via-zinc-100 to-slate-300"
          : "from-slate-950 via-slate-900 to-zinc-900",
        cardBg: is_day ? "bg-white/60 border-slate-300/40" : "bg-slate-900/50 border-slate-700/30",
        textColor: is_day ? "text-slate-800" : "text-slate-200",
        accentColor: "text-slate-400",
        glowColor: "shadow-slate-500/5",
      };

    case 45: // Fog
    case 48: // Depositing rime fog
      return {
        id: "fog",
        name: "안개",
        bgGradient: is_day
          ? "from-zinc-200 via-slate-200 to-zinc-300"
          : "from-zinc-950 via-zinc-900 to-slate-900",
        cardBg: is_day ? "bg-white/60 border-zinc-300/40" : "bg-zinc-900/50 border-zinc-800/30",
        textColor: is_day ? "text-slate-800" : "text-zinc-200",
        accentColor: "text-zinc-400",
        glowColor: "shadow-zinc-500/5",
      };

    case 51: // Light drizzle
    case 53: // Moderate drizzle
    case 55: // Dense drizzle
    case 56: // Light freezing drizzle
    case 57: // Dense freezing drizzle
    case 61: // Slight rain
    case 63: // Moderate rain
    case 65: // Heavy rain
    case 66: // Light freezing rain
    case 67: // Heavy freezing rain
    case 80: // Slight rain showers
    case 81: // Moderate rain showers
    case 82: // Violent rain showers
      return {
        id: "rain",
        name: "비",
        bgGradient: is_day
          ? "from-blue-100 via-slate-100 to-blue-200"
          : "from-blue-950 via-slate-900 to-slate-900",
        cardBg: is_day ? "bg-white/60 border-blue-200/50" : "bg-slate-900/40 border-blue-500/20",
        textColor: is_day ? "text-slate-800" : "text-blue-100",
        accentColor: "text-blue-500",
        glowColor: "shadow-blue-500/10",
      };

    case 71: // Slight snowfall
    case 73: // Moderate snowfall
    case 75: // Heavy snowfall
    case 77: // Snow grains
    case 85: // Slight snow showers
    case 86: // Heavy snow showers
      return {
        id: "snow",
        name: "눈",
        bgGradient: is_day
          ? "from-sky-100 via-white to-blue-100"
          : "from-slate-900 via-sky-950 to-slate-900",
        cardBg: is_day ? "bg-white/70 border-sky-200/50" : "bg-slate-900/40 border-sky-400/20",
        textColor: is_day ? "text-slate-800" : "text-sky-100",
        accentColor: "text-sky-400",
        glowColor: "shadow-sky-400/10",
      };

    case 95: // Thunderstorm
    case 96: // Thunderstorm with slight hail
    case 99: // Thunderstorm with heavy hail
      return {
        id: "storm",
        name: "뇌우",
        bgGradient: "from-slate-900 via-purple-950 to-indigo-950",
        cardBg: "bg-slate-950/40 border-violet-500/20",
        textColor: "text-slate-100",
        accentColor: "text-amber-400",
        glowColor: "shadow-amber-500/15",
      };

    default:
      return {
        id: "sunny",
        name: "맑음",
        bgGradient: "from-sky-100 via-slate-100 to-sky-200",
        cardBg: "bg-white/60 border-slate-200/50",
        textColor: "text-slate-800",
        accentColor: "text-amber-500",
        glowColor: "shadow-amber-500/5",
      };
  }
}

export function getWeatherIcon(code: number, is_day: number = 1): LucideIcon {
  // OWM codes mapping fallback
  if (code > 100) {
    if (code >= 200 && code < 300) return CloudLightning;
    if (code >= 300 && code < 400) return CloudDrizzle;
    if (code >= 500 && code < 600) return CloudRain;
    if (code >= 600 && code < 700) return Snowflake;
    if (code >= 700 && code < 800) return CloudFog;
    if (code === 800) return is_day ? Sun : Moon;
    return CloudSun;
  }

  // WMO Codes
  switch (code) {
    case 0:
      return is_day ? Sun : Moon;
    case 1:
    case 2:
      return CloudSun;
    case 3:
      return Cloud;
    case 45:
    case 48:
      return CloudFog;
    case 51:
    case 53:
    case 55:
      return CloudDrizzle;
    case 56:
    case 57:
    case 66:
    case 67:
      return Snowflake; // Freezing rain/drizzle is snowy
    case 61:
    case 63:
    case 65:
    case 80:
    case 81:
    case 82:
      return CloudRain;
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return Snowflake;
    case 95:
    case 96:
    case 99:
      return CloudLightning;
    default:
      return Sun;
  }
}

export function getKoreanDayName(dateStr: string): string {
  try {
    const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    const date = new Date(dateStr);
    return days[date.getDay()];
  } catch {
    return "요일";
  }
}

export function formatKoreanDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const dayOfWeek = days[date.getDay()];
    return `${month}월 ${day}일 (${dayOfWeek})`;
  } catch {
    return dateStr;
  }
}

export function formatTime(timeStr: string): string {
  try {
    // Time can be full ISO string "2026-07-14T08:00" or OpenWeatherMap "12:00:00"
    if (timeStr.includes("T")) {
      const timePart = timeStr.split("T")[1];
      return timePart.substring(0, 5);
    }
    if (timeStr.includes(" ")) {
      const timePart = timeStr.split(" ")[1];
      return timePart.substring(0, 5);
    }
    return timeStr.substring(0, 5);
  } catch {
    return timeStr;
  }
}
