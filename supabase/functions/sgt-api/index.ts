import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { action, params = {} } = await req.json();
    
    let data;
    
    switch (action) {
      case "members": {
        const { data: members, error } = await supabase
          .from("sgt_members")
          .select("*")
          .eq("user_active", 1)
          .order("user_name");
        
        if (error) throw error;
        
        // Map to expected format
        data = { 
          members: members?.map(m => ({
            user_id: m.user_id,
            user_name: m.user_name,
            user_email: m.user_email,
            user_active: m.user_active,
            user_country_code: m.user_country_code,
            user_has_avatar: m.user_has_avatar,
            user_game_id: m.user_game_id,
          })) || []
        };
        break;
      }
        
      case "tours": {
        const { data: tours, error } = await supabase
          .from("sgt_tours")
          .select("*")
          .order("active", { ascending: false });
        
        if (error) throw error;
        
        data = tours?.map(t => ({
          tourId: t.tour_id,
          name: t.name,
          start_date: t.start_date,
          end_date: t.end_date,
          teamTour: t.team_tour,
          active: t.active,
        })) || [];
        break;
      }
        
      case "tour-standings": {
        if (!params.tourId) throw new Error("tourId required");
        
        const { data: standings, error } = await supabase
          .from("sgt_tour_standings")
          .select("*")
          .eq("tour_id", parseInt(params.tourId))
          .eq("gross_or_net", params.grossOrNet || "gross")
          .order("position");
        
        if (error) throw error;
        
        data = standings?.map(s => ({
          user_name: s.user_name,
          country_code: s.country_code,
          user_has_avatar: s.user_has_avatar,
          hcp: s.hcp,
          events: s.events,
          first: s.first,
          top5: s.top5,
          top10: s.top10,
          points: s.points,
          position: s.position,
        })) || [];
        break;
      }
        
      case "tour-members": {
        if (!params.tourId) throw new Error("tourId required");
        
        const { data: members, error } = await supabase
          .from("sgt_tour_members")
          .select("*")
          .eq("tour_id", parseInt(params.tourId));
        
        if (error) throw error;
        
        data = members?.map(m => ({
          user_id: m.user_id,
          user_name: m.user_name,
          hcp_index: m.hcp_index,
          custom_hcp: m.custom_hcp,
        })) || [];
        break;
      }
        
      case "tournaments": {
        if (!params.tourId) throw new Error("tourId required");
        
        const { data: tournaments, error } = await supabase
          .from("sgt_tournaments")
          .select("*")
          .eq("tour_id", parseInt(params.tourId))
          .order("end_date", { ascending: false });
        
        if (error) throw error;
        
        data = { 
          results: tournaments?.map(t => ({
            tournamentId: t.tournament_id,
            tourId: t.tour_id,
            name: t.name,
            courseName: t.course_name,
            status: t.status,
            start_date: t.start_date,
            end_date: t.end_date,
          })) || []
        };
        break;
      }
        
      case "scorecards": {
        if (!params.tournamentId) throw new Error("tournamentId required");
        
        const { data: scorecards, error } = await supabase
          .from("sgt_scorecards")
          .select("*")
          .eq("tournament_id", parseInt(params.tournamentId));
        
        if (error) throw error;
        
        data = scorecards?.map(sc => ({
          playerId: sc.player_id,
          player_name: sc.player_name,
          hcp_index: sc.hcp_index,
          round: sc.round,
          courseName: sc.course_name,
          teetype: sc.teetype,
          rating: sc.rating,
          slope: sc.slope,
          total_gross: sc.total_gross,
          total_net: sc.total_net,
          toPar_gross: sc.to_par_gross,
          toPar_net: sc.to_par_net,
          in_gross: sc.in_gross,
          out_gross: sc.out_gross,
          in_net: sc.in_net,
          out_net: sc.out_net,
          ...sc.hole_data,
        })) || [];
        break;
      }
        
      case "member-stats": {
        if (!params.userId) throw new Error("userId required");
        
        // Get tour memberships with handicap info
        const { data: tourMemberships, error: tmError } = await supabase
          .from("sgt_tour_members")
          .select("*, sgt_tours!inner(name, active)")
          .eq("user_id", parseInt(params.userId));
        
        if (tmError) throw tmError;
        
        const tours = tourMemberships
          ?.filter(tm => tm.sgt_tours?.active === 1)
          .map(tm => ({
            tourId: tm.tour_id,
            tourName: tm.sgt_tours?.name,
            handicap: tm.hcp_index || 0,
            customHandicap: tm.custom_hcp || 0,
          })) || [];
        
        data = {
          tours,
          handicap: tours.length > 0 ? tours[0].handicap : null,
          totalRounds: 0,
        };
        break;
      }
        
      case "player-rounds": {
        if (!params.userId) throw new Error("userId required");
        
        // Get all scorecards for this player with tournament info
        const { data: scorecards, error } = await supabase
          .from("sgt_scorecards")
          .select("*, sgt_tournaments!inner(name, course_name, end_date, status)")
          .eq("player_id", parseInt(params.userId))
          .order("sgt_tournaments(end_date)", { ascending: false })
          .limit(50);
        
        if (error) throw error;
        
        data = scorecards?.map(sc => ({
          tournamentId: sc.tournament_id,
          tournamentName: sc.sgt_tournaments?.name,
          courseName: sc.course_name || sc.sgt_tournaments?.course_name,
          date: sc.sgt_tournaments?.end_date,
          status: sc.sgt_tournaments?.status,
          scorecard: {
            playerId: sc.player_id,
            player_name: sc.player_name,
            hcp_index: sc.hcp_index,
            round: sc.round,
            courseName: sc.course_name,
            teetype: sc.teetype,
            rating: sc.rating,
            slope: sc.slope,
            total_gross: sc.total_gross,
            total_net: sc.total_net,
            toPar_gross: sc.to_par_gross,
            toPar_net: sc.to_par_net,
            in_gross: sc.in_gross,
            out_gross: sc.out_gross,
            in_net: sc.in_net,
            out_net: sc.out_net,
            holeData: sc.hole_data,
            ...sc.hole_data,
          },
        })) || [];
        break;
      }

      case "last-sync": {
        const { data: lastSync, error } = await supabase
          .from("sgt_sync_log")
          .select("*")
          .eq("status", "completed")
          .order("completed_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (error) throw error;
        data = lastSync;
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
