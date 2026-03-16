import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";
import {
  type BagFilter as CandidBagFilter,
  type CustomActivity,
  type CustomCategory,
} from "@/backend";
import {
  fetchWeatherForTrip,
  type TripWeather,
  type CachedTripWeather,
  cachedToTripWeather,
  tripWeatherToCached,
} from "../utils/weather";
import {
  type SuggestedItem,
  getWeatherSuggestions,
  getActivitySuggestions,
} from "../constants";
import { timestampToDate } from "../utils/dates";

export function useProfile() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["profile", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.getProfile();
      return result ?? null;
    },
    enabled: !!actor && !!identity,
  });
}

export function useSetProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.setProfile(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profile", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useTrips() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["trips", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.getTrips();
    },
    enabled: !!actor && !!identity,
  });
}

export function useCreateTrip() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      destination,
      latitude,
      longitude,
      startDate,
      endDate,
      activities,
    }: {
      destination: string;
      latitude: number;
      longitude: number;
      startDate: bigint;
      endDate: bigint;
      activities: string[];
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.createTrip(
        destination,
        latitude,
        longitude,
        startDate,
        endDate,
        activities,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["trips", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useTrip(tripId: bigint | null) {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["trip", tripId?.toString(), identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || tripId === null) throw new Error("Actor not ready");
      const result = await actor.getTripById(tripId);
      return result ?? null;
    },
    enabled: !!actor && !!identity && tripId !== null,
  });
}

// New cached weather hook that checks backend first
export function useCachedTripWeather(tripId: bigint | null) {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<CachedTripWeather | null>({
    queryKey: [
      "cachedTripWeather",
      tripId?.toString(),
      identity?.getPrincipal().toString(),
    ],
    queryFn: async () => {
      if (!actor || tripId === null) throw new Error("Actor not ready");
      // caffeine-stub converts Candid optional to T | null
      return await actor.getTripWeather(tripId);
    },
    enabled: !!actor && !!identity && tripId !== null,
    staleTime: Infinity, // Never auto-refetch - user controls refresh
  });
}

// Mutation to save weather to backend
export function useSetTripWeather() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      tripId,
      weather,
    }: {
      tripId: bigint;
      weather: TripWeather;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const cached = tripWeatherToCached(weather);
      await actor.setTripWeather(tripId, cached.days, cached.hasHistoricalDays);
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({
        queryKey: [
          "cachedTripWeather",
          tripId.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
    },
  });
}

// Combined hook that fetches from cache or API
export function useTripWeather(
  tripId: bigint | null,
  latitude: number | undefined,
  longitude: number | undefined,
  startDate: bigint | undefined,
  endDate: bigint | undefined,
) {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const hasValidCoords =
    latitude !== undefined &&
    longitude !== undefined &&
    (latitude !== 0 || longitude !== 0);

  return useQuery<TripWeather>({
    queryKey: [
      "tripWeather",
      tripId?.toString(),
      identity?.getPrincipal().toString(),
    ],
    queryFn: async () => {
      if (
        !actor ||
        tripId === null ||
        !hasValidCoords ||
        !startDate ||
        !endDate
      ) {
        throw new Error("Missing parameters");
      }

      // First check backend cache (caffeine-stub converts optional to T | null)
      const cachedResult = await actor.getTripWeather(tripId);
      if (cachedResult !== null) {
        return cachedToTripWeather(cachedResult);
      }

      // Not in cache, fetch from Open Meteo
      const start = timestampToDate(startDate);
      const end = timestampToDate(endDate);
      const weather = await fetchWeatherForTrip(
        latitude!,
        longitude!,
        start,
        end,
      );

      // Save to backend cache
      if (weather.dataAvailable) {
        const cached = tripWeatherToCached(weather);
        await actor.setTripWeather(
          tripId,
          cached.days,
          cached.hasHistoricalDays,
        );
      }

      return weather;
    },
    enabled:
      !!actor &&
      !!identity &&
      tripId !== null &&
      hasValidCoords &&
      !!startDate &&
      !!endDate,
    staleTime: Infinity, // Never auto-refetch - user controls refresh
    retry: false,
    refetchOnWindowFocus: false,
  });
}

