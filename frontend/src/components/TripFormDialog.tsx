import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { type Trip } from "@/backend";
import {
  useCreateTrip,
  useUpdateTrip,
  useBulkAddItems,
  useWeatherSuggestions,
  useActivitySuggestions,
  useCustomActivitySuggestions,
  useCustomActivities,
  useCreateCustomActivity,
  useDeleteCustomActivity,
  useTripWeatherPreview,
} from "../hooks/useQueries";
import { deriveWeatherCondition } from "../utils/weather";
import { type SuggestedItem, PREDEFINED_ACTIVITIES } from "../constants";
import { CitySearch, type GeocodingResult } from "./CitySearch";
import { cn } from "@/lib/utils";
import {
  Sun,
  CloudSun,
  Cloud,
  Snowflake,
  CloudRain,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { timestampToDateString, dateStringToTimestamp } from "../utils/dates";

interface TripFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  trip?: Trip;
  onCreated?: (tripId: bigint) => void;
}

const ACTIVITIES = PREDEFINED_ACTIVITIES;

const CATEGORY_ICONS: Record<string, string> = {
  Clothing: "👕",
  Toiletries: "🧴",
  Electronics: "📱",
  Documents: "📄",
  Accessories: "👜",
  Other: "📦",
};

const WEATHER_ICONS: Record<string, typeof Sun> = {
  Hot: Sun,
  Warm: CloudSun,
  Mild: Cloud,
  Cold: Snowflake,
};

type Step = 1 | 2 | 3;

interface TripFormValues {
  selectedCity: GeocodingResult | null;
  startDate: string;
  endDate: string;
  selectedActivities: string[];
  selectedCustomActivityIds: bigint[];
  orphanedActivities: string[]; // Activities on trip that no longer exist
  selectedItems: Set<string>;
}

const defaultFormValues: TripFormValues = {
  selectedCity: null,
  startDate: "",
  endDate: "",
  selectedActivities: [],
  selectedCustomActivityIds: [],
  orphanedActivities: [],
  selectedItems: new Set(),
};

function StepIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: Step;
  totalSteps: number;
}) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map(
        (step, index) => (
          <div key={step} className="flex items-center">
            <div
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-200 border-2",
                step === currentStep
                  ? "bg-primary border-primary scale-110"
                  : step < currentStep
                    ? "bg-primary border-primary"
                    : "bg-transparent border-muted-foreground/50",
              )}
            />
            {index < totalSteps - 1 && (
              <div
                className={cn(
                  "w-8 h-0.5 mx-1",
                  step < currentStep ? "bg-primary" : "bg-muted-foreground/30",
                )}
              />
            )}
          </div>
        ),
      )}
    </div>
  );
}

