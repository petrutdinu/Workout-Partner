import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chatApi, userApi } from '../api';
import { getToken } from '../keycloak';
import './Chat.css';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8003/api/v1/chat/ws';

const Chat = () => {
  const { userId: otherUserId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);
  const bottomRef = useRef(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    userApi.getUserById(otherUserId)
      .then(res => setOtherUser(res.data?.user || res.data))
      .catch(() => {});
  }, [otherUserId]);

  useEffect(() => {
    chatApi.getMessages(otherUserId, { limit: 50 })
      .then(res => {
        const msgs = res.data?.messages || res.data || [];
        setMessages(msgs.reverse());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [otherUserId]);

  const connectWs = useCallback(() => {
    const token = getToken();
    if (!token) return;

    const ws = new WebSocket(`${WS_URL}/${otherUserId}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      setTimeout(connectWs, 3000);
    };
    ws.onerror = () => ws.close();
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        setMessages(prev => [...prev, msg]);
      } catch {}
    };

    return () => ws.close();
  }, [otherUserId]);

  useEffect(() => {
    const cleanup = connectWs();
    return () => {
      cleanup?.();
      wsRef.current?.close();
    };
  }, [connectWs]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ content: input.trim() }));
    setInput('');
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div className="chat-user-info">
          <div className="chat-avatar">{(otherUser?.username || '?')[0].toUpperCase()}</div>
          <div>
            <h2>{otherUser?.username || 'Loading...'}</h2>
            <span className={`conn-status ${connected ? 'online' : 'offline'}`}>
              {connected ? 'Connected' : 'Reconnecting...'}
            </span>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {loading ? (
          <div className="chat-loading">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">No messages yet. Say hi!</div>
        ) : (
          messages.map((msg, i) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id || i} className={`message ${isMine ? 'mine' : 'theirs'}`}>
                <div className="message-bubble">{msg.content}</div>
                <div className="message-time">
                  {msg.sent_at ? new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-bar" onSubmit={sendMessage}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={!connected}
          autoFocus
        />
        <button type="submit" className="btn btn-primary" disabled={!connected || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
