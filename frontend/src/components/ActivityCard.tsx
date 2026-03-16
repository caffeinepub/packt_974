import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dumbbell } from "lucide-react";
import { type CustomActivity } from "@/backend";
import { useDeleteCustomActivity } from "../hooks/useQueries";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { CardMenu } from "./CardMenu";

interface ActivityCardProps {
  activity: CustomActivity;
  onEdit?: () => void;
}

export function ActivityCard({ activity, onEdit }: ActivityCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { mutate: deleteActivity, isPending: isDeletingActivity } =
    useDeleteCustomActivity();

  const handleDelete = () => {
    deleteActivity(activity.id, {
      onSuccess: () => setDeleteDialogOpen(false),
    });
  };

  const itemCount = activity.suggestedItems.length;

  return (
    <>
      <Card
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={onEdit}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{activity.name}</CardTitle>
            </div>
            <CardMenu
              onEdit={onEdit}
              onDelete={() => setDeleteDialogOpen(true)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">
            {itemCount} suggested item{itemCount !== 1 ? "s" : ""}
          </Badge>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Activity"
        description={`Are you sure you want to delete "${activity.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        isPending={isDeletingActivity}
      />
    </>
  );
}
