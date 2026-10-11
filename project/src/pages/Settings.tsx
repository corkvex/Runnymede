import { useEffect, useState } from 'react';
import { useIdentity } from '@/context/IdentityContext';
import { useTheme } from '@/context/ThemeContext';
import { loadBTCPayConfig, setBTCPayConfig } from '@/lib/btcpay';
import { detectGeo, type GeoInfo } from '@/lib/geofence';
import { Sun, Moon, Globe, Bitcoin, Shield, Key, AlertTriangle } from 'lucide-react';

export default function Settings() {
  const { identity, profile, logout } = useIdentity();
  const { theme, toggleTheme } = useTheme();
  const [geo, setGeo] = useState<GeoInfo | null>(null);
  const [btcUrl, setBtcUrl] = useState('');
  const [btcStoreId, setBtcStoreId] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    detectGeo().then(setGeo);
    const cfg = loadBTCPayConfig();
    setBtcUrl(cfg.serverUrl);
    setBtcStoreId(cfg.storeId);
  }, []);

  const handleSaveBtc = () => {
    setBTCPayConfig({ serverUrl: btcUrl, storeId: btcStoreId });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-theme-text">Settings</h1>

      {/* Identity */}
      {identity && (
        <section className="bg-theme-surface border border-theme-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-theme-text flex items-center gap-2 mb-3"><Key size={16} className="text-amber-400" /> Cryptographic Identity</h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-theme-text-3">Handle</span>
              <span className="text-theme-text font-mono">@{identity.shortId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-text-3">Full ID</span>
              <span className="text-theme-text font-mono truncate max-w-[200px]">{identity.fullId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-text-3">Public Key</span>
              <span className="text-theme-text-2 font-mono truncate max-w-[200px]">{identity.publicKeyB64.substring(0, 24)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-text-3">Created</span>
              <span className="text-theme-text-2">{new Date(identity.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          {profile && (
            <div className="mt-3 pt-3 border-t border-theme-border">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-theme-text-3">Elo Rating</span>
                <span className="text-theme-text">{profile.elo}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-theme-text-3">Record</span>
                <span className="text-theme-text">{profile.debatesWon}W · {profile.debatesLost}L</span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Appearance */}
      <section className="bg-theme-surface border border-theme-border rounded-xl p-4">
        <h2 className="text-sm font-semibold text-theme-text mb-3">Appearance</h2>
        <button onClick={toggleTheme} className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-theme-hover transition-colors">
          {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-blue-400" />}
          <span className="text-sm text-theme-text-2">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </section>

      {/* Geofencing */}
      <section className="bg-theme-surface border border-theme-border rounded-xl p-4">
        <h2 className="text-sm font-semibold text-theme-text flex items-center gap-2 mb-3"><Globe size={16} className="text-amber-400" /> Geofencing</h2>
        {geo ? (
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-theme-text-3">Detected Country</span>
              <span className="text-theme-text">{geo.countryCode || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-text-3">Detection Method</span>
              <span className="text-theme-text capitalize">{geo.source}</span>
            </div>
            {geo.countryCode && (
              <p className="text-theme-text-3 text-xs mt-2">
                Restricted topics in your jurisdiction are automatically filtered from your feed.
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-theme-text-3">Detecting location...</p>
        )}
      </section>

      {/* BTCPay */}
      <section className="bg-theme-surface border border-theme-border rounded-xl p-4">
        <h2 className="text-sm font-semibold text-theme-text flex items-center gap-2 mb-3"><Bitcoin size={16} className="text-orange-400" /> BTCPay Server</h2>
        <p className="text-xs text-theme-text-3 mb-3">Connect your self-hosted BTCPay Server for real Bitcoin payments.</p>
        <div className="space-y-2">
          <input type="text" value={btcUrl} onChange={(e) => setBtcUrl(e.target.value)} placeholder="https://btcpay.yourserver.com" className="w-full bg-theme-input border border-theme-input-border rounded-lg px-3 py-2 text-theme-text text-sm focus:outline-none focus:border-amber-500" />
          <input type="text" value={btcStoreId} onChange={(e) => setBtcStoreId(e.target.value)} placeholder="Store ID" className="w-full bg-theme-input border border-theme-input-border rounded-lg px-3 py-2 text-theme-text text-sm focus:outline-none focus:border-amber-500" />
          <button onClick={handleSaveBtc} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors">
            {saved ? 'Saved!' : 'Save Configuration'}
          </button>
        </div>
      </section>

      {/* Danger zone */}
      <section className="bg-red-950/20 border border-red-900/30 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-2"><AlertTriangle size={16} /> Danger Zone</h2>
        <p className="text-xs text-theme-text-3 mb-3">
          Destroying your identity is permanent. Your private key will be wiped from this device and cannot be recovered.
        </p>
        <button onClick={logout} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors">
          <Shield size={16} /> Destroy Identity
        </button>
      </section>
    </div>
  );
}
