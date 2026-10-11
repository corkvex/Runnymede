import { NavLink } from 'react-router-dom';
import { Home, Zap, Video, Mic, Swords, TrendingUp, Compass } from 'lucide-react';

const tabs = [
  { to: '/', label: 'All', icon: Home, end: true },
  { to: '/discover', label: 'Discover', icon: Compass, end: false },
  { to: '/shorts', label: 'Shorts', icon: Zap, end: false },
  { to: '/videos', label: 'Videos', icon: Video, end: false },
  { to: '/podcasts', label: 'Podcasts', icon: Mic, end: false },
  { to: '/arena', label: 'Debates', icon: Swords, end: false },
  { to: '/ladder', label: 'Rankings', icon: TrendingUp, end: false },
];

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
    isActive
      ? 'bg-theme-text text-theme-base'
      : 'bg-theme-elevated text-theme-text-2 hover:bg-theme-hover'
  }`;

export default function TopNav() {
  return (
    <nav className="sticky top-14 z-30 bg-theme-base border-b border-theme-border">
      <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.end} className={tabClass}>
            <tab.icon size={15} />
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
