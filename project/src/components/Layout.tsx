import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import TopNav from '@/components/TopNav';
import { useIdentity } from '@/context/IdentityContext';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-theme-base">
      <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <TopNav />
      <div className="flex">
        <Sidebar mobileOpen={sidebarOpen} onCloseMobile={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0 pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

export function ProtectedLayout() {
  const { identity, loading } = useIdentity();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-base flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-theme-border border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!identity) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen bg-theme-base">
      <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <TopNav />
      <div className="flex">
        <Sidebar mobileOpen={sidebarOpen} onCloseMobile={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0 pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
