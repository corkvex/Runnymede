import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { IdentityProvider } from '@/context/IdentityContext';
import Layout, { ProtectedLayout } from '@/components/Layout';
import Home from '@/pages/Home';
import Onboarding from '@/pages/Onboarding';
import Arena from '@/pages/Arena';
import ArenaList from '@/pages/ArenaList';
import ArenaNew from '@/pages/ArenaNew';
import Profile from '@/pages/Profile';
import Messages from '@/pages/Messages';
import Wallet from '@/pages/Wallet';
import Ladder from '@/pages/Ladder';
import Settings from '@/pages/Settings';
import Shorts from '@/pages/Shorts';
import Search from '@/pages/Search';
import Discover from '@/pages/Discover';
import Videos from '@/pages/Videos';
import Podcasts from '@/pages/Podcasts';
import Upload from '@/pages/Upload';
import Watch from '@/pages/Watch';
import Library from '@/pages/Library';

export default function App() {
  return (
    <ThemeProvider>
      <IdentityProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/ladder" element={<Ladder />} />
              <Route path="/shorts" element={<Shorts />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/podcasts" element={<Podcasts />} />
              <Route path="/search" element={<Search />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/watch/:id" element={<Watch />} />
              <Route path="/arena" element={<ArenaList />} />
              <Route path="/arena/:id" element={<Arena />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:id" element={<Profile />} />
            </Route>

            <Route element={<ProtectedLayout />}>
              <Route path="/arena/new" element={<ArenaNew />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/messages/:conversationId" element={<Messages />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/library" element={<Library />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="/onboarding" element={<Onboarding />} />
          </Routes>
        </BrowserRouter>
      </IdentityProvider>
    </ThemeProvider>
  );
}
