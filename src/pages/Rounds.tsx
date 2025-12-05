import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ScorecardDisplay } from "@/components/ScorecardDisplay";
import { sgtClient, PlayerRound } from "@/lib/sgt-api";
import { Loader2, MapPin, ChevronDown, ChevronUp } from "lucide-react";

export default function Rounds() {
  const { profile, isLoading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [rounds, setRounds] = useState<PlayerRound[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRound, setExpandedRound] = useState<string | null>(
    searchParams.get("round")
  );

  useEffect(() => {
    if (authLoading || !profile) return;

    async function loadRounds() {
      setIsLoading(true);
      try {
        const data = await sgtClient.getPlayerRounds();
        setRounds(data);
      } catch (error) {
        console.error("Failed to load rounds:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadRounds();
  }, [profile, authLoading]);

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-secondary animate-spin" />
      </div>
    );
  }

  const toggleExpand = (roundKey: string) => {
    setExpandedRound(expandedRound === roundKey ? null : roundKey);
  };

  return (
    <Layout>
      <div className="mb-8 animate-fade-in">
        <h1 className="font-anton text-3xl md:text-4xl text-foreground mb-2">
          ROUND HISTORY
        </h1>
        <p className="font-inter text-muted-foreground">
          {rounds.length} rounds recorded at Birdies
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-secondary animate-spin" />
        </div>
      ) : rounds.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center animate-fade-in">
          <h3 className="font-anton text-xl text-foreground mb-2">NO ROUNDS YET</h3>
          <p className="text-muted-foreground font-inter">
            Your round history will appear here after you play at Birdies
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rounds.map((round, index) => {
            const roundKey = `${round.tournamentId}-${round.scorecard?.round || index}`;
            return (
            <div 
              key={roundKey}
              className="bg-card rounded-xl border border-border overflow-hidden animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <button
                onClick={() => toggleExpand(roundKey)}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                    <h3 className="font-inter font-semibold text-foreground">
                      {round.tournamentName}
                      {round.scorecard?.round && ` - Round ${round.scorecard.round}`}
                    </h3>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-inter font-medium w-fit ${
                      round.status === "Completed" 
                        ? "bg-birdie/20 text-birdie" 
                        : "bg-secondary/20 text-secondary"
                    }`}>
                      {round.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-inter">
                    <MapPin className="h-3 w-3" />
                    {round.courseName}
                    <span className="text-border">•</span>
                    {new Date(round.date).toLocaleDateString("en-AU", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="font-anton text-2xl text-foreground">
                      {round.scorecard.total_gross}
                    </div>
                    <div className={`text-sm font-inter font-medium ${
                      round.scorecard.toPar_gross <= 0 ? "text-birdie" : "text-bogey"
                    }`}>
                      {round.scorecard.toPar_gross === 0 ? "E" : 
                       round.scorecard.toPar_gross > 0 ? `+${round.scorecard.toPar_gross}` : 
                       round.scorecard.toPar_gross}
                    </div>
                  </div>
                  {expandedRound === roundKey ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {expandedRound === roundKey && (
                <div className="px-4 pb-4 pt-2 border-t border-border animate-fade-in">
                  <ScorecardDisplay scorecard={round.scorecard} showDetails />
                </div>
              )}
            </div>
          );
          })}
        </div>
      )}
    </Layout>
  );
}
