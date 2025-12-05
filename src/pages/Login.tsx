import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayer } from "@/contexts/PlayerContext";
import { sgtClient, Member } from "@/lib/sgt-api";
import birdiesLogo from "@/assets/birdies-logo.png";
import { Search, Loader2, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

export default function Login() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setPlayer, player } = usePlayer();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (player) {
      navigate("/dashboard");
    }
  }, [player, navigate]);

  useEffect(() => {
    async function loadMembers() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await sgtClient.getMembers();
        const activeMembers = data.members?.filter(m => m.user_active === 1) || [];
        setMembers(activeMembers);
        setFilteredMembers(activeMembers);
      } catch (err) {
        console.error("Failed to load members:", err);
        setError("Failed to connect to Birdies. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    loadMembers();
  }, []);

  useEffect(() => {
    if (search.trim() === "") {
      setFilteredMembers(members);
    } else {
      const query = search.toLowerCase();
      setFilteredMembers(
        members.filter(m => 
          m.user_name.toLowerCase().includes(query) ||
          m.user_email?.toLowerCase().includes(query)
        )
      );
    }
  }, [search, members]);

  const handleSelectPlayer = (member: Member) => {
    setPlayer(member);
    toast({
      title: `Welcome, ${member.user_name}!`,
      description: "Let's check your performance.",
    });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Header */}
      <div className="hero-section py-12 px-4">
        <div className="container max-w-lg mx-auto text-center">
          <img 
            src={birdiesLogo} 
            alt="Birdies Golf Simulator" 
            className="h-20 w-auto mx-auto mb-6 animate-fade-in"
          />
          <h1 className="font-anton text-4xl md:text-5xl text-primary-foreground mb-3 animate-slide-up">
            BIRDIES HUB
          </h1>
          <p className="font-inter text-primary-foreground/80 text-lg animate-slide-up" style={{ animationDelay: "100ms" }}>
            Track your simulator performance
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container max-w-lg mx-auto px-4 py-8">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-6 animate-scale-in">
          <h2 className="font-anton text-2xl text-foreground mb-2">
            SELECT YOUR PROFILE
          </h2>
          <p className="font-inter text-muted-foreground mb-6">
            Find your name to view your stats and rounds
          </p>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 font-inter text-base"
            />
          </div>

          {/* Members List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-secondary animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-destructive font-inter mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-inter font-medium hover:bg-secondary/90 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground font-inter">
                  {search ? "No members found matching your search" : "No members available"}
                </p>
              </div>
            ) : (
              filteredMembers.map((member) => (
                <button
                  key={member.user_id}
                  onClick={() => handleSelectPlayer(member)}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:border-secondary hover:bg-secondary/5 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-anton text-lg">
                      {member.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="font-inter font-semibold text-foreground">
                        {member.user_name}
                      </p>
                      {member.user_email && (
                        <p className="font-inter text-sm text-muted-foreground">
                          {member.user_email}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors" />
                </button>
              ))
            )}
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground font-inter mt-6">
          Can't find your profile? Contact Birdies staff.
        </p>
      </div>
    </div>
  );
}
