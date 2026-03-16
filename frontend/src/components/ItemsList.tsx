import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Package, FileText } from "lucide-react";
import { type PackingItem, type Bag } from "@/backend";
import { type PackedFilter, type BagFilter } from "../hooks/useQueries";
import { ItemRow } from "./ItemRow";
import { cn } from "@/lib/utils";

interface ItemsListProps {
  items: PackingItem[];
  tripId: bigint;
  bags: Bag[];
  onAddItem: () => void;
  onApplyTemplate?: () => void;
  packedFilter?: PackedFilter;
  onPackedFilterChange?: (filter: PackedFilter) => void;
  bagFilter?: BagFilter;
  onBagFilterChange?: (filter: BagFilter) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Clothing: "👕",
  Toiletries: "🧴",
  Electronics: "📱",
  Documents: "📄",
  Accessories: "👜",
  Other: "📦",
};

export function ItemsList({
  items,
  tripId,
  bags,
  onAddItem,
  onApplyTemplate,
  packedFilter,
  onPackedFilterChange,
  bagFilter,
  onBagFilterChange,
}: ItemsListProps) {
  const groupedItems = useMemo(() => {
    const groups: Record<string, PackingItem[]> = {};
    for (const item of items) {
      const category = item.category || "Other";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    }
    return groups;
  }, [items]);

  const categories = Object.keys(groupedItems).sort();

  const packedFilterOptions: { label: string; value: PackedFilter }[] = [
    { label: "All", value: null },
    { label: "Unpacked", value: false },
    { label: "Packed", value: true },
  ];

  const bagFilterToString = (filter: BagFilter | undefined): string => {
    if (filter === undefined || filter === "all") return "all";
    if (filter === "unassigned") return "unassigned";
    return filter.toString();
  };

  const stringToBagFilter = (value: string): BagFilter => {
    if (value === "all") return "all";
    if (value === "unassigned") return "unassigned";
    return BigInt(value);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Packing List</h2>
        <div className="flex gap-2">
          {onApplyTemplate && (
            <Button onClick={onApplyTemplate} size="sm" variant="outline">
              <FileText className="h-4 w-4 mr-1" />
              Apply Template
            </Button>
          )}
          <Button onClick={onAddItem} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Packed status filter */}
        {onPackedFilterChange && (
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {packedFilterOptions.map((option) => (
              <Button
                key={option.label}
                variant="ghost"
                size="sm"
                onClick={() => onPackedFilterChange(option.value)}
                className={cn(
                  "px-3 h-7",
                  packedFilter === option.value
                    ? "bg-background text-foreground shadow-sm hover:bg-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-transparent",
                )}
              >
                {option.label}
              </Button>
            ))}
          </div>
        )}

        {/* Bag filter dropdown */}
        {onBagFilterChange && bags.length > 0 && (
          <Select
            value={bagFilterToString(bagFilter)}
            onValueChange={(value) =>
              onBagFilterChange(stringToBagFilter(value))
            }
          >
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Filter by bag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bags</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {bags.map((bag) => (
                <SelectItem key={bag.id.toString()} value={bag.id.toString()}>
                  {bag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
            <Package className="h-12 w-12 text-muted-foreground" />
            <div className="flex flex-col items-center gap-2">
              <p className="text-lg font-medium">
                {(() => {
                  const hasPackedFilter =
                    packedFilter !== null && packedFilter !== undefined;
                  const hasBagFilter =
                    bagFilter !== undefined && bagFilter !== "all";

                  if (!hasPackedFilter && !hasBagFilter) return "No items yet";
                  if (hasPackedFilter && !hasBagFilter) {
                    return packedFilter
                      ? "No packed items"
                      : "No unpacked items";
                  }
                  if (!hasPackedFilter && hasBagFilter) {
                    return bagFilter === "unassigned"
                      ? "No unassigned items"
                      : "No items in this bag";
                  }
                  return "No items match filters";
                })()}
              </p>
              <p className="text-muted-foreground">
                {(() => {
                  const hasPackedFilter =
                    packedFilter !== null && packedFilter !== undefined;
                  const hasBagFilter =
                    bagFilter !== undefined && bagFilter !== "all";

                  if (!hasPackedFilter && !hasBagFilter)
                    return "Start adding items to your packing list";
                  if (hasPackedFilter && !hasBagFilter) {
                    return packedFilter
                      ? "Pack some items to see them here"
                      : "All items are packed!";
                  }
                  if (!hasPackedFilter && hasBagFilter) {
                    return bagFilter === "unassigned"
                      ? "All items are assigned to bags"
                      : "Assign items to this bag to see them here";
                  }
                  return "Try adjusting your filters";
                })()}
              </p>
            </div>
            {packedFilter === null &&
              (bagFilter === undefined || bagFilter === "all") && (
                <Button onClick={onAddItem}>
                  <Plus className="h-4 w-4" />
                  Add Your First Item
                </Button>
              )}
            {(packedFilter !== null ||
              (bagFilter !== undefined && bagFilter !== "all")) && (
              <Button
                variant="outline"
                onClick={() => {
                  onPackedFilterChange?.(null);
                  onBagFilterChange?.("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => {
            const categoryItems = groupedItems[category];
            const packedCount = categoryItems.filter((i) => i.packed).length;
            const icon = CATEGORY_ICONS[category] ?? "📦";

            return (
              <Card key={category}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span>{icon}</span>
                      {category}
                    </CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {packedCount}/{categoryItems.length}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="divide-y">
                    {categoryItems.map((item) => (
                      <ItemRow
                        key={item.id.toString()}
                        item={item}
                        tripId={tripId}
                        bags={bags}
                        allItems={items}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