// Hook for weather preview during trip creation (no caching, no tripId needed)
export function useTripWeatherPreview(
  latitude: number | undefined,
  longitude: number | undefined,
  startDate: bigint | undefined,
  endDate: bigint | undefined,
) {
  const hasValidCoords =
    latitude !== undefined &&
    longitude !== undefined &&
    (latitude !== 0 || longitude !== 0);

  return useQuery<TripWeather>({
    queryKey: [
      "tripWeatherPreview",
      latitude,
      longitude,
      startDate?.toString(),
      endDate?.toString(),
    ],
    queryFn: async () => {
      if (!hasValidCoords || !startDate || !endDate) {
        throw new Error("Missing parameters");
      }
      const start = timestampToDate(startDate);
      const end = timestampToDate(endDate);
      return await fetchWeatherForTrip(latitude!, longitude!, start, end);
    },
    enabled: hasValidCoords && !!startDate && !!endDate,
    staleTime: 1000 * 60 * 30, // 30 minutes for preview
    retry: false,
    refetchOnWindowFocus: false,
  });
}

// Hook to refresh weather (clears cache and refetches)
export function useRefreshTripWeather() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      tripId,
      latitude,
      longitude,
      startDate,
      endDate,
    }: {
      tripId: bigint;
      latitude: number;
      longitude: number;
      startDate: bigint;
      endDate: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");

      // Fetch fresh weather from API
      const start = timestampToDate(startDate);
      const end = timestampToDate(endDate);
      const weather = await fetchWeatherForTrip(
        latitude,
        longitude,
        start,
        end,
      );

      // Save to backend cache
      if (weather.dataAvailable) {
        const cached = tripWeatherToCached(weather);
        await actor.setTripWeather(
          tripId,
          cached.days,
          cached.hasHistoricalDays,
        );
      }

      return weather;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({
        queryKey: [
          "tripWeather",
          tripId.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
    },
  });
}

export type PackedFilter = boolean | null | undefined;

export type BagFilter = "all" | "unassigned" | bigint;

export function useItems(
  tripId: bigint | null,
  packedFilter?: PackedFilter,
  bagFilter: BagFilter = "all",
) {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();

  const normalizedPackedFilter =
    packedFilter === undefined ? null : packedFilter;
  const packedKey =
    normalizedPackedFilter === null
      ? "all"
      : normalizedPackedFilter
        ? "packed"
        : "unpacked";
  const bagKey =
    bagFilter === "all"
      ? "all"
      : bagFilter === "unassigned"
        ? "unassigned"
        : `bag-${bagFilter.toString()}`;

  return useQuery({
    queryKey: [
      "items",
      tripId?.toString(),
      identity?.getPrincipal().toString(),
      packedKey,
      bagKey,
    ],
    queryFn: async () => {
      if (!actor || tripId === null) throw new Error("Actor not ready");

      let candidBagFilter: CandidBagFilter;
      if (bagFilter === "all") {
        candidBagFilter = { __kind__: "all", all: null };
      } else if (bagFilter === "unassigned") {
        candidBagFilter = { __kind__: "unassigned", unassigned: null };
      } else {
        candidBagFilter = { __kind__: "specific", specific: bagFilter };
      }

      return await actor.getItems(
        tripId,
        normalizedPackedFilter,
        candidBagFilter,
      );
    },
    enabled: !!actor && !!identity && tripId !== null,
  });
}

