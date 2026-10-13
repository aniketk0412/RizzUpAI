'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client';
import { getUserProfile } from '@/actions/user-actions';
import { getClientDeviceFingerprint } from '@/lib/fingerprint-client';

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
  isPaid?: boolean;
  deviceClaimedBefore?: boolean;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshProfile = useCallback(async () => {
    try {
      const { data: session } = await authClient.getSession();
      if (!session?.user) {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      setUser({
        uid: session.user.id,
        id: session.user.id,
        email: session.user.email ?? null,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
      });

      // Obtain client hardware & persistent device fingerprint
      let fingerprint: { fingerprintHash: string; deviceId: string } | undefined;
      try {
        fingerprint = await getClientDeviceFingerprint();
      } catch {
        // Fallback to cookie / server detection
      }

      const profile = await getUserProfile(fingerprint);
      if (profile) {
        setUserProfile({
          credits: profile.credits,
          creditResetTimestamp: profile.creditResetTimestamp,
          isPaid: profile.isPaid,
          deviceClaimedBefore: profile.deviceClaimedBefore,
        });
      } else {
        setUserProfile({
          credits: 15,
          creditResetTimestamp: null,
          isPaid: false,
        });
      }
    } catch (error) {
      console.error('Failed to load user session/profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const updateLocalCredits = useCallback((credits: number) => {
    setUserProfile((prev) =>
      prev
        ? {
            ...prev,
            credits,
            creditResetTimestamp: credits > 0 ? null : prev.creditResetTimestamp,
          }
        : { credits, creditResetTimestamp: null }
    );
  }, []);

  const logout = async () => {
    await authClient.signOut();
    setUser(null);
    setUserProfile(null);
    router.push('/login');
  };

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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
