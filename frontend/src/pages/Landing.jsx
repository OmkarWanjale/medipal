import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';
import { useEffect } from 'react';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'doctor' ? '/doctor' : '/chat');
    }
  }, [user]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#f8f9fa' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px', letterSpacing: '-0.5px' }}>
          Medi<span style={{ color: '#1D9E75' }}>Pal</span>
        </h1>
        <p style={{ color: '#666', fontSize: '15px' }}>Your personal health assistant — talk freely, we listen</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%', maxWidth: '480px' }}>
        <PortalCard
          icon="🩺"
          title="I'm a patient"
          desc="Describe your symptoms to our AI assistant before your appointment"
          color="#1D9E75"
          onClick={() => navigate('/auth?role=patient')}
        />
        <PortalCard
          icon="👨‍⚕️"
          title="I'm a doctor"
          desc="Review AI-prepared patient summaries before consultations"
          color="#378ADD"
          onClick={() => navigate('/auth?role=doctor')}
        />
      </div>
    </div>
  );
}

function PortalCard({ icon, title, desc, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem 1.25rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', outline: 'none' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ fontSize: '28px', marginBottom: '12px' }}>{icon}</div>
      <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a', marginBottom: '6px' }}>{title}</h3>
      <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.5' }}>{desc}</p>
    </button>
  );
}