export function useAddItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      tripId,
      name,
      category,
      quantity,
      weight,
      bagId,
    }: {
      tripId: bigint;
      name: string;
      category: string;
      quantity: bigint;
      weight?: bigint;
      bagId?: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.addItem(
        tripId,
        name,
        category,
        quantity,
        weight ?? null,
        bagId ?? null,
      );
    },
    onSuccess: (
      _: bigint,
      variables: {
        tripId: bigint;
        name: string;
        category: string;
        quantity: bigint;
        weight?: bigint;
        bagId?: bigint;
      },
    ) => {
      queryClient.invalidateQueries({
        queryKey: [
          "items",
          variables.tripId.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "bags",
          variables.tripId.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
    },
  });
}

export function useTogglePacked() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ itemId }: { itemId: bigint; tripId: bigint }) => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.togglePacked(itemId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "items",
          variables.tripId.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
    },
  });
}

export function useUpdateItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      itemId,
      tripId,
      name,
      category,
      quantity,
      weight,
      bagId,
    }: {
      itemId: bigint;
      tripId: bigint;
      name: string;
      category: string;
      quantity: bigint;
      weight?: bigint;
      bagId?: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.updateItem(
        itemId,
        name,
        category,
        quantity,
        weight ?? null,
        bagId ?? null,
      );
    },
    onSuccess: (
      _: void,
      variables: {
        itemId: bigint;
        tripId: bigint;
        name: string;
        category: string;
        quantity: bigint;
        weight?: bigint;
        bagId?: bigint;
      },
    ) => {
      queryClient.invalidateQueries({
        queryKey: [
          "items",
          variables.tripId.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "bags",
          variables.tripId.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
    },
  });
}

export function useDeleteItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ itemId }: { itemId: bigint; tripId: bigint }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.deleteItem(itemId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "items",
          variables.tripId.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
    },
  });
}

export function useUpdateTrip() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      destination,
      latitude,
      longitude,
      startDate,
      endDate,
      activities,
    }: {
      id: bigint;
      destination: string;
      latitude: number;
      longitude: number;
      startDate: bigint;
      endDate: bigint;
      activities: string[];
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.updateTrip(
        id,
        destination,
        latitude,
        longitude,
        startDate,
        endDate,
        activities,
      );
      // Clear weather cache since location/dates may have changed
      await actor.clearTripWeather(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

export function useDeleteTrip() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.deleteTrip(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["trips", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useBags(tripId: bigint | null) {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["bags", tripId?.toString(), identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || tripId === null) throw new Error("Actor not ready");
      return await actor.getBags(tripId);
    },
    enabled: !!actor && !!identity && tripId !== null,
  });
}

export function useCreateBag() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      tripId,
      name,
      weightLimit,
    }: {
      tripId: bigint;
      name: string;
      weightLimit?: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.createBag(tripId, name, weightLimit ?? null);
    },
    onSuccess: (
      _: bigint,
      variables: { tripId: bigint; name: string; weightLimit?: bigint },
    ) => {
      queryClient.invalidateQueries({
        queryKey: [
          "bags",
          variables.tripId.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
    },
  });
}

export function useUpdateBag() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      bagId,
      name,
      weightLimit,
    }: {
      bagId: bigint;
      tripId: bigint;
      name: string;
      weightLimit?: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.updateBag(bagId, name, weightLimit ?? null);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "bags",
          variables.tripId.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
    },
  });
}

export function useDeleteBag() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ bagId }: { bagId: bigint; tripId: bigint }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.deleteBag(bagId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "bags",
          variables.tripId.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "items",
          variables.tripId.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
    },
  });
}

export function useAssignToBag() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      itemId,
      bagId,
    }: {
      itemId: bigint;
      tripId: bigint;
      bagId?: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.assignToBag(itemId, bagId ?? null);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "items",
          variables.tripId.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "bags",
          variables.tripId.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
    },
  });
}

export function useTemplates() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery({
    queryKey: ["templates", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.getTemplates();
    },
    enabled: !!actor && !!identity,
  });
}

