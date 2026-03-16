import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";

interface PackingProgressProps {
  packed: number;
  total: number;
}

export function PackingProgress({ packed, total }: PackingProgressProps) {
  const percentage = total > 0 ? (packed / total) * 100 : 0;
  const isComplete = total > 0 && packed === total;

  return (
    <Card className="mb-8">
      <CardContent className="pt-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Packing Progress</h2>
          <span className="text-sm text-muted-foreground">
            {packed}/{total} items
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
        {isComplete && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">All packed!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
