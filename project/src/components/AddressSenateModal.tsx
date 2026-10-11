import { useState } from 'react';
import { Landmark, Coins, X, Send, Check, Loader2 } from 'lucide-react';
import { createInvoice, loadWalletState, saveWalletState } from '@/lib/btcpay';

interface AddressSenateModalProps {
  open: boolean;
  onClose: () => void;
  debateTitle: string;
  proHandle: string;
  conHandle: string;
  onAddressed: (message: string) => void;
}

const ADDRESS_COST_SATS = 5000;

type Phase = 'compose' | 'processing' | 'done';

export default function AddressSenateModal({
  open,
  onClose,
  debateTitle,
  proHandle,
  conHandle,
  onAddressed,
}: AddressSenateModalProps) {
  const [message, setMessage] = useState('');
  const [phase, setPhase] = useState<Phase>('compose');
  const [error, setError] = useState('');

  if (!open) return null;

  const splitSats = Math.floor(ADDRESS_COST_SATS / 2);

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('Your address to the Senate cannot be empty.');
      return;
    }

    setError('');
    setPhase('processing');

    try {
      const wallet = loadWalletState();

      if (wallet.balanceSats < ADDRESS_COST_SATS) {
        setError('Insufficient balance in your wallet to address the Senate.');
        setPhase('compose');
        return;
      }

      // Deduct from viewer's wallet
      wallet.balanceSats -= ADDRESS_COST_SATS;
      wallet.tippedTotalSats += ADDRESS_COST_SATS;

      const invoice = await createInvoice(
        ADDRESS_COST_SATS,
        `Address the Senate: "${debateTitle}" — split to ${proHandle} / ${conHandle}`,
      );

      wallet.transactionHistory.unshift(invoice);
      saveWalletState(wallet);

      // Simulate payment processing
      await new Promise((r) => setTimeout(r, 1200));

      setPhase('done');
      onAddressed(message.trim());
    } catch {
      setError('Failed to process payment. Please try again.');
      setPhase('compose');
    }
  };

  const handleClose = () => {
    setMessage('');
    setPhase('compose');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl border border-amber-700/40 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #1a1510 0%, #12100c 100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-amber-900/30">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg border border-amber-600/40 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #78350f, #451a03)' }}
            >
              <Landmark size={20} className="text-amber-400/80" />
            </div>
            <div>
              <h2 className="text-base font-bold text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>
                Address the Senate
              </h2>
              <p className="text-[10px] tracking-widest text-amber-600/50" style={{ fontFamily: 'Georgia, serif' }}>
                AD·SENATVM·LOQVI
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-amber-700/50 hover:text-amber-400 hover:bg-amber-950/40 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {phase === 'compose' && (
          <div className="px-5 py-5 space-y-4">
            <p className="text-sm text-amber-100/70" style={{ fontFamily: 'Georgia, serif' }}>
              Pay tribute to speak before the Senate. Your words will be heard by all, and your offering is split equally between the two orators.
            </p>

            {/* Cost breakdown */}
            <div className="rounded-xl border border-amber-900/30 p-3 space-y-2" style={{ background: 'rgba(20, 18, 14, 0.6)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-700/60 tracking-wide">TOTAL TRIBUTE</span>
                <div className="flex items-center gap-1.5">
                  <Coins size={14} className="text-amber-500" />
                  <span className="text-sm font-bold text-amber-300">{ADDRESS_COST_SATS.toLocaleString()} sats</span>
                </div>
              </div>
              <div className="h-px bg-amber-900/20" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-400/70">{proHandle}</span>
                <span className="text-xs text-emerald-300">{splitSats.toLocaleString()} sats</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-rose-400/70">{conHandle}</span>
                <span className="text-xs text-rose-300">{splitSats.toLocaleString()} sats</span>
              </div>
            </div>

            {/* Message input */}
            <div>
              <label className="text-[10px] tracking-widest text-amber-600/50 mb-1.5 block" style={{ fontFamily: 'Georgia, serif' }}>
                YOUR ADDRESS
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hear me, Senators..."
                rows={4}
                maxLength={500}
                className="w-full rounded-xl border border-amber-900/30 px-3 py-2.5 text-sm text-theme-text placeholder-amber-700/40 focus:outline-none focus:border-amber-600/50 transition-colors resize-none"
                style={{ background: 'rgba(15, 12, 8, 0.6)', fontFamily: 'Georgia, serif' }}
              />
              <div className="flex justify-end mt-1">
                <span className="text-[10px] text-amber-700/40">{message.length}/500</span>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 text-center">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!message.trim()}
              className="w-full py-3 rounded-xl font-semibold text-sm text-amber-50 disabled:opacity-40 transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: 'linear-gradient(135deg, #b45309, #92400e)' }}
            >
              <span className="flex items-center justify-center gap-2">
                <Send size={16} />
                Pay {ADDRESS_COST_SATS.toLocaleString()} sats & Address the Senate
              </span>
            </button>
          </div>
        )}

        {phase === 'processing' && (
          <div className="px-5 py-12 flex flex-col items-center">
            <Loader2 size={36} className="text-amber-500 animate-spin mb-4" />
            <p className="text-sm text-amber-200/70" style={{ fontFamily: 'Georgia, serif' }}>
              Processing your tribute on the Lightning Network...
            </p>
          </div>
        )}

        {phase === 'done' && (
          <div className="px-5 py-12 flex flex-col items-center">
            <div
              className="w-16 h-16 rounded-full border-2 border-emerald-500/40 flex items-center justify-center mb-4"
              style={{ background: 'rgba(6, 95, 70, 0.15)' }}
            >
              <Check size={28} className="text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-amber-200 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              The Senate Hears You
            </h3>
            <p className="text-sm text-amber-100/60 text-center" style={{ fontFamily: 'Georgia, serif' }}>
              Your words have been delivered to the floor. {splitSats.toLocaleString()} sats each to {proHandle} and {conHandle}.
            </p>
            <button
              onClick={handleClose}
              className="mt-5 px-5 py-2.5 rounded-xl text-sm font-medium text-amber-100 border border-amber-700/40 hover:bg-amber-950/40 transition-colors"
            >
              Return to the Gallery
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
