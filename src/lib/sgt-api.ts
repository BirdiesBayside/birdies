const SGT_API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sgt-api`;

export interface Member {
  user_name: string;
  user_id: number;
  user_active: number;
  user_country_code: string;
  user_has_avatar: string;
  user_game_id: string;
  user_email: string;
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

export interface MemberStats {
  tours: {
    tourId: number;
    tourName: string;
    handicap: number;
    customHandicap: number;
  }[];
  handicap: number | null;
  totalRounds: number;
}

async function sgtApi<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  const response = await fetch(SGT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
  
  getMemberStats: (userId: number) =>
    sgtApi<MemberStats>("member-stats", { userId: userId.toString() }),
  
  getPlayerRounds: (userId: number) =>
    sgtApi<PlayerRound[]>("player-rounds", { userId: userId.toString() }),
};
