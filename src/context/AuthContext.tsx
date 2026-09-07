/**
 * Authentication & User Isolation Context
 * 
 * Manages active user identity, demo mode toggling, user switching,
 * workspaces, profile configuration, and guarantees hard multi-tenant isolation.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserProfile, Workspace } from '../types/domain';
import { LocalDatabase } from '../repositories/localDatabase';
import { WorkspaceRepository } from '../repositories/workspaceRepository';
import { SeedService } from '../services/seedService';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  activeWorkspace: Workspace | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  isProfileModalOpen: boolean;
  isWorkspaceModalOpen: boolean;
  signIn: (email: string, displayName?: string) => Promise<void>;
  signUp: (email: string, displayName: string) => Promise<void>;
  signOut: () => void;
  toggleDemoMode: (enableDemo: boolean) => void;
  refreshProfile: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setActiveWorkspaceId: (id: string) => void;
  createWorkspace: (name: string, description?: string) => Promise<Workspace>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  openWorkspaceModal: () => void;
  closeWorkspaceModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: User = {
  id: 'user_demo_trader',
  email: 'quant.demo@tradeos.terminal',
  displayName: 'Alex Rivers (Pro Trader)',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: new Date().toISOString(),
  isDemo: true,
};

const STORAGE_AUTH_KEY = 'tradeos_auth_session_v1';
const workspaceRepo = new WorkspaceRepository();

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);

  const loadUserData = async (userId: string) => {
    // 1. Load or Initialize Workspaces
    let userWorkspaces = await workspaceRepo.getWorkspaces(userId);
    if (userWorkspaces.length === 0) {
      const defaultWs = await workspaceRepo.createWorkspace({
        userId,
        name: 'Primary Portfolio',
        description: 'Main multi-asset execution & evaluation workspace',
        isDefault: true,
      });
      userWorkspaces = [defaultWs];
    }
    setWorkspaces(userWorkspaces);

    // 2. Load or Initialize Profile
    const profiles = LocalDatabase.getItems<UserProfile>(userId, 'profile');
    let activeProfile: UserProfile;
    if (profiles.length > 0) {
      activeProfile = profiles[0];
      if (!userWorkspaces.some(w => w.id === activeProfile.activeWorkspaceId)) {
        activeProfile.activeWorkspaceId = userWorkspaces[0].id;
        LocalDatabase.updateItem<UserProfile>(userId, 'profile', userId, { activeWorkspaceId: userWorkspaces[0].id });
      }
    } else {
      activeProfile = {
        userId,
        defaultCurrency: 'USD',
        defaultTimezone: 'America/New_York',
        riskTolerancePercent: 1.0,
        experienceLevel: 'ADVANCED',
        themePreference: 'dark',
        enableSoundEffects: true,
        activeWorkspaceId: userWorkspaces[0].id,
      };
      LocalDatabase.insertItem(userId, 'profile', { id: userId, ...activeProfile });
    }

    setUserProfile(activeProfile);
    setActiveWorkspaceIdState(activeProfile.activeWorkspaceId || userWorkspaces[0].id);
  };

  useEffect(() => {
    // Initialize Auth Session
    const initAuth = async () => {
      try {
        const session = localStorage.getItem(STORAGE_AUTH_KEY);
        if (session) {
          const user = JSON.parse(session) as User;
          setCurrentUser(user);
          await loadUserData(user.id);
        } else {
          // Default to Demo Trader for immediate review & testability
          setCurrentUser(DEMO_USER);
          const existingAccounts = LocalDatabase.getItems(DEMO_USER.id, 'accounts');
          if (existingAccounts.length === 0) {
            SeedService.seedInitialData(DEMO_USER.id);
          }
          await loadUserData(DEMO_USER.id);
          localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(DEMO_USER));
        }
      } catch (e) {
        console.error('Failed to initialize auth session:', e);
        setCurrentUser(DEMO_USER);
        await loadUserData(DEMO_USER.id);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email: string, displayName?: string) => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const safeId = 'usr_' + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
      const user: User = {
        id: safeId,
        email: cleanEmail,
        displayName: displayName?.trim() || cleanEmail.split('@')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDemo: false,
      };
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(user));
      setCurrentUser(user);
      await loadUserData(user.id);
      setIsAuthModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, displayName: string) => {
    return signIn(email, displayName);
  };

  const signOut = () => {
    localStorage.removeItem(STORAGE_AUTH_KEY);
    setCurrentUser(null);
    setUserProfile(null);
    setWorkspaces([]);
    setActiveWorkspaceIdState('');
  };

  const toggleDemoMode = async (enableDemo: boolean) => {
    if (enableDemo) {
      setCurrentUser(DEMO_USER);
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(DEMO_USER));
      const existing = LocalDatabase.getItems(DEMO_USER.id, 'accounts');
      if (existing.length === 0) {
        SeedService.seedInitialData(DEMO_USER.id);
      }
      await loadUserData(DEMO_USER.id);
      setIsAuthModalOpen(false);
    } else {
      signOut();
    }
  };

  const refreshProfile = () => {
    if (currentUser) {
      loadUserData(currentUser.id);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser || !userProfile) return;
    const updated = { ...userProfile, ...updates };
    LocalDatabase.updateItem(currentUser.id, 'profile', currentUser.id, updated);
    setUserProfile(updated);
  };

  const setActiveWorkspaceId = (id: string) => {
    setActiveWorkspaceIdState(id);
    if (currentUser && userProfile) {
      updateProfile({ activeWorkspaceId: id });
    }
  };

  const createWorkspace = async (name: string, description?: string): Promise<Workspace> => {
    if (!currentUser) throw new Error('Unauthenticated user');
    const newWs = await workspaceRepo.createWorkspace({
      userId: currentUser.id,
      name,
      description,
      isDefault: false,
    });
    setWorkspaces((prev) => [...prev, newWs]);
    setActiveWorkspaceId(newWs.id);
    return newWs;
  };

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0] || null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        workspaces,
        activeWorkspaceId,
        activeWorkspace,
        isAuthenticated: !!currentUser,
        isDemoMode: !!currentUser?.isDemo,
        isLoading,
        isAuthModalOpen,
        isProfileModalOpen,
        isWorkspaceModalOpen,
        signIn,
        signUp,
        signOut,
        toggleDemoMode,
        refreshProfile,
        updateProfile,
        setActiveWorkspaceId,
        createWorkspace,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        openProfileModal: () => setIsProfileModalOpen(true),
        closeProfileModal: () => setIsProfileModalOpen(false),
        openWorkspaceModal: () => setIsWorkspaceModalOpen(true),
        closeWorkspaceModal: () => setIsWorkspaceModalOpen(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
