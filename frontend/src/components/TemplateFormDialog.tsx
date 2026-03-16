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
import { Textarea } from "@/components/ui/textarea";
import { FormDialogFooter } from "./FormDialogFooter";
import {
  useCreateTemplate,
  useUpdateTemplate,
  useCustomActivities,
} from "../hooks/useQueries";
import { type TemplateView } from "@/backend";
import { PREDEFINED_ACTIVITIES } from "../constants";

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  template?: TemplateView;
  onCreated?: (templateId: bigint) => void;
}

export function TemplateFormDialog({
  open,
  onOpenChange,
  mode,
  template,
  onCreated,
}: TemplateFormDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { mutate: createTemplate, isPending: isCreatingTemplate } =
    useCreateTemplate();
  const { mutate: updateTemplate, isPending: isUpdatingTemplate } =
    useUpdateTemplate();
  const { data: customActivities } = useCustomActivities();

  const isEditMode = mode === "edit";
  const isPending = isCreatingTemplate || isUpdatingTemplate;

  useEffect(() => {
    if (open && isEditMode && template) {
      setName(template.name);
      setDescription(template.description);
      setSelectedActivities([...template.activities]);
    }
  }, [open, isEditMode, template]);

  const toggleActivity = (activity: string) => {
    setSelectedActivities((prev) =>
      prev.includes(activity)
        ? prev.filter((a) => a !== activity)
        : [...prev, activity],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);

    if (isEditMode && template) {
      updateTemplate(
        {
          id: template.id,
          name: name.trim(),
          description: description.trim(),
          activities: selectedActivities,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
          onError: (err: unknown) => {
            setError(
              err instanceof Error ? err.message : "Failed to update template",
            );
          },
        },
      );
    } else {
      createTemplate(
        {
          name: name.trim(),
          description: description.trim(),
          activities: selectedActivities,
        },
        {
          onSuccess: (templateId) => {
            resetForm();
            onOpenChange(false);
            if (onCreated) {
              onCreated(templateId);
            }
          },
          onError: (err: unknown) => {
            setError(
              err instanceof Error ? err.message : "Failed to create template",
            );
          },
        },
      );
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setSelectedActivities([]);
    setError(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isEditMode) {
      resetForm();
    }
    if (!newOpen) {
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Template" : "Create Template"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the template details."
              : "Create a new reusable packing template."}
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
                placeholder="e.g., Beach Trip Essentials"
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

            <div className="space-y-2">
              <Label>Activities (optional)</Label>
              <p className="text-sm text-muted-foreground">
                Select activities to get item suggestions when applying this
                template.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {PREDEFINED_ACTIVITIES.map((activity) => (
                  <Button
                    key={activity}
                    type="button"
                    variant={
                      selectedActivities.includes(activity)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => toggleActivity(activity)}
                  >
                    {activity}
                  </Button>
                ))}
                {customActivities?.map((activity) => (
                  <Button
                    key={`custom-${activity.id}`}
                    type="button"
                    variant={
                      selectedActivities.includes(activity.name)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => toggleActivity(activity.name)}
                  >
                    {activity.name}
                  </Button>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <FormDialogFooter
            onCancel={() => handleOpenChange(false)}
            isPending={isPending}
            submitLabel={isEditMode ? "Save Changes" : "Create Template"}
            submitDisabled={!name.trim()}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
