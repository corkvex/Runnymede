import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  generateIdentity,
  loadIdentity,
  clearIdentity,
  type CryptoIdentity,
} from '@/lib/crypto';
import {
  saveProfile,
  getProfile,
  type StoredProfile,
} from '@/lib/storage';
import { STARTING_ELO } from '@/lib/elo';

interface IdentityContextType {
  identity: CryptoIdentity | null;
  profile: StoredProfile | null;
  loading: boolean;
  createIdentity: () => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const IdentityContext = createContext<IdentityContextType>({
  identity: null,
  profile: null,
  loading: true,
  createIdentity: async () => {},
  logout: () => {},
  refreshProfile: async () => {},
});

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<CryptoIdentity | null>(null);
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = loadIdentity();
    if (stored) {
      setIdentity(stored);
      getProfile(stored.fullId).then((p) => {
        setProfile(p || null);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const createIdentity = async () => {
    const newIdentity = await generateIdentity();
    setIdentity(newIdentity);

    const newProfile: StoredProfile = {
      id: newIdentity.fullId,
      handle: `@${newIdentity.shortId}`,
      publicKey: newIdentity.publicKeyB64,
      elo: STARTING_ELO,
      debatesWon: 0,
      debatesLost: 0,
      bio: 'A new voice on the Runnymede floor.',
      avatarSeed: newIdentity.shortId,
      createdAt: Date.now(),
    };

    await saveProfile(newProfile);
    setProfile(newProfile);
  };

  const logout = () => {
    clearIdentity();
    setIdentity(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (!identity) return;
    const p = await getProfile(identity.fullId);
    setProfile(p || null);
  };

  return (
    <IdentityContext.Provider
      value={{ identity, profile, loading, createIdentity, logout, refreshProfile }}
    >
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  return useContext(IdentityContext);
}
