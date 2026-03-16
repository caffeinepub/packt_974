import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CustomActivity {
    id: bigint;
    name: string;
    suggestedItems: Array<SuggestedItem>;
}
export interface Trip {
    id: bigint;
    latitude: number;
    destination: string;
    endDate: bigint;
    createdAt: bigint;
    activities: Array<string>;
    longitude: number;
    startDate: bigint;
}
export interface CustomCategory {
    id: bigint;
    name: string;
}
export interface TemplateView {
    id: bigint;
    name: string;
    createdAt: bigint;
    itemCount: bigint;
    activities: Array<string>;
    description: string;
    bagCount: bigint;
}
export interface Bag {
    id: bigint;
    name: string;
    weightLimit?: bigint;
    listId: bigint;
}
export interface SuggestedItem {
    name: string;
    quantity: bigint;
    category: string;
}
export interface CachedWeatherDay {
    date: string;
    tempMax: number;
    tempMin: number;
    isHistorical: boolean;
    weatherCode: bigint;
    precipitationSum?: number;
    precipitationProbability?: number;
}
export type BagFilter = {
    __kind__: "all";
    all: null;
} | {
    __kind__: "specific";
    specific: bigint;
} | {
    __kind__: "unassigned";
    unassigned: null;
};
export interface CachedTripWeather {
    days: Array<CachedWeatherDay>;
    tripId: bigint;
    cachedAt: bigint;
    hasHistoricalDays: boolean;
}
export interface UserProfile {
    name: string;
}
export interface PackingItem {
    id: bigint;
    weight?: bigint;
    name: string;
    quantity: bigint;
    category: string;
    bagId?: bigint;
    packed: boolean;
    listId: bigint;
}
export interface backendInterface {
    addItem(listId: bigint, name: string, category: string, quantity: bigint, weight: bigint | null, bagId: bigint | null): Promise<bigint>;
    applyTemplate(tripId: bigint, templateId: bigint): Promise<void>;
    assignToBag(itemId: bigint, bagId: bigint | null): Promise<void>;
    bulkAddItems(listId: bigint, newItems: Array<{
        weight?: bigint;
        name: string;
        quantity: bigint;
        category: string;
    }>): Promise<Array<bigint>>;
    clearTripWeather(tripId: bigint): Promise<void>;
    createBag(listId: bigint, name: string, weightLimit: bigint | null): Promise<bigint>;
    createCustomActivity(name: string, suggestedItems: Array<SuggestedItem>): Promise<bigint>;
    createCustomCategory(name: string): Promise<bigint>;
    createTemplate(name: string, description: string, activities: Array<string>): Promise<bigint>;
    createTrip(destination: string, latitude: number, longitude: number, startDate: bigint, endDate: bigint, activities: Array<string>): Promise<bigint>;
    deleteBag(id: bigint): Promise<void>;
    deleteCustomActivity(id: bigint): Promise<void>;
    deleteCustomCategory(id: bigint): Promise<void>;
    deleteItem(id: bigint): Promise<void>;
    deleteTemplate(id: bigint): Promise<void>;
    deleteTrip(id: bigint): Promise<void>;
    getActivitySuggestedItems(activityIds: Array<bigint>): Promise<Array<SuggestedItem>>;
    getBags(listId: bigint): Promise<Array<Bag>>;
    getCustomActivities(): Promise<Array<CustomActivity>>;
    getCustomCategories(): Promise<Array<CustomCategory>>;
    getItems(listId: bigint, packedFilter: boolean | null, bagFilter: BagFilter): Promise<Array<PackingItem>>;
    getProfile(): Promise<UserProfile | null>;
    getTemplateById(id: bigint): Promise<TemplateView | null>;
    getTemplates(): Promise<Array<TemplateView>>;
    getTripById(id: bigint): Promise<Trip | null>;
    getTripWeather(tripId: bigint): Promise<CachedTripWeather | null>;
    getTrips(): Promise<Array<Trip>>;
    saveAsTemplate(tripId: bigint, name: string, description: string): Promise<bigint>;
    setProfile(name: string): Promise<void>;
    setTripWeather(tripId: bigint, days: Array<CachedWeatherDay>, hasHistoricalDays: boolean): Promise<void>;
    togglePacked(id: bigint): Promise<boolean>;
    updateBag(id: bigint, name: string, weightLimit: bigint | null): Promise<void>;
    updateCustomActivity(id: bigint, name: string, suggestedItems: Array<SuggestedItem>): Promise<void>;
    updateCustomCategory(id: bigint, name: string): Promise<void>;
    updateItem(id: bigint, name: string, category: string, quantity: bigint, weight: bigint | null, bagId: bigint | null): Promise<void>;
    updateTemplate(id: bigint, name: string, description: string, activities: Array<string>): Promise<void>;
    updateTrip(id: bigint, destination: string, latitude: number, longitude: number, startDate: bigint, endDate: bigint, activities: Array<string>): Promise<void>;
}
