import { useState, useEffect } from "react";
import { Loader2, MapPin, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

interface CitySearchProps {
  value: GeocodingResult | null;
  onChange: (city: GeocodingResult | null) => void;
  placeholder?: string;
}

export function CitySearch({
  value,
  onChange,
  placeholder = "Search for a city...",
}: CitySearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setResults([]);
      return;
    }

    const fetchCities = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(debouncedSearch)}&count=5&language=en`,
        );
        if (!response.ok) throw new Error("Geocoding API error");
        const data = await response.json();
        setResults(
          data.results?.map((r: GeocodingResult) => ({
            id: r.id,
            name: r.name,
            latitude: r.latitude,
            longitude: r.longitude,
            country: r.country,
            admin1: r.admin1,
          })) || [],
        );
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCities();
  }, [debouncedSearch]);

  const formatCity = (city: GeocodingResult) =>
    city.admin1
      ? `${city.name}, ${city.admin1}, ${city.country}`
      : `${city.name}, ${city.country}`;

  const handleSelect = (city: GeocodingResult) => {
    onChange(city);
    setSearch("");
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearch("");
  };

  const hasResults = results.length > 0;
  const showResults = search.length >= 2 && (hasResults || isLoading);

  if (value) {
    return (
      <div className="relative">
        <Input value={formatCity(value)} readOnly className="pr-8" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open && showResults} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Input
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setOpen(true)}
            className={hasResults ? "pr-8" : ""}
          />
          {isLoading ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : hasResults ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen((prev) => !prev);
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </Button>
          ) : null}
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-64 overflow-y-auto">
          {results.map((city) => (
            <button
              key={city.id}
              type="button"
              className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-accent transition-colors"
              onClick={() => handleSelect(city)}
            >
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex flex-col min-w-0">
                <span className="font-medium truncate">{city.name}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {city.admin1
                    ? `${city.admin1}, ${city.country}`
                    : city.country}
                </span>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
