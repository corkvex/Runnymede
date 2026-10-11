import { useEffect, useState, useRef } from 'react';
import type { CircuitBreakerState } from '@/types';
import { Mic, MicOff, Clock, Pause, Play } from 'lucide-react';

interface CircuitBreakerProps {
  initialState: CircuitBreakerState;
  onTimeExpired: () => void;
  onTogglePause: (paused: boolean) => void;
  isModerator?: boolean;
}

export default function CircuitBreaker({ initialState, onTimeExpired, onTogglePause, isModerator }: CircuitBreakerProps) {
  const [state, setState] = useState<CircuitBreakerState>(initialState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setState(initialState);
  }, [initialState]);

  useEffect(() => {
    if (state.isPaused || state.timeRemaining <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (state.timeRemaining <= 0 && !state.isPaused) {
        onTimeExpired();
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setState((prev) => ({
        ...prev,
        timeRemaining: Math.max(0, prev.timeRemaining - 1),
      }));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.isPaused, state.timeRemaining, onTimeExpired]);

  const minutes = Math.floor(state.timeRemaining / 60);
  const seconds = state.timeRemaining % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const progress = state.totalTime > 0 ? (state.timeRemaining / state.totalTime) * 100 : 0;
  const isActive = state.activeSide === 'pro';
  const lowTime = state.timeRemaining <= 10;

  return (
    <div className="flex items-center gap-3">
      {/* Timer */}
      <div className="flex items-center gap-2 bg-theme-elevated rounded-full px-3 py-1.5">
        <Clock size={16} className={lowTime ? 'text-red-400' : 'text-theme-text-3'} />
        <span className={`font-mono text-sm font-bold ${lowTime ? 'text-red-400' : 'text-theme-text'}`}>
          {timeStr}
        </span>
      </div>

      {/* Mic indicator */}
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
        isActive
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'bg-red-500/20 text-red-400 border border-red-500/30'
      }`}>
        {isActive ? <Mic size={16} /> : <MicOff size={16} />}
        <span className="text-xs font-medium uppercase">{state.activeSide}</span>
      </div>

      {/* Round indicator */}
      <div className="text-xs text-theme-text-3 px-2">
        Round {state.round}
      </div>

      {/* Pause control (moderator only) */}
      {isModerator && (
        <button
          onClick={() => onTogglePause(!state.isPaused)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-theme-elevated hover:bg-theme-hover text-theme-text-2 transition-colors"
        >
          {state.isPaused ? <Play size={14} /> : <Pause size={14} />}
        </button>
      )}

      {/* Progress bar */}
      <div className="flex-1 h-2 bg-theme-elevated rounded-full overflow-hidden min-w-[60px]">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            lowTime ? 'bg-red-500' : isActive ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
