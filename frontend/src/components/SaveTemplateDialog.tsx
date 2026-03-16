import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormDialogFooter } from "./FormDialogFooter";
import { useSaveAsTemplate } from "../hooks/useQueries";

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: bigint;
  tripName: string;
  itemCount: number;
}

export function SaveTemplateDialog({
  open,
  onOpenChange,
  tripId,
  tripName,
  itemCount,
}: SaveTemplateDialogProps) {
  const [name, setName] = useState(tripName);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate: saveTemplate, isPending: isSavingTemplate } =
    useSaveAsTemplate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);
    saveTemplate(
      {
        tripId,
        name: name.trim(),
        description: description.trim(),
      },
      {
        onSuccess: () => {
          setName("");
          setDescription("");
          setError(null);
          onOpenChange(false);
        },
        onError: (err: unknown) => {
          setError(
            err instanceof Error ? err.message : "Failed to save template",
          );
        },
      },
    );
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName(tripName);
      setDescription("");
      setError(null);
    } else {
      setName(tripName);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Save your packing list for future use.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Name</Label>
              <Input
                id="template-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Template name"
                autoFocus
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">
                Description (optional)
              </Label>
              <Textarea
                id="template-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Great for tropical vacations..."
                rows={2}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              Items to save: {itemCount} item{itemCount !== 1 ? "s" : ""}
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <FormDialogFooter
            onCancel={() => handleOpenChange(false)}
            isPending={isSavingTemplate}
            submitLabel="Save Template"
            submitDisabled={!name.trim()}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
