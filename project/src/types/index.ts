import type { CryptoIdentity } from '@/lib/crypto';
import type { StoredProfile, StoredDebate, StoredVote, StoredPositionVote, StoredMessage, StoredVideo, StoredLike, StoredFollow } from '@/lib/storage';
import type { RankInfo } from '@/lib/elo';

export type {
  CryptoIdentity,
  StoredProfile,
  StoredDebate,
  StoredVote,
  StoredPositionVote,
  StoredMessage,
  StoredVideo,
  StoredLike,
  StoredFollow,
  RankInfo,
};

export type DebateStatus = 'waiting' | 'live' | 'ended';

export interface DebateMessage {
  id: string;
  debateId: string;
  fromId: string;
  content: string;
  signature: string;
  timestamp: number;
  fromHandle?: string;
}

export interface VoteMetric {
  key: 'kept_calm' | 'good_logic' | 'fallacy_alert';
  label: string;
  icon: string;
  color: string;
}

export interface ReportFlag {
  debateId: string;
  reporterId: string;
  reason: string;
  timestamp: number;
}

export interface CircuitBreakerState {
  activeSide: 'pro' | 'con';
  timeRemaining: number;
  totalTime: number;
  round: number;
  isPaused: boolean;
}
