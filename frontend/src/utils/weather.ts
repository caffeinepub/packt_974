import { format, addDays } from "date-fns";

export interface WeatherDay {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitationProbability?: number;
  precipitationSum?: number;
  weatherCode: number;
  isHistorical?: boolean;
}

export interface TripWeather {
  days: WeatherDay[];
  hasHistoricalDays: boolean;
  dataAvailable: boolean;
}

interface OpenMeteoForecastResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    weather_code: number[];
  };
}

interface OpenMeteoHistoricalResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    weather_code: number[];
  };
}

function formatDateYMD(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export async function fetchWeatherForTrip(
  latitude: number,
  longitude: number,
  startDate: Date,
  endDate: Date,
): Promise<TripWeather> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxForecastDate = addDays(today, 14);

  if (startDate > maxForecastDate) {
    return fetchHistoricalWeather(
      latitude,
      longitude,
      startDate,
      endDate,
      true,
    );
  }

  if (endDate <= maxForecastDate) {
    return fetchForecastWeather(latitude, longitude, startDate, endDate);
  }

  const forecastResult = await fetchForecastWeather(
    latitude,
    longitude,
    startDate,
    maxForecastDate,
  );
  const historicalStartDate = addDays(maxForecastDate, 1);
  const historicalResult = await fetchHistoricalWeather(
    latitude,
    longitude,
    historicalStartDate,
    endDate,
    true,
  );

  const combinedDays = [...forecastResult.days, ...historicalResult.days];

  return {
    days: combinedDays,
    hasHistoricalDays: historicalResult.days.length > 0,
    dataAvailable: combinedDays.length > 0,
  };
}

async function fetchForecastWeather(
  latitude: number,
  longitude: number,
  startDate: Date,
  endDate: Date,
): Promise<TripWeather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto&start_date=${formatDateYMD(startDate)}&end_date=${formatDateYMD(endDate)}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data: OpenMeteoForecastResponse = await response.json();

    if (!data.daily || !data.daily.time || data.daily.time.length === 0) {
      return {
        days: [],
        hasHistoricalDays: false,
        dataAvailable: false,
      };
    }

    const days: WeatherDay[] = data.daily.time.map((date, i) => ({
      date,
      tempMax: data.daily.temperature_2m_max[i],
      tempMin: data.daily.temperature_2m_min[i],
      precipitationProbability: data.daily.precipitation_probability_max[i],
      weatherCode: data.daily.weather_code[i],
      isHistorical: false,
    }));

    return {
      days,
      hasHistoricalDays: false,
      dataAvailable: days.length > 0,
    };
  } catch {
    return {
      days: [],
      hasHistoricalDays: false,
      dataAvailable: false,
    };
  }
}

