import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Member, sgtClient } from "@/lib/sgt-api";

interface PlayerContextType {
  player: Member | null;
  setPlayer: (player: Member | null) => void;
  isLoading: boolean;
  logout: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayerState] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored player on mount
    const storedPlayer = localStorage.getItem("birdies_player");
    if (storedPlayer) {
      try {
        setPlayerState(JSON.parse(storedPlayer));
      } catch {
        localStorage.removeItem("birdies_player");
      }
    }
    setIsLoading(false);
  }, []);

  const setPlayer = (player: Member | null) => {
    setPlayerState(player);
    if (player) {
      localStorage.setItem("birdies_player", JSON.stringify(player));
    } else {
      localStorage.removeItem("birdies_player");
    }
  };

  const logout = () => {
    setPlayer(null);
  };

  return (
    <PlayerContext.Provider value={{ player, setPlayer, isLoading, logout }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
