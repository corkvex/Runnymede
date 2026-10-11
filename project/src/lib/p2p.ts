/**
 * WebRTC P2P messaging layer with E2EE via client-side signing.
 * No central message database — messages are signed locally and
 * transmitted directly through WebRTC data channels.
 */

import type { CryptoIdentity } from './crypto';
import { signData } from './crypto';

export interface P2PMessage {
  id: string;
  fromId: string;
  toId: string;
  content: string;
  signature: string;
  timestamp: number;
}

export interface PeerConnection {
  peerId: string;
  pc: RTCPeerConnection;
  channel?: RTCDataChannel;
  status: 'connecting' | 'connected' | 'disconnected';
}

const PEERS = new Map<string, PeerConnection>();

export function createPeerConnection(peerId: string): RTCPeerConnection {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  });

  PEERS.set(peerId, { peerId, pc, status: 'connecting' });

  pc.onconnectionstatechange = () => {
    const peer = PEERS.get(peerId);
    if (!peer) return;
    if (pc.connectionState === 'connected') peer.status = 'connected';
    if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
      peer.status = 'disconnected';
    }
  };

  return pc;
}

export function createDataChannel(pc: RTCPeerConnection, label: string): RTCDataChannel {
  const channel = pc.createDataChannel(label, { ordered: true });
  return channel;
}

export async function createOffer(pc: RTCPeerConnection): Promise<RTCSessionDescriptionInit> {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  return offer;
}

export async function acceptOffer(
  pc: RTCPeerConnection,
  offer: RTCSessionDescriptionInit,
): Promise<RTCSessionDescriptionInit> {
  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return answer;
}

export async function acceptAnswer(
  pc: RTCPeerConnection,
  answer: RTCSessionDescriptionInit,
): Promise<void> {
  await pc.setRemoteDescription(answer);
}

export async function encryptAndSignMessage(
  content: string,
  fromIdentity: CryptoIdentity,
  toId: string,
): Promise<P2PMessage> {
  const timestamp = Date.now();
  const payload = `${fromIdentity.fullId}:${toId}:${content}:${timestamp}`;
  const signature = await signData(payload, fromIdentity);

  return {
    id: `${fromIdentity.fullId}-${timestamp}-${Math.random().toString(36).substring(2, 8)}`,
    fromId: fromIdentity.fullId,
    toId,
    content,
    signature,
    timestamp,
  };
}

export function sendMessage(channel: RTCDataChannel, msg: P2PMessage): void {
  if (channel.readyState === 'open') {
    channel.send(JSON.stringify(msg));
  }
}

export function getPeerStatus(peerId: string): PeerConnection | undefined {
  return PEERS.get(peerId);
}

export function disconnectPeer(peerId: string): void {
  const peer = PEERS.get(peerId);
  if (peer) {
    peer.pc.close();
    PEERS.delete(peerId);
  }
}

export function disconnectAll(): void {
  for (const [id] of PEERS) {
    disconnectPeer(id);
  }
}
