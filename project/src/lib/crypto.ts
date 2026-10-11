/**
 * Local-first cryptographic identity using Web Crypto API.
 * Zero PII: identity is a public key hash, private key stays in browser storage.
 */

const STORAGE_PREFIX = 'agora_identity';

export interface CryptoIdentity {
  publicKeyB64: string;
  privateKeyB64: string;
  shortId: string;
  fullId: string;
  createdAt: number;
}

function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function b64ToBuf(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function sha256Hex(data: string): Promise<string> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(data));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function generateIdentity(): Promise<CryptoIdentity> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify'],
  );

  const pubKey = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const privKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const pubB64 = bufToB64(pubKey);
  const privB64 = bufToB64(privKey);

  const fullHash = await sha256Hex(pubB64);
  const shortId = fullHash.substring(0, 8);
  const fullId = fullHash.substring(0, 16);

  const identity: CryptoIdentity = {
    publicKeyB64: pubB64,
    privateKeyB64: privB64,
    shortId,
    fullId,
    createdAt: Date.now(),
  };

  saveIdentity(identity);
  return identity;
}

export function saveIdentity(identity: CryptoIdentity): void {
  localStorage.setItem(`${STORAGE_PREFIX}_keys`, JSON.stringify(identity));
}

export function loadIdentity(): CryptoIdentity | null {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}_keys`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CryptoIdentity;
  } catch {
    return null;
  }
}

export function clearIdentity(): void {
  localStorage.removeItem(`${STORAGE_PREFIX}_keys`);
}

export async function signData(data: string, identity: CryptoIdentity): Promise<string> {
  const privKey = await crypto.subtle.importKey(
    'pkcs8',
    b64ToBuf(identity.privateKeyB64),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  const enc = new TextEncoder();
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privKey,
    enc.encode(data),
  );
  return bufToB64(sig);
}

export async function verifySignature(
  data: string,
  signatureB64: string,
  publicKeyB64: string,
): Promise<boolean> {
  try {
    const pubKey = await crypto.subtle.importKey(
      'raw',
      b64ToBuf(publicKeyB64),
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify'],
    );
    const enc = new TextEncoder();
    return crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      pubKey,
      b64ToBuf(signatureB64),
      enc.encode(data),
    );
  } catch {
    return false;
  }
}

export function formatHandle(identity: CryptoIdentity): string {
  return `@${identity.shortId}`;
}
