import { TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function LeadScoringDisplay({ score }) {
  const getScoreColor = (s) => {
    if (s >= 75) return "text-accent";
    if (s >= 50) return "text-blue-500";
    if (s >= 25) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreLabel = (s) => {
    if (s >= 75) return "Hot Lead";
    if (s >= 50) return "Warm Lead";
    if (s >= 25) return "Cold Lead";
    return "Not Qualified";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">Lead Score</span>
        </div>
        <span className={`text-sm font-bold ${getScoreColor(score)}`}>
          {score}/100 - {getScoreLabel(score)}
        </span>
      </div>
      <Progress value={score} className="h-2" />
    </div>
  );
}