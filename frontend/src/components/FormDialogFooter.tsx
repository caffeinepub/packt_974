import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface FormDialogFooterProps {
  onCancel: () => void;
  isPending: boolean;
  submitLabel: string;
  submitDisabled?: boolean;
  pendingLabel?: string;
}

export function FormDialogFooter({
  onCancel,
  isPending,
  submitLabel,
  submitDisabled,
  pendingLabel,
}: FormDialogFooterProps) {
  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={isPending || submitDisabled}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending && pendingLabel ? pendingLabel : submitLabel}
      </Button>
    </DialogFooter>
  );
}
