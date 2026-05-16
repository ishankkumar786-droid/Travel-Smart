import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useAuth as useClerkAuth, useUser, useClerk } from '@clerk/clerk-expo';
import { authAPI, setTokenProvider } from '@/services/api';
import { storageService } from '@/services/storageService';

interface User {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  points: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isGuest: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, signOut, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  
  const [isGuest, setIsGuest] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [dbUser, setDbUser] = useState<Partial<User> | null>(null);

  // Register token provider once
  useEffect(() => {
    setTokenProvider(getToken);
  }, [getToken]);

  // Load guest mode
  useEffect(() => {
    SecureStore.getItemAsync('guestMode').then(val => {
      if (val === 'true') setIsGuest(true);
    });
  }, []);

  const refreshUser = useCallback(async () => {
    if (isSignedIn) {
      try {
        const res = await authAPI.verify();
        if (res.data.success && res.data.data.user) {
          setDbUser(res.data.data.user);
        }
      } catch (e) {
        console.error('Failed to fetch user from DB:', e);
      }
    } else {
      setDbUser(null);
    }
  }, [isSignedIn]);

  // Sync with DB when signed in
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await clerkSignOut();
      await SecureStore.deleteItemAsync('guestMode');
      await storageService.clearCache();
      setIsGuest(false);
      setSessionToken(null);
      setDbUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [clerkSignOut]);

  const continueAsGuest = useCallback(() => {
    setIsGuest(true);
    SecureStore.setItemAsync('guestMode', 'true').catch(() => {});
  }, []);

  // Map Clerk user and merge with DB user to our User interface
  const mappedUser: User | null = clerkUser ? {
    _id: clerkUser.id,
    name: clerkUser.fullName || clerkUser.username || 'User',
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    isAdmin: dbUser?.isAdmin ?? !!clerkUser.publicMetadata?.isAdmin,
    points: dbUser?.points ?? ((clerkUser.publicMetadata?.points as number) || 0),
  } : null;

  return (
    <AuthContext.Provider
      value={{
        user: mappedUser,
        token: sessionToken,
        isGuest,
        isLoading: !isLoaded,
        isAuthenticated: !!isSignedIn,
        login: async () => ({ success: false, message: 'Use Clerk Sign In' }),
        signup: async () => ({ success: false, message: 'Use Clerk Sign Up' }),
        logout,
        continueAsGuest,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
