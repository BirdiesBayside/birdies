import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayer } from "@/contexts/PlayerContext";
import { Layout } from "@/components/Layout";
import { sgtClient, Tour, TourStanding } from "@/lib/sgt-api";
import { Loader2, Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Leaderboard() {
  const { player, isLoading: playerLoading } = usePlayer();
  const navigate = useNavigate();
  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedTour, setSelectedTour] = useState<number | null>(null);
  const [standings, setStandings] = useState<TourStanding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scoreType, setScoreType] = useState<"gross" | "net">("gross");

  useEffect(() => {
    if (!playerLoading && !player) {
      navigate("/");
    }
  }, [player, playerLoading, navigate]);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!selectedTour) return;

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
  }, [selectedTour, scoreType]);

  if (playerLoading || !player) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-secondary animate-spin" />
      </div>
    );
  }

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
      ) : standings.length === 0 ? (
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
              const isCurrentPlayer = standing.user_name.toLowerCase() === player.user_name.toLowerCase();
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
      )}
    </Layout>
  );
}
