import { useState } from "react";
import { type PackingItem } from "@/backend";
import {
  useItems,
  useTrip,
  useDeleteTrip,
  useBags,
  useTripWeather,
  useRefreshTripWeather,
  type PackedFilter,
  type BagFilter,
} from "../hooks/useQueries";
import { TripHeader } from "./TripHeader";
import { WeatherDisplay } from "./WeatherDisplay";
import { PackingProgress } from "./PackingProgress";
import { BagSection } from "./BagSection";
import { ItemsList } from "./ItemsList";
import { ItemFormDialog } from "./ItemFormDialog";
import { TripFormDialog } from "./TripFormDialog";
import { SaveTemplateDialog } from "./SaveTemplateDialog";
import { ApplyTemplateDialog } from "./ApplyTemplateDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { PageLoader } from "./PageLoader";

interface TripDetailPageProps {
  tripId: bigint;
  onBack: () => void;
}

export function TripDetailPage({ tripId, onBack }: TripDetailPageProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [applyTemplateOpen, setApplyTemplateOpen] = useState(false);
  const [packedFilter, setPackedFilter] = useState<PackedFilter>(null);
  const [bagFilter, setBagFilter] = useState<BagFilter>("all");

  const { data: trip, isLoading: tripLoading } = useTrip(tripId);
  const { data: allItems, isLoading: allItemsLoading } = useItems(
    tripId,
    null,
    "all",
  );
  const { data: filteredItems, isLoading: filteredItemsLoading } = useItems(
    tripId,
    packedFilter,
    bagFilter,
  );
  const { data: bags, isLoading: bagsLoading } = useBags(tripId);

  const { data: weather, isLoading: weatherLoading } = useTripWeather(
    tripId,
    trip?.latitude,
    trip?.longitude,
    trip?.startDate,
    trip?.endDate,
  );
  const { mutate: refreshWeather, isPending: isRefreshingWeather } =
    useRefreshTripWeather();
  const { mutate: deleteTrip, isPending: isDeletingTrip } = useDeleteTrip();

  const handleRefreshWeather = () => {
    if (!trip) return;
    refreshWeather({
      tripId,
      latitude: trip.latitude,
      longitude: trip.longitude,
      startDate: trip.startDate,
      endDate: trip.endDate,
    });
  };

  const handleDeleteTrip = () => {
    deleteTrip(tripId, {
      onSuccess: () => onBack(),
    });
  };

  const isLoading =
    tripLoading || allItemsLoading || filteredItemsLoading || bagsLoading;

  if (isLoading || !trip) {
    return <PageLoader message="Loading trip..." />;
  }

  const packedCount =
    allItems?.filter((item: PackingItem) => item.packed).length ?? 0;
  const totalCount = allItems?.length ?? 0;

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <TripHeader
          trip={trip}
          onBack={onBack}
          onEdit={() => setEditDialogOpen(true)}
          onDelete={() => setDeleteDialogOpen(true)}
          onSaveAsTemplate={() => setSaveTemplateOpen(true)}
        />

        <WeatherDisplay
          weather={weather}
          isLoading={weatherLoading}
          onRefresh={handleRefreshWeather}
          isRefreshing={isRefreshingWeather}
        />

        <PackingProgress packed={packedCount} total={totalCount} />

        <BagSection bags={bags ?? []} items={allItems ?? []} tripId={tripId} />

        <ItemsList
          items={filteredItems ?? []}
          tripId={tripId}
          bags={bags ?? []}
          onAddItem={() => setAddDialogOpen(true)}
          onApplyTemplate={() => setApplyTemplateOpen(true)}
          packedFilter={packedFilter}
          onPackedFilterChange={setPackedFilter}
          bagFilter={bagFilter}
          onBagFilterChange={setBagFilter}
        />

        <ItemFormDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          tripId={tripId}
          bags={bags ?? []}
        />

        <TripFormDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          mode="edit"
          trip={trip}
        />

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Trip"
          description="Are you sure you want to delete this trip? This will also delete all items and bags. This action cannot be undone."
          onConfirm={handleDeleteTrip}
          isPending={isDeletingTrip}
        />

        <SaveTemplateDialog
          open={saveTemplateOpen}
          onOpenChange={setSaveTemplateOpen}
          tripId={tripId}
          tripName={trip.destination}
          itemCount={allItems?.length ?? 0}
        />

        <ApplyTemplateDialog
          open={applyTemplateOpen}
          onOpenChange={setApplyTemplateOpen}
          tripId={tripId}
        />
      </div>
    </main>
  );
}
