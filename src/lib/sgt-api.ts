import { supabase } from "@/integrations/supabase/client";

const SGT_API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sgt-api`;

export interface Member {
  user_name: string;
  user_id: number;
  user_active: number;
  user_country_code: string;
  user_has_avatar: string;
}

export interface Tour {
  name: string;
  tourId: number;
  start_date: string;
  end_date: string;
  teamTour: number;
  active: number;
}

export interface TourStanding {
  hcp: number;
  events: number;
  first: number;
  top5: number;
  top10: number;
  points: number;
  user_name: string;
  country_code: string;
  user_has_avatar: string;
  position: number;
}

export interface Tournament {
  tournamentId: number;
  tourId: number;
  courseName: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
}

export interface Scorecard {
  tournamentId: number;
  playerId: number;
  player_name: string;
  hcp_index: number;
  round: number;
  courseName: string;
  teetype: string;
  rating: number;
  slope: number;
  total_gross: number;
  total_net: number;
  toPar_gross: number;
  toPar_net: number;
  in_gross: number;
  out_gross: number;
  in_net: number;
  out_net: number;
  holeData?: Record<string, number | string>;
  [key: string]: unknown;
}

export interface PlayerRound {
  tournamentId: number;
  tournamentName: string;
  courseName: string;
  date: string;
  status: string;
  scorecard: Scorecard;
}

export interface UserStanding {
  position: number;
  points: number;
  first: number;
  top5: number;
  top10: number;
  events: number;
}

export interface MemberStats {
  tours: {
    tourId: number;
    tourName: string;
    handicap: number;
    customHandicap: number;
  }[];
  handicap: number | null;
  totalRounds: number;
  standing: UserStanding | null;
}

export interface TournamentResult {
  position: number;
  player_name: string;
  hcp: number;
  total_gross: number;
  total_net: number;
  to_par_gross: number;
  to_par_net: number;
}

async function sgtApi<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  // Get the current session for auth header
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(SGT_API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ action, params }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "API request failed");
  }

  return response.json();
}

export const sgtClient = {
  getMembers: () => sgtApi<{ members: Member[] }>("members"),
  
  getTours: () => sgtApi<Tour[]>("tours"),
  
  getTourStandings: (tourId: number, grossOrNet: "gross" | "net" = "gross") =>
    sgtApi<TourStanding[]>("tour-standings", { tourId: tourId.toString(), grossOrNet }),
  
  getTourMembers: (tourId: number) =>
    sgtApi<Member[]>("tour-members", { tourId: tourId.toString() }),
  
  getTournaments: (tourId: number) =>
    sgtApi<{ results: Tournament[] }>("tournaments", { tourId: tourId.toString() }),
  
  getScorecards: (tournamentId: number) =>
    sgtApi<Scorecard[]>("scorecards", { tournamentId: tournamentId.toString() }),
  
  getMemberStats: () =>
    sgtApi<MemberStats>("member-stats", {}),
  
  getPlayerRounds: () =>
    sgtApi<PlayerRound[]>("player-rounds", {}),
  
  getTournamentResults: (tournamentId: number, grossOrNet: "gross" | "net" = "gross") =>
    sgtApi<TournamentResult[]>("tournament-results", { tournamentId: tournamentId.toString(), grossOrNet }),
};
