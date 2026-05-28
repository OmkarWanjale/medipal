import express from 'express';
import { pool } from '../db/schema.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

const SYSTEM_PROMPT = (patientName) => `You are MediPal, a warm and empathetic AI health intake assistant. Your job is to collect a thorough medical history from ${patientName} before they see their doctor.

Rules:
- Ask ONE question at a time, never multiple
- Be conversational, warm, and reassuring — never clinical or scary
- Never diagnose or prescribe — only collect information

Your structured flow:
1. Ask about the main symptom and how long it has been going on
2. Ask about severity on a scale of 1–10
3. Ask about any other associated symptoms
4. Ask about relevant past medical history or allergies
5. Ask about current medications if any

After 5–6 exchanges, when you have enough information:
- Summarise what the patient told you in a friendly way
- Offer 1–2 general wellness tips (drink water, rest, etc.) — never diagnose
- End your message with this exact JSON block on its own line:
INTAKE_COMPLETE:{"symptoms":["symptom1","symptom2"],"duration":"X days","severity":7,"summary":"Patient reported...","suggestion":"Doctor should consider...","urgency":"normal"}

Use "urgent" only if symptoms suggest something potentially serious (chest pain, difficulty breathing, severe pain, etc.). Keep the JSON on one line.`;

async function callGroq(messages, patientName) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 500,
      temperature: 0.7,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT(patientName) },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ]
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Groq API error');
  return data.choices[0].message.content;
}

router.post('/session', authMiddleware, requireRole('patient'), async (req, res) => {
  try {
    const result = await pool.query(
      'INSERT INTO sessions (patient_id) VALUES ($1) RETURNING *',
      [req.user.id]
    );
    res.json({ session: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

router.get('/session/:sessionId/messages', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await pool.query(
      'SELECT role, content, created_at FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
      [sessionId]
    );
    res.json({ messages: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/session/:sessionId/message', authMiddleware, requireRole('patient'), async (req, res) => {
  const { sessionId } = req.params;
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Message content required' });

  try {
    const sessionRes = await pool.query(
      'SELECT * FROM sessions WHERE id = $1 AND patient_id = $2',
      [sessionId, req.user.id]
    );
    if (sessionRes.rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    if (sessionRes.rows[0].status === 'completed') return res.status(400).json({ error: 'Session already completed' });

    await pool.query(
      'INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)',
      [sessionId, 'user', content]
    );

    const historyRes = await pool.query(
      'SELECT role, content FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
      [sessionId]
    );
    const messages = historyRes.rows.map(m => ({ role: m.role, content: m.content }));

    const reply = await callGroq(messages, req.user.name);

    await pool.query(
      'INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)',
      [sessionId, 'assistant', reply]
    );

    const intakeMatch = reply.match(/INTAKE_COMPLETE:(\{.+\})/);
    let completed = false;

    if (intakeMatch) {
      try {
        const data = JSON.parse(intakeMatch[1]);
        await pool.query(
          `INSERT INTO summaries (session_id, patient_id, symptoms, duration, severity, ai_summary, ai_suggestion, urgency)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [sessionId, req.user.id, data.symptoms, data.duration, data.severity, data.summary, data.suggestion, data.urgency || 'normal']
        );
        await pool.query(
          'UPDATE sessions SET status = $1, completed_at = NOW() WHERE id = $2',
          ['completed', sessionId]
        );
        completed = true;
      } catch (e) {
        console.error('Failed to parse intake data:', e);
      }
    }

    const displayReply = reply.replace(/INTAKE_COMPLETE:\{.+\}/, '').trim();
    res.json({ reply: displayReply, completed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;