import { useEffect, useState } from 'react';

interface PositionVoteBarProps {
  round: number;
  proCount: number;
  conCount: number;
  neutralCount: number;
  myVote: 'pro' | 'con' | 'neutral' | null;
  onVote: (lean: 'pro' | 'con' | 'neutral') => void;
  disabled?: boolean;
}

export default function PositionVoteBar({ round, proCount, conCount, neutralCount, myVote, onVote, disabled }: PositionVoteBarProps) {
  const [resetFlash, setResetFlash] = useState(false);
  const [prevRound, setPrevRound] = useState(round);

  useEffect(() => {
    if (round !== prevRound) {
      setResetFlash(true);
      setPrevRound(round);
      const t = setTimeout(() => setResetFlash(false), 600);
      return () => clearTimeout(t);
    }
  }, [round, prevRound]);

  const total = proCount + conCount + neutralCount;
  const proPct = total > 0 ? (proCount / total) * 100 : 0;
  const conPct = total > 0 ? (conCount / total) * 100 : 0;
  const neutralPct = total > 0 ? (neutralCount / total) * 100 : 0;

  const btnBase = 'flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5';
  const btnActive = 'scale-[1.03] shadow-lg';

  return (
    <div className={`rounded-xl border border-amber-900/25 p-4 transition-all ${resetFlash ? 'ring-2 ring-amber-500/40' : ''}`}
      style={{ background: 'rgba(20, 18, 14, 0.8)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-amber-500/70 tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>
          Senatorial Position · Round {round}
        </span>
        <span className="text-[10px] text-amber-700/40">
          {resetFlash ? 'Moderator reset — vote again' : 'Indicate your lean'}
        </span>
      </div>

      {/* Proportional bar */}
      <div className="flex h-6 rounded-lg overflow-hidden mb-3" style={{ background: 'rgba(15, 12, 8, 0.6)' }}>
        {proPct > 0 && (
          <div className="flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
            style={{ width: `${proPct}%`, background: 'linear-gradient(90deg, #1e3a5f, #2563eb)' }}>
            {proCount > 0 && proCount}
          </div>
        )}
        {neutralPct > 0 && (
          <div className="flex items-center justify-center text-[10px] font-bold text-gray-300 transition-all duration-500"
            style={{ width: `${neutralPct}%`, background: 'linear-gradient(90deg, #374151, #4b5563)' }}>
            {neutralCount > 0 && neutralCount}
          </div>
        )}
        {conPct > 0 && (
          <div className="flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
            style={{ width: `${conPct}%`, background: 'linear-gradient(90deg, #dc2626, #9f1239)' }}>
            {conCount > 0 && conCount}
          </div>
        )}
      </div>

      {/* Three vote buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onVote('pro')}
          disabled={disabled}
          className={`${btnBase} ${myVote === 'pro' ? btnActive + ' bg-blue-600 text-white' : 'bg-blue-950/40 text-blue-400 border border-blue-800/40 hover:bg-blue-900/40'} disabled:opacity-40`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> I Agree with Pro
        </button>
        <button
          onClick={() => onVote('neutral')}
          disabled={disabled}
          className={`${btnBase} ${myVote === 'neutral' ? btnActive + ' bg-gray-600 text-white' : 'bg-gray-950/40 text-gray-400 border border-gray-700/40 hover:bg-gray-800/40'} disabled:opacity-40`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-gray-500" /> I'm Undecided
        </button>
        <button
          onClick={() => onVote('con')}
          disabled={disabled}
          className={`${btnBase} ${myVote === 'con' ? btnActive + ' bg-red-600 text-white' : 'bg-red-950/40 text-red-400 border border-red-800/40 hover:bg-red-900/40'} disabled:opacity-40`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> I Agree with Con
        </button>
      </div>
    </div>
  );
}
