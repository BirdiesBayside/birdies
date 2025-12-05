import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { sgtClient, Tour, TourStanding, Tournament, TournamentResult } from "@/lib/sgt-api";
import { Loader2, Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Leaderboard() {
  const { profile, isLoading: authLoading } = useAuth();
  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedTour, setSelectedTour] = useState<number | null>(null);
  const [standings, setStandings] = useState<TourStanding[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<number | null>(null);
  const [tournamentResults, setTournamentResults] = useState<TournamentResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scoreType, setScoreType] = useState<"gross" | "net">("gross");
  const [viewMode, setViewMode] = useState<"overall" | "weekly">("overall");
  const [showAllWeeks, setShowAllWeeks] = useState(false);

  const INITIAL_WEEKS_TO_SHOW = 5;

  useEffect(() => {
    if (authLoading) return;

    async function loadTours() {
      try {
        const data = await sgtClient.getTours();
        const activeTours = data.filter(t => t.active === 1);
        setTours(activeTours);
        if (activeTours.length > 0) {
          setSelectedTour(activeTours[0].tourId);
        }
      } catch (error) {
        console.error("Failed to load tours:", error);
      }
    }
    loadTours();
  }, [authLoading]);

  // Load tournaments when tour changes
  useEffect(() => {
    if (!selectedTour) return;

    async function loadTournaments() {
      try {
        const data = await sgtClient.getTournaments(selectedTour);
        // Include In Progress and Completed tournaments
        // Filter out "Final Week" unless it's currently in progress
        const availableTournaments = data.results.filter(t => {
          const isFinalWeek = t.name.toLowerCase().includes("final week");
          if (isFinalWeek) {
            return t.status === "In Progress";
          }
          return t.status === "Completed" || t.status === "In Progress";
        });
        setTournaments(availableTournaments);
        if (availableTournaments.length > 0) {
          setSelectedTournament(availableTournaments[0].tournamentId);
        }
      } catch (error) {
        console.error("Failed to load tournaments:", error);
        setTournaments([]);
      }
    }
    loadTournaments();
  }, [selectedTour]);

  // Load overall standings
  useEffect(() => {
    if (!selectedTour || viewMode !== "overall") return;

    async function loadStandings() {
      setIsLoading(true);
      try {
        const data = await sgtClient.getTourStandings(selectedTour, scoreType);
        setStandings(data);
      } catch (error) {
        console.error("Failed to load standings:", error);
        setStandings([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadStandings();
  }, [selectedTour, scoreType, viewMode]);

  // Load tournament results
  useEffect(() => {
    if (!selectedTournament || viewMode !== "weekly") return;

    async function loadTournamentResults() {
      setIsLoading(true);
      try {
        const data = await sgtClient.getTournamentResults(selectedTournament, scoreType);
        setTournamentResults(data);
      } catch (error) {
        console.error("Failed to load tournament results:", error);
        setTournamentResults([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadTournamentResults();
  }, [selectedTournament, scoreType, viewMode]);

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-secondary animate-spin" />
      </div>
    );
  }

  const displayName = profile.display_name || "";

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const formatScore = (score: number) => {
    if (score === 0) return "E";
    if (score > 0) return `+${score}`;
    return score.toString();
  };

  return (
    <Layout>
      <div className="mb-8 animate-fade-in">
        <h1 className="font-anton text-3xl md:text-4xl text-foreground mb-2">
          LEADERBOARD
        </h1>
        <p className="font-inter text-muted-foreground">
          See how you compare to other Birdies players
        </p>
      </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "overall" | "weekly")} className="mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overall" className="font-inter">Overall Standings</TabsTrigger>
          <TabsTrigger value="weekly" className="font-inter">Weekly Results</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-slide-up">
        <Select
          value={selectedTour?.toString()}
          onValueChange={(val) => setSelectedTour(parseInt(val))}
        >
          <SelectTrigger className="w-full sm:w-[250px] font-inter">
            <SelectValue placeholder="Select tour" />
          </SelectTrigger>
          <SelectContent>
            {tours.map((tour) => (
              <SelectItem key={tour.tourId} value={tour.tourId.toString()}>
                {tour.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {viewMode === "weekly" && tournaments.length > 0 && (
          <Select
            value={selectedTournament?.toString()}
            onValueChange={(val) => setSelectedTournament(parseInt(val))}
          >
            <SelectTrigger className="w-full sm:w-[350px] font-inter">
              <SelectValue placeholder="Select week" />
            </SelectTrigger>
            <SelectContent>
              {(showAllWeeks ? tournaments : tournaments.slice(0, INITIAL_WEEKS_TO_SHOW)).map((tournament, index) => (
                <SelectItem key={tournament.tournamentId} value={tournament.tournamentId.toString()}>
                  <div className="flex items-center gap-2">
                    <span>{tournament.name}</span>
                    {index === 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold bg-secondary text-secondary-foreground rounded">
                        CURRENT
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
              {tournaments.length > INITIAL_WEEKS_TO_SHOW && (
                <div 
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground font-inter text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAllWeeks(!showAllWeeks);
                  }}
                >
                  {showAllWeeks ? (
                    <span>Show less</span>
                  ) : (
                    <span>Show {tournaments.length - INITIAL_WEEKS_TO_SHOW} more weeks...</span>
                  )}
                </div>
              )}
            </SelectContent>
          </Select>
        )}

        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setScoreType("gross")}
            className={cn(
              "px-4 py-2 font-inter text-sm font-medium transition-colors",
              scoreType === "gross"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            Gross
          </button>
          <button
            onClick={() => setScoreType("net")}
            className={cn(
              "px-4 py-2 font-inter text-sm font-medium transition-colors",
              scoreType === "net"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            Net
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-secondary animate-spin" />
        </div>
      ) : viewMode === "overall" ? (
        // Overall Standings View
        standings.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center animate-fade-in">
            <h3 className="font-anton text-xl text-foreground mb-2">NO STANDINGS YET</h3>
            <p className="text-muted-foreground font-inter">
              Standings will appear once players have completed rounds
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden animate-slide-up">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b border-border font-inter text-sm font-medium text-muted-foreground">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-4">Player</div>
              <div className="col-span-1 text-center">HCP</div>
              <div className="col-span-1 text-center">Events</div>
              <div className="col-span-1 text-center">Wins</div>
              <div className="col-span-1 text-center">Top 5</div>
              <div className="col-span-1 text-center">Top 10</div>
              <div className="col-span-2 text-center">Points</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border">
              {standings.map((standing, index) => {
                const isCurrentPlayer = displayName && standing.user_name.toLowerCase() === displayName.toLowerCase();
                return (
                  <div
                    key={standing.user_name}
                    className={cn(
                      "grid grid-cols-12 gap-4 px-4 py-4 items-center transition-colors",
                      isCurrentPlayer && "bg-secondary/10 border-l-4 border-secondary",
                      !isCurrentPlayer && "hover:bg-muted/30"
                    )}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {/* Position */}
                    <div className="col-span-2 md:col-span-1 flex items-center justify-center gap-2">
                      {getPositionIcon(standing.position)}
                      <span className={cn(
                        "font-anton text-lg",
                        standing.position <= 3 ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {standing.position}
                      </span>
                    </div>

                    {/* Player */}
                    <div className="col-span-7 md:col-span-4 flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-anton text-lg",
                        isCurrentPlayer 
                          ? "bg-secondary text-secondary-foreground" 
                          : "bg-primary text-primary-foreground"
                      )}>
                        {standing.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className={cn(
                          "font-inter font-semibold",
                          isCurrentPlayer ? "text-secondary" : "text-foreground"
                        )}>
                          {standing.user_name}
                          {isCurrentPlayer && <span className="text-xs ml-2">(You)</span>}
                        </p>
                        <p className="font-inter text-xs text-muted-foreground md:hidden">
                          {standing.events} events • {standing.points} pts
                        </p>
                      </div>
                    </div>

                    {/* Stats - Desktop */}
                    <div className="hidden md:block col-span-1 text-center font-inter text-muted-foreground">
                      {standing.hcp}
                    </div>
                    <div className="hidden md:block col-span-1 text-center font-inter text-muted-foreground">
                      {standing.events}
                    </div>
                    <div className="hidden md:block col-span-1 text-center font-inter font-medium text-foreground">
                      {standing.first || "-"}
                    </div>
                    <div className="hidden md:block col-span-1 text-center font-inter text-muted-foreground">
                      {standing.top5 || "-"}
                    </div>
                    <div className="hidden md:block col-span-1 text-center font-inter text-muted-foreground">
                      {standing.top10 || "-"}
                    </div>

                    {/* Points */}
                    <div className="col-span-3 md:col-span-2 text-center">
                      <span className="font-anton text-xl text-foreground">
                        {standing.points}
                      </span>
                      <span className="text-xs text-muted-foreground font-inter ml-1">pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : (
        // Weekly Results View
        tournamentResults.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center animate-fade-in">
            <h3 className="font-anton text-xl text-foreground mb-2">NO RESULTS YET</h3>
            <p className="text-muted-foreground font-inter">
              {tournaments.length === 0 
                ? "No completed tournaments in this tour yet"
                : "No results available for this tournament"
              }
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden animate-slide-up">
            {/* Tournament Info Header */}
            {selectedTournament && tournaments.find(t => t.tournamentId === selectedTournament) && (
              <div className="px-4 py-3 bg-primary/10 border-b border-border">
                <h3 className="font-anton text-lg text-foreground">
                  {tournaments.find(t => t.tournamentId === selectedTournament)?.name}
                </h3>
                <p className="font-inter text-sm text-muted-foreground">
                  {tournaments.find(t => t.tournamentId === selectedTournament)?.courseName}
                </p>
              </div>
            )}

            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b border-border font-inter text-sm font-medium text-muted-foreground">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-3">Player</div>
              <div className="col-span-1 text-center">HCP</div>
              <div className="col-span-2 text-center">R1</div>
              <div className="col-span-2 text-center">R2</div>
              <div className="col-span-1 text-center">Total</div>
              <div className="col-span-2 text-center">To Par</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border">
              {tournamentResults.map((result, index) => {
                const isCurrentPlayer = displayName && result.player_name.toLowerCase() === displayName.toLowerCase();
                const r1 = scoreType === "gross" ? result.r1_gross : result.r1_net;
                const r2 = scoreType === "gross" ? result.r2_gross : result.r2_net;
                const total = scoreType === "gross" ? result.total_gross : result.total_net;
                const toPar = scoreType === "gross" ? result.to_par_gross : result.to_par_net;
                
                return (
                  <div
                    key={result.player_name}
                    className={cn(
                      "grid grid-cols-12 gap-4 px-4 py-4 items-center transition-colors",
                      isCurrentPlayer && "bg-secondary/10 border-l-4 border-secondary",
                      !isCurrentPlayer && "hover:bg-muted/30"
                    )}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {/* Position */}
                    <div className="col-span-2 md:col-span-1 flex items-center justify-center gap-2">
                      {getPositionIcon(result.position)}
                      <span className={cn(
                        "font-anton text-lg",
                        result.position <= 3 ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {result.position}
                      </span>
                    </div>

                    {/* Player */}
                    <div className="col-span-6 md:col-span-3 flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-anton text-lg",
                        isCurrentPlayer 
                          ? "bg-secondary text-secondary-foreground" 
                          : "bg-primary text-primary-foreground"
                      )}>
                        {result.player_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className={cn(
                          "font-inter font-semibold text-sm",
                          isCurrentPlayer ? "text-secondary" : "text-foreground"
                        )}>
                          {result.player_name}
                          {isCurrentPlayer && <span className="text-xs ml-1">(You)</span>}
                        </p>
                        <p className="font-inter text-xs text-muted-foreground md:hidden">
                          {total} ({formatScore(toPar)})
                        </p>
                      </div>
                    </div>

                    {/* HCP - Desktop */}
                    <div className="hidden md:block col-span-1 text-center font-inter text-muted-foreground">
                      {result.hcp}
                    </div>

                    {/* R1 - Desktop */}
                    <div className="hidden md:block col-span-2 text-center font-inter text-foreground">
                      {r1 ?? "-"}
                    </div>

                    {/* R2 - Desktop */}
                    <div className="hidden md:block col-span-2 text-center font-inter text-foreground">
                      {r2 ?? "-"}
                    </div>

                    {/* Total - Desktop */}
                    <div className="hidden md:block col-span-1 text-center font-anton text-lg text-foreground">
                      {total}
                    </div>

                    {/* To Par */}
                    <div className="col-span-4 md:col-span-2 text-center">
                      <span className={cn(
                        "font-anton text-xl",
                        toPar < 0 ? "text-green-600" : toPar > 0 ? "text-red-500" : "text-foreground"
                      )}>
                        {formatScore(toPar)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}
    </Layout>
  );
}