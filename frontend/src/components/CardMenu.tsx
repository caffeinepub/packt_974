import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

interface CardMenuProps {
  onEdit?: () => void;
  onDelete?: () => void;
  size?: "default" | "sm";
}

export function CardMenu({
  onEdit,
  onDelete,
  size = "default",
}: CardMenuProps) {
  const buttonClass = size === "sm" ? "h-6 w-6" : "h-8 w-8";
  const iconClass = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={buttonClass}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className={iconClass} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
