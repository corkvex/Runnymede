import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useIdentity } from '@/context/IdentityContext';
import { getMessages, saveMessage, type StoredMessage } from '@/lib/storage';
import { getAllProfiles, type StoredProfile } from '@/lib/storage';
import { encryptAndSignMessage } from '@/lib/p2p';
import { Send, MessageSquare, ArrowLeft, Lock, Search } from 'lucide-react';

export default function Messages() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { identity } = useIdentity();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [profiles, setProfiles] = useState<StoredProfile[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!identity) { setLoading(false); return; }
    const fetch = async () => {
      const msgs = await getMessages(identity.fullId);
      setMessages(msgs);
      const profs = await getAllProfiles();
      setProfiles(profs);
      setLoading(false);
    };
    fetch();
  }, [identity]);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, conversationId]);

  const conversations = profiles.filter((p) => {
    if (p.id === identity?.fullId) return false;
    if (searchTerm && !p.handle.includes(searchTerm)) return false;
    return messages.some((m) => m.fromId === p.id || m.toId === p.id);
  });

  const activeMessages = conversationId
    ? messages.filter((m) => m.fromId === conversationId || m.toId === conversationId).sort((a, b) => a.timestamp - b.timestamp)
    : [];

  const activeProfile = profiles.find((p) => p.id === conversationId);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity || !conversationId || !newMessage.trim()) return;
    setSending(true);
    const signed = await encryptAndSignMessage(newMessage.trim(), identity, conversationId);
    const stored: StoredMessage = {
      id: signed.id,
      fromId: signed.fromId,
      toId: signed.toId,
      content: signed.content,
      signature: signed.signature,
      timestamp: signed.timestamp,
      read: true,
    };
    await saveMessage(stored);
    setMessages((prev) => [stored, ...prev]);
    setNewMessage('');
    setSending(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-theme-border border-t-amber-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Conversation list */}
      <div className={`w-full md:w-80 border-r border-theme-border flex flex-col ${conversationId ? 'hidden md:flex' : ''}`}>
        <div className="p-3 border-b border-theme-border">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={20} className="text-amber-400" />
            <h1 className="text-sm font-bold text-theme-text">Messages</h1>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-3" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search..." className="w-full bg-theme-input border border-theme-input-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-theme-text placeholder-theme-text-3 focus:outline-none focus:border-amber-500" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center">
              <Lock size={32} className="text-theme-border mx-auto mb-2" />
              <p className="text-theme-text-3 text-xs">No conversations yet.</p>
              <p className="text-theme-text-3 text-xs mt-1">All messages are E2EE and stored locally.</p>
            </div>
          ) : (
            conversations.map((p) => {
              const lastMsg = messages.find((m) => m.fromId === p.id || m.toId === p.id);
              return (
                <button key={p.id} onClick={() => navigate(`/messages/${p.id}`)} className={`w-full flex items-center gap-3 p-3 hover:bg-theme-hover transition-colors border-b border-theme-border ${conversationId === p.id ? 'bg-theme-hover' : ''}`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {p.handle.substring(1, 3).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-mono text-theme-text truncate">{p.handle}</p>
                    <p className="text-xs text-theme-text-3 truncate mt-0.5">{lastMsg?.content || 'No messages'}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      {conversationId ? (
        <div className="flex-1 flex flex-col">
          <div className="h-12 border-b border-theme-border flex items-center gap-3 px-4">
            <button onClick={() => navigate('/messages')} className="md:hidden text-theme-text-3 hover:text-theme-text"><ArrowLeft size={18} /></button>
            {activeProfile && (
              <Link to={`/profile/${activeProfile.id}`} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold">{activeProfile.handle.substring(1, 3).toUpperCase()}</div>
                <span className="text-sm font-mono text-theme-text">{activeProfile.handle}</span>
              </Link>
            )}
            <span className="text-xs text-green-400 flex items-center gap-1 ml-auto"><Lock size={10} /> E2EE</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Lock size={32} className="text-theme-border mb-2" />
                <p className="text-theme-text-3 text-sm">No messages yet</p>
                <p className="text-theme-text-3 text-xs mt-1">Your conversation is end-to-end encrypted.</p>
              </div>
            ) : (
              activeMessages.map((msg) => {
                const isMine = msg.fromId === identity?.fullId;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMine ? 'bg-amber-600 text-white rounded-br-sm' : 'bg-theme-elevated text-theme-text rounded-bl-sm'}`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isMine ? 'text-amber-300' : 'text-theme-text-3'}`}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 border-t border-theme-border">
            <div className="flex items-center gap-2">
              <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type an encrypted message..." className="flex-1 bg-theme-input border border-theme-input-border rounded-full px-4 py-2.5 text-theme-text text-sm placeholder-theme-text-3 focus:outline-none focus:border-amber-500 transition-colors" />
              <button type="submit" disabled={sending || !newMessage.trim()} className="w-10 h-10 flex items-center justify-center bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-full transition-colors shrink-0">
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center">
          <Lock size={48} className="text-theme-border mb-3" />
          <p className="text-theme-text-3">Select a conversation</p>
          <p className="text-xs text-theme-text-3 mt-1">All messages are E2EE via WebRTC</p>
        </div>
      )}
    </div>
  );
}
