import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext.jsx';
import { api } from '../lib/api.js';

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({ today: 0, week: 0, urgent: 0 });
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getPatients(), api.getStats()])
      .then(([p, s]) => { setPatients(p.patients); setStats(s); })
      .finally(() => setLoading(false));
  }, []);

  async function saveNotes(summaryId) {
    setSaving(true);
    try {
      await api.saveDoctorNotes(summaryId, notes);
      setPatients(prev => prev.map(p => p.summary_id === summaryId ? { ...p, doctor_notes: notes, reviewed_at: new Date().toISOString() } : p));
      setSelected(null);
    } catch (e) {
      alert('Failed to save notes');
    } finally {
      setSaving(false);
    }
  }

  const s = {
    page: { minHeight: '100vh', background: '#f8f9fa' },
    header: { background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '12px' },
    body: { padding: '24px', maxWidth: '900px', margin: '0 auto' },
    statCard: { background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '16px', textAlign: 'center' },
    patientCard: { background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px', marginBottom: '12px', cursor: 'pointer', transition: 'border-color 0.15s' },
    badge: (type) => ({
      display: 'inline-block', fontSize: '11px', padding: '2px 9px', borderRadius: '20px', fontWeight: '500',
      background: type === 'urgent' ? '#FCEBEB' : type === 'new' ? '#E6F1FB' : '#E1F5EE',
      color: type === 'urgent' ? '#A32D2D' : type === 'new' ? '#0C447C' : '#085041',
    }),
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
    modal: { background: '#fff', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' },
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>Loading...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <span style={{ fontSize: '20px' }}>🏥</span>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>Doctor dashboard</h2>
        <span style={{ fontSize: '13px', color: '#888', marginLeft: '8px' }}>Dr. {user.name}</span>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={logout} style={{ fontSize: '12px', color: '#888', background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer' }}>Sign out</button>
        </div>
      </div>

      <div style={s.body}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <div style={s.statCard}><div style={{ fontSize: '24px', fontWeight: '600', color: '#1D9E75' }}>{stats.today}</div><div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Today</div></div>
          <div style={s.statCard}><div style={{ fontSize: '24px', fontWeight: '600', color: '#378ADD' }}>{stats.week}</div><div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>This week</div></div>
          <div style={s.statCard}><div style={{ fontSize: '24px', fontWeight: '600', color: '#E24B4A' }}>{stats.urgent}</div><div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Urgent pending</div></div>
        </div>

        <div style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Patient summaries</div>

        {patients.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#aaa', fontSize: '14px' }}>No patient summaries yet. Patients will appear here after completing their intake chat.</div>
        )}

        {patients.map((p, i) => (
          <div key={i} style={s.patientCard}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#1D9E75'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
            onClick={() => { setSelected(p); setNotes(p.doctor_notes || ''); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E1F5EE', color: '#0F6E56', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', flexShrink: 0 }}>
                {p.patient_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>{p.patient_name}</span>
              <span style={s.badge(p.urgency)}>{p.urgency === 'urgent' ? '⚠ Urgent' : p.reviewed_at ? 'Reviewed' : 'New'}</span>
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#aaa' }}>{p.completed_at ? new Date(p.completed_at).toLocaleString() : ''}</span>
            </div>
            <div style={{ fontSize: '13px', color: '#555', borderLeft: '2px solid #9FE1CB', paddingLeft: '10px', lineHeight: '1.5' }}>
              {p.ai_summary?.slice(0, 140)}{p.ai_summary?.length > 140 ? '...' : ''}
            </div>
            {p.symptoms?.length > 0 && (
              <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {p.symptoms.slice(0, 4).map((sym, j) => (
                  <span key={j} style={{ background: '#FAEEDA', color: '#633806', fontSize: '11px', padding: '2px 8px', borderRadius: '20px' }}>{sym}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {selected && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div style={s.modal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a' }}>{selected.patient_name}</h2>
                <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>{selected.patient_email}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#aaa' }}>×</button>
            </div>

            <Section label="Reported symptoms">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selected.symptoms?.map((s, i) => <span key={i} style={{ background: '#FAEEDA', color: '#633806', fontSize: '12px', padding: '3px 10px', borderRadius: '20px' }}>{s}</span>)}
              </div>
            </Section>

            <Section label="Duration & severity">
              <div style={{ fontSize: '14px', color: '#1a1a1a' }}>{selected.duration} · Severity: {selected.severity}/10</div>
            </Section>

            <Section label="Patient description">
              <div style={{ fontSize: '13px', color: '#444', lineHeight: '1.6', background: '#f9f9f9', borderRadius: '8px', padding: '12px' }}>{selected.ai_summary}</div>
            </Section>

            <Section label="AI clinical suggestion">
              <div style={{ fontSize: '13px', color: '#444', lineHeight: '1.6', background: '#f0fdf7', borderRadius: '8px', padding: '12px', borderLeft: '3px solid #5DCAA5' }}>{selected.ai_suggestion}</div>
            </Section>

            <Section label="Your notes">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add your clinical notes here..."
                style={{ width: '100%', minHeight: '100px', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', resize: 'vertical', outline: 'none', color: '#1a1a1a', boxSizing: 'border-box' }}
              />
            </Section>

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                onClick={() => saveNotes(selected.summary_id)}
                disabled={saving}
                style={{ flex: 1, padding: '10px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
              >
                {saving ? 'Saving...' : 'Save notes & mark reviewed'}
              </button>
              <button onClick={() => setSelected(null)} style={{ padding: '10px 20px', background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: '#555' }}>
                Close
              </button>
            </div>
            <div style={{ marginTop: '12px', fontSize: '11px', color: '#aaa', textAlign: 'center' }}>
              ⚠ AI-generated summary to assist, not replace, clinical judgment.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{label}</div>
      {children}
    </div>
  );
}
