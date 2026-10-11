import { NavLink } from 'react-router-dom';
import { Home, Swords, Zap, MessageSquare, Shield } from 'lucide-react';
import { useIdentity } from '@/context/IdentityContext';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center gap-0.5 py-2 px-3 transition-colors ${
    isActive ? 'text-amber-400' : 'text-theme-text-3 hover:text-theme-text'
  }`;

export default function BottomNav() {
  const { identity } = useIdentity();

  const links = [
    { to: '/', icon: Home, label: 'Home', end: true },
    { to: '/arena', icon: Swords, label: 'Arena', end: false },
    { to: '/shorts', icon: Zap, label: 'Shorts', end: false },
    { to: '/messages', icon: MessageSquare, label: 'Messages', end: false },
    { to: '/profile', icon: Shield, label: 'Profile', end: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-theme-surface border-t border-theme-border md:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {links.map((link) => (
          <NavLink key={link.to} to={identity ? link.to : '/onboarding'} end={link.end} className={linkClass}>
            <link.icon size={22} />
            <span className="text-[10px] font-medium">{link.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
