import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDialogFooter } from "./FormDialogFooter";
import { type Bag } from "@/backend";
import { useCreateBag, useUpdateBag } from "../hooks/useQueries";
import { getOptionalValue } from "../utils/candid";
import { gramsToKg, parseWeightToGrams } from "../utils/weight";

interface BagFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: bigint;
  bag?: Bag;
}

const SUGGESTED_NAMES = [
  "Carry-on",
  "Checked",
  "Personal",
  "Backpack",
  "Daypack",
];

export function BagFormDialog({
  open,
  onOpenChange,
  tripId,
  bag,
}: BagFormDialogProps) {
  const [name, setName] = useState("");
  const [weightLimit, setWeightLimit] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate: createBag, isPending: isCreatingBag } = useCreateBag();
  const { mutate: updateBag, isPending: isUpdatingBag } = useUpdateBag();
  const isEditing = !!bag;
  const isPending = isCreatingBag || isUpdatingBag;

  useEffect(() => {
    if (open) {
      setError(null);
      if (bag) {
        setName(bag.name);
        const wlValue = getOptionalValue(bag.weightLimit);
        setWeightLimit(
          wlValue !== undefined ? gramsToKg(Number(wlValue)).toString() : "",
        );
      } else {
        setName("");
        setWeightLimit("");
      }
    }
  }, [open, bag]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);
    const weightLimitGrams = parseWeightToGrams(weightLimit);

    const onError = (err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to save bag");
    };

    if (isEditing && bag) {
      updateBag(
        {
          bagId: bag.id,
          tripId,
          name: name.trim(),
          weightLimit: weightLimitGrams,
        },
        {
          onSuccess: () => onOpenChange(false),
          onError,
        },
      );
    } else {
      createBag(
        {
          tripId,
          name: name.trim(),
          weightLimit: weightLimitGrams,
        },
        {
          onSuccess: () => onOpenChange(false),
          onError,
        },
      );
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setName(suggestion);
    if (suggestion === "Carry-on") {
      setWeightLimit("7");
    } else if (suggestion === "Checked") {
      setWeightLimit("23");
    } else if (suggestion === "Personal") {
      setWeightLimit("5");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Bag" : "Add Bag"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the bag details below."
              : "Create a new bag to organize your items."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bag-name">Name</Label>
              <Input
                id="bag-name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
                placeholder="Bag name"
                autoFocus
                required
              />
              {!isEditing && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {SUGGESTED_NAMES.map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight-limit">Weight Limit (kg)</Label>
              <Input
                id="weight-limit"
                type="number"
                step="0.1"
                min="0"
                value={weightLimit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setWeightLimit(e.target.value)
                }
                placeholder="Optional"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for no weight tracking
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <FormDialogFooter
            onCancel={() => onOpenChange(false)}
            isPending={isPending}
            submitLabel={isEditing ? "Save Changes" : "Create Bag"}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
