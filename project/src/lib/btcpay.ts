/**
 * BTCPay Server integration interface for P2P crypto monetization.
 * Pre-wired for self-hosted BTCPay — no corporate payment gateways.
 * All tipping/subscription/ticket flows go through Bitcoin Lightning.
 */

export interface BTCPayConfig {
  serverUrl: string;
  storeId: string;
}

export interface PaymentRequest {
  invoiceId: string;
  amount: number; // in satoshis
  description: string;
  paymentUrl: string;
  status: 'pending' | 'paid' | 'expired';
  createdAt: number;
}

export interface TipRequest {
  toUserId: string;
  amountSats: number;
  message?: string;
}

export interface SubscriptionTier {
  id: string;
  creatorId: string;
  name: string;
  priceSats: number;
  perks: string[];
}

// Default config — would be set by user/creator with their own BTCPay Server
const DEFAULT_CONFIG: BTCPayConfig = {
  serverUrl: '', // e.g. https://btcpay.example.com
  storeId: '',
};

let config: BTCPayConfig = DEFAULT_CONFIG;

export function setBTCPayConfig(cfg: Partial<BTCPayConfig>): void {
  config = { ...config, ...cfg };
  localStorage.setItem('agora_btcpay_config', JSON.stringify(config));
}

export function loadBTCPayConfig(): BTCPayConfig {
  const stored = localStorage.getItem('agora_btcpay_config');
  if (stored) {
    try {
      config = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    } catch {
      // keep defaults
    }
  }
  return config;
}

export async function createInvoice(
  amountSats: number,
  description: string,
): Promise<PaymentRequest> {
  const cfg = loadBTCPayConfig();

  if (!cfg.serverUrl) {
    // Mock invoice when BTCPay is not configured yet
    return {
      invoiceId: `mock_${Date.now()}`,
      amount: amountSats,
      description,
      paymentUrl: `lightning:lnbc${amountSats}n1mock`,
      status: 'pending',
      createdAt: Date.now(),
    };
  }

  const res = await fetch(`${cfg.serverUrl}/api/v1/stores/${cfg.storeId}/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `token ${cfg.storeId}`,
    },
    body: JSON.stringify({
      amount: amountSats / 100000000, // Convert sats to BTC
      currency: 'BTC',
      metadata: { description },
    }),
  });

  if (!res.ok) throw new Error('Failed to create BTCPay invoice');

  const data = await res.json();
  return {
    invoiceId: data.id,
    amount: amountSats,
    description,
    paymentUrl: data.paymentLink || data.checkoutLink,
    status: 'pending',
    createdAt: Date.now(),
  };
}

export async function checkInvoiceStatus(invoiceId: string): Promise<PaymentRequest['status']> {
  const cfg = loadBTCPayConfig();
  if (invoiceId.startsWith('mock_')) {
    return 'pending';
  }

  if (!cfg.serverUrl) return 'pending';

  try {
    const res = await fetch(`${cfg.serverUrl}/api/v1/stores/${cfg.storeId}/invoices/${invoiceId}`);
    if (!res.ok) return 'pending';
    const data = await res.json();
    if (data.status === 'settled' || data.status === 'complete') return 'paid';
    if (data.status === 'expired' || data.status === 'invalid') return 'expired';
    return 'pending';
  } catch {
    return 'pending';
  }
}

export async function sendTip(req: TipRequest): Promise<PaymentRequest> {
  const desc = req.message
    ? `Tip to ${req.toUserId}: ${req.message}`
    : `Tip to ${req.toUserId}`;
  return createInvoice(req.amountSats, desc);
}

export interface WalletState {
  balanceSats: number;
  tippedTotalSats: number;
  receivedTotalSats: number;
  transactionHistory: PaymentRequest[];
}

export function loadWalletState(): WalletState {
  const stored = localStorage.getItem('agora_wallet');
  if (stored) {
    try {
      return JSON.parse(stored) as WalletState;
    } catch {
      // fall through
    }
  }
  return {
    balanceSats: 50000, // Mock starting balance
    tippedTotalSats: 0,
    receivedTotalSats: 0,
    transactionHistory: [],
  };
}

export function saveWalletState(state: WalletState): void {
  localStorage.setItem('agora_wallet', JSON.stringify(state));
}

// --- Debater earnings from "Address the Senate" paid floor speeches ---

export interface DebaterEarning {
  debateId: string;
  fromUserId: string;
  amountSats: number;
  timestamp: number;
}

const EARNINGS_KEY = 'agora_debater_earnings';

export function loadDebaterEarnings(): DebaterEarning[] {
  const stored = localStorage.getItem(EARNINGS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as DebaterEarning[];
    } catch {
      // fall through
    }
  }
  return [];
}

export function saveDebaterEarning(earning: DebaterEarning): void {
  const all = loadDebaterEarnings();
  all.push(earning);
  localStorage.setItem(EARNINGS_KEY, JSON.stringify(all));
}

export function getEarningsForUser(userId: string): DebaterEarning[] {
  return loadDebaterEarnings().filter((e) => e.fromUserId === userId);
}

export function getTotalEarningsForDebater(debaterId: string): number {
  return loadDebaterEarnings()
    .filter((e) => e.fromUserId === debaterId)
    .reduce((sum, e) => sum + e.amountSats, 0);
}
