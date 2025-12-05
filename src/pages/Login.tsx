import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayer } from "@/contexts/PlayerContext";
import { sgtClient, Member } from "@/lib/sgt-api";
import birdiesLogo from "@/assets/birdies-logo.png";
import { Mail, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setPlayer, player } = usePlayer();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (player) {
      navigate("/dashboard");
    }
  }, [player, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await sgtClient.getMembers();
      const members = data.members || [];
      
      // Find member by email (case-insensitive)
      const member = members.find(
        (m: Member) => m.user_email?.toLowerCase() === email.trim().toLowerCase()
      );

      if (!member) {
        setError("No account found with this email. Please contact Birdies staff.");
        setIsLoading(false);
        return;
      }

      if (member.user_active !== 1) {
        setError("Your account is not active. Please contact Birdies staff.");
        setIsLoading(false);
        return;
      }

      setPlayer(member);
      navigate("/dashboard");
    } catch (err) {
      console.error("Failed to load members:", err);
      setError("Failed to connect to Birdies. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Header */}
      <div className="hero-section py-16 px-4">
        <div className="container max-w-lg mx-auto text-center">
          <img 
            src={birdiesLogo} 
            alt="Birdies Golf Simulator" 
            className="h-24 w-auto mx-auto mb-8 animate-fade-in"
          />
          <h1 className="font-anton text-4xl md:text-5xl text-primary-foreground animate-slide-up">
            BIRDIES HUB
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container max-w-md mx-auto px-4 py-8">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-8 animate-scale-in">
          <h2 className="font-anton text-2xl text-foreground mb-2 text-center">
            SIGN IN
          </h2>
          <p className="font-inter text-muted-foreground mb-8 text-center">
            Enter your email to view your stats
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                className="pl-10 h-14 font-inter text-base"
                disabled={isLoading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-destructive font-inter text-sm text-center">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 font-inter font-semibold text-base gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  View My Stats
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground font-inter mt-6">
          Don't have an account? Contact Birdies staff.
        </p>
      </div>
    </div>
  );
}
