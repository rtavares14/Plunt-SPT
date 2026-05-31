import { createContext } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  bio?: string | null;
  city?: string | null;
  emailVerified: boolean;
  hasPassword: boolean;
  hasGoogleLink: boolean;
  hasAppleLink: boolean;
}

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<string | null>;
  setUser: (user: AuthUser) => void;
  authFetch: (input: string, init?: RequestInit) => Promise<Response>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
