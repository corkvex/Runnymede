import { useState } from 'react';
import type { VoteMetric } from '@/types';
import { ThumbsUp, Brain, AlertTriangle, Check } from 'lucide-react';

const METRICS: VoteMetric[] = [
  { key: 'kept_calm', label: 'Kept Calm', icon: 'calm', color: '#06b6d4' },
  { key: 'good_logic', label: 'Good Logic', icon: 'logic', color: '#22c55e' },
  { key: 'fallacy_alert', label: 'Fallacy Alert', icon: 'fallacy', color: '#ef4444' },
];

interface VotingPanelProps {
  targetId: string;
  targetLabel: string;
  onVote: (metric: VoteMetric['key'], targetId: string) => void;
  disabled?: boolean;
}

export default function VotingPanel({ targetId, targetLabel, onVote, disabled }: VotingPanelProps) {
  const [voted, setVoted] = useState<Set<string>>(new Set());

  const handleVote = (metric: VoteMetric['key'], key: string) => {
    if (voted.has(key) || disabled) return;
    onVote(metric, targetId);
    setVoted((prev) => new Set(prev).add(key));
  };

  const icons: Record<string, React.ReactNode> = {
    calm: <ThumbsUp size={16} />,
    logic: <Brain size={16} />,
    fallacy: <AlertTriangle size={16} />,
  };

  return (
    <div className="bg-theme-surface border border-theme-border rounded-xl p-3">
      <p className="text-xs text-theme-text-3 mb-2 font-medium uppercase tracking-wide">
        Vote: {targetLabel}
      </p>
      <div className="flex flex-col gap-2">
        {METRICS.map((m) => {
          const key = `${targetId}-${m.key}`;
          const hasVoted = voted.has(key);
          return (
            <button
              key={key}
              onClick={() => handleVote(m.key, key)}
              disabled={disabled || hasVoted}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-60"
              style={{
                color: hasVoted ? m.color : undefined,
                backgroundColor: hasVoted ? `${m.color}15` : 'transparent',
                border: `1px solid ${hasVoted ? `${m.color}40` : 'transparent'}`,
              }}
            >
              {hasVoted ? <Check size={16} style={{ color: m.color }} /> : icons[m.icon]}
              <span className={hasVoted ? '' : 'text-theme-text-2'}>{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
