import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Zap, X, Menu, Search, Upload, Sun, Moon } from 'lucide-react';
import { useIdentity } from '@/context/IdentityContext';
import { useTheme } from '@/context/ThemeContext';
import EloBadge from '@/components/EloBadge';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { identity, profile, logout } = useIdentity();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMenuOpen(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) setSearchQuery(q);
  }, [location]);

  return (
    <header className="h-14 sticky top-0 z-50 flex items-center justify-between px-2 md:px-4 gap-2 bg-theme-surface border-b border-theme-border">
      {/* Left: hamburger + logo */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <button className="text-theme-text-3 hover:text-theme-text hover:bg-theme-hover rounded-full p-2 transition-colors" onClick={() => onToggleSidebar?.()}>
          <Menu size={22} />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
            <img src="/logo-yew-tree.webp" alt="Runnymede" className="w-full h-full object-contain" />
          </div>
          <span className="hidden sm:block text-theme-text font-bold text-lg tracking-tight">
            Runnymede
          </span>
        </Link>
      </div>

      {/* Center: search bar */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-2 md:mx-4">
        <div className="flex items-center">
          <div className="flex-1 flex items-center bg-theme-input border border-theme-input-border rounded-l-full px-4 h-10 focus-within:border-amber-500 transition-colors">
            <Search size={16} className="text-theme-text-3 mr-2 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search debates, videos, debaters..."
              className="flex-1 bg-transparent text-theme-text text-sm placeholder-theme-text-3 focus:outline-none min-w-0"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="text-theme-text-3 hover:text-theme-text shrink-0 ml-1">
                <X size={14} />
              </button>
            )}
          </div>
          <button type="submit" className="h-10 px-5 bg-theme-elevated border border-l-0 border-theme-input-border rounded-r-full hover:bg-theme-hover transition-colors shrink-0">
            <Search size={18} className="text-theme-text-3" />
          </button>
        </div>
      </form>

      {/* Right: actions */}
      <div className="flex items-center gap-1 md:gap-2 shrink-0">
        {identity && (
          <Link
            to="/upload"
            className="w-9 h-9 flex items-center justify-center rounded-full text-theme-text-3 hover:text-theme-text hover:bg-theme-hover transition-colors"
            title="Upload"
          >
            <Upload size={20} />
          </Link>
        )}
        {identity && profile && (
          <div className="hidden sm:block">
            <EloBadge elo={profile.elo} size="sm" />
          </div>
        )}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-full text-theme-text-3 hover:text-theme-text hover:bg-theme-hover transition-colors"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {identity && profile ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 rounded-full overflow-hidden border-2 border-theme-border hover:border-theme-text transition-colors"
            >
              <div className="w-full h-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                {identity.shortId.substring(0, 2).toUpperCase()}
              </div>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-12 w-56 bg-theme-surface border border-theme-border rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-theme-border">
                    <p className="text-xs text-theme-text-3">Your Identity</p>
                    <p className="text-sm font-mono text-theme-text truncate">@{identity.shortId}</p>
                    <div className="mt-2"><EloBadge elo={profile.elo} size="sm" /></div>
                  </div>
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-theme-hover transition-colors text-theme-text-2 text-sm">
                    Profile & Stats
                  </Link>
                  <Link to="/wallet" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-theme-hover transition-colors text-theme-text-2 text-sm">
                    Wallet
                  </Link>
                  <Link to="/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-theme-hover transition-colors text-theme-text-2 text-sm">
                    Settings
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-theme-hover transition-colors text-red-400 text-sm border-t border-theme-border">
                    <X size={16} /> Destroy Identity
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link
            to="/onboarding"
            className="flex items-center gap-2 px-3 md:px-4 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-500 text-white rounded-full transition-colors"
          >
            <Zap size={16} />
            <span className="hidden sm:inline">Create Identity</span>
          </Link>
        )}
      </div>
    </header>
  );
}