export function useTemplate(templateId: bigint | null) {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: [
      "template",
      templateId?.toString(),
      identity?.getPrincipal().toString(),
    ],
    queryFn: async () => {
      if (!actor || templateId === null) throw new Error("Actor not ready");
      const result = await actor.getTemplateById(templateId);
      return result ?? null;
    },
    enabled: !!actor && !!identity && templateId !== null,
  });
}

export function useCreateTemplate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  return useMutation({
    mutationFn: async ({
      name,
      description,
      activities,
    }: {
      name: string;
      description: string;
      activities: string[];
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.createTemplate(name, description, activities);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["templates", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useSaveAsTemplate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  return useMutation({
    mutationFn: async ({
      tripId,
      name,
      description,
    }: {
      tripId: bigint;
      name: string;
      description: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.saveAsTemplate(tripId, name, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["templates", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useApplyTemplate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  return useMutation({
    mutationFn: async ({
      tripId,
      templateId,
    }: {
      tripId: bigint;
      templateId: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.applyTemplate(tripId, templateId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "items",
          variables.tripId.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "bags",
          variables.tripId.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
    },
  });
}

export function useUpdateTemplate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
      activities,
    }: {
      id: bigint;
      name: string;
      description: string;
      activities: string[];
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.updateTemplate(id, name, description, activities);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["templates", identity?.getPrincipal().toString()],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "template",
          variables.id.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
    },
  });
}

export function useDeleteTemplate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.deleteTemplate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["templates", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useWeatherSuggestions(
  condition: string | null,
  isRainy: boolean,
) {
  return useQuery<SuggestedItem[]>({
    queryKey: ["weatherSuggestions", condition, isRainy],
    queryFn: () => Promise.resolve(getWeatherSuggestions(condition, isRainy)),
    enabled: !!condition,
  });
}

export function useActivitySuggestions(activities: string[]) {
  return useQuery<SuggestedItem[]>({
    queryKey: ["activitySuggestions", activities.join(",")],
    queryFn: () => Promise.resolve(getActivitySuggestions(activities)),
    enabled: activities.length > 0,
  });
}

export function useCustomActivitySuggestions(activityIds: bigint[]) {
  const { actor } = useActor();

  return useQuery<SuggestedItem[]>({
    queryKey: [
      "customActivitySuggestions",
      activityIds.map((id) => id.toString()).join(","),
    ],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.getActivitySuggestedItems(activityIds);
    },
    enabled: activityIds.length > 0 && !!actor,
  });
}

export function useBulkAddItems() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      tripId,
      items,
    }: {
      tripId: bigint;
      items: Array<{
        name: string;
        category: string;
        quantity: bigint;
        weight?: bigint;
      }>;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.bulkAddItems(tripId, items);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "items",
          variables.tripId.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
    },
  });
}

export function useCustomActivities() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<CustomActivity[]>({
    queryKey: ["customActivities", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.getCustomActivities();
    },
    enabled: !!actor && !!identity,
  });
}

export function useCreateCustomActivity() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      name,
      suggestedItems = [],
    }: {
      name: string;
      suggestedItems?: Array<{
        name: string;
        category: string;
        quantity: bigint;
      }>;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.createCustomActivity(name, suggestedItems);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customActivities", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useUpdateCustomActivity() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      suggestedItems,
    }: {
      id: bigint;
      name: string;
      suggestedItems: Array<{
        name: string;
        category: string;
        quantity: bigint;
      }>;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.updateCustomActivity(id, name, suggestedItems);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customActivities", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useDeleteCustomActivity() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.deleteCustomActivity(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customActivities", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useCustomCategories() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<CustomCategory[]>({
    queryKey: ["customCategories", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.getCustomCategories();
    },
    enabled: !!actor && !!identity,
  });
}

export function useCreateCustomCategory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.createCustomCategory(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customCategories", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useUpdateCustomCategory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ id, name }: { id: bigint; name: string }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.updateCustomCategory(id, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customCategories", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useDeleteCustomCategory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.deleteCustomCategory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customCategories", identity?.getPrincipal().toString()],
      });
    },
  });
}
