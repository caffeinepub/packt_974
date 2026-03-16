import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { type TemplateView } from "@/backend";
import { useDeleteTemplate } from "../hooks/useQueries";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { CardMenu } from "./CardMenu";

interface TemplateCardProps {
  template: TemplateView;
  onClick?: () => void;
}

export function TemplateCard({ template, onClick }: TemplateCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { mutate: deleteTemplate, isPending: isDeletingTemplate } =
    useDeleteTemplate();

  const handleDelete = () => {
    deleteTemplate(template.id, {
      onSuccess: () => setDeleteDialogOpen(false),
    });
  };

  return (
    <>
      <Card
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{template.name}</CardTitle>
            </div>
            <CardMenu onDelete={() => setDeleteDialogOpen(true)} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {template.description && (
            <p className="text-sm text-muted-foreground">
              {template.description}
            </p>
          )}
          {template.activities && template.activities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {template.activities.map((activity: string) => (
                <Badge key={activity} variant="secondary" className="text-xs">
                  {activity}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Badge variant="outline">
              {Number(template.itemCount)} item
              {Number(template.itemCount) !== 1 ? "s" : ""}
            </Badge>
            {Number(template.bagCount) > 0 && (
              <Badge variant="outline">
                {Number(template.bagCount)} bag
                {Number(template.bagCount) !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Template"
        description={`Are you sure you want to delete "${template.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        isPending={isDeletingTemplate}
      />
    </>
  );
}
