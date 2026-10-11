import { useState, useEffect } from 'react';
import { useIdentity } from '@/context/IdentityContext';
import { loadWalletState, saveWalletState, sendTip, loadBTCPayConfig, setBTCPayConfig, type WalletState, type PaymentRequest } from '@/lib/btcpay';
import { Bitcoin, Send, Zap, Copy, Check, Settings as SettingsIcon, Loader2 } from 'lucide-react';

const TIP_AMOUNTS = [100, 500, 1000, 5000];

export default function Wallet() {
  const { profile } = useIdentity();
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [tipAmount, setTipAmount] = useState(100);
  const [tipTo, setTipTo] = useState('');
  const [tipMsg, setTipMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingInvoice, setPendingInvoice] = useState<PaymentRequest | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [btcUrl, setBtcUrl] = useState('');
  const [btcStoreId, setBtcStoreId] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setWallet(loadWalletState());
    const cfg = loadBTCPayConfig();
    setBtcUrl(cfg.serverUrl);
    setBtcStoreId(cfg.storeId);
  }, []);

  const handleSendTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipTo.trim() || !profile) return;
    setSending(true);
    try {
      const invoice = await sendTip({ toUserId: tipTo.trim(), amountSats: tipAmount, message: tipMsg.trim() || undefined });
      setPendingInvoice(invoice);
      const newWallet: WalletState = {
        ...wallet!,
        balanceSats: wallet!.balanceSats - tipAmount,
        tippedTotalSats: wallet!.tippedTotalSats + tipAmount,
        transactionHistory: [invoice, ...wallet!.transactionHistory],
      };
      setWallet(newWallet);
      saveWalletState(newWallet);
    } catch {
      // show error
    }
    setSending(false);
  };

  const handleSaveConfig = () => {
    setBTCPayConfig({ serverUrl: btcUrl, storeId: btcStoreId });
    setShowSettings(false);
  };

  if (!wallet) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-theme-border border-t-amber-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bitcoin size={28} className="text-orange-400" />
          <h1 className="text-2xl font-bold text-theme-text">Wallet</h1>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className="w-9 h-9 flex items-center justify-center rounded-full text-theme-text-3 hover:text-theme-text hover:bg-theme-hover transition-colors">
          <SettingsIcon size={18} />
        </button>
      </div>

      {showSettings && (
        <div className="bg-theme-surface border border-theme-border rounded-xl p-4 mb-6 space-y-3">
          <h3 className="text-sm font-semibold text-theme-text">BTCPay Server Configuration</h3>
          <p className="text-xs text-theme-text-3">Connect your self-hosted BTCPay Server to enable real Bitcoin payments.</p>
          <input type="text" value={btcUrl} onChange={(e) => setBtcUrl(e.target.value)} placeholder="https://btcpay.yourserver.com" className="w-full bg-theme-input border border-theme-input-border rounded-lg px-3 py-2 text-theme-text text-sm focus:outline-none focus:border-amber-500" />
          <input type="text" value={btcStoreId} onChange={(e) => setBtcStoreId(e.target.value)} placeholder="Store ID" className="w-full bg-theme-input border border-theme-input-border rounded-lg px-3 py-2 text-theme-text text-sm focus:outline-none focus:border-amber-500" />
          <button onClick={handleSaveConfig} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors">Save Configuration</button>
        </div>
      )}

      {/* Balance card */}
      <div className="bg-gradient-to-br from-orange-950/40 via-theme-surface to-theme-surface border border-orange-900/30 rounded-2xl p-6 mb-6">
        <p className="text-xs text-theme-text-3 uppercase tracking-wide mb-1">Balance</p>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-theme-text">{wallet.balanceSats.toLocaleString()}</span>
          <span className="text-sm text-theme-text-3">sats</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="text-center">
            <p className="text-xs text-theme-text-3">Tipped Out</p>
            <p className="text-sm font-semibold text-theme-text">{wallet.tippedTotalSats.toLocaleString()} sats</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-theme-text-3">Received</p>
            <p className="text-sm font-semibold text-theme-text">{wallet.receivedTotalSats.toLocaleString()} sats</p>
          </div>
        </div>
      </div>

      {/* Pending invoice */}
      {pendingInvoice && (
        <div className="bg-theme-surface border border-amber-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={18} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-theme-text">Payment Invoice</h3>
          </div>
          <p className="text-xs text-theme-text-3 mb-2">{pendingInvoice.description}</p>
          <p className="text-lg font-bold text-theme-text mb-2">{pendingInvoice.amount.toLocaleString()} sats</p>
          <div className="bg-theme-input border border-theme-border rounded-lg p-2 flex items-center gap-2">
            <code className="text-xs text-theme-text-2 truncate flex-1 font-mono">{pendingInvoice.paymentUrl}</code>
            <button onClick={() => { navigator.clipboard.writeText(pendingInvoice.paymentUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="shrink-0 text-theme-text-3 hover:text-theme-text">
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          </div>
          <p className="text-xs text-theme-text-3 mt-2">Status: <span className="text-amber-400">{pendingInvoice.status}</span></p>
          <button onClick={() => setPendingInvoice(null)} className="mt-3 w-full py-2 bg-theme-elevated hover:bg-theme-hover text-theme-text-2 text-sm rounded-lg transition-colors">Dismiss</button>
        </div>
      )}

      {/* Send tip form */}
      <form onSubmit={handleSendTip} className="bg-theme-surface border border-theme-border rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-semibold text-theme-text flex items-center gap-2"><Send size={16} className="text-amber-400" /> Send a Tip</h3>
        <div>
          <label className="block text-xs font-medium text-theme-text-3 mb-1">Recipient handle (@...)</label>
          <input type="text" required value={tipTo} onChange={(e) => setTipTo(e.target.value)} placeholder="@8c2d1a..." className="w-full bg-theme-input border border-theme-input-border rounded-lg px-3 py-2 text-theme-text text-sm font-mono focus:outline-none focus:border-amber-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-theme-text-3 mb-2">Amount (sats)</label>
          <div className="flex gap-2 flex-wrap">
            {TIP_AMOUNTS.map((amt) => (
              <button key={amt} type="button" onClick={() => setTipAmount(amt)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tipAmount === amt ? 'bg-amber-600 text-white' : 'bg-theme-elevated text-theme-text-2 hover:bg-theme-hover'}`}>
                {amt.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-theme-text-3 mb-1">Message (optional)</label>
          <input type="text" value={tipMsg} onChange={(e) => setTipMsg(e.target.value)} placeholder="Great argument!" className="w-full bg-theme-input border border-theme-input-border rounded-lg px-3 py-2 text-theme-text text-sm focus:outline-none focus:border-amber-500" />
        </div>
        <button type="submit" disabled={sending || !tipTo.trim()} className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
          Send {tipAmount.toLocaleString()} sats
        </button>
      </form>

      {/* Transaction history */}
      {wallet.transactionHistory.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-theme-text-3 uppercase tracking-wide mb-3">History</h3>
          <div className="space-y-2">
            {wallet.transactionHistory.slice(0, 10).map((tx) => (
              <div key={tx.invoiceId} className="flex items-center justify-between bg-theme-surface border border-theme-border rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs text-theme-text truncate">{tx.description}</p>
                  <p className="text-[10px] text-theme-text-3">{new Date(tx.createdAt).toLocaleString()}</p>
                </div>
                <div className="shrink-0 ml-2">
                  <span className="text-xs font-medium text-theme-text">{tx.amount.toLocaleString()} sats</span>
                  <span className={`text-[10px] ml-2 ${tx.status === 'paid' ? 'text-green-400' : tx.status === 'expired' ? 'text-red-400' : 'text-amber-400'}`}>{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
