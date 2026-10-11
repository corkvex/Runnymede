import { NavLink } from 'react-router-dom';
import {
  Home, Swords, Trophy, MessageSquare, Wallet, Library, Zap, Shield, Video, Upload, Settings, X, Compass,
} from 'lucide-react';
import { useIdentity } from '@/context/IdentityContext';
import EloBadge from '@/components/EloBadge';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors ${
    isActive
      ? 'bg-theme-elevated text-theme-text'
      : 'text-theme-text-3 hover:bg-theme-hover hover:text-theme-text'
  }`;

const sectionLabel = 'px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-theme-text-3';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { identity, profile } = useIdentity();

  const browseLinks = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/discover', icon: Compass, label: 'Discover' },
    { to: '/shorts', icon: Zap, label: 'Shorts' },
    { to: '/videos', icon: Video, label: 'Videos' },
  ];

  const debateLinks = [
    { to: '/arena', icon: Swords, label: 'Debate Arena' },
    { to: '/ladder', icon: Trophy, label: 'Rankings' },
  ];

  const personalLinks = [
    { to: '/upload', icon: Upload, label: 'Upload' },
    { to: '/library', icon: Library, label: 'Library' },
    { to: '/messages', icon: MessageSquare, label: 'Messages' },
    { to: '/wallet', icon: Wallet, label: 'Wallet' },
  ];

  const renderLinks = (links: typeof browseLinks) =>
    links.map((link) => (
      <NavLink key={link.to} to={link.to} end={link.to === '/'} className={linkClass} onClick={onCloseMobile}>
        <link.icon size={20} />
        <span className="text-sm font-medium">{link.label}</span>
      </NavLink>
    ));

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onCloseMobile} />
      )}

      <aside className={`fixed md:sticky top-14 left-0 z-40 md:z-auto w-60 shrink-0 border-r border-theme-border bg-theme-surface h-[calc(100vh-56px)] overflow-y-auto flex flex-col transition-transform duration-200 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Mobile close button */}
        <button onClick={onCloseMobile} className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full text-theme-text-3 hover:text-theme-text hover:bg-theme-hover transition-colors md:hidden">
          <X size={18} />
        </button>

        <nav className="p-3 space-y-0.5 flex-1">
          <div className={sectionLabel}>Browse</div>
          {renderLinks(browseLinks)}

          <div className={sectionLabel}>Debate</div>
          {renderLinks(debateLinks)}

          <div className={sectionLabel}>Personal</div>
          {renderLinks(personalLinks)}

          {identity && profile && (
            <>
              <div className="border-t border-theme-border mx-3 my-2" />
              <NavLink to="/profile" className={linkClass} onClick={onCloseMobile}>
                <Shield size={20} />
                <span className="text-sm font-medium">My Profile</span>
              </NavLink>
              <NavLink to="/settings" className={linkClass} onClick={onCloseMobile}>
                <Settings size={20} />
                <span className="text-sm font-medium">Settings</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-theme-border">
          {identity && profile ? (
            <div className="space-y-2">
              <div className="text-xs text-theme-text-3">Your Identity</div>
              <div className="text-sm font-mono text-theme-text truncate">@{identity.shortId}</div>
              <EloBadge elo={profile.elo} size="sm" />
            </div>
          ) : (
            <p className="text-xs text-theme-text-3 leading-relaxed">
              Runnymede © 2026
              <br />
              Zero PII. Zero servers. Sovereign by design.
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
