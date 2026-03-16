import { useState } from "react";
import { ArrowLeft, FileText, Trash2, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type PackingItem } from "@/backend";
import {
  useItems,
  useBags,
  useDeleteTemplate,
  useTemplate,
  useApplyTemplate,
} from "../hooks/useQueries";
import { BagSection } from "./BagSection";
import { ItemsList } from "./ItemsList";
import { ItemFormDialog } from "./ItemFormDialog";
import { TripFormDialog } from "./TripFormDialog";
import { TemplateFormDialog } from "./TemplateFormDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { PageLoader } from "./PageLoader";

interface TemplateDetailPageProps {
  templateId: bigint;
  onBack: () => void;
  onNavigateToTrip?: (tripId: bigint) => void;
}

export function TemplateDetailPage({
  templateId,
  onBack,
  onNavigateToTrip,
}: TemplateDetailPageProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createTripDialogOpen, setCreateTripDialogOpen] = useState(false);

  const { data: template, isLoading: templateLoading } =
    useTemplate(templateId);
  const { data: items, isLoading: itemsLoading } = useItems(templateId);
  const { data: bags, isLoading: bagsLoading } = useBags(templateId);
  const { mutate: deleteTemplate, isPending: isDeletingTemplate } =
    useDeleteTemplate();
  const { mutate: applyTemplate } = useApplyTemplate();

  const handleDeleteTemplate = () => {
    deleteTemplate(templateId, {
      onSuccess: () => onBack(),
    });
  };

  const handleTripCreated = (tripId: bigint) => {
    applyTemplate(
      { tripId, templateId },
      {
        onSuccess: () => {
          if (onNavigateToTrip) {
            onNavigateToTrip(tripId);
          }
        },
      },
    );
  };

  const isLoading = templateLoading || itemsLoading || bagsLoading;

  if (isLoading || !template) {
    return <PageLoader message="Loading template..." />;
  }

  const templateItems =
    items?.map((item: PackingItem) => ({
      ...item,
      packed: false,
    })) ?? [];

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col items-start gap-4">
          <Button
            variant="ghost"
            className="-ml-2 text-muted-foreground hover:text-foreground"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Button>

          <div className="space-y-3 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold">{template.name}</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={() => setCreateTripDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Trip
              </Button>
            </div>

            {template.description && (
              <p className="text-muted-foreground">{template.description}</p>
            )}

            <p className="text-sm text-muted-foreground">
              {Number(template.itemCount)} item
              {Number(template.itemCount) !== 1 ? "s" : ""}
              {Number(template.bagCount) > 0 && (
                <>
                  , {Number(template.bagCount)} bag
                  {Number(template.bagCount) !== 1 ? "s" : ""}
                </>
              )}
            </p>
          </div>
        </div>

        <BagSection
          bags={bags ?? []}
          items={templateItems}
          tripId={templateId}
        />

        <ItemsList
          items={templateItems}
          tripId={templateId}
          bags={bags ?? []}
          onAddItem={() => setAddDialogOpen(true)}
        />

        <ItemFormDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          tripId={templateId}
          bags={bags ?? []}
        />

        <TemplateFormDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          mode="edit"
          template={template}
        />

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Template"
          description="Are you sure you want to delete this template? This will also delete all items and bags. This action cannot be undone."
          onConfirm={handleDeleteTemplate}
          isPending={isDeletingTemplate}
        />

        <TripFormDialog
          open={createTripDialogOpen}
          onOpenChange={setCreateTripDialogOpen}
          mode="create"
          onCreated={handleTripCreated}
        />
      </div>
    </main>
  );
}
