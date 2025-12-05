import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import birdiesLogo from "@/assets/birdies-logo.png";
import { 
  LayoutDashboard, 
  History, 
  Trophy, 
  User, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/rounds", label: "Rounds", icon: History },
  { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { path: "/profile", label: "Profile", icon: User },
];

export function Layout({ children }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="hero-section sticky top-0 z-50 shadow-lg">
        <div className="container flex items-center justify-between h-16 px-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src={birdiesLogo} alt="Birdies" className="h-10 w-auto" />
            <span className="font-anton text-xl text-primary-foreground hidden sm:block">
              BIRDIES HUB
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg font-inter text-sm font-medium transition-all",
                    isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User & Logout */}
          <div className="hidden md:flex items-center gap-4">
            <span className="text-primary-foreground/80 text-sm font-inter">
              {profile?.display_name || profile?.email?.split("@")[0]}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 transition-all"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-primary-foreground p-2"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 animate-slide-up">
            <nav className="container py-4 px-4 flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg font-inter font-medium transition-all",
                      isActive
                        ? "bg-secondary text-secondary-foreground"
                        : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 transition-all mt-2 border-t border-white/10 pt-4"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container py-6 px-4">
        {children}
      </main>
    </div>
  );
}
