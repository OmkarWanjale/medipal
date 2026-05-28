import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';

export default function AuthPage() {
  const [params] = useSearchParams();
  const role = params.get('role') || 'patient';
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const accentColor = role === 'doctor' ? '#378ADD' : '#1D9E75';

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      let user;
      if (mode === 'login') {
        user = await login(form.email, form.password);
      } else {
        if (!form.name) { setError('Name is required'); setLoading(false); return; }
        user = await register(form.name, form.email, form.password, role);
      }
      navigate(user.role === 'doctor' ? '/doctor' : '/chat');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const s = {
    page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', padding: '1rem' },
    box: { background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '2rem', width: '100%', maxWidth: '380px' },
    label: { display: 'block', fontSize: '13px', color: '#666', marginBottom: '5px' },
    input: { width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', color: '#1a1a1a' },
    btn: { width: '100%', padding: '11px', background: accentColor, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '4px' },
  };

  return (
    <div style={s.page}>
      <div style={s.box}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a', marginBottom: '4px' }}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </div>
          <div style={{ fontSize: '13px', color: '#888' }}>
            {role === 'doctor' ? 'Doctor portal' : 'Patient portal'} · {mode === 'login' ? 'Sign in to continue' : 'Register to get started'}
          </div>
        </div>

        {mode === 'register' && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={s.label}>Full name</label>
            <input style={s.input} placeholder="Rahul Sharma" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
        )}
        <div style={{ marginBottom: '1rem' }}>
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" placeholder="you@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>

        {error && <div style={{ background: '#fef2f2', color: '#b91c1c', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', marginBottom: '1rem' }}>{error}</div>}

        <button style={s.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign in →' : 'Create account →'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '13px', color: '#888' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <span style={{ color: accentColor, cursor: 'pointer', fontWeight: '500' }} onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Register' : 'Sign in'}
          </span>
        </div>
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <span style={{ fontSize: '13px', color: '#aaa', cursor: 'pointer' }} onClick={() => navigate('/')}>← Back to home</span>
        </div>
      </div>
    </div>
  );
}
