import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIdentity } from '@/context/IdentityContext';
import { saveDebate, type StoredDebate } from '@/lib/storage';
import { getRankFromElo } from '@/lib/elo';
import { Swords, Loader2, Shield } from 'lucide-react';
import GeofenceNotice from '@/components/GeofenceNotice';
import EloBadge from '@/components/EloBadge';

export const ELO_MATCH_RANGE = 75;

const DEBATE_TOPICS = [
  'Should social media platforms be held liable for user content?',
  'Is universal basic income a viable economic policy?',
  'Should AI development be paused for safety regulation?',
  'Is nuclear energy the answer to climate change?',
  'Should voting be mandatory in democratic elections?',
  'Is space colonization worth the investment?',
  'Should data privacy be a fundamental human right?',
  'Is the gig economy exploitative by nature?',
];

export default function ArenaNew() {
  const { identity, profile } = useIdentity();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [side, setSide] = useState<'pro' | 'con'>('pro');
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity || !profile || !title.trim() || !topic.trim()) return;
    setCreating(true);

    const debate: StoredDebate = {
      id: `${identity.fullId}-${Date.now()}`,
      title: title.trim(),
      topic: topic.trim(),
      description: description.trim() || '',
      proId: side === 'pro' ? identity.fullId : 'pending',
      conId: side === 'con' ? identity.fullId : 'pending',
      moderatorId: null,
      status: 'waiting',
      winnerId: null,
      proVotes: 0,
      conVotes: 0,
      createdAt: Date.now(),
      endedAt: null,
    };

    await saveDebate(debate);
    navigate(`/arena/${debate.id}`);
  };

  const inputClass = 'w-full bg-theme-input border border-theme-input-border rounded-lg px-4 py-3 text-theme-text placeholder-theme-text-3 focus:outline-none focus:border-amber-500 transition-colors';

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Swords size={28} className="text-amber-400" />
        <h1 className="text-2xl font-bold text-theme-text">Start a Debate</h1>
      </div>

      <div className="mb-4">
        <GeofenceNotice topic={topic} />
      </div>

      <form onSubmit={handleCreate} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-theme-text-2 mb-1.5">Debate Title <span className="text-red-400">*</span></label>
          <input type="text" required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="e.g. The Future of Free Speech Online" />
        </div>

        <div>
          <label className="block text-sm font-medium text-theme-text-2 mb-1.5">Topic / Resolution <span className="text-red-400">*</span></label>
          <div className="space-y-2">
            <input type="text" required maxLength={200} value={topic} onChange={(e) => setTopic(e.target.value)} className={inputClass} placeholder="The specific statement being debated" />
            <div className="flex flex-wrap gap-1.5">
              {DEBATE_TOPICS.map((t) => (
                <button key={t} type="button" onClick={() => setTopic(t)} className="text-xs px-2.5 py-1 rounded-full bg-theme-elevated text-theme-text-3 hover:text-theme-text hover:bg-theme-hover transition-colors">
                  {t.length > 40 ? t.substring(0, 40) + '...' : t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-theme-text-2 mb-1.5">Description</label>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputClass} resize-none`} placeholder="Rules, format, and what to expect" />
        </div>

        <div>
          <label className="block text-sm font-medium text-theme-text-2 mb-1.5">Your Side <span className="text-red-400">*</span></label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setSide('pro')} className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${side === 'pro' ? 'bg-green-600 text-white' : 'bg-theme-elevated text-theme-text-2 hover:bg-theme-hover'}`}>
              Pro — In Favor
            </button>
            <button type="button" onClick={() => setSide('con')} className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${side === 'con' ? 'bg-red-600 text-white' : 'bg-theme-elevated text-theme-text-2 hover:bg-theme-hover'}`}>
              Con — Against
            </button>
          </div>
        </div>

        {/* Matchmaking constraint info */}
        {profile && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-900/30" style={{ background: 'rgba(20, 18, 14, 0.6)' }}>
            <Shield size={18} className="text-amber-500/60 shrink-0" />
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-theme-text-2">Your rank:</span>
                <EloBadge elo={profile.elo} size="sm" />
              </div>
              <p className="text-theme-text-3">
                Opponents must be within <span className="text-amber-400 font-semibold">{ELO_MATCH_RANGE} Elo</span> of your rating
                ({profile.elo - ELO_MATCH_RANGE}–{profile.elo + ELO_MATCH_RANGE}). Debaters outside this range cannot challenge you.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="px-5 py-2.5 text-sm font-medium text-theme-text-3 rounded-full hover:bg-theme-hover transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={creating || !title.trim() || !topic.trim()} className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-medium rounded-full transition-colors">
            {creating ? <Loader2 size={18} className="animate-spin" /> : <Swords size={18} />}
            Open the Floor
          </button>
        </div>
      </form>
    </div>
  );
}
