import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Luggage,
  LogOut,
  Pencil,
  Loader2,
  FileText,
  Settings2,
  Dumbbell,
  Tag,
} from "lucide-react";
import {
  type Trip,
  type TemplateView,
  type CustomActivity,
  type CustomCategory,
} from "@/backend";
import {
  useTrips,
  useDeleteTrip,
  useTemplates,
  useCustomActivities,
  useCustomCategories,
  useDeleteCustomActivity,
  useDeleteCustomCategory,
} from "../hooks/useQueries";
import { TripCard } from "./TripCard";
import { TripFormDialog } from "./TripFormDialog";
import { TemplateCard } from "./TemplateCard";
import { TemplateFormDialog } from "./TemplateFormDialog";
import { ActivityFormDialog } from "./ActivityFormDialog";
import { CategoryFormDialog } from "./CategoryFormDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { EditNameDialog } from "./EditNameDialog";
import { CardMenu } from "./CardMenu";

interface DashboardProps {
  userName: string;
  onLogout: () => void;
  onSelectTrip: (tripId: bigint) => void;
  onSelectTemplate: (templateId: bigint) => void;
}

export function Dashboard({
  userName,
  onLogout,
  onSelectTrip,
  onSelectTemplate,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "trips" | "templates" | "customize"
  >("trips");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createTemplateDialogOpen, setCreateTemplateDialogOpen] =
    useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editActivity, setEditActivity] = useState<CustomActivity | null>(null);
  const [editCategory, setEditCategory] = useState<CustomCategory | null>(null);
  const [deleteActivity, setDeleteActivity] = useState<CustomActivity | null>(
    null,
  );
  const [deleteCategory, setDeleteCategory] = useState<CustomCategory | null>(
    null,
  );
  const [editTrip, setEditTrip] = useState<Trip | null>(null);
  const [deleteTrip, setDeleteTrip] = useState<Trip | null>(null);
  const [editNameDialogOpen, setEditNameDialogOpen] = useState(false);
  const { data: trips, isLoading } = useTrips();
  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const { data: activities, isLoading: activitiesLoading } =
    useCustomActivities();
  const { data: categories, isLoading: categoriesLoading } =
    useCustomCategories();
  const { mutate: deleteTripMutate, isPending: isDeletingTrip } =
    useDeleteTrip();
  const { mutate: deleteActivityMutate, isPending: isDeletingActivity } =
    useDeleteCustomActivity();
  const { mutate: deleteCategoryMutate, isPending: isDeletingCategory } =
    useDeleteCustomCategory();

  const handleCreate = () => {
    if (activeTab === "trips") {
      setCreateDialogOpen(true);
    } else if (activeTab === "templates") {
      setCreateTemplateDialogOpen(true);
    }
  };

  const getCreateButtonLabel = () => {
    switch (activeTab) {
      case "trips":
        return "Create Trip";
      case "templates":
        return "Create Template";
      default:
        return "Create";
    }
  };

  const customizeLoading = activitiesLoading || categoriesLoading;

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between flex-row">
          <div>
            <h1 className="text-4xl font-bold">Packt</h1>
          </div>
          <div className="flex items-center gap-3">
            {activeTab !== "customize" && (
              <Button className="gap-2" onClick={handleCreate}>
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline">
                  {getCreateButtonLabel()}
                </span>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-10 w-10 cursor-pointer">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Welcome back, {userName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setEditNameDialogOpen(true)}>
                  <Pencil className="h-4 w-4" />
                  Edit Name
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) =>
            setActiveTab(v as "trips" | "templates" | "customize")
          }
        >
          <TabsList className="mb-6">
            <TabsTrigger value="trips" className="gap-2">
              <Luggage className="h-4 w-4" />
              Trips
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="customize" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Customize
            </TabsTrigger>
          </TabsList>

          {/* Trips Tab */}
          <TabsContent value="trips">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : trips && trips.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {trips.map((trip: Trip) => (
                  <TripCard
                    key={trip.id.toString()}
                    trip={trip}
                    onClick={() => onSelectTrip(trip.id)}
                    onEdit={() => setEditTrip(trip)}
                    onDelete={() => setDeleteTrip(trip)}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
                  <Luggage className="h-12 w-12 text-muted-foreground" />
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-lg font-medium">No trips yet</p>
                    <p className="text-muted-foreground">
                      Start by creating your first packing list
                    </p>
                  </div>
                  <Button
                    className="gap-2"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    <Plus className="h-5 w-5" />
                    Create Your First Trip
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            {templatesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : templates && templates.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template: TemplateView) => (
                  <TemplateCard
                    key={template.id.toString()}
                    template={template}
                    onClick={() => onSelectTemplate(template.id)}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-lg font-medium">No templates yet</p>
                    <p className="text-muted-foreground">
                      Create a template or save a trip as a template to reuse it
                      later
                    </p>
                  </div>
                  <Button
                    className="gap-2"
                    onClick={() => setCreateTemplateDialogOpen(true)}
                  >
                    <Plus className="h-5 w-5" />
                    Create Your First Template
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Customize Tab */}
          <TabsContent value="customize">
            {customizeLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Activities Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-5 w-5 text-muted-foreground" />
                      <h2 className="text-lg font-semibold">Activities</h2>
                      <span className="text-sm text-muted-foreground">
                        ({activities?.length || 0})
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActivityDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Activity
                    </Button>
                  </div>
                  {activities && activities.length > 0 ? (
                    <div className="space-y-1">
                      {activities.map((activity: CustomActivity) => (
                        <div
                          key={activity.id.toString()}
                          className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <Dumbbell className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{activity.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {activity.suggestedItems.length} item
                              {activity.suggestedItems.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <CardMenu
                            size="sm"
                            onEdit={() => setEditActivity(activity)}
                            onDelete={() => setDeleteActivity(activity)}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">
                      No custom activities yet. Add activities with suggested
                      items to use in your trips.
                    </p>
                  )}
                </div>

                {/* Categories Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Tag className="h-5 w-5 text-muted-foreground" />
                      <h2 className="text-lg font-semibold">Categories</h2>
                      <span className="text-sm text-muted-foreground">
                        ({categories?.length || 0})
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCategoryDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Category
                    </Button>
                  </div>
                  {categories && categories.length > 0 ? (
                    <div className="space-y-1">
                      {categories.map((category: CustomCategory) => (
                        <div
                          key={category.id.toString()}
                          className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <CardMenu
                            size="sm"
                            onEdit={() => setEditCategory(category)}
                            onDelete={() => setDeleteCategory(category)}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">
                      No custom categories yet. Add categories to organize your
                      items beyond the defaults.
                    </p>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <TripFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        mode="create"
        onCreated={(tripId) => onSelectTrip(tripId)}
      />

      {editTrip && (
        <TripFormDialog
          open={!!editTrip}
          onOpenChange={(open) => !open && setEditTrip(null)}
          mode="edit"
          trip={editTrip}
        />
      )}

      <DeleteConfirmDialog
        open={!!deleteTrip}
        onOpenChange={(open) => !open && !isDeletingTrip && setDeleteTrip(null)}
        title="Delete Trip"
        description={`Are you sure you want to delete "${deleteTrip?.destination}"? This action cannot be undone and will remove all items in this trip.`}
        onConfirm={() => {
          if (deleteTrip) {
            deleteTripMutate(deleteTrip.id, {
              onSuccess: () => setDeleteTrip(null),
            });
          }
        }}
        isPending={isDeletingTrip}
      />

      <TemplateFormDialog
        open={createTemplateDialogOpen}
        onOpenChange={setCreateTemplateDialogOpen}
        mode="create"
        onCreated={(templateId) => onSelectTemplate(templateId)}
      />

      <ActivityFormDialog
        open={activityDialogOpen}
        onOpenChange={setActivityDialogOpen}
      />

      {editActivity && (
        <ActivityFormDialog
          open={!!editActivity}
          onOpenChange={(open) => !open && setEditActivity(null)}
          activity={editActivity}
        />
      )}

      <CategoryFormDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
      />

      {editCategory && (
        <CategoryFormDialog
          open={!!editCategory}
          onOpenChange={(open) => !open && setEditCategory(null)}
          category={editCategory}
        />
      )}

      <DeleteConfirmDialog
        open={!!deleteActivity}
        onOpenChange={(open) =>
          !open && !isDeletingActivity && setDeleteActivity(null)
        }
        title="Delete Activity"
        description={`Are you sure you want to delete "${deleteActivity?.name}"? This action cannot be undone.`}
        onConfirm={() => {
          if (deleteActivity) {
            deleteActivityMutate(deleteActivity.id, {
              onSuccess: () => setDeleteActivity(null),
            });
          }
        }}
        isPending={isDeletingActivity}
      />

      <DeleteConfirmDialog
        open={!!deleteCategory}
        onOpenChange={(open) =>
          !open && !isDeletingCategory && setDeleteCategory(null)
        }
        title="Delete Category"
        description={`Are you sure you want to delete "${deleteCategory?.name}"? This action cannot be undone.`}
        onConfirm={() => {
          if (deleteCategory) {
            deleteCategoryMutate(deleteCategory.id, {
              onSuccess: () => setDeleteCategory(null),
            });
          }
        }}
        isPending={isDeletingCategory}
      />

      <EditNameDialog
        open={editNameDialogOpen}
        onOpenChange={setEditNameDialogOpen}
        currentName={userName}
      />
    </main>
  );
}
