import { Scorecard } from "@/lib/sgt-api";
import { cn } from "@/lib/utils";

interface ScorecardDisplayProps {
  scorecard: Scorecard;
  showDetails?: boolean;
}

function getScoreClass(score: number, par: number): string {
  const diff = score - par;
  if (score === 0) return "bg-muted text-muted-foreground";
  if (diff <= -2) return "score-eagle";
  if (diff === -1) return "score-birdie";
  if (diff === 0) return "score-par";
  if (diff === 1) return "score-bogey";
  return "score-double";
}

function formatToPar(toPar: number): string {
  if (toPar === 0) return "E";
  if (toPar > 0) return `+${toPar}`;
  return toPar.toString();
}

export function ScorecardDisplay({ scorecard, showDetails = false }: ScorecardDisplayProps) {
  const holes = Array.from({ length: 18 }, (_, i) => i + 1);
  
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex flex-wrap items-center gap-4 text-sm font-inter">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Gross:</span>
          <span className="font-semibold text-foreground">{scorecard.total_gross}</span>
          <span className={cn(
            "px-2 py-0.5 rounded text-xs font-medium",
            scorecard.toPar_gross <= 0 ? "bg-birdie/20 text-birdie" : "bg-bogey/20 text-bogey"
          )}>
            {formatToPar(scorecard.toPar_gross)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Net:</span>
          <span className="font-semibold text-foreground">{scorecard.total_net}</span>
          <span className={cn(
            "px-2 py-0.5 rounded text-xs font-medium",
            scorecard.toPar_net <= 0 ? "bg-birdie/20 text-birdie" : "bg-bogey/20 text-bogey"
          )}>
            {formatToPar(scorecard.toPar_net)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">HCP:</span>
          <span className="font-semibold text-foreground">{scorecard.hcp_index}</span>
        </div>
      </div>

      {/* Hole by hole */}
      {showDetails && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-inter">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 px-1 text-left text-muted-foreground font-medium">Hole</th>
                {holes.slice(0, 9).map(hole => (
                  <th key={hole} className="py-2 px-1 text-center text-muted-foreground font-medium w-8">
                    {hole}
                  </th>
                ))}
                <th className="py-2 px-2 text-center text-foreground font-semibold bg-muted/50">OUT</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-2 px-1 text-muted-foreground">Par</td>
                {holes.slice(0, 9).map(hole => (
                  <td key={hole} className="py-2 px-1 text-center text-muted-foreground">
                    {scorecard[`h${hole}_Par`] as number || "-"}
                  </td>
                ))}
                <td className="py-2 px-2 text-center text-muted-foreground bg-muted/50">
                  {holes.slice(0, 9).reduce((sum, h) => sum + ((scorecard[`h${h}_Par`] as number) || 0), 0)}
                </td>
              </tr>
              <tr>
                <td className="py-2 px-1 text-foreground font-medium">Score</td>
                {holes.slice(0, 9).map(hole => {
                  const score = scorecard[`hole${hole}_gross`] as number;
                  const par = scorecard[`h${hole}_Par`] as number;
                  return (
                    <td key={hole} className="py-1 px-1 text-center">
                      <span className={cn(
                        "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold",
                        getScoreClass(score, par)
                      )}>
                        {score || "-"}
                      </span>
                    </td>
                  );
                })}
                <td className="py-2 px-2 text-center font-semibold text-foreground bg-muted/50">
                  {scorecard.out_gross}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Back 9 */}
          <table className="w-full text-xs font-inter mt-2">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 px-1 text-left text-muted-foreground font-medium">Hole</th>
                {holes.slice(9).map(hole => (
                  <th key={hole} className="py-2 px-1 text-center text-muted-foreground font-medium w-8">
                    {hole}
                  </th>
                ))}
                <th className="py-2 px-2 text-center text-foreground font-semibold bg-muted/50">IN</th>
                <th className="py-2 px-2 text-center text-foreground font-semibold bg-primary/10">TOT</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-2 px-1 text-muted-foreground">Par</td>
                {holes.slice(9).map(hole => (
                  <td key={hole} className="py-2 px-1 text-center text-muted-foreground">
                    {scorecard[`h${hole}_Par`] as number || "-"}
                  </td>
                ))}
                <td className="py-2 px-2 text-center text-muted-foreground bg-muted/50">
                  {holes.slice(9).reduce((sum, h) => sum + ((scorecard[`h${h}_Par`] as number) || 0), 0)}
                </td>
                <td className="py-2 px-2 text-center text-muted-foreground bg-primary/10">
                  {holes.reduce((sum, h) => sum + ((scorecard[`h${h}_Par`] as number) || 0), 0)}
                </td>
              </tr>
              <tr>
                <td className="py-2 px-1 text-foreground font-medium">Score</td>
                {holes.slice(9).map(hole => {
                  const score = scorecard[`hole${hole}_gross`] as number;
                  const par = scorecard[`h${hole}_Par`] as number;
                  return (
                    <td key={hole} className="py-1 px-1 text-center">
                      <span className={cn(
                        "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold",
                        getScoreClass(score, par)
                      )}>
                        {score || "-"}
                      </span>
                    </td>
                  );
                })}
                <td className="py-2 px-2 text-center font-semibold text-foreground bg-muted/50">
                  {scorecard.in_gross}
                </td>
                <td className="py-2 px-2 text-center font-bold text-foreground bg-primary/10">
                  {scorecard.total_gross}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      {showDetails && (
        <div className="flex flex-wrap gap-3 text-xs font-inter pt-2">
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full score-eagle"></span>
            <span className="text-muted-foreground">Eagle+</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full score-birdie"></span>
            <span className="text-muted-foreground">Birdie</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full score-par"></span>
            <span className="text-muted-foreground">Par</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full score-bogey"></span>
            <span className="text-muted-foreground">Bogey</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full score-double"></span>
            <span className="text-muted-foreground">Double+</span>
          </div>
        </div>
      )}
    </div>
  );
}
