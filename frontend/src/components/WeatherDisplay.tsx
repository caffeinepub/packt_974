import { useState } from "react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, CloudSun, Droplets, ChevronDown, RefreshCw } from "lucide-react";
import {
  type TripWeather,
  type WeatherDay,
  getWeatherIcon,
  isRainyDay,
} from "../utils/weather";

interface WeatherDisplayProps {
  weather: TripWeather | undefined;
  isLoading: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

function formatDayName(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tmrw";
  return format(date, "EEE");
}

function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), "MMM d");
}

export function WeatherDisplay({
  weather,
  isLoading,
  onRefresh,
  isRefreshing,
}: WeatherDisplayProps) {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-16" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weather || !weather.dataAvailable) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <CloudSun className="h-4 w-4" />
              Local Weather Forecast
            </h3>
            <p className="text-sm text-muted-foreground">
              Weather data is not available for this trip.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { days, hasHistoricalDays } = weather;

  const tempMaxes = days.map((d) => d.tempMax);
  const tempMins = days.map((d) => d.tempMin);
  const overallMax = Math.round(Math.max(...tempMaxes));
  const overallMin = Math.round(Math.min(...tempMins));
  const rainyDays = days.filter(isRainyDay).length;
  const totalDays = days.length;

  const weatherCounts = new Map<number, number>();
  for (const day of days) {
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

  return (
    <TooltipProvider>
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <CloudSun className="h-4 w-4" />
                  Local Weather Forecast
                  {hasHistoricalDays && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-amber-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-[200px]">
                          Some days show estimated forecast based on last year's
                          data.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </h3>
                <div className="flex items-center gap-1">
                  {onRefresh && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground"
                          onClick={onRefresh}
                          disabled={isRefreshing}
                        >
                          <RefreshCw
                            className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Refresh weather data</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground"
                    >
                      {expanded ? "Overview" : "Details"}
                      <ChevronDown
                        className={`h-3 w-3 ml-1 transition-transform ${expanded ? "rotate-180" : ""}`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>

              {/* Summary View - hidden when expanded */}
              {!expanded && (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {getWeatherIcon(mostCommonCode)}
                  </span>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-semibold">
                      {overallMin}° - {overallMax}°C
                    </span>
                    {rainyDays > 0 && (
                      <span className="text-blue-500 flex items-center gap-1">
                        <Droplets className="h-3.5 w-3.5" />
                        {rainyDays}/{totalDays} days
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Detailed View - shown when expanded */}
              <CollapsibleContent>
                <div className="flex gap-2 overflow-x-auto scrollbar-thin">
                  {days.map((day) => (
                    <DayCard key={day.date} day={day} />
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </CardContent>
        </Card>
      </Collapsible>
    </TooltipProvider>
  );
}

function DayCard({ day }: { day: WeatherDay }) {
  const isRainy = isRainyDay(day);

  return (
    <div
      className={`relative flex flex-col items-center gap-1 p-3 rounded-lg min-w-[72px] shrink-0 ${
        day.isHistorical ? "bg-amber-50 border border-amber-200" : "bg-muted/50"
      }`}
    >
      {day.isHistorical && (
        <div className="absolute top-1 right-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-amber-500 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">Estimated based on last year</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
      <span className="text-xs font-medium text-muted-foreground">
        {formatDayName(day.date)}
      </span>
      <span className="text-[10px] text-muted-foreground/70">
        {formatDateShort(day.date)}
      </span>
      <div className="text-2xl">{getWeatherIcon(day.weatherCode)}</div>
      <div className="flex flex-col items-center">
        <span className="text-sm font-semibold">
          {Math.round(day.tempMax)}°
        </span>
        <span className="text-xs text-muted-foreground">
          {Math.round(day.tempMin)}°
        </span>
      </div>
      {isRainy && <Droplets className="h-3 w-3 text-blue-500" />}
    </div>
  );
}
