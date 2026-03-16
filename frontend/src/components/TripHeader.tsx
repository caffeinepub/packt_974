import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Pencil,
  Trash2,
  Bookmark,
} from "lucide-react";
import { type Trip } from "@/backend";
import { timestampToDate } from "../utils/dates";

interface TripHeaderProps {
  trip: Trip;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSaveAsTemplate: () => void;
}

function formatDateRange(startDate: bigint, endDate: bigint): string {
  const start = timestampToDate(startDate);
  const end = timestampToDate(endDate);
  return `${format(start, "MMM d")} - ${format(end, "MMM d")}`;
}

export function TripHeader({
  trip,
  onBack,
  onEdit,
  onDelete,
  onSaveAsTemplate,
}: TripHeaderProps) {
  return (
    <div className="mb-8 flex flex-col items-start gap-4">
      <Button
        variant="ghost"
        className="-ml-2 text-muted-foreground hover:text-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to trips
      </Button>

      <div className="space-y-3 w-full">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="h-6 w-6 text-primary flex-shrink-0" />
            <h1 className="text-xl font-bold truncate">{trip.destination}</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onEdit}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
          </div>
          <Button variant="outline" size="sm" onClick={onSaveAsTemplate}>
            <Bookmark className="h-4 w-4 mr-1" />
            Save as Template
          </Button>
        </div>

        {trip.activities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {trip.activities.map((activity: string) => (
              <Badge key={activity} variant="secondary">
                {activity}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
