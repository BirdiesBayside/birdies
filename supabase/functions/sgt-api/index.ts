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

// Helper to extract array from API response (handles wrapped responses)
function extractArray(data: unknown, possibleKeys: string[] = ['results', 'members', 'standings', 'scorecards', 'tours']): unknown[] {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object') {
    for (const key of possibleKeys) {
      if (key in data && Array.isArray((data as Record<string, unknown>)[key])) {
        return (data as Record<string, unknown>)[key] as unknown[];
      }
    }
  }
  console.log("Response structure:", JSON.stringify(data).slice(0, 500));
  return [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, params = {} } = await req.json();
    
    let data;
    
    switch (action) {
      case "members": {
        const response = await sgtRequest("/members/list");
        data = { members: extractArray(response, ['members', 'results']) };
        break;
      }
        
      case "tours": {
        const response = await sgtRequest("/tours/list");
        data = extractArray(response, ['tours', 'results']);
        break;
      }
        
      case "tour-standings": {
        if (!params.tourId) throw new Error("tourId required");
        const response = await sgtRequest("/tours/standings", { 
          tourId: params.tourId,
          grossOrNet: params.grossOrNet || "gross"
        });
        data = extractArray(response, ['standings', 'results']);
        break;
      }
        
      case "tour-members": {
        if (!params.tourId) throw new Error("tourId required");
        const response = await sgtRequest("/tours/members", { tourId: params.tourId });
        data = extractArray(response, ['members', 'results']);
        break;
      }
        
      case "tournaments": {
        if (!params.tourId) throw new Error("tourId required");
        const response = await sgtRequest("/tournaments/list", { tourId: params.tourId });
        data = { results: extractArray(response, ['results', 'tournaments']) };
        break;
      }
        
      case "scorecards": {
        if (!params.tournamentId) throw new Error("tournamentId required");
        const response = await sgtRequest("/tournaments/scorecards", { tournamentId: params.tournamentId });
        data = extractArray(response, ['scorecards', 'results']);
        break;
      }
        
      case "registrations": {
        if (!params.tournamentId) throw new Error("tournamentId required");
        const response = await sgtRequest("/registrations/view", { tournamentId: params.tournamentId });
        data = extractArray(response, ['registrations', 'results']);
        break;
      }
        
      case "member-stats": {
        if (!params.userId) throw new Error("userId required");
        const toursResponse = await sgtRequest("/tours/list");
        const tours = extractArray(toursResponse, ['tours', 'results']);
        
        const memberStats: MemberStats = {
          tours: [],
          handicap: null,
          totalRounds: 0,
        };
        
        const activeTours = tours.filter((t: unknown) => {
          const tour = t as { active?: number };
          return tour.active === 1;
        });
        
        for (const tour of activeTours) {
          const t = tour as { tourId: number; name: string };
          try {
            const membersResponse = await sgtRequest("/tours/members", { tourId: t.tourId.toString() });
            const members = extractArray(membersResponse, ['members', 'results']);
            const memberData = members.find((m: unknown) => {
              const member = m as { user_id: number };
              return member.user_id?.toString() === params.userId;
            }) as { hcp_index?: number; custom_hcp?: number } | undefined;
            
            if (memberData) {
              memberStats.tours.push({
                tourId: t.tourId,
                tourName: t.name,
                handicap: memberData.hcp_index || 0,
                customHandicap: memberData.custom_hcp || 0,
              });
              if (memberStats.handicap === null && memberData.hcp_index !== undefined) {
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
        if (!params.userId) throw new Error("userId required");
        const toursResponse = await sgtRequest("/tours/list");
        const allTours = extractArray(toursResponse, ['tours', 'results']);
        
        const rounds: Array<{
          tournamentId: number;
          tournamentName: string;
          courseName: string;
          date: string;
          status: string;
          scorecard: unknown;
        }> = [];
        
        const activeTours = allTours.filter((t: unknown) => {
          const tour = t as { active?: number };
          return tour.active === 1;
        });
        
        for (const tour of activeTours) {
          const t = tour as { tourId: number };
          try {
            const tournamentsResponse = await sgtRequest("/tournaments/list", { tourId: t.tourId.toString() });
            const tournaments = extractArray(tournamentsResponse, ['results', 'tournaments']);
            
            for (const tournament of tournaments.slice(0, 10)) {
              const tourn = tournament as { tournamentId: number; name: string; courseName: string; end_date: string; status: string };
              try {
                const scorecardsResponse = await sgtRequest("/tournaments/scorecards", { 
                  tournamentId: tourn.tournamentId.toString() 
                });
                const scorecards = extractArray(scorecardsResponse, ['scorecards', 'results']);
                
                const playerScorecard = scorecards.find((sc: unknown) => {
                  const scorecard = sc as { playerId: number };
                  return scorecard.playerId?.toString() === params.userId;
                }) as { courseName?: string } | undefined;
                
                if (playerScorecard) {
                  rounds.push({
                    tournamentId: tourn.tournamentId,
                    tournamentName: tourn.name,
                    courseName: playerScorecard.courseName || tourn.courseName,
                    date: tourn.end_date,
                    status: tourn.status,
                    scorecard: playerScorecard,
                  });
                }
              } catch (e) {
                console.error("Error getting scorecards:", e);
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
