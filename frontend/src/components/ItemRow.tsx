import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Briefcase, X } from "lucide-react";
import { type PackingItem, type Bag } from "@/backend";
import {
  useTogglePacked,
  useDeleteItem,
  useAssignToBag,
} from "../hooks/useQueries";
import { cn } from "@/lib/utils";
import { ItemFormDialog } from "./ItemFormDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { CardMenu } from "./CardMenu";
import { getOptionalValue } from "../utils/candid";
import { formatWeight } from "../utils/weight";

interface ItemRowProps {
  item: PackingItem;
  tripId: bigint;
  bags: Bag[];
  allItems: PackingItem[];
}

export function ItemRow({ item, tripId, bags, allItems }: ItemRowProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bagPopoverOpen, setBagPopoverOpen] = useState(false);

  const { mutate: togglePacked, isPending: isTogglingPacked } =
    useTogglePacked();
  const { mutate: deleteItem, isPending: isDeletingItem } = useDeleteItem();
  const { mutate: assignToBag, isPending: isAssigningToBag } = useAssignToBag();

  const bagIdValue = getOptionalValue(item.bagId);
  const assignedBag =
    bagIdValue !== undefined
      ? bags.find((b) => b.id === bagIdValue)
      : undefined;

  const weightValue = getOptionalValue(item.weight);
  const itemWeight =
    (weightValue ? Number(weightValue) : 0) * Number(item.quantity);

  const bagWeightInfo = (() => {
    if (!assignedBag) return null;

    const totalWeight = allItems.reduce((sum, i) => {
      const iBagIdValue = getOptionalValue(i.bagId);
      if (iBagIdValue !== undefined && iBagIdValue === assignedBag.id) {
        const iWeight = getOptionalValue(i.weight);
        return sum + (iWeight ? Number(iWeight) : 0) * Number(i.quantity);
      }
      return sum;
    }, 0);

    const limit = getOptionalValue(assignedBag.weightLimit);
    const limitNum = limit ? Number(limit) : null;

    if (limitNum === null)
      return { totalWeight, limit: null, isOver: false, isNear: false };

    const percentage = (totalWeight / limitNum) * 100;
    return {
      totalWeight,
      limit: limitNum,
      isOver: totalWeight > limitNum,
      isNear: percentage >= 80 && totalWeight <= limitNum,
    };
  })();

  const handleToggle = () => {
    togglePacked({ itemId: item.id, tripId });
  };

  const handleDelete = () => {
    deleteItem(
      { itemId: item.id, tripId },
      {
        onSuccess: () => setDeleteDialogOpen(false),
      },
    );
  };

  const handleAssignToBag = (bagId?: bigint) => {
    assignToBag(
      { itemId: item.id, tripId, bagId },
      {
        onSuccess: () => setBagPopoverOpen(false),
      },
    );
  };

  return (
    <>
      <div
        className={cn(
          "flex items-center justify-between py-2 -mx-2 px-2 rounded",
          item.packed && "bg-muted/50",
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Checkbox
            checked={item.packed}
            onCheckedChange={handleToggle}
            disabled={isTogglingPacked}
          />
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span
              className={cn(
                "text-sm truncate",
                item.packed && "line-through text-muted-foreground",
              )}
            >
              {item.name}
              {Number(item.quantity) > 1 && (
                <span className="text-muted-foreground ml-1">
                  x{Number(item.quantity)}
                </span>
              )}
            </span>

            {/* Bag Badge */}
            <Popover open={bagPopoverOpen} onOpenChange={setBagPopoverOpen}>
              <PopoverTrigger asChild>
                {assignedBag ? (
                  <Badge
                    variant={
                      bagWeightInfo?.isOver
                        ? "destructive"
                        : bagWeightInfo?.isNear
                          ? "outline"
                          : "secondary"
                    }
                    className={cn(
                      "cursor-pointer flex-shrink-0 text-xs",
                      bagWeightInfo?.isOver &&
                        "bg-destructive text-destructive-foreground hover:bg-destructive/80",
                      bagWeightInfo?.isNear &&
                        "border-yellow-500 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-950",
                      !bagWeightInfo?.isOver &&
                        !bagWeightInfo?.isNear &&
                        "hover:bg-secondary/80",
                    )}
                  >
                    <Briefcase className="h-3 w-3 mr-1" />
                    {bagWeightInfo?.isOver && bagWeightInfo.limit !== null
                      ? `${assignedBag.name} (${formatWeight(bagWeightInfo.totalWeight)}/${formatWeight(bagWeightInfo.limit)}!)`
                      : bagWeightInfo?.isNear && bagWeightInfo.limit !== null
                        ? `${assignedBag.name} (${formatWeight(bagWeightInfo.totalWeight)}/${formatWeight(bagWeightInfo.limit)})`
                        : assignedBag.name}
                  </Badge>
                ) : bags.length > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground flex-shrink-0"
                  >
                    <Briefcase className="h-3 w-3 mr-1" />
                    Assign
                  </Button>
                ) : null}
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1" align="start">
                <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                  Assign to bag
                </div>
                {bags.map((bag) => (
                  <Button
                    key={bag.id.toString()}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start text-sm h-8",
                      assignedBag?.id === bag.id && "bg-muted",
                    )}
                    onClick={() => handleAssignToBag(bag.id)}
                    disabled={isAssigningToBag}
                  >
                    {bag.name}
                  </Button>
                ))}
                {assignedBag && (
                  <>
                    <div className="h-px bg-border my-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-sm h-8 text-muted-foreground"
                      onClick={() => handleAssignToBag(undefined)}
                      disabled={isAssigningToBag}
                    >
                      <X className="h-4 w-4" />
                      Remove from bag
                    </Button>
                  </>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Item Weight Display */}
        {itemWeight > 0 && (
          <span className="text-sm text-muted-foreground tabular-nums flex-shrink-0 mr-1">
            {formatWeight(itemWeight)}
          </span>
        )}

        <CardMenu
          onEdit={() => setEditDialogOpen(true)}
          onDelete={() => setDeleteDialogOpen(true)}
        />
      </div>

      {/* Edit Dialog - using consolidated ItemFormDialog */}
      <ItemFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        tripId={tripId}
        bags={bags}
        item={item}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Item"
        description={`Are you sure you want to delete "${item.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        isPending={isDeletingItem}
      />
    </>
  );
}
