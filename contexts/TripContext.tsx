import React, { createContext, useContext, useState, useCallback } from 'react';

export interface TripParams {
  source: string;
  destination: string;
  budget: 'low' | 'moderate' | 'high';
  days: number;
  people: number;
  intent: string;
}

export interface DayItinerary {
  day: number;
  title: string;
  travel?: {
    mode: string;
    duration: string;
    costRange: string;
    distance?: string;
  };
  places: Array<{
    name: string;
    bestTime: string;
    duration: string;
    category: string;
    description?: string;
    entryFee?: string;
  }>;
  food: Array<{
    name: string;
    type: string;
    famousFor?: string;
    area?: string;
    priceRange?: string;
  }>;
  stay?: {
    category: string;
    priceRange: string;
    suggestions?: string[];
  };
  tips: string[];
  avoid: string[];
  localGems?: Array<{
    name: string;
    type: string;
    description: string;
  }>;
}

export interface Itinerary {
  destination: string;
  source: string;
  budget: string;
  travelOverview?: {
    distance: string;
    duration: string;
    mode: string;
    costRange: string;
  };
  days: DayItinerary[];
  mode: 'premium' | 'ai-generated';
  confidenceScore: number;
  summary?: string;
  disclaimer?: string;
}

interface TripContextType {
  tripParams: TripParams | null;
  currentItinerary: Itinerary | null;
  setTripParams: (params: TripParams) => void;
  setCurrentItinerary: (itinerary: Itinerary) => void;
  clearTrip: () => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [tripParams, setTripParams] = useState<TripParams | null>(null);
  const [currentItinerary, setCurrentItinerary] = useState<Itinerary | null>(null);

  const clearTrip = useCallback(() => {
    setTripParams(null);
    setCurrentItinerary(null);
  }, []);

  return (
    <TripContext.Provider
      value={{
        tripParams,
        currentItinerary,
        setTripParams,
        setCurrentItinerary,
        clearTrip,
      }}
    >
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
}
