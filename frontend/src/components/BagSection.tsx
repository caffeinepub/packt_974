import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { BagCard } from "./BagCard";
import { BagFormDialog } from "./BagFormDialog";
import { type Bag, type PackingItem } from "@/backend";

interface BagSectionProps {
  bags: Bag[];
  items: PackingItem[];
  tripId: bigint;
}

export function BagSection({ bags, items, tripId }: BagSectionProps) {
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingBag, setEditingBag] = useState<Bag | undefined>(undefined);

  const handleAddBag = () => {
    setEditingBag(undefined);
    setFormDialogOpen(true);
  };

  const handleEditBag = (bag: Bag) => {
    setEditingBag(bag);
    setFormDialogOpen(true);
  };

  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          My Bags
        </h3>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {bags.map((bag) => (
          <BagCard
            key={bag.id.toString()}
            bag={bag}
            items={items}
            tripId={tripId}
            onEdit={handleEditBag}
          />
        ))}

        {/* Add Bag Card */}
        <Card
          className="min-w-[140px] flex-shrink-0 cursor-pointer hover:bg-muted/50 transition-colors border-dashed"
          onClick={handleAddBag}
        >
          <CardContent className="p-3 flex flex-col items-center justify-center gap-1 h-full min-h-[80px]">
            <Plus className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Add Bag</span>
          </CardContent>
        </Card>
      </div>

      <BagFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        tripId={tripId}
        bag={editingBag}
      />
    </div>
  );
}
