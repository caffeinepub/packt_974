import { format, isSameMonth, isSameYear } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Calendar,
  Droplets,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudSun,
  CloudFog,
  CloudLightning,
  type LucideIcon,
} from "lucide-react";
import { type Trip } from "@/backend";
import { timestampToDate } from "../utils/dates";
import { CardMenu } from "./CardMenu";
import { useTripWeather } from "../hooks/useQueries";
import {
  getWeatherIcon,
  isRainyDay,
  getTemperatureCategory,
} from "../utils/weather";

interface TripCardProps {
  trip: Trip;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function formatDateRange(startDate: bigint, endDate: bigint): string {
  const start = timestampToDate(startDate);
  const end = timestampToDate(endDate);

  if (isSameMonth(start, end) && isSameYear(start, end)) {
    return `${format(start, "MMM d")} - ${format(end, "d, yyyy")}`;
  }

  return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
}

function getWeatherLucideIcon(code: number): LucideIcon {
  if (code === 0) return Sun;
  if (code === 1 || code === 2) return CloudSun;
  if (code === 3) return Cloud;
  if (code >= 45 && code <= 48) return CloudFog;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82))
    return CloudRain;
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86))
    return CloudSnow;
  if (code >= 95 && code <= 99) return CloudLightning;
  return CloudSun;
}

function getWeatherIconColor(
  category: "hot" | "warm" | "mild" | "cold",
  isRainy: boolean,
): string {
  if (isRainy) return "text-blue-200";
  switch (category) {
    case "hot":
      return "text-orange-200";
    case "warm":
      return "text-amber-200";
    case "mild":
      return "text-emerald-200";
    case "cold":
      return "text-sky-200";
    default:
      return "text-muted-foreground/20";
  }
}

export function TripCard({ trip, onClick, onEdit, onDelete }: TripCardProps) {
  const { data: weather, isLoading: weatherLoading } = useTripWeather(
    trip.id,
    trip.latitude,
    trip.longitude,
    trip.startDate,
    trip.endDate,
  );

  // Calculate weather summary
  let weatherEmoji = "";
  let tempRange = "";
  let rainyDays = 0;
  let totalDays = 0;
  let iconColor = "";
  let WeatherBgIcon: LucideIcon | null = null;

  if (weather?.dataAvailable && weather.days.length > 0) {
    const tempMaxes = weather.days.map((d) => d.tempMax);
    const tempMins = weather.days.map((d) => d.tempMin);
    const overallMax = Math.round(Math.max(...tempMaxes));
    const overallMin = Math.round(Math.min(...tempMins));
    const avgTemp =
      weather.days.reduce((sum, d) => sum + (d.tempMax + d.tempMin) / 2, 0) /
      weather.days.length;

    // Find most common weather code
    const weatherCounts = new Map<number, number>();
    for (const day of weather.days) {
      weatherCounts.set(
        day.weatherCode,
        (weatherCounts.get(day.weatherCode) || 0) + 1,
      );
    }
    let mostCommonCode = 0;
    let maxCount = 0;
    for (const [code, count] of weatherCounts) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonCode = code;
      }
    }

    weatherEmoji = getWeatherIcon(mostCommonCode);
    WeatherBgIcon = getWeatherLucideIcon(mostCommonCode);
    tempRange = `${overallMin}° - ${overallMax}°`;
    rainyDays = weather.days.filter(isRainyDay).length;
    totalDays = weather.days.length;

    const category = getTemperatureCategory(avgTemp);
    const isRainyTrip = rainyDays / totalDays >= 0.3;
    iconColor = getWeatherIconColor(category, isRainyTrip);
  }

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden relative"
      onClick={onClick}
    >
      {/* Background Weather Icon */}
      {WeatherBgIcon && (
        <div className="absolute -right-4 -bottom-1 pointer-events-none">
          <WeatherBgIcon className={`h-32 w-32 ${iconColor}`} strokeWidth={1} />
        </div>
      )}

      <CardHeader className="pb-2 relative z-10">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle className="text-md">{trip.destination}</CardTitle>
          </div>
          <CardMenu onEdit={onEdit} onDelete={onDelete} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
          </div>

          {/* Weather Summary */}
          {weatherLoading ? (
            <Skeleton className="h-5 w-16" />
          ) : (
            weather?.dataAvailable && (
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-base">{weatherEmoji}</span>
                <span className="font-medium">{tempRange}</span>
                {rainyDays > 0 && (
                  <span className="text-blue-500 flex items-center gap-0.5">
                    <Droplets className="h-3 w-3" />
                    <span className="text-xs">{rainyDays}d</span>
                  </span>
                )}
              </div>
            )
          )}
        </div>

        {trip.activities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {trip.activities.map((activity) => (
              <Badge key={activity} variant="outline" className="text-xs">
                {activity}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
