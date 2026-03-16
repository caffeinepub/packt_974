import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { FormDialogFooter } from "./FormDialogFooter";
import { type CustomActivity } from "@/backend";
import {
  useCreateCustomActivity,
  useUpdateCustomActivity,
  useCustomCategories,
} from "../hooks/useQueries";

interface ActivityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: CustomActivity;
}

interface EditableItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
}

const CATEGORIES = [
  "Clothing",
  "Toiletries",
  "Electronics",
  "Documents",
  "Accessories",
  "Other",
];

export function ActivityFormDialog({
  open,
  onOpenChange,
  activity,
}: ActivityFormDialogProps) {
  const [name, setName] = useState("");
  const [items, setItems] = useState<EditableItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Other");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const { mutate: createActivity, isPending: isCreatingActivity } =
    useCreateCustomActivity();
  const { mutate: updateActivity, isPending: isUpdatingActivity } =
    useUpdateCustomActivity();
  const { data: customCategories } = useCustomCategories();

  const isEditMode = !!activity;
  const isPending = isCreatingActivity || isUpdatingActivity;

  // Combine default categories with custom categories
  const allCategories = [
    ...CATEGORIES,
    ...(customCategories?.map((c) => c.name) ?? []),
  ];

  useEffect(() => {
    if (open && activity) {
      setName(activity.name);
      setItems(
        activity.suggestedItems.map((item, index) => ({
          id: `existing-${index}`,
          name: item.name,
          category: item.category,
          quantity: Number(item.quantity),
        })),
      );
    } else if (open && !activity) {
      setName("");
      setItems([]);
    }
  }, [open, activity]);

  const resetForm = () => {
    setName("");
    setItems([]);
    setNewItemName("");
    setNewItemCategory("Other");
    setNewItemQuantity(1);
    setError(null);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) return;

    setItems((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        name: newItemName.trim(),
        category: newItemCategory,
        quantity: newItemQuantity,
      },
    ]);
    setNewItemName("");
    setNewItemQuantity(1);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    setError(null);
    const suggestedItems = items.map((item) => ({
      name: item.name,
      category: item.category,
      quantity: BigInt(item.quantity),
    }));

    const onSuccess = () => {
      resetForm();
      onOpenChange(false);
    };

    const onError = (err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to save activity");
    };

    if (isEditMode && activity) {
      updateActivity(
        {
          id: activity.id,
          name: name.trim(),
          suggestedItems,
        },
        { onSuccess, onError },
      );
    } else {
      createActivity(
        {
          name: name.trim(),
          suggestedItems,
        },
        { onSuccess, onError },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Activity" : "Create Activity"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="activityName">Activity Name</Label>
              <Input
                id="activityName"
                placeholder="e.g., Photography, Yoga, Skiing..."
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
              />
            </div>

            <div className="space-y-3">
              <Label>Suggested Items</Label>
              <p className="text-sm text-muted-foreground">
                Items that will be suggested when this activity is selected for
                a trip.
              </p>

              {items.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                    >
                      <span className="flex-1 text-sm">{item.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.category}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-xs text-muted-foreground">
                          x{item.quantity}
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 items-end pt-2 border-t">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Item Name</Label>
                  <Input
                    placeholder="Item name..."
                    value={newItemName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewItemName(e.target.value)
                    }
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                    className="h-8"
                  />
                </div>
                <div className="w-28 space-y-1">
                  <Label className="text-xs">Category</Label>
                  <Select
                    value={newItemCategory}
                    onValueChange={setNewItemCategory}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-16 space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    min={1}
                    value={newItemQuantity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewItemQuantity(
                        Math.max(1, parseInt(e.target.value) || 1),
                      )
                    }
                    className="h-8"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleAddItem}
                  disabled={!newItemName.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <FormDialogFooter
            onCancel={() => handleClose(false)}
            isPending={isPending}
            submitLabel={isEditMode ? "Save Changes" : "Create Activity"}
            submitDisabled={!name.trim()}
            pendingLabel={isEditMode ? "Saving..." : "Creating..."}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
