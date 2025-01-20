import React, { createContext, useContext, useState, useEffect } from "react";

interface LocationContextType {
  location: string;
  setLocation: (location: string) => void;
}

export const LocationContext = createContext<LocationContextType | undefined>(
  undefined
);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<string>(() => {
    return localStorage.getItem("userLocation") || "Bangalore";
  });

  useEffect(() => {
    localStorage.setItem("userLocation", location);
  }, [location]);

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
