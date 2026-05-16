import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { chatApi, userApi, matchApi } from '../api';
import { io } from 'socket.io-client';
import {
  MessageCircle, PenSquare, Search, ArrowLeft,
  Phone, MoreVertical, Paperclip, Smile, Send,
  Lock, Zap, Users
} from 'lucide-react';
import './Chat.css';

const ACCENT = '#DC2626';
const SOCKET_URL = process.env.REACT_APP_CHAT_WS_URL || 'http://localhost:8003';

const AVATAR_TONES = [
  '#0EA5E9', '#7C3AED', '#10B981', '#EA580C', '#EC4899', '#F97316', '#DC2626',
];

function getAvatarTone(str) {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

function getInitials(user) {
  if (!user) return '?';
  if (user.username) return user.username.slice(0, 2).toUpperCase();
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return name ? name.slice(0, 2).toUpperCase() : '?';
}

function getName(user) {
  if (!user) return 'Unknown';
  if (user.username) return user.username;
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return name || 'Partner';
}

function formatTime(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Sidebar ─────────────────────────────────────────────────────────
function Sidebar({ partners, activeId, onSelect, hidden }) {
  const [q, setQ] = useState('');
  const filtered = partners.filter(p =>
    getName(p).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <aside className={`ch-sidebar${hidden ? ' ch-sidebar--hidden' : ''}`}>
      <div className="ch-sidebar-head">
        <div className="ch-sidebar-title">
          <h1>
            <span className="ch-title-icon" style={{ background: ACCENT }}>
              <MessageCircle size={18} strokeWidth={2.5} />
            </span>
            Messages
          </h1>
          <button className="ch-new-btn" aria-label="New chat">
            <PenSquare size={18} />
          </button>
        </div>
        <div className="ch-search-wrap">
          <span className="ch-search-icon"><Search size={15} /></span>
          <input
            className="ch-search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search conversations…"
          />
        </div>
      </div>

      <div className="ch-conv-list">
        {filtered.length === 0 && (
          <div className="ch-conv-empty">
            {q ? `No results for "${q}"` : 'No conversations yet.'}
          </div>
        )}
        {filtered.map(p => {
          const name = getName(p);
          const initials = getInitials(p);
          const tone = getAvatarTone(name);
          const isActive = String(p.id) === String(activeId);
          return (
            <button
              key={p.id}
              className={`ch-conv-row${isActive ? ' ch-conv-row--active' : ''}`}
              style={isActive ? { background: ACCENT + '0e' } : {}}
              onClick={() => onSelect(p.id)}
            >
              {isActive && (
                <span className="ch-active-stripe" style={{ background: ACCENT }} />
              )}
              <div className="ch-conv-avatar">
                <div
                  className="ch-conv-avatar-inner"
                  style={{ background: `linear-gradient(135deg, ${tone}, ${tone}cc)` }}
                >
                  {initials}
                </div>
                <span className="ch-conv-status-dot" style={{ background: '#9CA3AF' }} />
              </div>
              <div className="ch-conv-body">
                <div className="ch-conv-top">
                  <span className={`ch-conv-name`}>{name}</span>
                  {p.fitness_level && (
                    <span className="ch-conv-time">{p.fitness_level}</span>
                  )}
                </div>
                <div className="ch-conv-bottom">
                  <span className="ch-conv-preview">Tap to chat</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

// ── No-chat placeholder (desktop) ───────────────────────────────────
function NoChatPlaceholder() {
  return (
    <div className="ch-placeholder">
      <div className="ch-placeholder-icon-wrap">
        <span className="ch-placeholder-glow" style={{ background: ACCENT + '33' }} />
        <div className="ch-placeholder-icon" style={{ background: ACCENT + '14', color: ACCENT }}>
          <MessageCircle size={48} strokeWidth={1.75} />
        </div>
      </div>
      <h2>Select a conversation</h2>
      <p>Choose a partner from the list to start chatting. Messages sync in real time.</p>
      <div className="ch-placeholder-meta">
        <span><Lock size={13} /> End-to-end private</span>
        <span className="ch-placeholder-sep">·</span>
        <span><Zap size={13} /> Live updates</span>
      </div>
    </div>
  );
}

// ── No partners empty ────────────────────────────────────────────────
function NoPartnersEmpty() {
  return (
    <div className="ch-no-partners">
      <div className="ch-no-partners-card">
        <div className="ch-no-partners-icon-wrap">
          <span className="ch-no-partners-glow" style={{ background: ACCENT + '33' }} />
          <div className="ch-no-partners-icon" style={{ background: ACCENT + '14', color: ACCENT }}>
            <Users size={48} strokeWidth={1.75} />
          </div>
        </div>
        <h2>No partners yet</h2>
        <p>Connect with athletes to start chatting — your conversations will live here.</p>
        <Link
          to="/partners/find"
          className="ch-no-partners-cta"
          style={{
            background: `linear-gradient(135deg, ${ACCENT}, #b91c1c)`,
            boxShadow: `0 12px 28px -8px ${ACCENT}99`,
          }}
        >
          <Users size={16} strokeWidth={2.5} />
          Find Partners
        </Link>
      </div>
    </div>
  );
}

// ── Day chip ─────────────────────────────────────────────────────────
function DayChip({ label }) {
  return (
    <div className="ch-day-chip">
      <span>{label}</span>
    </div>
  );
}

// ── Message bubble ───────────────────────────────────────────────────
function Bubble({ msg, isMine, otherUser, showAvatar }) {
  const tone = getAvatarTone(getName(otherUser));
  const initials = getInitials(otherUser);
  const time = formatTime(msg.sent_at);

  return (
    <div className={`ch-bubble-row ch-bubble-row--${isMine ? 'mine' : 'theirs'}`}>
      {!isMine && showAvatar && (
        <div
          className="ch-bubble-avatar"
          style={{ background: `linear-gradient(135deg, ${tone}, ${tone}cc)` }}
        >
          {initials}
        </div>
      )}
      {!isMine && !showAvatar && <span className="ch-bubble-spacer" />}

      <div className={`ch-bubble-col ch-bubble-col--${isMine ? 'mine' : 'theirs'}`}>
        <div
          className={`ch-bubble ch-bubble--${isMine ? 'mine' : 'theirs'}`}
          style={isMine ? {
            background: `linear-gradient(135deg, ${ACCENT}, #b91c1c)`,
            boxShadow: `0 4px 12px -4px ${ACCENT}55`,
          } : {}}
        >
          {msg.content}
        </div>
        {time && (
          <div className={`ch-bubble-meta ch-bubble-meta--${isMine ? 'mine' : 'theirs'}`}>
            {time}
            {isMine && <Send size={11} style={{ color: ACCENT }} />}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Conversation pane ────────────────────────────────────────────────
function ConversationPane({ otherUser, messages, loading, connected, myUserId, onSend, onBack }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useLayoutEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const tone = getAvatarTone(getName(otherUser));
  const name = getName(otherUser);
  const initials = getInitials(otherUser);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="ch-conv-pane">
      {/* Header */}
      <header className="ch-conv-header">
        <button className="ch-back-btn" onClick={onBack} aria-label="Back">
          <ArrowLeft size={18} strokeWidth={2.25} />
        </button>

        <div className="ch-header-avatar">
          <div
            className="ch-header-avatar-inner"
            style={{ background: `linear-gradient(135deg, ${tone}, ${tone}cc)` }}
          >
            {initials}
          </div>
          <span
            className="ch-header-status-dot"
            style={{ background: connected ? '#22C55E' : '#9CA3AF' }}
          />
        </div>

        <div className="ch-header-info">
          <div className="ch-header-name">{name}</div>
          <div className="ch-header-sub">
            <span
              className="ch-header-sub-dot"
              style={{ background: connected ? '#22C55E' : '#9CA3AF' }}
            />
            <span style={{ color: connected ? '#16A34A' : '#9CA3AF' }}>
              {connected ? 'Online' : 'Reconnecting…'}
            </span>
          </div>
        </div>

        <div className="ch-header-actions">
          <button className="ch-header-btn" aria-label="Call">
            <Phone size={18} />
          </button>
          <button className="ch-header-btn" aria-label="More">
            <MoreVertical size={18} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="ch-messages">
        {loading ? (
          <div className="ch-messages-loading">Loading messages…</div>
        ) : (
          <div className="ch-msg-inner">
            {messages.length === 0 && (
              <div className="ch-day-chip" style={{ marginTop: 32 }}>
                <span>Start the conversation!</span>
              </div>
            )}
            {messages.length > 0 && <DayChip label="Today" />}
            {messages.map((msg, i) => {
              const isMine = msg.sender_id === myUserId;
              const prev = messages[i - 1];
              const showAvatar = !isMine && (!prev || prev.sender_id !== msg.sender_id);
              return (
                <Bubble
                  key={msg.id || i}
                  msg={msg}
                  isMine={isMine}
                  otherUser={otherUser}
                  showAvatar={showAvatar}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="ch-input-bar">
        <form className="ch-input-inner" onSubmit={handleSend}>
          <button type="button" className="ch-input-action-btn" aria-label="Attach">
            <Paperclip size={18} />
          </button>
          <div className="ch-input-wrap">
            <input
              className="ch-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              autoFocus
            />
            <button type="button" className="ch-emoji-btn" aria-label="Emoji">
              <Smile size={16} />
            </button>
          </div>
          <button
            type="submit"
            className="ch-send-btn"
            disabled={!input.trim()}
            style={{
              background: ACCENT,
              boxShadow: input.trim() ? `0 8px 20px -6px ${ACCENT}99` : 'none',
            }}
            aria-label="Send"
          >
            <Send size={17} strokeWidth={2.25} />
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Chat component ──────────────────────────────────────────────
const Chat = () => {
  const { userId: otherUserId } = useParams();
  const navigate = useNavigate();
  const [myUser, setMyUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [partners, setPartners] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    userApi.getCurrentUser()
      .then(res => setMyUser(res.data?.user || res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    matchApi.getPartners()
      .then(res => setPartners(res.data?.partners || res.data || []))
      .catch(() => {})
      .finally(() => setPartnersLoading(false));
  }, []);

  useEffect(() => {
    if (!otherUserId) { setOtherUser(null); return; }
    userApi.getUserById(otherUserId)
      .then(res => setOtherUser(res.data?.user || res.data))
      .catch(() => {});
  }, [otherUserId]);

  useEffect(() => {
    if (!otherUserId) { setMessages([]); setLoading(false); return; }
    setLoading(true);
    chatApi.getMessages(otherUserId, { limit: 50 })
      .then(res => {
        const msgs = res.data?.messages || res.data || [];
        setMessages(Array.isArray(msgs) ? msgs : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [otherUserId]);

  const connectSocket = useCallback(() => {
    if (!myUser?.id) return;
    const socket = io(`${SOCKET_URL}/chat`, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      query: { userId: myUser.id },
      reconnection: true,
      reconnectionDelay: 3000,
    });
    socketRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('newMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    return () => socket.disconnect();
  }, [myUser?.id]);

  useEffect(() => {
    const cleanup = connectSocket();
    return () => { cleanup?.(); };
  }, [connectSocket]);

  const handleSend = useCallback((content) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('sendMessage', { receiverId: otherUserId, content });
  }, [otherUserId]);

  const handleSelectPartner = (id) => navigate(`/chat/${id}`);
  const handleBack = () => navigate('/chat');

  if (!partnersLoading && partners.length === 0) {
    return (
      <div className="ch-root">
        <NoPartnersEmpty />
      </div>
    );
  }

  return (
    <div className="ch-root">
      <Sidebar
        partners={partners}
        activeId={otherUserId}
        onSelect={handleSelectPartner}
        hidden={!!otherUserId}
      />

      {!otherUserId && <NoChatPlaceholder />}

      {otherUserId && (
        <ConversationPane
          otherUser={otherUser || {}}
          messages={messages}
          loading={loading}
          connected={connected}
          myUserId={myUser?.id}
          onSend={handleSend}
          onBack={handleBack}
        />
      )}
    </div>
  );
};

export default Chat;
