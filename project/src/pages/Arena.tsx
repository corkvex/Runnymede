import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useIdentity } from '@/context/IdentityContext';
import { getDebate, saveDebate, getProfile, saveProfile, getAllProfiles, getVoterLeans, savePositionVote, getPositionVotesForRound, getAllPositionVotesForDebate, getVoterLeansFromPositionVotes, saveSpectrumPosition, getSpectrumPositionsForDebate, getAllSpectrumPositions, type StoredDebate, type StoredProfile, type VoterLean, type StoredSpectrumPosition, type StoredPositionVote } from '@/lib/storage';
import { computeVoterBaselines, computeWeightedVerdict, getMyPoolInfo, type WeightedVerdict, type PoolLabel, type VoterBaseline } from '@/lib/votingMath';
import { processDebateResult } from '@/lib/elo';
import { updatePublishedStats } from '@/lib/registry';
import { ELO_MATCH_RANGE } from '@/pages/ArenaNew';
import type { CircuitBreakerState } from '@/types';
import CircuitBreaker from '@/components/CircuitBreaker';
import PositionVoteBar from '@/components/PositionVoteBar';
import SpectrumBar, { type SpectrumVoter } from '@/components/SpectrumBar';
import MasterSpectrum, { type MasterSpectrumData } from '@/components/MasterSpectrum';
import RoundVoteModal from '@/components/RoundVoteModal';
import WeightedVerdictDisplay from '@/components/WeightedVerdictDisplay';
import GeofenceNotice, { ReportThreshold } from '@/components/GeofenceNotice';
import EloBadge from '@/components/EloBadge';
import { Radio, Mic, MicOff, Flag, Crown, ArrowLeft, Trophy, Users, Landmark, Scale, Shield, Coins } from 'lucide-react';
import SenateSeating from '@/components/SenateSeating';
import AddressSenateModal from '@/components/AddressSenateModal';
import { saveDebaterEarning } from '@/lib/btcpay';

const ROUND_TIME = 120;
const MAX_ROUNDS = 3;
const REPORT_THRESHOLD = 5;

const romanNumeral = (n: number): string => {
  const map: [number, string][] = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let result = '';
  let remaining = n;
  for (const [val, sym] of map) {
    while (remaining >= val) { result += sym; remaining -= val; }
  }
  return result || 'I';
};

