import { useEffect, useState } from 'react';
import { Gavel, Clock, Check } from 'lucide-react';

type VoteChoice = 'pro' | 'con' | 'neutral';

interface RoundVoteModalProps {
  open: boolean;
  round: number;
  maxRounds: number;
  timeLimit: number; // seconds
  onVote: (choice: VoteChoice) => void;
  onTimeout: () => void;
  hasIdentity: boolean;
}

export default function RoundVoteModal({ open, round, maxRounds, timeLimit, onVote, onTimeout, hasIdentity }: RoundVoteModalProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [selected, setSelected] = useState<VoteChoice | null>(null);
  const [locked, setLocked] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setTimeLeft(timeLimit);
      setSelected(null);
      setLocked(false);
    }
  }, [open, timeLimit]);

  // Countdown timer
  useEffect(() => {
    if (!open || locked) return;
    if (timeLeft <= 0) {
      // Auto-register as undecided
      setLocked(true);
      onTimeout();
      return;
    }
    const t = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [open, locked, timeLeft, onTimeout]);

  if (!open) return null;

  const handleChoice = (choice: VoteChoice) => {
    if (locked) return;
    setSelected(choice);
    setLocked(true);
    onVote(choice);
  };

  const progressPct = (timeLeft / timeLimit) * 100;
  const lowTime = timeLeft <= 10;

  const choices: { value: VoteChoice; label: string; color: string; activeColor: string; border: string; dot: string }[] = [
    {
      value: 'pro',
      label: "I Agree with Pro",
      color: 'bg-blue-950/50 text-blue-400',
      activeColor: 'bg-blue-600 text-white',
      border: 'border-blue-800/50',
      dot: 'bg-blue-500',
    },
    {
      value: 'neutral',
      label: "I'm Undecided",
      color: 'bg-gray-950/50 text-gray-400',
      activeColor: 'bg-gray-600 text-white',
      border: 'border-gray-700/50',
      dot: 'bg-gray-500',
    },
    {
      value: 'con',
      label: "I Agree with Con",
      color: 'bg-red-950/50 text-red-400',
      activeColor: 'bg-red-600 text-white',
      border: 'border-red-800/50',
      dot: 'bg-red-500',
    },
  ];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-4"
      style={{ background: 'rgba(0, 0, 0, 0.88)' }}>
      <div className="w-full max-w-lg rounded-2xl border-2 border-amber-600/40 overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1c1812, #131008)', boxShadow: '0 0 40px rgba(180, 83, 9, 0.15)' }}>

        {/* Header with gavel */}
        <div className="flex items-center justify-center pt-6 pb-2">
          <div className="w-14 h-14 rounded-full border-2 border-amber-500/40 flex items-center justify-center"
            style={{ background: 'radial-gradient(circle, rgba(40,33,20,0.9), rgba(20,16,10,0.9))' }}>
            <Gavel size={26} className="text-amber-400/80" />
          </div>
        </div>

        <div className="text-center px-6 pb-2">
          <p className="text-[10px] font-bold tracking-[0.25em] text-amber-600/50 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
            SENATVS·DIVINAT
          </p>
          <h2 className="text-xl font-bold text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>
            The Round Has Ended
          </h2>
          <p className="text-xs text-amber-700/50 mt-1" style={{ fontFamily: 'Georgia, serif' }}>
            Round {round} of {maxRounds} — declare your position
          </p>
        </div>

        {/* Countdown bar */}
        <div className="px-8 pt-4 pb-2">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Clock size={13} className={lowTime ? 'text-red-400 animate-pulse' : 'text-amber-600/50'} />
              <span className={`text-[11px] font-mono font-bold ${lowTime ? 'text-red-400' : 'text-amber-500/60'}`}>
                0:{timeLeft.toString().padStart(2, '0')}
              </span>
            </div>
            <span className="text-[10px] text-amber-700/40" style={{ fontFamily: 'Georgia, serif' }}>
              {locked ? 'Vote recorded' : 'Decide before time expires'}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(15, 12, 8, 0.6)' }}>
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${lowTime ? 'bg-red-500' : 'bg-amber-500'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Vote buttons */}
        <div className="px-6 pt-3 pb-2 space-y-2.5">
          {choices.map((c) => {
            const isActive = selected === c.value;
            return (
              <button
                key={c.value}
                onClick={() => handleChoice(c.value)}
                disabled={locked || !hasIdentity}
                className={`w-full py-4 rounded-xl border text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-3 ${
                  isActive
                    ? `${c.activeColor} ${c.border} scale-[1.02] shadow-lg`
                    : `${c.color} ${c.border} hover:scale-[1.01]`
                } ${locked && !isActive ? 'opacity-30' : ''} ${!hasIdentity ? 'cursor-not-allowed opacity-40' : ''}`}
                style={{ fontFamily: 'Georgia, serif' }}
              >
                <span className={`w-3 h-3 rounded-full ${c.dot} ${isActive ? 'ring-2 ring-white/40' : ''}`} />
                {c.label}
                {isActive && <Check size={16} className="ml-1" />}
              </button>
            );
          })}
        </div>

        {/* Auto-undecided notice */}
        <div className="px-6 pb-2">
          <p className="text-[10px] text-amber-700/35 text-center" style={{ fontFamily: 'Georgia, serif' }}>
            {!hasIdentity
              ? 'You need an identity to cast a formal vote.'
              : locked && selected === 'neutral' && timeLeft === 0
              ? 'Time expired — your position was recorded as Undecided.'
              : locked
              ? 'Your position has been recorded. The gallery will update shortly.'
              : `If time expires, your vote will be recorded as "I'm Undecided".`}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-1">
          <div className="flex items-center justify-center gap-2 text-[9px] text-amber-700/25 tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>
            <span>SENATVS·POPVLVSQVE·ROMANVS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
