import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import birdiesLogo from "@/assets/birdies-logo.png";
import { Mail, Lock, Loader2, ArrowRight, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { signIn, signUp, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  const validateForm = () => {
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as "email" | "password";
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign up failed",
              description: error.message,
              variant: "destructive",
            });
          }
          return;
        }
        toast({
          title: "Account created!",
          description: "Welcome to Birdies Hub. You're now signed in.",
        });
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login")) {
            toast({
              title: "Invalid credentials",
              description: "Please check your email and password.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign in failed",
              description: error.message,
              variant: "destructive",
            });
          }
          return;
        }
      }
      
      navigate("/dashboard");
    } catch (err) {
      console.error("Auth error:", err);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-secondary animate-spin" />
      </div>
    );
  }

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
            {isSignUp ? "CREATE ACCOUNT" : "SIGN IN"}
          </h2>
          <p className="font-inter text-muted-foreground mb-8 text-center">
            {isSignUp 
              ? "Sign up with your Birdies email to access your stats" 
              : "Enter your credentials to view your stats"
            }
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-1">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className="pl-10 h-14 font-inter text-base"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-destructive font-inter text-sm pl-1">{errors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  className="pl-10 h-14 font-inter text-base"
                  disabled={isLoading}
                />
              </div>
              {errors.password && (
                <p className="text-destructive font-inter text-sm pl-1">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 font-inter font-semibold text-base gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {isSignUp ? "Creating account..." : "Signing in..."}
                </>
              ) : (
                <>
                  {isSignUp ? "Create Account" : "Sign In"}
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="mt-6 pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrors({});
              }}
              className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground font-inter text-sm transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              {isSignUp 
                ? "Already have an account? Sign in" 
                : "Don't have an account? Sign up"
              }
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground font-inter mt-6">
          Use the same email you registered with at Birdies to link your stats.
        </p>
      </div>
    </div>
  );
}
