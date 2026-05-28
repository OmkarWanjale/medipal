import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/AuthContext.jsx';
import { api } from '../lib/api.js';

export default function ChatPage() {
  const { user, logout } = useAuth();
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [completed, setCompleted] = useState(false);
  const bottomRef = useRef(null);

  const greeted = useRef(false);

useEffect(() => {
    if (greeted.current) return;
    greeted.current = true;
    api.createSession().then(({ session }) => {
      setSessionId(session.id);
      setTimeout(() => {
        addBot(`Hi ${user.name.split(' ')[0]}! 👋 I'm your MediPal assistant. I'm here to help you describe your health concerns before you meet the doctor — you can be completely open with me.\n\nLet's start: what's been bothering you recently?`);
      }, 400);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function addBot(text) {
    setMessages(prev => [...prev, { role: 'assistant', content: text, time: now() }]);
  }

  function now() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  async function send() {
    if (!input.trim() || sending || !sessionId) return;
    const text = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text, time: now() }]);
    setSending(true);
    try {
      const { reply, completed: done } = await api.sendMessage(sessionId, text);
      addBot(reply);
      if (done) setCompleted(true);
    } catch (e) {
      addBot('Sorry, I had a connection issue. Please try again in a moment.');
    } finally {
      setSending(false);
    }
  }

  const s = {
    page: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8f9fa' },
    header: { background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' },
    avatar: { width: '36px', height: '36px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 },
    messages: { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' },
    inputRow: { background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'center' },
    input: { flex: 1, padding: '9px 14px', border: '1px solid #e5e7eb', borderRadius: '20px', fontSize: '14px', outline: 'none', color: '#1a1a1a' },
    sendBtn: { width: '38px', height: '38px', borderRadius: '50%', background: '#1D9E75', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.avatar}>🤖</div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>MediPal Assistant</div>
          <div style={{ fontSize: '12px', color: '#888' }}>AI health intake · Confidential</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1D9E75' }} />
          <button onClick={logout} style={{ fontSize: '12px', color: '#888', background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer' }}>Exit</button>
        </div>
      </div>

      {completed && (
        <div style={{ background: '#E1F5EE', borderBottom: '1px solid #9FE1CB', padding: '10px 20px', fontSize: '13px', color: '#085041', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ✅ Your summary has been sent to the doctor. You're all set!
        </div>
      )}

      <div style={s.messages}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              padding: '10px 14px', borderRadius: '16px', fontSize: '14px', lineHeight: '1.55',
              background: m.role === 'user' ? '#1D9E75' : '#fff',
              color: m.role === 'user' ? '#fff' : '#1a1a1a',
              border: m.role === 'user' ? 'none' : '1px solid #e5e7eb',
              borderBottomRightRadius: m.role === 'user' ? '4px' : '16px',
              borderBottomLeftRadius: m.role === 'assistant' ? '4px' : '16px',
              whiteSpace: 'pre-wrap',
            }}>
              {m.content}
            </div>
            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '3px', padding: '0 4px' }}>{m.time}</div>
          </div>
        ))}
        {sending && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', borderBottomLeftRadius: '4px', padding: '12px 16px', display: 'flex', gap: '4px' }}>
              {[0, 150, 300].map(d => (
                <div key={d} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#aaa', animation: `bounce 1s ${d}ms infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={s.inputRow}>
        <input
          style={{ ...s.input, opacity: completed ? 0.5 : 1 }}
          placeholder={completed ? 'Session complete' : 'Type your symptoms or answer here...'}
          value={input}
          disabled={completed}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button style={{ ...s.sendBtn, opacity: (sending || completed) ? 0.5 : 1 }} onClick={send} disabled={sending || completed}>
          ➤
        </button>
      </div>

      <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }`}</style>
    </div>
  );
}
