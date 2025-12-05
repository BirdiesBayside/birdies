import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayer } from "@/contexts/PlayerContext";
import { Layout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { sgtClient, MemberStats, PlayerRound, TourStanding } from "@/lib/sgt-api";
import { 
  Loader2, 
  User, 
  Mail, 
  Globe, 
  Target, 
  Trophy,
  TrendingUp,
  TrendingDown,
  BarChart3
} from "lucide-react";

export default function Profile() {
  const { player, isLoading: playerLoading } = usePlayer();
  const navigate = useNavigate();
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [rounds, setRounds] = useState<PlayerRound[]>([]);
  const [standing, setStanding] = useState<TourStanding | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!playerLoading && !player) {
      navigate("/");
    }
  }, [player, playerLoading, navigate]);

  useEffect(() => {
    if (!player) return;

    async function loadProfile() {
      setIsLoading(true);
      try {
        const [statsData, roundsData, toursData] = await Promise.all([
          sgtClient.getMemberStats(player.user_id).catch(() => null),
          sgtClient.getPlayerRounds(player.user_id).catch(() => []),
          sgtClient.getTours().catch(() => []),
        ]);

        setStats(statsData);
        setRounds(roundsData);

        // Get standing from first active tour
        const activeTour = toursData.find(t => t.active === 1);
        if (activeTour) {
          try {
            const standingsData = await sgtClient.getTourStandings(activeTour.tourId);
            const playerStanding = standingsData.find(
              s => s.user_name.toLowerCase() === player.user_name.toLowerCase()
            );
            if (playerStanding) {
              setStanding(playerStanding);
            }
          } catch (e) {
            console.error("Failed to load standings:", e);
          }
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [player]);

  if (playerLoading || !player) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-secondary animate-spin" />
      </div>
    );
  }

  // Calculate stats
  const avgScore = rounds.length > 0
    ? Math.round(rounds.reduce((sum, r) => sum + r.scorecard.total_gross, 0) / rounds.length)
    : null;

  const bestRound = rounds.length > 0
    ? rounds.reduce((best, r) => 
        r.scorecard.total_gross < best.scorecard.total_gross ? r : best
      )
    : null;

  const completedRounds = rounds.filter(r => r.status === "Completed");

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden mb-8 animate-fade-in">
          <div className="hero-section p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-anton text-4xl md:text-5xl shadow-lg">
                {player.user_name.charAt(0).toUpperCase()}
              </div>
              <div className="text-center md:text-left">
                <h1 className="font-anton text-3xl md:text-4xl text-primary-foreground mb-2">
                  {player.user_name.toUpperCase()}
                </h1>
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-primary-foreground/80 font-inter text-sm">
                  {player.user_email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {player.user_email}
                    </div>
                  )}
                  {player.user_country_code && (
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      {player.user_country_code}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Handicap Banner */}
          <div className="bg-card p-6 border-t border-border">
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-sm font-inter text-muted-foreground mb-1">Current Handicap</p>
                <p className="font-anton text-5xl text-foreground">
                  {stats?.handicap ?? "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-secondary animate-spin" />
          </div>
        ) : (
          <>
            {/* Performance Stats */}
            <div className="mb-8 animate-slide-up" style={{ animationDelay: "100ms" }}>
              <h2 className="font-anton text-2xl text-foreground mb-4">
                PERFORMANCE STATS
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Average Score"
                  value={avgScore ?? "N/A"}
                  icon={<BarChart3 className="h-5 w-5" />}
                  delay={0}
                />
                <StatCard
                  label="Best Round"
                  value={bestRound?.scorecard.total_gross ?? "N/A"}
                  subValue={bestRound?.courseName}
                  icon={<TrendingDown className="h-5 w-5" />}
                  delay={100}
                />
                <StatCard
                  label="Tour Rank"
                  value={standing?.position ? `#${standing.position}` : "N/A"}
                  subValue={standing ? `${standing.points} points` : undefined}
                  icon={<Trophy className="h-5 w-5" />}
                  delay={200}
                />
                <StatCard
                  label="Rounds Played"
                  value={completedRounds.length}
                  subValue="Completed"
                  icon={<Target className="h-5 w-5" />}
                  delay={300}
                />
              </div>
            </div>

            {/* Tour Performance */}
            {standing && (
              <div className="mb-8 animate-slide-up" style={{ animationDelay: "200ms" }}>
                <h2 className="font-anton text-2xl text-foreground mb-4">
                  TOUR PERFORMANCE
                </h2>
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
                    <div>
                      <p className="text-3xl font-anton text-foreground">{standing.events}</p>
                      <p className="text-sm font-inter text-muted-foreground">Events</p>
                    </div>
                    <div>
                      <p className="text-3xl font-anton text-secondary">{standing.first || 0}</p>
                      <p className="text-sm font-inter text-muted-foreground">Wins</p>
                    </div>
                    <div>
                      <p className="text-3xl font-anton text-foreground">{standing.top5 || 0}</p>
                      <p className="text-sm font-inter text-muted-foreground">Top 5</p>
                    </div>
                    <div>
                      <p className="text-3xl font-anton text-foreground">{standing.top10 || 0}</p>
                      <p className="text-sm font-inter text-muted-foreground">Top 10</p>
                    </div>
                    <div>
                      <p className="text-3xl font-anton text-secondary">{standing.points}</p>
                      <p className="text-sm font-inter text-muted-foreground">Points</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Active Tours */}
            {stats && stats.tours.length > 0 && (
              <div className="animate-slide-up" style={{ animationDelay: "300ms" }}>
                <h2 className="font-anton text-2xl text-foreground mb-4">
                  ACTIVE TOURS
                </h2>
                <div className="space-y-3">
                  {stats.tours.map((tour) => (
                    <div 
                      key={tour.tourId}
                      className="bg-card rounded-xl border border-border p-4 flex items-center justify-between"
                    >
                      <div>
                        <h3 className="font-inter font-semibold text-foreground">
                          {tour.tourName}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="font-anton text-xl text-secondary">
                          {tour.handicap}
                        </p>
                        <p className="text-xs font-inter text-muted-foreground">
                          Tour HCP
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
