import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormDialogFooter } from "./FormDialogFooter";
import { type Bag, type PackingItem } from "@/backend";
import {
  useAddItem,
  useUpdateItem,
  useCustomCategories,
} from "../hooks/useQueries";
import { getOptionalValue } from "../utils/candid";
import { gramsToKg, parseWeightToGrams } from "../utils/weight";

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: bigint;
  bags: Bag[];
  item?: PackingItem;
}

const CATEGORIES = [
  "Clothing",
  "Toiletries",
  "Electronics",
  "Documents",
  "Accessories",
  "Other",
];

const NO_BAG_VALUE = "__none__";

export function ItemFormDialog({
  open,
  onOpenChange,
  tripId,
  bags,
  item,
}: ItemFormDialogProps) {
  const isEditMode = !!item;

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Clothing");
  const [quantity, setQuantity] = useState("1");
  const [weight, setWeight] = useState("");
  const [selectedBagId, setSelectedBagId] = useState<string>(NO_BAG_VALUE);
  const [error, setError] = useState<string | null>(null);

  const { mutate: addItem, isPending: isAdding } = useAddItem();
  const { mutate: updateItem, isPending: isUpdating } = useUpdateItem();
  const { data: customCategories } = useCustomCategories();

  const isPending = isAdding || isUpdating;

  // Combine default categories with custom categories
  const allCategories = [
    ...CATEGORIES,
    ...(customCategories?.map((c) => c.name) ?? []),
  ];

  useEffect(() => {
    if (open && item) {
      setName(item.name);
      setCategory(item.category);
      setQuantity(Number(item.quantity).toString());

      const weightVal = getOptionalValue(item.weight);
      setWeight(weightVal ? gramsToKg(Number(weightVal)).toString() : "");

      const bagIdVal = getOptionalValue(item.bagId);
      setSelectedBagId(bagIdVal ? bagIdVal.toString() : NO_BAG_VALUE);
    }
  }, [open, item]);

  const resetForm = () => {
    setName("");
    setCategory("Clothing");
    setQuantity("1");
    setWeight("");
    setSelectedBagId(NO_BAG_VALUE);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    if (!name.trim() || qty < 1) return;

    setError(null);
    const weightGrams = parseWeightToGrams(weight);
    const bagId =
      selectedBagId !== NO_BAG_VALUE ? BigInt(selectedBagId) : undefined;

    const onError = (err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to save item");
    };

    if (isEditMode && item) {
      updateItem(
        {
          itemId: item.id,
          tripId,
          name: name.trim(),
          category,
          quantity: BigInt(qty),
          weight: weightGrams,
          bagId,
        },
        {
          onSuccess: () => {
            resetForm();
            onOpenChange(false);
          },
          onError,
        },
      );
    } else {
      addItem(
        {
          tripId,
          name: name.trim(),
          category,
          quantity: BigInt(qty),
          weight: weightGrams,
          bagId,
        },
        {
          onSuccess: () => {
            resetForm();
            onOpenChange(false);
          },
          onError,
        },
      );
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isPending) {
      return;
    }
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Item" : "Add Item"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the item details below."
              : "Add a new item to your packing list."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
                placeholder="Item name"
                autoFocus={!isEditMode}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setQuantity(e.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="0"
                  value={weight}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setWeight(e.target.value)
                  }
                  placeholder="Optional"
                />
              </div>
            </div>

            {bags.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="bag">Bag</Label>
                <Select value={selectedBagId} onValueChange={setSelectedBagId}>
                  <SelectTrigger id="bag">
                    <SelectValue placeholder="Select bag (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_BAG_VALUE}>No bag</SelectItem>
                    {bags.map((bag) => (
                      <SelectItem
                        key={bag.id.toString()}
                        value={bag.id.toString()}
                      >
                        {bag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <FormDialogFooter
            onCancel={() => handleOpenChange(false)}
            isPending={isPending}
            submitLabel={isEditMode ? "Save Changes" : "Add Item"}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
