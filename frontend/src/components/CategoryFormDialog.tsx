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
import { FormDialogFooter } from "./FormDialogFooter";
import { type CustomCategory } from "@/backend";
import {
  useCreateCustomCategory,
  useUpdateCustomCategory,
} from "../hooks/useQueries";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CustomCategory;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: CategoryFormDialogProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate: createCategory, isPending: isCreating } =
    useCreateCustomCategory();
  const { mutate: updateCategory, isPending: isUpdating } =
    useUpdateCustomCategory();

  const isEditMode = !!category;
  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (open && category) {
      setName(category.name);
    } else if (open && !category) {
      setName("");
    }
    setError(null);
  }, [open, category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);
    const onSuccess = () => onOpenChange(false);
    const onError = (err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to save category");
    };

    if (isEditMode && category) {
      updateCategory(
        { id: category.id, name: name.trim() },
        { onSuccess, onError },
      );
    } else {
      createCategory({ name: name.trim() }, { onSuccess, onError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Category" : "Create Category"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update the category name."
                : "Create a custom category for your items."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                placeholder="e.g., Photography Gear, Ski Equipment..."
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
                autoFocus
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <FormDialogFooter
            onCancel={() => onOpenChange(false)}
            isPending={isPending}
            submitLabel={isEditMode ? "Save Changes" : "Create Category"}
            submitDisabled={!name.trim()}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