export default function Arena() {
  const { id } = useParams<{ id: string }>();
  const { identity, profile, refreshProfile } = useIdentity();
  const navigate = useNavigate();

  const [debate, setDebate] = useState<StoredDebate | null>(null);
  const [proProfile, setProProfile] = useState<StoredProfile | null>(null);
  const [conProfile, setConProfile] = useState<StoredProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [circuitState, setCircuitState] = useState<CircuitBreakerState>({
    activeSide: 'pro',
    timeRemaining: ROUND_TIME,
    totalTime: ROUND_TIME,
    round: 1,
    isPaused: false,
  });
  const [chat, setChat] = useState<{ id: string; fromId: string; content: string; timestamp: number }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [reportCount, setReportCount] = useState(0);
  const [streamPaused, setStreamPaused] = useState(false);
  const [winnerDeclared, setWinnerDeclared] = useState(false);
  const [voterLeans, setVoterLeans] = useState<VoterLean[]>([]);
  const [allProfiles, setAllProfiles] = useState<Record<string, StoredProfile>>({});
  const [moderatorOpen, setModeratorOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [floorMessages, setFloorMessages] = useState<{ id: string; fromId: string; content: string; timestamp: number; isPaidFloor?: boolean }[]>([]);
  const [positionVotes, setPositionVotes] = useState<{ voterId: string; lean: 'pro' | 'con' | 'neutral' }[]>([]);
  const [myPositionVote, setMyPositionVote] = useState<'pro' | 'con' | 'neutral' | null>(null);
  const [autoWinner, setAutoWinner] = useState<'pro' | 'con' | null>(null);
  const [spectrumVoters, setSpectrumVoters] = useState<SpectrumVoter[]>([]);
  const [mySpectrum, setMySpectrum] = useState<number | null>(null);
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [voteModalRound, setVoteModalRound] = useState(1);
  const [galleryLeans, setGalleryLeans] = useState<VoterLean[]>([]);
  const [masterSpectrumData, setMasterSpectrumData] = useState<MasterSpectrumData>({ proCount: 0, conCount: 0, neutralCount: 0, totalCount: 0, averagePosition: 0 });
  const [voterBaselines, setVoterBaselines] = useState<Map<string, VoterBaseline>>(new Map());
  const [weightedVerdict, setWeightedVerdict] = useState<WeightedVerdict | null>(null);
  const [myPoolInfo, setMyPoolInfo] = useState<{ pool: PoolLabel; weight: number; biasScore: number } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadDebate = useCallback(async () => {
    if (!id) return;
    const d = await getDebate(id);
    if (!d) { setLoading(false); return; }
    setDebate(d);
    if (d.proId && d.proId !== 'pending') {
      const p = await getProfile(d.proId);
      setProProfile(p || null);
    }
    if (d.conId && d.conId !== 'pending') {
      const c = await getProfile(d.conId);
      setConProfile(c || null);
    }
    // Load voter leans, all profiles, and spectrum positions
    const [leans, profiles, spectrums] = await Promise.all([getVoterLeans(), getAllProfiles(), getSpectrumPositionsForDebate(d.id)]);
    setVoterLeans(leans);
    const profileMap: Record<string, StoredProfile> = {};
    for (const p of profiles) profileMap[p.id] = p;
    setAllProfiles(profileMap);
    setSpectrumVoters(spectrums.map((s: StoredSpectrumPosition) => ({ voterId: s.voterId, position: s.position, isMe: identity?.fullId === s.voterId })));
    if (identity) {
      const mine = spectrums.find((s: StoredSpectrumPosition) => s.voterId === identity.fullId);
      setMySpectrum(mine ? mine.position : null);
    }
    // Load voter baselines from all spectrum positions across all debates
    const allSpectrums = await getAllSpectrumPositions();
    const baselines = computeVoterBaselines(allSpectrums);
    setVoterBaselines(baselines);
    if (identity) {
      setMyPoolInfo(getMyPoolInfo(identity.fullId, baselines));
    }
    // Load gallery leans from position votes for this debate
    const debateLeans = await getVoterLeansFromPositionVotes(d.id);
    setGalleryLeans(debateLeans);
    await refreshMasterSpectrum(d.id);
    await refreshWeightedVerdict(d.id, baselines);
    setLoading(false);
  }, [id]);

  const refreshMasterSpectrum = async (debateId: string) => {
    const allVotes = await getAllPositionVotesForDebate(debateId);
    const proCount = allVotes.filter((v) => v.lean === 'pro').length;
    const conCount = allVotes.filter((v) => v.lean === 'con').length;
    const neutralCount = allVotes.filter((v) => v.lean === 'neutral').length;
    const totalCount = proCount + conCount + neutralCount;
    const scoreMap = { pro: -100, neutral: 0, con: 100 };
    const averagePosition = totalCount > 0
      ? Math.round(allVotes.reduce((s, v) => s + scoreMap[v.lean], 0) / totalCount)
      : 0;
    setMasterSpectrumData({ proCount, conCount, neutralCount, totalCount, averagePosition });
  };

  const refreshGalleryLeans = async (debateId: string) => {
    const debateLeans = await getVoterLeansFromPositionVotes(debateId);
    setGalleryLeans(debateLeans);
  };

  const refreshWeightedVerdict = async (debateId: string, baselines: Map<string, VoterBaseline>) => {
    const allVotes: StoredPositionVote[] = await getAllPositionVotesForDebate(debateId);
    const verdict = computeWeightedVerdict(allVotes, baselines);
    setWeightedVerdict(verdict);
  };

  useEffect(() => { loadDebate(); }, [loadDebate]);

  // Load position votes for the current round whenever the round changes
  const refreshPositionVotes = useCallback(async () => {
    if (!id || !debate || debate.status !== 'live') return;
    const votes = await getPositionVotesForRound(id, circuitState.round);
    setPositionVotes(votes.map((v) => ({ voterId: v.voterId, lean: v.lean })));
    if (identity) {
      const mine = votes.find((v) => v.voterId === identity.fullId);
      setMyPositionVote(mine ? mine.lean : null);
    }
  }, [id, debate, circuitState.round, identity]);

  useEffect(() => {
    refreshPositionVotes();
  }, [refreshPositionVotes]);

  const handlePositionVote = async (lean: 'pro' | 'con' | 'neutral') => {
    if (!identity || !debate || debate.status !== 'live') return;
    const voteId = `${identity.fullId}-${debate.id}-${circuitState.round}`;
    await savePositionVote({
      id: voteId,
      debateId: debate.id,
      voterId: identity.fullId,
      lean,
      round: circuitState.round,
      timestamp: Date.now(),
    });
    setMyPositionVote(lean);
    await refreshPositionVotes();
  };

  const handleModalVote = async (choice: 'pro' | 'con' | 'neutral') => {
    if (!identity || !debate) return;
    const voteId = `${identity.fullId}-${debate.id}-${voteModalRound}`;
    await savePositionVote({
      id: voteId,
      debateId: debate.id,
      voterId: identity.fullId,
      lean: choice,
      round: voteModalRound,
      timestamp: Date.now(),
    });
    setMyPositionVote(choice);
    await refreshPositionVotes();
    await refreshGalleryLeans(debate.id);
    await refreshMasterSpectrum(debate.id);
    await refreshWeightedVerdict(debate.id, voterBaselines);
  };

  const handleModalTimeout = async () => {
    if (!identity || !debate) return;
    const voteId = `${identity.fullId}-${debate.id}-${voteModalRound}`;
    await savePositionVote({
      id: voteId,
      debateId: debate.id,
      voterId: identity.fullId,
      lean: 'neutral',
      round: voteModalRound,
      timestamp: Date.now(),
    });
    setMyPositionVote('neutral');
    await refreshPositionVotes();
    await refreshGalleryLeans(debate.id);
    await refreshMasterSpectrum(debate.id);
    await refreshWeightedVerdict(debate.id, voterBaselines);
  };

  const handleSpectrumSlide = async (position: number) => {
    if (!identity || !debate) return;
    setMySpectrum(position);
    const specId = `${identity.fullId}-${debate.id}`;
    await saveSpectrumPosition({
      id: specId,
      debateId: debate.id,
      voterId: identity.fullId,
      position,
      timestamp: Date.now(),
    });
    setSpectrumVoters((prev) => {
      const filtered = prev.filter((v) => v.voterId !== identity.fullId);
      return [...filtered, { voterId: identity.fullId, position, isMe: true }];
    });
  };

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chat, floorMessages]);

  const isPro = identity?.fullId === debate?.proId;
  const isCon = identity?.fullId === debate?.conId;
  const isParticipant = isPro || isCon;
  const canSpeak = (isPro && circuitState.activeSide === 'pro') || (isCon && circuitState.activeSide === 'con');

  const handleTimeExpired = useCallback(() => {
    // When a side's time expires, open the vote modal if this is a round-end (con just finished)
    setCircuitState((prev) => {
      const nextSide = prev.activeSide === 'pro' ? 'con' : 'pro';
      const nextRound = nextSide === 'pro' ? prev.round + 1 : prev.round;
      const isRoundEnd = nextSide === 'pro' && prev.activeSide === 'con';

      if (isRoundEnd && nextRound <= MAX_ROUNDS + 1) {
        // Open the vote modal for the round that just completed
        setVoteModalRound(prev.round);
        setVoteModalOpen(true);
      }

      if (nextRound > MAX_ROUNDS) {
        return { ...prev, isPaused: true, timeRemaining: 0 };
      }
      return {
        ...prev,
        activeSide: nextSide,
        round: nextRound,
        timeRemaining: ROUND_TIME,
        totalTime: ROUND_TIME,
      };
    });
  }, []);

  const handleTogglePause = (paused: boolean) => {
    setCircuitState((prev) => ({ ...prev, isPaused: paused }));
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity || !chatInput.trim() || !canSpeak) return;
    setChat((prev) => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      fromId: identity.fullId,
      content: chatInput.trim(),
      timestamp: Date.now(),
    }]);
    setChatInput('');
  };

  const handleReport = () => {
    setReportCount((c) => c + 1);
  };

  const handleAddressSenate = (msg: string) => {
    if (!identity || !debate) return;
    const paidMsg = {
      id: `floor-${Date.now()}-${Math.random()}`,
      fromId: identity.fullId,
      content: msg,
      timestamp: Date.now(),
      isPaidFloor: true,
    };
    setFloorMessages((prev) => [...prev, paidMsg]);

    // Split the tribute between both debaters
    const splitSats = 2500;
    if (debate.proId && debate.proId !== 'pending') {
      saveDebaterEarning({ debateId: debate.id, fromUserId: identity.fullId, amountSats: splitSats, timestamp: Date.now() });
    }
    if (debate.conId && debate.conId !== 'pending') {
      saveDebaterEarning({ debateId: debate.id, fromUserId: identity.fullId, amountSats: splitSats, timestamp: Date.now() });
    }
  };

  const handleDeclareWinner = async (winnerSide: 'pro' | 'con') => {
    if (!debate || !proProfile || !conProfile || winnerDeclared) return;
    const winnerId = winnerSide === 'pro' ? debate.proId : debate.conId;
    const loserId = winnerSide === 'pro' ? debate.conId : debate.proId;
    const winnerElo = winnerSide === 'pro' ? proProfile.elo : conProfile.elo;
    const loserElo = winnerSide === 'pro' ? conProfile.elo : proProfile.elo;

    const fetchedWinner = await getProfile(winnerId);
    const fetchedLoser = await getProfile(loserId);
    const winnerGames = (fetchedWinner?.debatesWon || 0) + (fetchedWinner?.debatesLost || 0);
    const loserGames = (fetchedLoser?.debatesWon || 0) + (fetchedLoser?.debatesLost || 0);
    const result = processDebateResult(winnerId, loserId, winnerElo, loserElo, winnerGames, loserGames);

    if (fetchedWinner) {
      fetchedWinner.elo = result.winnerNewElo;
      fetchedWinner.debatesWon += 1;
      await saveProfile(fetchedWinner);
      await updatePublishedStats(fetchedWinner.id, fetchedWinner.elo, fetchedWinner.debatesWon, fetchedWinner.debatesLost);
    }
    if (fetchedLoser) {
      fetchedLoser.elo = result.loserNewElo;
      fetchedLoser.debatesLost += 1;
      await saveProfile(fetchedLoser);
      await updatePublishedStats(fetchedLoser.id, fetchedLoser.elo, fetchedLoser.debatesLost, fetchedLoser.debatesLost);
    }

    const updatedDebate = { ...debate, status: 'ended' as const, winnerId, endedAt: Date.now() };
    setDebate(updatedDebate);
    await saveDebate(updatedDebate);
    setWinnerDeclared(true);
    if (identity?.fullId === winnerId || identity?.fullId === loserId) {
      await refreshProfile();
    }
  };

  // Auto-declare winner using proportional weighted verdict when all rounds complete
  useEffect(() => {
    if (!debate || debate.status !== 'live' || winnerDeclared) return;
    if (circuitState.round <= MAX_ROUNDS) return;
    (async () => {
      const allVotes = await getAllPositionVotesForDebate(debate.id);
      if (allVotes.length === 0) return;
      const allSpectrums = await getAllSpectrumPositions();
      const baselines = computeVoterBaselines(allSpectrums);
      const verdict = computeWeightedVerdict(allVotes, baselines);
      setWeightedVerdict(verdict);
      if (verdict.winner === 'tie') return;
      setAutoWinner(verdict.winner);
      await handleDeclareWinner(verdict.winner);
    })();
  }, [circuitState.round, debate, winnerDeclared]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-amber-700/40 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!debate) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-theme-text-3 text-lg">Debate not found</p>
        <Link to="/" className="text-amber-500 hover:text-amber-400 mt-2">Back to home</Link>
      </div>
    );
  }

  const debateOver = debate.status === 'ended';
  const bothSidesJoined = debate.proId !== 'pending' && debate.conId !== 'pending';

  return (
    <div className="min-h-[calc(100vh-56px)] relative"
      style={{
        background: 'linear-gradient(180deg, #1a1510 0%, #12100c 40%, #0e0c08 100%)',
      }}
    >
      {/* Subtle marble texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.02' numOctaves='3' /%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' /%3E%3C/svg%3E")`,
        }}
      />

      <ReportThreshold flagCount={reportCount} threshold={REPORT_THRESHOLD} onPause={() => setStreamPaused(true)} />

      {streamPaused && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] px-4">
          <div className="w-full max-w-md bg-theme-surface border border-red-800/50 rounded-2xl p-6 text-center">
            <Flag size={40} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-theme-text">Session Suspended</h2>
            <p className="text-sm text-theme-text-2 mt-2">Automated pause triggered by community reports. Awaiting confirmation.</p>
            <button onClick={() => setStreamPaused(false)} className="mt-4 px-4 py-2 bg-theme-elevated hover:bg-theme-hover text-theme-text-2 text-sm rounded-full transition-colors">
              Acknowledge
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        {/* Senate Header */}
        <div className="px-4 md:px-6 pt-5 pb-4 border-b border-amber-900/20">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs text-amber-700/60 hover:text-amber-500 mb-3 transition-colors">
            <ArrowLeft size={14} /> Return
          </button>

          {/* SPQR Banner */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-amber-600/40 flex items-center justify-center shrink-0">
                <Landmark size={20} className="text-amber-500/70" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-amber-600/50">SENATVS·POPVLVSQVE·ROMANVS</span>
                </div>
                {debate.status === 'live' && <span className="text-xs font-medium text-red-400 flex items-center gap-1"><Radio size={10} className="animate-pulse" /> IN SESSION</span>}
                {debate.status === 'waiting' && <span className="text-xs font-medium text-amber-500">Awaiting Orator</span>}
                {debate.status === 'ended' && <span className="text-xs font-medium text-theme-text-3">Concluded</span>}
                <h1 className="text-xl md:text-2xl font-bold text-theme-text" style={{ fontFamily: 'Georgia, serif' }}>{debate.title}</h1>
                <p className="text-amber-700/60 text-sm mt-1 italic" style={{ fontFamily: 'Georgia, serif' }}>"{debate.topic}"</p>
              </div>
            </div>
            <button onClick={handleReport} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-700/60 hover:text-red-400 border border-amber-900/30 rounded-full transition-colors">
              <Flag size={12} /> Object
            </button>
          </div>

          {/* Round indicator */}
          {!debateOver && bothSidesJoined && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-900/30" />
              <span className="text-xs font-semibold tracking-widest text-amber-600/50" style={{ fontFamily: 'Georgia, serif' }}>
                ROUND {romanNumeral(circuitState.round)} OF {romanNumeral(MAX_ROUNDS)}
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-900/30" />
            </div>
          )}
        </div>

        {/* Geofence */}
        <div className="px-4 md:px-6 mt-3">
          <GeofenceNotice topic={debate.topic} />
        </div>

        {/* Senate Floor — Split Screen */}
        <div className="px-4 md:px-6 mt-4">
          <div className="grid grid-cols-2 gap-3 md:gap-5">
            {/* PRO Side — Senator for the Affirmative */}
            <SenatorPodium
              label="PRO"
              labelLatin="PARTES"
              side="pro"
              profile={proProfile}
              isActive={circuitState.activeSide === 'pro' && !debateOver}
              accentColor="emerald"
              debate={debate}
              identity={identity ? { fullId: identity.fullId, elo: profile?.elo ?? 1000 } : null}
              isCon={isCon}
              onJoin={async () => {
                if (!identity || !debate) return;
                const updated = { ...debate, proId: identity.fullId };
                setDebate(updated); await saveDebate(updated); loadDebate();
              }}
            />

            {/* CON Side — Senator for the Opposition */}
            <SenatorPodium
              label="CON"
              labelLatin="CONTRA"
              side="con"
              profile={conProfile}
              isActive={circuitState.activeSide === 'con' && !debateOver}
              accentColor="rose"
              debate={debate}
              identity={identity ? { fullId: identity.fullId, elo: profile?.elo ?? 1000 } : null}
              isPro={isPro}
              onJoin={async () => {
                if (!identity || !debate) return;
                const updated = { ...debate, conId: identity.fullId };
                setDebate(updated); await saveDebate(updated); loadDebate();
              }}
            />
          </div>

          {/* Center seal — Moderator (clickable) */}
          <div className="flex items-center justify-center -mt-7 relative z-10">
            <button
              onClick={() => setModeratorOpen(!moderatorOpen)}
              className="w-14 h-14 rounded-full border-2 border-amber-600/30 flex items-center justify-center transition-all hover:border-amber-500/60 hover:scale-105"
              style={{ background: 'radial-gradient(circle, #1a1510 60%, #12100c 100%)' }}
              title="View the Moderator"
            >
              {moderatorOpen ? <Shield size={22} className="text-amber-400" /> : <Scale size={22} className="text-amber-500/60" />}
            </button>
          </div>

          {/* Moderator panel — revealed when scales clicked */}
          {moderatorOpen && (
            <div className="px-4 md:px-6 mt-3 flex justify-center">
              <div className="rounded-xl border border-amber-700/30 p-4 flex items-center gap-4"
                style={{ background: 'rgba(22, 19, 14, 0.85)' }}>
                <div className="w-12 h-12 rounded-lg border-2 border-amber-600/40 flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #78350f, #451a03)' }}>
                  <Shield size={24} className="text-amber-400/80" />
                </div>
                <div>
                  <p className="text-[10px] tracking-widest text-amber-600/50" style={{ fontFamily: 'Georgia, serif' }}>PRAETOR·IVDEX</p>
                  <p className="text-sm font-semibold text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>The Moderator</p>
                  <p className="text-xs text-amber-700/50" style={{ fontFamily: 'Georgia, serif' }}>Keeper of order and the circuit breaker</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Circuit Breaker + Controls */}
        {!debateOver && bothSidesJoined && (
          <div className="px-4 md:px-6 mt-5 mb-4">
            <div className="rounded-xl border border-amber-900/25 p-3"
              style={{ background: 'rgba(20, 18, 14, 0.8)' }}>
              <CircuitBreaker
                initialState={circuitState}
                onTimeExpired={handleTimeExpired}
                onTogglePause={handleTogglePause}
                isModerator={isParticipant}
              />
              {debate.status === 'waiting' && isParticipant && (
                <button onClick={async () => {
                  if (!debate) return;
                  const updated = { ...debate, status: 'live' as const };
                  setDebate(updated); await saveDebate(updated);
                }} className="w-full mt-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
                  style={{ background: 'linear-gradient(135deg, #b45309, #92400e)', color: '#fef3c7' }}>
                  Convene the Senate
                </button>
              )}
              {debate.status === 'live' && circuitState.round > MAX_ROUNDS && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-amber-700/60 text-center" style={{ fontFamily: 'Georgia, serif' }}>
                    {autoWinner ? 'The Senate has ruled: ' + (autoWinner === 'pro' ? 'Pro' : 'Con') + ' prevails.' : 'All rounds complete. The Senate renders judgment...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Winner display */}
        {debateOver && debate.winnerId && (
          <div className="px-4 md:px-6 mb-4">
            <div className="rounded-xl p-6 text-center border border-amber-600/30"
              style={{ background: 'linear-gradient(135deg, rgba(30, 25, 15, 0.9), rgba(15, 12, 8, 0.9))' }}>
              <Crown size={36} className="text-amber-500 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>The Senate Has Decided</h2>
              <p className="text-sm text-theme-text-2 mt-2">
                Victor: <span className="font-mono text-amber-400">
                  {debate.winnerId === debate.proId ? proProfile?.handle : conProfile?.handle}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Proportional Weighted Verdict — pool breakdown and fair scoring */}
        {weightedVerdict && weightedVerdict.totalVotes > 0 && (
          <div className="px-4 md:px-6 mb-4">
            <WeightedVerdictDisplay
              verdict={weightedVerdict}
              myPool={myPoolInfo?.pool ?? null}
              myWeight={myPoolInfo?.weight ?? null}
            />
          </div>
        )}

        {/* Master Spectrum — display-only aggregate above the gallery */}
        <div className="px-4 md:px-6 mb-4">
          <MasterSpectrum data={masterSpectrumData} />
        </div>

        {/* Senate Seating — always visible */}
        <div className="px-4 md:px-6 mb-4">
          <div className="rounded-xl border border-amber-900/25 p-4"
            style={{ background: 'rgba(18, 16, 12, 0.6)' }}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-amber-500/70 flex items-center gap-2" style={{ fontFamily: 'Georgia, serif' }}>
                <Landmark size={16} className="text-amber-600/50" /> The Senatorial Gallery
              </h3>
              <span className="text-[10px] text-amber-700/40" style={{ fontFamily: 'Georgia, serif' }}>
                Seated by latest round vote
              </span>
            </div>
            <p className="text-[10px] text-amber-700/35 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
              Those who have favored the affirmative (pro) are seated to the left in blue; those who have favored the opposition (con) to the right in red. Seats update after each round vote.
            </p>
            <SenateSeating
              voterLeans={[...voterLeans, ...galleryLeans]}
              profiles={allProfiles}
              currentVoterId={identity?.fullId}
            />
          </div>
        </div>

        {/* Spectrum of Opinion — permanent sliding intent, does not affect round votes */}
        <div className="px-4 md:px-6 mb-4">
          <SpectrumBar
            voters={spectrumVoters}
            myPosition={mySpectrum}
            onSlide={handleSpectrumSlide}
            disabled={!identity}
          />
        </div>

        {/* Voting + Floor Discussion */}
        <div className="px-4 md:px-6 pb-6 grid md:grid-cols-3 gap-4">
          <div className="md:col-span-1 space-y-3">
            <h3 className="text-sm font-semibold text-amber-500/80 flex items-center gap-2" style={{ fontFamily: 'Georgia, serif' }}>
              <Trophy size={16} className="text-amber-500/60" /> Senatorial Position
            </h3>
            {!debateOver && bothSidesJoined && debate.status === 'live' ? (
              <PositionVoteBar
                round={circuitState.round}
                proCount={positionVotes.filter((v) => v.lean === 'pro').length}
                conCount={positionVotes.filter((v) => v.lean === 'con').length}
                neutralCount={positionVotes.filter((v) => v.lean === 'neutral').length}
                myVote={myPositionVote}
                onVote={handlePositionVote}
                disabled={!identity || debateOver}
              />
            ) : (
              <p className="text-xs text-theme-text-3 text-center py-4">
                {debateOver ? 'Voting has concluded.' : 'Voting opens when the debate goes live.'}
              </p>
            )}
            {!identity && (
              <p className="text-xs text-theme-text-3 text-center">Create an identity to vote.</p>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="rounded-xl border border-amber-900/25 overflow-hidden"
              style={{ background: 'rgba(20, 18, 14, 0.8)' }}>
              {/* Header */}
              <div className="px-4 py-2.5 border-b border-amber-900/25 flex items-center gap-2">
                <Users size={16} className="text-amber-600/50" />
                <span className="text-sm font-semibold text-amber-500/80" style={{ fontFamily: 'Georgia, serif' }}>The Floor</span>
                {chat.length > 0 && <span className="text-[10px] text-amber-700/40">({chat.length})</span>}
              </div>
              <div className="h-48 overflow-y-auto p-3 space-y-2">
                {chat.length === 0 && floorMessages.length === 0 ? (
                  <p className="text-xs text-amber-700/40 text-center py-8" style={{ fontFamily: 'Georgia, serif' }}>
                    {canSpeak ? 'Speak your argument, Senator...' : 'The floor awaits the orators...'}
                  </p>
                ) : (
                  <>
                    {chat.map((msg) => {
                      const isProMsg = msg.fromId === debate.proId;
                      return (
                        <div key={msg.id} className={`flex ${msg.fromId === identity?.fullId ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                            msg.fromId === identity?.fullId ? 'bg-amber-700/80 text-amber-50' :
                            isProMsg ? 'bg-emerald-950/40 text-theme-text border border-emerald-800/30' :
                            'bg-rose-950/40 text-theme-text border border-rose-800/30'
                          }`}>
                            <p className="text-[10px] tracking-widest opacity-60 mb-0.5" style={{ fontFamily: 'Georgia, serif' }}>{isProMsg ? 'PRO' : 'CON'}</p>
                            <p>{msg.content}</p>
                          </div>
                        </div>
                      );
                    })}
                    {floorMessages.map((msg) => (
                      <div key={msg.id} className="flex justify-center">
                        <div className="max-w-[85%] rounded-xl px-4 py-2.5 text-sm text-amber-50 border border-amber-500/30"
                          style={{ background: 'linear-gradient(135deg, rgba(180,83,9,0.15), rgba(120,53,15,0.15))' }}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <Coins size={11} className="text-amber-400" />
                            <p className="text-[10px] tracking-widest text-amber-400/70" style={{ fontFamily: 'Georgia, serif' }}>PAID FLOOR ADDRESS</p>
                          </div>
                          <p style={{ fontFamily: 'Georgia, serif' }}>{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="p-2 border-t border-amber-900/25">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && canSpeak) handleSendChat(e as unknown as React.FormEvent); }}
                    placeholder={canSpeak ? 'Speak your argument...' : 'Awaiting your turn to speak'}
                    disabled={!canSpeak}
                    className="flex-1 border border-amber-900/30 rounded-full px-3 py-2 text-theme-text text-sm placeholder-amber-700/40 focus:outline-none focus:border-amber-600/50 transition-colors disabled:opacity-40"
                    style={{ background: 'rgba(15, 12, 8, 0.6)' }}
                  />
                  <button
                    onClick={() => setAddressModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 px-3 h-9 text-xs font-semibold text-amber-50 rounded-full transition-all hover:scale-105 active:scale-95 shrink-0"
                    style={{ background: 'linear-gradient(135deg, #b45309, #92400e)' }}
                  >
                    <Coins size={14} className="text-amber-300" />
                    Address
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddressSenateModal
        open={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        debateTitle={debate.title}
        proHandle={proProfile?.handle || 'Pro'}
        conHandle={conProfile?.handle || 'Con'}
        onAddressed={handleAddressSenate}
      />

      <RoundVoteModal
        open={voteModalOpen}
        round={voteModalRound}
        maxRounds={MAX_ROUNDS}
        timeLimit={30}
        hasIdentity={!!identity}
        onVote={(choice) => { handleModalVote(choice); setTimeout(() => setVoteModalOpen(false), 1200); }}
        onTimeout={() => { handleModalTimeout(); setTimeout(() => setVoteModalOpen(false), 1500); }}
      />
    </div>
  );
}

interface SenatorPodiumProps {
  label: string;
  labelLatin: string;
  side: 'pro' | 'con';
  profile: StoredProfile | null;
  isActive: boolean;
  accentColor: 'emerald' | 'rose';
  debate: StoredDebate;
  identity: { fullId: string; elo: number } | null;
  isCon?: boolean;
  isPro?: boolean;
  onJoin: () => void;
}

function TakeSeatButton({ onJoin, colorClass, label, myElo, opponentElo }: { onJoin: () => void; colorClass: string; label: string; myElo: number; opponentElo?: number }) {
  const withinRange = opponentElo === undefined || Math.abs(myElo - opponentElo) <= ELO_MATCH_RANGE;
  if (!withinRange) {
    return (
      <div className="w-full py-2 bg-theme-elevated text-theme-text-3 text-xs font-medium rounded-lg text-center">
        Opponent outside {ELO_MATCH_RANGE} Elo range
      </div>
    );
  }
  return (
    <button onClick={onJoin} className={`w-full py-2 ${colorClass} text-white text-xs font-medium rounded-lg transition-colors`}>
      {label}
    </button>
  );
}

function SenatorPodium({ label, labelLatin, side, profile, isActive, accentColor, debate, identity, isCon, isPro, onJoin }: SenatorPodiumProps) {
  const accentClasses = {
    emerald: {
      border: 'border-emerald-700/40',
      borderActive: 'border-emerald-500/60',
      bg: 'bg-emerald-950/20',
      bgActive: 'bg-emerald-950/30',
      text: 'text-emerald-400',
      gradient: 'from-emerald-600 to-emerald-800',
      joinBtn: 'bg-emerald-700 hover:bg-emerald-600',
    },
    rose: {
      border: 'border-rose-700/40',
      borderActive: 'border-rose-500/60',
      bg: 'bg-rose-950/20',
      bgActive: 'bg-rose-950/30',
      text: 'text-rose-400',
      gradient: 'from-rose-600 to-rose-800',
      joinBtn: 'bg-rose-700 hover:bg-rose-600',
    },
  };
  const c = accentClasses[accentColor];

  return (
    <div className={`relative rounded-2xl border-2 overflow-hidden transition-all ${
      isActive ? `${c.borderActive} ${c.bgActive}` : `${c.border} ${c.bg}`
    }`}
      style={{ background: isActive ? undefined : 'rgba(18, 16, 12, 0.6)' }}>
      {/* Column accents */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{
        background: `linear-gradient(180deg, transparent, ${accentColor === 'emerald' ? '#065f46' : '#9f1239'} 30%, ${accentColor === 'emerald' ? '#065f46' : '#9f1239'} 70%, transparent)`,
        opacity: isActive ? 0.6 : 0.2,
      }} />
      <div className="absolute right-0 top-0 bottom-0 w-1.5" style={{
        background: `linear-gradient(180deg, transparent, ${accentColor === 'emerald' ? '#065f46' : '#9f1239'} 30%, ${accentColor === 'emerald' ? '#065f46' : '#9f1239'} 70%, transparent)`,
        opacity: isActive ? 0.6 : 0.2,
      }} />

      <div className="aspect-video flex flex-col items-center justify-center p-4 relative">
        {profile ? (
          <>
            {/* Toga-clad senator avatar */}
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white text-xl font-bold mb-2 relative`}
              style={{ boxShadow: isActive ? `0 0 20px ${accentColor === 'emerald' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}` : 'none' }}>
              {profile.handle.substring(1, 3).toUpperCase()}
              {/* Laurel wreath indicator when speaking */}
              {isActive && (
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-amber-500/50" />
              )}
            </div>
            <p className="text-sm font-mono text-theme-text">{profile.handle}</p>
            <div className="mt-1.5"><EloBadge elo={profile.elo} size="sm" /></div>
            {isActive && (
              <div className={`mt-2 flex items-center gap-1.5 text-xs ${c.text}`}>
                <Mic size={12} /> Speaking
              </div>
            )}
            {!isActive && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-theme-text-3">
                <MicOff size={12} /> Muted
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-800/30 flex items-center justify-center mb-2 mx-auto">
              <span className="text-amber-700/40 text-xs" style={{ fontFamily: 'Georgia, serif' }}>Vacant</span>
            </div>
            <p className="text-xs text-amber-700/40" style={{ fontFamily: 'Georgia, serif' }}>Seat awaits a Senator</p>
          </div>
        )}
      </div>

      <div className="px-3 pb-3">
        <div className={`text-xs ${c.text} font-semibold uppercase tracking-[0.15em] mb-1.5`} style={{ fontFamily: 'Georgia, serif' }}>
          {label} · {labelLatin}
        </div>
        {debate.status === 'waiting' && side === 'pro' && debate.proId === 'pending' && identity && !isCon && (
          <TakeSeatButton onJoin={onJoin} colorClass={c.joinBtn} label="Take the Pro Seat" myElo={identity.elo} opponentElo={conProfile?.elo} />
        )}
        {debate.status === 'waiting' && side === 'con' && debate.conId === 'pending' && identity && !isPro && (
          <TakeSeatButton onJoin={onJoin} colorClass={c.joinBtn} label="Take the Con Seat" myElo={identity.elo} opponentElo={proProfile?.elo} />
        )}
      </div>
    </div>
  );
}
