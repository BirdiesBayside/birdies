import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SGT_BASE_URL = "https://simulatorgolftour.com/sgt-api/club-admin";
const CLUB_URL = "birdiesbayside";

let cachedApiKey: string | null = null;
let apiKeyExpiry: number = 0;

interface TourStats {
  tourId: number;
  tourName: string;
  handicap: number;
  customHandicap: number;
}

interface MemberStats {
  tours: TourStats[];
  handicap: number | null;
  totalRounds: number;
}

async function getApiKey(): Promise<string> {
  const now = Date.now();
  
  // Return cached key if still valid (with 5 min buffer)
  if (cachedApiKey && apiKeyExpiry > now + 300000) {
    return cachedApiKey;
  }

  const username = Deno.env.get("SGT_USERNAME");
  const password = Deno.env.get("SGT_PASSWORD");

  if (!username || !password) {
    throw new Error("SGT credentials not configured");
  }

  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  const response = await fetch(`${SGT_BASE_URL}/${CLUB_URL}/apikey/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  });

  const data = await response.json();

  if (!data.success || !data.key) {
    console.error("Failed to get API key:", data);
    throw new Error("Failed to authenticate with SGT API");
  }

  cachedApiKey = data.key;
  apiKeyExpiry = now + (data.expires * 1000);
  
  console.log("SGT API key obtained, expires in:", data.expires, "seconds");
  return cachedApiKey as string;
}

async function sgtRequest(endpoint: string, params: Record<string, string> = {}) {
  const apiKey = await getApiKey();
  const url = new URL(`${SGT_BASE_URL}/${CLUB_URL}${endpoint}`);
  url.searchParams.append("api-key", apiKey);
  
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, value);
  }

  console.log("SGT API request:", endpoint);
  
  const response = await fetch(url.toString());
  
  if (!response.ok) {
    console.error("SGT API error:", response.status, await response.text());
    throw new Error(`SGT API error: ${response.status}`);
  }

  return response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, params = {} } = await req.json();
    
    let data;
    
    switch (action) {
      case "members":
        data = await sgtRequest("/members/list");
        break;
        
      case "tours":
        data = await sgtRequest("/tours/list");
        break;
        
      case "tour-standings":
        if (!params.tourId) throw new Error("tourId required");
        data = await sgtRequest("/tours/standings", { 
          tourId: params.tourId,
          grossOrNet: params.grossOrNet || "gross"
        });
        break;
        
      case "tour-members":
        if (!params.tourId) throw new Error("tourId required");
        data = await sgtRequest("/tours/members", { tourId: params.tourId });
        break;
        
      case "tournaments":
        if (!params.tourId) throw new Error("tourId required");
        data = await sgtRequest("/tournaments/list", { tourId: params.tourId });
        break;
        
      case "scorecards":
        if (!params.tournamentId) throw new Error("tournamentId required");
        data = await sgtRequest("/tournaments/scorecards", { tournamentId: params.tournamentId });
        break;
        
      case "registrations":
        if (!params.tournamentId) throw new Error("tournamentId required");
        data = await sgtRequest("/registrations/view", { tournamentId: params.tournamentId });
        break;
        
      case "member-stats": {
        // Get member info including handicap from tour members
        if (!params.userId) throw new Error("userId required");
        const tours = await sgtRequest("/tours/list");
        const memberStats: MemberStats = {
          tours: [],
          handicap: null,
          totalRounds: 0,
        };
        
        for (const tour of tours.filter((t: { active: number }) => t.active === 1)) {
          try {
            const members = await sgtRequest("/tours/members", { tourId: tour.tourId.toString() });
            const memberData = members.find((m: { user_id: number }) => m.user_id.toString() === params.userId);
            if (memberData) {
              memberStats.tours.push({
                tourId: tour.tourId,
                tourName: tour.name,
                handicap: memberData.hcp_index,
                customHandicap: memberData.custom_hcp,
              });
              if (memberStats.handicap === null) {
                memberStats.handicap = memberData.hcp_index;
              }
            }
          } catch (e) {
            console.error("Error getting tour members:", e);
          }
        }
        
        data = memberStats;
        break;
      }
        
      case "player-rounds": {
        // Get all rounds for a player across tournaments
        if (!params.userId) throw new Error("userId required");
        const allTours = await sgtRequest("/tours/list");
        const rounds: Array<{
          tournamentId: number;
          tournamentName: string;
          courseName: string;
          date: string;
          status: string;
          scorecard: unknown;
        }> = [];
        
        for (const tour of allTours.filter((t: { active: number }) => t.active === 1)) {
          try {
            const tournaments = await sgtRequest("/tournaments/list", { tourId: tour.tourId.toString() });
            
            if (tournaments.results) {
              for (const tournament of tournaments.results.slice(0, 10)) { // Limit to recent 10
                try {
                  const scorecards = await sgtRequest("/tournaments/scorecards", { 
                    tournamentId: tournament.tournamentId.toString() 
                  });
                  
                  const playerScorecard = scorecards.find((sc: { playerId: number }) => 
                    sc.playerId.toString() === params.userId
                  );
                  
                  if (playerScorecard) {
                    rounds.push({
                      tournamentId: tournament.tournamentId,
                      tournamentName: tournament.name,
                      courseName: playerScorecard.courseName || tournament.courseName,
                      date: tournament.end_date,
                      status: tournament.status,
                      scorecard: playerScorecard,
                    });
                  }
                } catch (e) {
                  console.error("Error getting scorecards:", e);
                }
              }
            }
          } catch (e) {
            console.error("Error getting tournaments:", e);
          }
        }
        
        data = rounds.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      }
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("SGT API error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