async function fetchHistoricalWeather(
  latitude: number,
  longitude: number,
  startDate: Date,
  endDate: Date,
  markAsHistorical: boolean = true,
): Promise<TripWeather> {
  const lastYearStart = new Date(startDate);
  lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);

  const lastYearEnd = new Date(endDate);
  lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1);

  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${formatDateYMD(lastYearStart)}&end_date=${formatDateYMD(lastYearEnd)}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=auto`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data: OpenMeteoHistoricalResponse = await response.json();

    if (!data.daily || !data.daily.time || data.daily.time.length === 0) {
      return {
        days: [],
        hasHistoricalDays: markAsHistorical,
        dataAvailable: false,
      };
    }

    const days: WeatherDay[] = data.daily.time.map((_, i) => {
      const tripDate = addDays(startDate, i);
      return {
        date: formatDateYMD(tripDate),
        tempMax: data.daily.temperature_2m_max[i],
        tempMin: data.daily.temperature_2m_min[i],
        precipitationSum: data.daily.precipitation_sum[i],
        weatherCode: data.daily.weather_code[i],
        isHistorical: markAsHistorical,
      };
    });

    return {
      days,
      hasHistoricalDays: markAsHistorical,
      dataAvailable: days.length > 0,
    };
  } catch {
    return {
      days: [],
      hasHistoricalDays: markAsHistorical,
      dataAvailable: false,
    };
  }
}

export function getWeatherIcon(code: number): string {
  if (code === 0) return "☀️";
  if (code === 1) return "🌤️";
  if (code === 2) return "⛅";
  if (code === 3) return "☁️";
  if (code >= 45 && code <= 48) return "🌫️";
  if (code >= 51 && code <= 55) return "🌧️";
  if (code >= 56 && code <= 57) return "🌧️";
  if (code >= 61 && code <= 65) return "🌧️";
  if (code >= 66 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 77) return "❄️";
  if (code >= 80 && code <= 82) return "🌦️";
  if (code >= 85 && code <= 86) return "🌨️";
  if (code >= 95 && code <= 99) return "⛈️";
  return "🌤️";
}

export function getWeatherDescription(code: number): string {
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code >= 45 && code <= 48) return "Foggy";
  if (code >= 51 && code <= 55) return "Drizzle";
  if (code >= 56 && code <= 57) return "Freezing drizzle";
  if (code >= 61 && code <= 65) return "Rain";
  if (code >= 66 && code <= 67) return "Freezing rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 85 && code <= 86) return "Snow showers";
  if (code >= 95 && code <= 99) return "Thunderstorm";
  return "Partly cloudy";
}

export function getTemperatureCategory(
  avgTemp: number,
): "hot" | "warm" | "mild" | "cold" {
  if (avgTemp >= 30) return "hot";
  if (avgTemp >= 20) return "warm";
  if (avgTemp >= 10) return "mild";
  return "cold";
}

export function isRainyDay(day: WeatherDay): boolean {
  if (day.precipitationProbability !== undefined) {
    return day.precipitationProbability >= 30;
  }
  if (day.precipitationSum !== undefined) {
    return day.precipitationSum > 1;
  }
  const code = day.weatherCode;
  return (code >= 51 && code <= 67) || (code >= 80 && code <= 99);
}

export interface DerivedWeatherCondition {
  condition: "Hot" | "Warm" | "Mild" | "Cold";
  isRainy: boolean;
  avgTemp: number;
  rainyDays: number;
  totalDays: number;
}

export function deriveWeatherCondition(
  weather: TripWeather,
): DerivedWeatherCondition | null {
  if (!weather.dataAvailable || weather.days.length === 0) {
    return null;
  }

  const avgTemp =
    weather.days.reduce((sum, day) => {
      return sum + (day.tempMax + day.tempMin) / 2;
    }, 0) / weather.days.length;

  const rainyDays = weather.days.filter(isRainyDay).length;

  const category = getTemperatureCategory(avgTemp);
  const condition = (category.charAt(0).toUpperCase() + category.slice(1)) as
    | "Hot"
    | "Warm"
    | "Mild"
    | "Cold";

  const isRainy = rainyDays / weather.days.length >= 0.3;

  return {
    condition,
    isRainy,
    avgTemp: Math.round(avgTemp),
    rainyDays,
    totalDays: weather.days.length,
  };
}

// Cache conversion types (matching backend Candid types)
export interface CachedWeatherDay {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitationProbability?: number;
  precipitationSum?: number;
  weatherCode: bigint;
  isHistorical: boolean;
}

export interface CachedTripWeather {
  tripId: bigint;
  days: CachedWeatherDay[];
  hasHistoricalDays: boolean;
  cachedAt: bigint;
}

// Convert backend cached weather to frontend TripWeather format
export function cachedToTripWeather(cached: CachedTripWeather): TripWeather {
  return {
    days: cached.days.map(
      (d): WeatherDay => ({
        date: d.date,
        tempMax: d.tempMax,
        tempMin: d.tempMin,
        precipitationProbability: d.precipitationProbability,
        precipitationSum: d.precipitationSum,
        weatherCode: Number(d.weatherCode),
        isHistorical: d.isHistorical,
      }),
    ),
    hasHistoricalDays: cached.hasHistoricalDays,
    dataAvailable: cached.days.length > 0,
  };
}

// Convert frontend TripWeather to backend cache format
export function tripWeatherToCached(weather: TripWeather): {
  days: CachedWeatherDay[];
  hasHistoricalDays: boolean;
} {
  return {
    days: weather.days.map(
      (d): CachedWeatherDay => ({
        date: d.date,
        tempMax: d.tempMax,
        tempMin: d.tempMin,
        precipitationProbability: d.precipitationProbability,
        precipitationSum: d.precipitationSum,
        weatherCode: BigInt(d.weatherCode),
        isHistorical: d.isHistorical ?? false,
      }),
    ),
    hasHistoricalDays: weather.hasHistoricalDays,
  };
}
