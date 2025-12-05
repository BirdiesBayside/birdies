import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayer } from "@/contexts/PlayerContext";
import { Layout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { sgtClient, MemberStats, PlayerRound, TourStanding, Scorecard } from "@/lib/sgt-api";
import { 
  Loader2, 
  Mail, 
  Globe, 
  Target, 
  Trophy,
  TrendingDown,
  BarChart3,
  Zap,
  CircleDot,
  AlertTriangle,
  Gauge,
  Award
} from "lucide-react";

interface HoleData {
  [key: string]: number | string;
}

interface ProgressStats {
  avgBirdies: number;
  avgPars: number;
  avgBogeys: number;
  avgDoublePlus: number;
  par3Avg: number;
  par4Avg: number;
  par5Avg: number;
  blowUpFrequency: number;
  consistencyScore: number;
  bestToPar: number;
}

function calculateProgressStats(rounds: PlayerRound[]): ProgressStats | null {
  const validRounds = rounds.filter(r => r.scorecard?.holeData);
  if (validRounds.length === 0) return null;

  let totalBirdies = 0;
  let totalPars = 0;
  let totalBogeys = 0;
  let totalDoublePlus = 0;
  let par3Scores: number[] = [];
  let par4Scores: number[] = [];
  let par5Scores: number[] = [];
  let blowUpHoles = 0;
  let totalHoles = 0;
  let roundScores: number[] = [];

  for (const round of validRounds) {
    const holeData = round.scorecard.holeData as HoleData;
    if (!holeData) continue;

    roundScores.push(round.scorecard.toPar_gross);

    for (let hole = 1; hole <= 18; hole++) {
      const par = holeData[`h${hole}_Par`] as number;
      const gross = holeData[`hole${hole}_gross`] as number;
      
      if (typeof par !== 'number' || typeof gross !== 'number') continue;
      
      totalHoles++;
      const scoreToPar = gross - par;

      // Count score types
      if (scoreToPar <= -1) totalBirdies++;
      else if (scoreToPar === 0) totalPars++;
      else if (scoreToPar === 1) totalBogeys++;
      else totalDoublePlus++;

      // Blow-up holes (triple bogey or worse)
      if (scoreToPar >= 3) blowUpHoles++;

      // Par type performance
      if (par === 3) par3Scores.push(gross);
      else if (par === 4) par4Scores.push(gross);
      else if (par === 5) par5Scores.push(gross);
    }
  }

  const numRounds = validRounds.length;
  const avgScore = roundScores.reduce((a, b) => a + b, 0) / roundScores.length;
  
  // Consistency: % of rounds within ±5 of average to-par
  const consistentRounds = roundScores.filter(s => Math.abs(s - avgScore) <= 5).length;

  return {
    avgBirdies: totalBirdies / numRounds,
    avgPars: totalPars / numRounds,
    avgBogeys: totalBogeys / numRounds,
    avgDoublePlus: totalDoublePlus / numRounds,
    par3Avg: par3Scores.length > 0 ? par3Scores.reduce((a, b) => a + b, 0) / par3Scores.length : 0,
    par4Avg: par4Scores.length > 0 ? par4Scores.reduce((a, b) => a + b, 0) / par4Scores.length : 0,
    par5Avg: par5Scores.length > 0 ? par5Scores.reduce((a, b) => a + b, 0) / par5Scores.length : 0,
    blowUpFrequency: totalHoles > 0 ? (blowUpHoles / totalHoles) * 100 : 0,
    consistencyScore: (consistentRounds / numRounds) * 100,
    bestToPar: Math.min(...roundScores),
  };
}

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

  const progressStats = useMemo(() => calculateProgressStats(rounds), [rounds]);

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

            {/* My Progress */}
            {progressStats && (
              <div className="mb-8 animate-slide-up" style={{ animationDelay: "150ms" }}>
                <h2 className="font-anton text-2xl text-foreground mb-4">
                  MY PROGRESS
                </h2>
                <div className="bg-card rounded-xl border border-border p-6">
                  {/* Scoring Breakdown */}
                  <div className="mb-6">
                    <h3 className="font-inter font-semibold text-foreground mb-4 flex items-center gap-2">
                      <CircleDot className="h-4 w-4 text-secondary" />
                      Average Per Round
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-birdie/10 rounded-lg p-4 text-center">
                        <p className="font-anton text-2xl text-birdie">{progressStats.avgBirdies.toFixed(1)}</p>
                        <p className="text-xs font-inter text-muted-foreground">Birdies</p>
                      </div>
                      <div className="bg-muted rounded-lg p-4 text-center">
                        <p className="font-anton text-2xl text-foreground">{progressStats.avgPars.toFixed(1)}</p>
                        <p className="text-xs font-inter text-muted-foreground">Pars</p>
                      </div>
                      <div className="bg-bogey/10 rounded-lg p-4 text-center">
                        <p className="font-anton text-2xl text-bogey">{progressStats.avgBogeys.toFixed(1)}</p>
                        <p className="text-xs font-inter text-muted-foreground">Bogeys</p>
                      </div>
                      <div className="bg-double/10 rounded-lg p-4 text-center">
                        <p className="font-anton text-2xl text-double">{progressStats.avgDoublePlus.toFixed(1)}</p>
                        <p className="text-xs font-inter text-muted-foreground">Double+</p>
                      </div>
                    </div>
                  </div>

                  {/* Par Performance */}
                  <div className="mb-6">
                    <h3 className="font-inter font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-secondary" />
                      Par Performance
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <p className="font-anton text-2xl text-foreground">{progressStats.par3Avg.toFixed(1)}</p>
                        <p className="text-xs font-inter text-muted-foreground">Par 3 Avg</p>
                        <p className={`text-xs font-inter font-medium mt-1 ${progressStats.par3Avg - 3 <= 0 ? 'text-birdie' : 'text-bogey'}`}>
                          {progressStats.par3Avg - 3 > 0 ? '+' : ''}{(progressStats.par3Avg - 3).toFixed(1)} vs par
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <p className="font-anton text-2xl text-foreground">{progressStats.par4Avg.toFixed(1)}</p>
                        <p className="text-xs font-inter text-muted-foreground">Par 4 Avg</p>
                        <p className={`text-xs font-inter font-medium mt-1 ${progressStats.par4Avg - 4 <= 0 ? 'text-birdie' : 'text-bogey'}`}>
                          {progressStats.par4Avg - 4 > 0 ? '+' : ''}{(progressStats.par4Avg - 4).toFixed(1)} vs par
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <p className="font-anton text-2xl text-foreground">{progressStats.par5Avg.toFixed(1)}</p>
                        <p className="text-xs font-inter text-muted-foreground">Par 5 Avg</p>
                        <p className={`text-xs font-inter font-medium mt-1 ${progressStats.par5Avg - 5 <= 0 ? 'text-birdie' : 'text-bogey'}`}>
                          {progressStats.par5Avg - 5 > 0 ? '+' : ''}{(progressStats.par5Avg - 5).toFixed(1)} vs par
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-muted/30 rounded-lg p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                        <Award className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <p className="font-anton text-xl text-foreground">
                          {progressStats.bestToPar === 0 ? 'E' : progressStats.bestToPar > 0 ? `+${progressStats.bestToPar}` : progressStats.bestToPar}
                        </p>
                        <p className="text-xs font-inter text-muted-foreground">Best To Par</p>
                      </div>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-bogey/20 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-bogey" />
                      </div>
                      <div>
                        <p className="font-anton text-xl text-foreground">{progressStats.blowUpFrequency.toFixed(1)}%</p>
                        <p className="text-xs font-inter text-muted-foreground">Blow-up Holes</p>
                      </div>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-birdie/20 flex items-center justify-center">
                        <Gauge className="h-5 w-5 text-birdie" />
                      </div>
                      <div>
                        <p className="font-anton text-xl text-foreground">{progressStats.consistencyScore.toFixed(0)}%</p>
                        <p className="text-xs font-inter text-muted-foreground">Consistency</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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