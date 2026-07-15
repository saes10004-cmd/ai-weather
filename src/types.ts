export interface CurrentWeather {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  pressure: number;
  weather_code: number;
  description: string;
  is_day: number;
  icon?: string;
}

export interface HourlyWeather {
  time: string;
  temp: number;
  weather_code: number;
  description: string;
  precipitation_prob: number;
}

export interface DailyWeather {
  date: string;
  temp_max: number;
  temp_min: number;
  weather_code: number;
  description: string;
  uv_index?: number;
  sunrise?: string;
  sunset?: string;
}

export interface WeatherData {
  source: string;
  current: CurrentWeather;
  forecast: HourlyWeather[];
  daily: DailyWeather[];
}

export interface GeocodeResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  feature_code?: string;
  country_code?: string;
  admin1?: string;
  country?: string;
}

export interface AdviceData {
  summary: string;
  outfit: string;
  activities: string;
  precaution: string;
}

export interface SavedCity {
  name: string;
  lat: number;
  lon: number;
  country?: string;
}
