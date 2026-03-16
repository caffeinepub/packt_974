import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase } from "lucide-react";
import { type Bag, type PackingItem } from "@/backend";
import { useDeleteBag } from "../hooks/useQueries";
import { cn } from "@/lib/utils";
import { getOptionalValue, getOptionalNumber } from "../utils/candid";
import { gramsToKg } from "../utils/weight";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { CardMenu } from "./CardMenu";

interface BagCardProps {
  bag: Bag;
  items: PackingItem[];
  tripId: bigint;
  onEdit: (bag: Bag) => void;
}

export function BagCard({ bag, items, tripId, onEdit }: BagCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { mutate: deleteBag, isPending: isDeletingBag } = useDeleteBag();

  const bagItems = items.filter((item) => {
    const bagIdValue = getOptionalValue(item.bagId);
    return bagIdValue !== undefined && bagIdValue === bag.id;
  });
  const itemCount = bagItems.length;

  const totalWeightGrams = bagItems.reduce((sum, item) => {
    return sum + getOptionalNumber(item.weight) * Number(item.quantity);
  }, 0);

  const totalWeightKg = gramsToKg(totalWeightGrams);
  const weightLimitValue = getOptionalValue(bag.weightLimit);
  const weightLimitKg =
    weightLimitValue !== undefined ? gramsToKg(Number(weightLimitValue)) : null;

  const weightPercentage = weightLimitKg
    ? Math.min((totalWeightKg / weightLimitKg) * 100, 100)
    : 0;

  const getProgressColor = () => {
    if (!weightLimitKg) return "bg-muted";
    if (totalWeightKg > weightLimitKg) return "bg-destructive";
    if (weightPercentage >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const handleDelete = () => {
    deleteBag(
      { bagId: bag.id, tripId },
      {
        onSuccess: () => setDeleteDialogOpen(false),
      },
    );
  };

  return (
    <>
      <Card className="min-w-[140px] flex-shrink-0">
        <CardContent className="p-3 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-1">
            <div className="flex items-center gap-2 min-w-0">
              <Briefcase className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="font-medium text-sm truncate">{bag.name}</span>
            </div>
            <CardMenu
              size="sm"
              onEdit={() => onEdit(bag)}
              onDelete={() => setDeleteDialogOpen(true)}
            />
          </div>

          <div className="text-xs text-muted-foreground">
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </div>

          {weightLimitKg && (
            <div className="flex flex-col gap-1">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full transition-all", getProgressColor())}
                  style={{ width: `${weightPercentage}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                <span
                  className={cn(
                    totalWeightKg > weightLimitKg &&
                      "text-destructive font-medium",
                  )}
                >
                  {totalWeightKg.toFixed(1)}
                </span>
                /{weightLimitKg}kg
              </div>
            </div>
          )}

          {!weightLimitKg && totalWeightGrams > 0 && (
            <div className="text-xs text-muted-foreground">
              {totalWeightKg.toFixed(1)}kg
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Bag"
        description={`Are you sure you want to delete "${bag.name}"? Items in this bag will become unassigned.`}
        onConfirm={handleDelete}
        isPending={isDeletingBag}
      />
    </>
  );
}