export function TripFormDialog({
  open,
  onOpenChange,
  mode,
  trip,
  onCreated,
}: TripFormDialogProps) {
  const [step, setStep] = useState<Step>(1);
  const [newActivityName, setNewActivityName] = useState("");
  const hasInitializedRef = useRef(false);

  const {
    watch,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<TripFormValues>({
    defaultValues: defaultFormValues,
  });

  const selectedCity = watch("selectedCity");
  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const selectedActivities = watch("selectedActivities");
  const selectedCustomActivityIds = watch("selectedCustomActivityIds");
  const orphanedActivities = watch("orphanedActivities");
  const selectedItems = watch("selectedItems");

  const { mutate: createTrip, isPending: isCreatingTrip } = useCreateTrip();
  const { mutate: updateTrip, isPending: isUpdatingTrip } = useUpdateTrip();
  const { mutateAsync: bulkAddItemsAsync, isPending: isBulkAdding } =
    useBulkAddItems();

  const { data: customActivities } = useCustomActivities();
  const {
    mutateAsync: createCustomActivityAsync,
    isPending: isCreatingActivity,
  } = useCreateCustomActivity();
  const { mutateAsync: deleteCustomActivityAsync } = useDeleteCustomActivity();

  const startTimestamp = startDate
    ? BigInt(new Date(startDate).getTime() * 1_000_000)
    : undefined;
  const endTimestamp = endDate
    ? BigInt(new Date(endDate).getTime() * 1_000_000)
    : undefined;
  const { data: weather, isLoading: weatherLoading } = useTripWeatherPreview(
    selectedCity?.latitude,
    selectedCity?.longitude,
    startTimestamp,
    endTimestamp,
  );
  const derivedWeather = weather ? deriveWeatherCondition(weather) : null;

  const { data: weatherSuggestions, isLoading: weatherSuggestionsLoading } =
    useWeatherSuggestions(
      step === 3 && derivedWeather ? derivedWeather.condition : null,
      derivedWeather?.isRainy ?? false,
    );
  const { data: activitySuggestions, isLoading: activitySuggestionsLoading } =
    useActivitySuggestions(step === 3 ? selectedActivities : []);
  const {
    data: customActivitySuggestions,
    isLoading: customActivitySuggestionsLoading,
  } = useCustomActivitySuggestions(step === 3 ? selectedCustomActivityIds : []);

  const isEditMode = mode === "edit";
  const isPending = isCreatingTrip || isUpdatingTrip || isBulkAdding;

  const allSuggestions = useMemo(() => {
    const seen = new Set<string>();
    const result: { item: SuggestedItem; source: "weather" | "activity" }[] =
      [];

    if (weatherSuggestions) {
      for (const item of weatherSuggestions) {
        const key = `${item.name}|${item.category}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({ item, source: "weather" });
        }
      }
    }

    if (activitySuggestions) {
      for (const item of activitySuggestions) {
        const key = `${item.name}|${item.category}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({ item, source: "activity" });
        }
      }
    }

    if (customActivitySuggestions) {
      for (const item of customActivitySuggestions) {
        const key = `${item.name}|${item.category}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({ item, source: "activity" });
        }
      }
    }

    return result;
  }, [weatherSuggestions, activitySuggestions, customActivitySuggestions]);

  const groupedSuggestions = useMemo(() => {
    const groups: Record<
      string,
      { item: SuggestedItem; source: "weather" | "activity" }[]
    > = {};
    for (const suggestion of allSuggestions) {
      const category = suggestion.item.category || "Other";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(suggestion);
    }
    return groups;
  }, [allSuggestions]);

  useEffect(() => {
    if (step === 3 && allSuggestions.length > 0) {
      setValue(
        "selectedItems",
        new Set(allSuggestions.map((s) => `${s.item.name}|${s.item.category}`)),
      );
    }
  }, [step, allSuggestions, setValue]);

  useEffect(() => {
    // Reset initialization tracking when dialog closes
    if (!open) {
      hasInitializedRef.current = false;
      return;
    }

    // Only initialize once per dialog open
    if (hasInitializedRef.current) {
      return;
    }

    if (isEditMode && trip && customActivities) {
      hasInitializedRef.current = true;

      // Separate predefined activities from custom activities
      const customActivityNames = new Set(
        customActivities.map((ca) => ca.name),
      );
      const predefinedActivities = trip.activities.filter((a) =>
        ACTIVITIES.includes(a),
      );
      const customActivityIds = trip.activities
        .filter((a) => customActivityNames.has(a))
        .map((name) => customActivities.find((ca) => ca.name === name)?.id)
        .filter((id): id is bigint => id !== undefined);

      // Find orphaned activities (not predefined and not in current custom activities)
      const orphaned = trip.activities.filter(
        (a) => !ACTIVITIES.includes(a) && !customActivityNames.has(a),
      );

      reset({
        selectedCity: {
          id: 0,
          name: trip.destination.split(",")[0].trim(),
          latitude: trip.latitude,
          longitude: trip.longitude,
          country: trip.destination.includes(",")
            ? trip.destination.split(",").pop()?.trim() || ""
            : "",
        },
        startDate: timestampToDateString(trip.startDate),
        endDate: timestampToDateString(trip.endDate),
        selectedActivities: predefinedActivities,
        selectedCustomActivityIds: customActivityIds,
        orphanedActivities: orphaned,
        selectedItems: new Set(),
      });
      setStep(1);
    }
  }, [open, isEditMode, trip, customActivities, reset]);

  const resetForm = () => {
    setStep(1);
    reset(defaultFormValues);
    setNewActivityName("");
  };

  const handleAddCustomActivity = async () => {
    const trimmed = newActivityName.trim();
    if (!trimmed) return;
    if (ACTIVITIES.includes(trimmed)) return;
    if (customActivities?.some((a) => a.name === trimmed)) return;

    const newId = await createCustomActivityAsync({ name: trimmed });
    setNewActivityName("");
    setValue("selectedCustomActivityIds", [
      ...selectedCustomActivityIds,
      newId,
    ]);
  };

  const handleDeleteCustomActivity = async (id: bigint) => {
    setValue(
      "selectedCustomActivityIds",
      selectedCustomActivityIds.filter((actId) => actId !== id),
    );
    await deleteCustomActivityAsync(id);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen && isPending) {
      return;
    }
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = () => {
    if (!selectedCity || !startDate || !endDate) return;

    const startTimestamp = dateStringToTimestamp(startDate);
    const endTimestamp = dateStringToTimestamp(endDate);

    const destination = selectedCity.admin1
      ? `${selectedCity.name}, ${selectedCity.admin1}, ${selectedCity.country}`
      : `${selectedCity.name}, ${selectedCity.country}`;

    const customActivityNames = selectedCustomActivityIds
      .map((id) => customActivities?.find((ca) => ca.id === id)?.name)
      .filter((name): name is string => !!name);
    // Include orphaned activities that weren't removed
    const allActivityNames = [
      ...selectedActivities,
      ...customActivityNames,
      ...orphanedActivities,
    ];

    if (isEditMode && trip) {
      updateTrip(
        {
          id: trip.id,
          destination,
          latitude: selectedCity.latitude,
          longitude: selectedCity.longitude,
          startDate: startTimestamp,
          endDate: endTimestamp,
          activities: allActivityNames,
        },
        {
          onSuccess: () => {
            resetForm();
            onOpenChange(false);
          },
          onError: (err: unknown) => {
            setError("root", {
              message:
                err instanceof Error ? err.message : "Failed to update trip",
            });
          },
        },
      );
    } else {
      createTrip(
        {
          destination,
          latitude: selectedCity.latitude,
          longitude: selectedCity.longitude,
          startDate: startTimestamp,
          endDate: endTimestamp,
          activities: allActivityNames,
        },
        {
          onSuccess: async (newTripId) => {
            if (selectedItems.size > 0) {
              const itemsToAdd = allSuggestions
                .filter((s) =>
                  selectedItems.has(`${s.item.name}|${s.item.category}`),
                )
                .map((s) => ({
                  name: s.item.name,
                  category: s.item.category,
                  quantity: s.item.quantity,
                }));

              if (itemsToAdd.length > 0) {
                await bulkAddItemsAsync({
                  tripId: newTripId,
                  items: itemsToAdd,
                });
              }
            }

            if (onCreated) {
              onCreated(newTripId);
            }

            resetForm();
            onOpenChange(false);
          },
          onError: (err: unknown) => {
            setError("root", {
              message:
                err instanceof Error ? err.message : "Failed to create trip",
            });
          },
        },
      );
    }
  };

  const toggleActivity = (activity: string) => {
    setValue(
      "selectedActivities",
      selectedActivities.includes(activity)
        ? selectedActivities.filter((a) => a !== activity)
        : [...selectedActivities, activity],
    );
  };

  const isCustomActivitySelected = (id: bigint) => {
    return selectedCustomActivityIds.some(
      (actId) => actId.toString() === id.toString(),
    );
  };

  const toggleCustomActivity = (id: bigint) => {
    setValue(
      "selectedCustomActivityIds",
      isCustomActivitySelected(id)
        ? selectedCustomActivityIds.filter(
            (actId) => actId.toString() !== id.toString(),
          )
        : [...selectedCustomActivityIds, id],
    );
  };

  const removeOrphanedActivity = (activity: string) => {
    setValue(
      "orphanedActivities",
      orphanedActivities.filter((a) => a !== activity),
    );
  };

  const toggleItem = (item: SuggestedItem) => {
    const key = `${item.name}|${item.category}`;
    const next = new Set(selectedItems);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setValue("selectedItems", next);
  };

  const toggleAllItems = (selected: boolean) => {
    if (selected) {
      setValue(
        "selectedItems",
        new Set(allSuggestions.map((s) => `${s.item.name}|${s.item.category}`)),
      );
    } else {
      setValue("selectedItems", new Set());
    }
  };

  const isStep1Valid =
    selectedCity && startDate && endDate && endDate >= startDate;
  const suggestionsLoading =
    weatherSuggestionsLoading ||
    activitySuggestionsLoading ||
    customActivitySuggestionsLoading;

  const handleNext = () => {
    if (step < 3) {
      setStep((s) => (s + 1) as Step);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as Step);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Trip Details";
      case 2:
        return "What will you be doing?";
      case 3:
        return "Review Suggested Items";
    }
  };

  const totalSteps = isEditMode ? 2 : 3;

  const categories = Object.keys(groupedSuggestions).sort();
  const allSelected =
    selectedItems.size === allSuggestions.length && allSuggestions.length > 0;

  const allSelectedActivityNames = useMemo(() => {
    const customNames = selectedCustomActivityIds
      .map((id) => customActivities?.find((ca) => ca.id === id)?.name)
      .filter((name): name is string => !!name);
    return [...selectedActivities, ...customNames, ...orphanedActivities];
  }, [
    selectedActivities,
    selectedCustomActivityIds,
    customActivities,
    orphanedActivities,
  ]);

  const WeatherIcon = derivedWeather
    ? WEATHER_ICONS[derivedWeather.condition]
    : Cloud;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <StepIndicator currentStep={step} totalSteps={totalSteps} />
          <DialogTitle className="text-center text-xl">
            {getStepTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 flex-1 overflow-y-auto">
          {/* Step 1: City & Dates */}
          {step === 1 && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="destination">Destination</Label>
                <CitySearch
                  value={selectedCity}
                  onChange={(city) => setValue("selectedCity", city)}
                  placeholder="Search for a city..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setValue("startDate", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setValue("endDate", e.target.value)}
                  />
                </div>
              </div>

              {/* Auto-detected weather display */}
              {selectedCity && startDate && endDate && (
                <div className="mt-2 p-3 rounded-lg bg-muted/50 border">
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Expected Weather
                  </Label>
                  {weatherLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Fetching weather forecast...
                    </div>
                  ) : derivedWeather ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <WeatherIcon className="h-5 w-5" />
                        <span className="font-medium">
                          {derivedWeather.condition}
                        </span>
                        <span className="text-muted-foreground">
                          ({derivedWeather.avgTemp}°C avg)
                        </span>
                      </div>
                      {derivedWeather.isRainy && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <CloudRain className="h-4 w-4" />
                          <span className="text-sm">Rain expected</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Weather data unavailable
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Activities */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Select any activities you have planned (optional)
              </p>

              {/* Predefined activities */}
              <div className="flex flex-wrap gap-2 justify-center">
                {ACTIVITIES.map((activity) => (
                  <Button
                    key={activity}
                    type="button"
                    variant={
                      selectedActivities.includes(activity)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => toggleActivity(activity)}
                  >
                    {activity}
                  </Button>
                ))}
              </div>

              {/* Custom activities */}
              {customActivities && customActivities.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center">
                    Your custom activities
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {customActivities.map((activity) => (
                      <div
                        key={activity.id.toString()}
                        className="relative group"
                      >
                        <Button
                          type="button"
                          variant={
                            isCustomActivitySelected(activity.id)
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => toggleCustomActivity(activity.id)}
                          className="pr-7"
                        >
                          {activity.name}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomActivity(activity.id);
                          }}
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-opacity"
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Orphaned activities (from deleted custom activities) */}
              {orphanedActivities.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center">
                    Unknown activities (click to remove)
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {orphanedActivities.map((activity) => (
                      <Button
                        key={activity}
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => removeOrphanedActivity(activity)}
                        className="gap-1"
                      >
                        {activity}
                        <X className="h-3 w-3" />
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add custom activity */}
              <div className="flex items-center gap-2 justify-center pt-2 border-t">
                <Input
                  placeholder="Add custom activity..."
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomActivity();
                    }
                  }}
                  className="max-w-[200px] h-8 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCustomActivity}
                  disabled={!newActivityName.trim() || isCreatingActivity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review Items */}
          {step === 3 && !isEditMode && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {derivedWeather ? (
                  <>
                    Based on {derivedWeather.condition.toLowerCase()} weather (
                    {derivedWeather.avgTemp}°C)
                    {derivedWeather.isRainy ? " with rain" : ""}
                    {allSelectedActivityNames.length > 0 &&
                      ` and ${allSelectedActivityNames.join(", ").toLowerCase()}`}
                  </>
                ) : (
                  <>
                    {allSelectedActivityNames.length > 0
                      ? `Based on ${allSelectedActivityNames.join(", ").toLowerCase()}`
                      : "No weather or activities selected"}
                  </>
                )}
              </p>

              {suggestionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : allSuggestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No suggestions available. You can add items manually after
                  creating the trip.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Select all toggle */}
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Checkbox
                      id="select-all"
                      checked={allSelected}
                      onCheckedChange={(checked) =>
                        toggleAllItems(checked === true)
                      }
                    />
                    <label
                      htmlFor="select-all"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Select all ({allSuggestions.length} items)
                    </label>
                  </div>

                  {/* Grouped items */}
                  {categories.map((category) => {
                    const categoryItems = groupedSuggestions[category];
                    const icon = CATEGORY_ICONS[category] ?? "📦";

                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <span>{icon}</span>
                          <span>{category}</span>
                        </div>
                        <div className="space-y-1 pl-6">
                          {categoryItems.map(({ item, source }) => {
                            const key = `${item.name}|${item.category}`;
                            return (
                              <div
                                key={key}
                                className="flex items-center gap-2 py-1"
                              >
                                <Checkbox
                                  id={key}
                                  checked={selectedItems.has(key)}
                                  onCheckedChange={() => toggleItem(item)}
                                />
                                <label
                                  htmlFor={key}
                                  className="text-sm cursor-pointer flex-1 flex items-center gap-2"
                                >
                                  {item.name}
                                  {item.quantity > 1n && (
                                    <span className="text-muted-foreground">
                                      x{item.quantity.toString()}
                                    </span>
                                  )}
                                  <span
                                    className={cn(
                                      "text-xs px-1.5 py-0.5 rounded",
                                      source === "weather"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-green-100 text-green-700",
                                    )}
                                  >
                                    {source === "weather"
                                      ? "weather"
                                      : "activity"}
                                  </span>
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {errors.root && (
          <p className="text-sm text-destructive">{errors.root.message}</p>
        )}

        <DialogFooter className="gap-2">
          {step === 1 && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                disabled={!isStep1Valid}
              >
                Next
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              {isEditMode ? (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending}
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              ) : (
                <Button type="button" onClick={handleNext}>
                  Next
                </Button>
              )}
            </>
          )}

          {step === 3 && !isEditMode && (
            <>
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isPending
                  ? "Creating..."
                  : `Create Trip${selectedItems.size > 0 ? ` with ${selectedItems.size} items` : ""}`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
