import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { type TemplateView } from "@/backend";
import { useTemplates, useApplyTemplate } from "../hooks/useQueries";

interface ApplyTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: bigint;
}

const NO_TEMPLATE_VALUE = "__none__";

export function ApplyTemplateDialog({
  open,
  onOpenChange,
  tripId,
}: ApplyTemplateDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<string>(NO_TEMPLATE_VALUE);
  const [error, setError] = useState<string | null>(null);

  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const { mutate: applyTemplate, isPending: isApplyingTemplate } =
    useApplyTemplate();

  const selectedTemplate = templates?.find(
    (t: TemplateView) => t.id.toString() === selectedTemplateId,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedTemplateId === NO_TEMPLATE_VALUE) {
      return;
    }

    setError(null);
    const templateIdBigInt = BigInt(selectedTemplateId);

    applyTemplate(
      {
        tripId,
        templateId: templateIdBigInt,
      },
      {
        onSuccess: () => {
          setSelectedTemplateId(NO_TEMPLATE_VALUE);
          setError(null);
          onOpenChange(false);
        },
        onError: (err: unknown) => {
          setError(
            err instanceof Error ? err.message : "Failed to apply template",
          );
        },
      },
    );
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedTemplateId(NO_TEMPLATE_VALUE);
      setError(null);
    }
    onOpenChange(newOpen);
  };

  const hasTemplates = templates && templates.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply Template</DialogTitle>
          <DialogDescription>
            Add items from a saved template to your trip.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {templatesLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !hasTemplates ? (
              <p className="text-sm text-muted-foreground">
                No templates available. Save a trip as a template first.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="template">Select template</Label>
                  <Select
                    value={selectedTemplateId}
                    onValueChange={setSelectedTemplateId}
                  >
                    <SelectTrigger id="template">
                      <SelectValue placeholder="Choose a template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_TEMPLATE_VALUE}>
                        Choose a template
                      </SelectItem>
                      {templates.map((template: TemplateView) => (
                        <SelectItem
                          key={template.id.toString()}
                          value={template.id.toString()}
                        >
                          {template.name} ({Number(template.itemCount)} items)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate && (
                  <p className="text-sm text-muted-foreground">
                    This will add {Number(selectedTemplate.itemCount)} item
                    {Number(selectedTemplate.itemCount) !== 1 ? "s" : ""}
                    {Number(selectedTemplate.bagCount) > 0 && (
                      <>
                        {" "}
                        and {Number(selectedTemplate.bagCount)} bag
                        {Number(selectedTemplate.bagCount) !== 1 ? "s" : ""}
                      </>
                    )}{" "}
                    to your trip.
                  </p>
                )}
              </>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isApplyingTemplate ||
                !hasTemplates ||
                selectedTemplateId === NO_TEMPLATE_VALUE
              }
            >
              {isApplyingTemplate && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Apply
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
