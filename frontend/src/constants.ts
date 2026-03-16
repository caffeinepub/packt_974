export interface SuggestedItem {
  name: string;
  category: string;
  quantity: bigint;
}

export const PREDEFINED_ACTIVITIES: string[] = [
  "Hiking",
  "Beach",
  "Business",
  "Sightseeing",
  "Camping",
  "Sports",
  "Shopping",
  "Dining",
];

export const WEATHER_SUGGESTIONS: Record<string, SuggestedItem[]> = {
  Hot: [
    { name: "T-shirts", category: "Clothing", quantity: 3n },
    { name: "Shorts", category: "Clothing", quantity: 2n },
    { name: "Sunglasses", category: "Accessories", quantity: 1n },
    { name: "Sunscreen", category: "Toiletries", quantity: 1n },
    { name: "Hat", category: "Accessories", quantity: 1n },
    { name: "Sandals", category: "Clothing", quantity: 1n },
  ],
  Warm: [
    { name: "T-shirts", category: "Clothing", quantity: 3n },
    { name: "Light pants", category: "Clothing", quantity: 2n },
    { name: "Sunglasses", category: "Accessories", quantity: 1n },
    { name: "Light jacket", category: "Clothing", quantity: 1n },
  ],
  Mild: [
    { name: "Long sleeve shirts", category: "Clothing", quantity: 3n },
    { name: "Pants", category: "Clothing", quantity: 2n },
    { name: "Light jacket", category: "Clothing", quantity: 1n },
    { name: "Sweater", category: "Clothing", quantity: 1n },
  ],
  Cold: [
    { name: "Warm layers", category: "Clothing", quantity: 3n },
    { name: "Pants", category: "Clothing", quantity: 2n },
    { name: "Winter jacket", category: "Clothing", quantity: 1n },
    { name: "Sweater", category: "Clothing", quantity: 2n },
    { name: "Scarf", category: "Accessories", quantity: 1n },
    { name: "Gloves", category: "Accessories", quantity: 1n },
  ],
};

export const RAIN_ITEMS: SuggestedItem[] = [
  { name: "Umbrella", category: "Accessories", quantity: 1n },
  { name: "Rain jacket", category: "Clothing", quantity: 1n },
];

export const ACTIVITY_SUGGESTIONS: Record<string, SuggestedItem[]> = {
  Hiking: [
    { name: "Hiking boots", category: "Clothing", quantity: 1n },
    { name: "Backpack", category: "Accessories", quantity: 1n },
    { name: "Water bottle", category: "Accessories", quantity: 1n },
  ],
  Beach: [
    { name: "Swimsuit", category: "Clothing", quantity: 1n },
    { name: "Beach towel", category: "Accessories", quantity: 1n },
    { name: "Sunscreen", category: "Toiletries", quantity: 1n },
    { name: "Flip flops", category: "Clothing", quantity: 1n },
  ],
  Business: [
    { name: "Business suit", category: "Clothing", quantity: 1n },
    { name: "Dress shoes", category: "Clothing", quantity: 1n },
    { name: "Laptop", category: "Electronics", quantity: 1n },
  ],
  Sightseeing: [
    { name: "Comfortable walking shoes", category: "Clothing", quantity: 1n },
    { name: "Camera", category: "Electronics", quantity: 1n },
    { name: "Day bag", category: "Accessories", quantity: 1n },
  ],
  Camping: [
    { name: "Tent", category: "Other", quantity: 1n },
    { name: "Sleeping bag", category: "Other", quantity: 1n },
    { name: "Flashlight", category: "Electronics", quantity: 1n },
  ],
  Sports: [
    { name: "Athletic shoes", category: "Clothing", quantity: 1n },
    { name: "Workout clothes", category: "Clothing", quantity: 2n },
    { name: "Water bottle", category: "Accessories", quantity: 1n },
  ],
  Shopping: [
    { name: "Comfortable shoes", category: "Clothing", quantity: 1n },
    { name: "Crossbody bag", category: "Accessories", quantity: 1n },
  ],
  Dining: [
    { name: "Nice outfit", category: "Clothing", quantity: 1n },
    { name: "Dress shoes", category: "Clothing", quantity: 1n },
  ],
};

// Helper functions for getting suggestions
export function getWeatherSuggestions(
  condition: string | null,
  isRainy: boolean,
): SuggestedItem[] {
  if (!condition) return [];
  const items = [...(WEATHER_SUGGESTIONS[condition] || [])];
  if (isRainy) items.push(...RAIN_ITEMS);
  return items;
}

export function getActivitySuggestions(activities: string[]): SuggestedItem[] {
  const seen = new Set<string>();
  const items: SuggestedItem[] = [];
  for (const activity of activities) {
    for (const item of ACTIVITY_SUGGESTIONS[activity] || []) {
      const key = `${item.name}|${item.category}`;
      if (!seen.has(key)) {
        seen.add(key);
        items.push(item);
      }
    }
  }
  return items;
}
