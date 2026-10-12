'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { SessionProvider, useSession, signOut } from 'next-auth/react';
import { getUserProfile } from '@/actions/user-actions';

export interface AuthUser {
  uid: string;
  id: string;
  email: string | null;
  name?: string | null;
  image?: string | null;
}

export interface UserProfile {
  credits: number;
  creditResetTimestamp: number | null;
}

interface AuthContextType {
  user: AuthUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateLocalCredits: (credits: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthStateContainer({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const user: AuthUser | null = session?.user
    ? {
        uid: session.user.id || session.user.email || 'user',
        id: session.user.id || session.user.email || 'user',
        email: session.user.email ?? null,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
      }
    : null;

  const refreshProfile = useCallback(async () => {
    if (!session?.user) {
      setUserProfile(null);
      return;
    }
    setProfileLoading(true);
    try {
      const profile = await getUserProfile();
      if (profile) {
        setUserProfile({
          credits: profile.credits,
          creditResetTimestamp: profile.creditResetTimestamp,
        });
      } else {
        setUserProfile({
          credits: 15,
          creditResetTimestamp: null,
        });
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setUserProfile({
        credits: 15,
        creditResetTimestamp: null,
      });
    } finally {
      setProfileLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    if (status === 'authenticated') {
      refreshProfile();
    } else if (status === 'unauthenticated') {
      setUserProfile(null);
    }
  }, [status, refreshProfile]);

  const updateLocalCredits = useCallback((credits: number) => {
    setUserProfile((prev) =>
      prev
        ? { ...prev, credits, creditResetTimestamp: credits > 0 ? null : prev.creditResetTimestamp }
        : { credits, creditResetTimestamp: null }
    );
  }, []);

  const logout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const loading = status === 'loading' || (status === 'authenticated' && profileLoading && !userProfile);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        logout,
        refreshProfile,
        updateLocalCredits,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthStateContainer>{children}</AuthStateContainer>
    </SessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
