import express from 'express';
import { pool } from '../db/schema.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, requireRole('doctor'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.id AS session_id,
        s.status,
        s.created_at,
        s.completed_at,
        u.id AS patient_id,
        u.name AS patient_name,
        u.email AS patient_email,
        sm.id AS summary_id,
        sm.symptoms,
        sm.duration,
        sm.severity,
        sm.ai_summary,
        sm.ai_suggestion,
        sm.urgency,
        sm.doctor_notes,
        sm.reviewed_at
      FROM sessions s
      JOIN users u ON s.patient_id = u.id
      LEFT JOIN summaries sm ON sm.session_id = s.id
      WHERE s.status IN ('completed', 'reviewed')
      ORDER BY sm.urgency DESC, s.completed_at DESC
      LIMIT 50
    `);
    res.json({ patients: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

router.get('/stats', authMiddleware, requireRole('doctor'), async (req, res) => {
  try {
    const today = await pool.query(`
      SELECT COUNT(*) FROM sessions
      WHERE status IN ('completed','reviewed') AND completed_at::date = CURRENT_DATE
    `);
    const week = await pool.query(`
      SELECT COUNT(*) FROM sessions
      WHERE status IN ('completed','reviewed') AND completed_at >= NOW() - INTERVAL '7 days'
    `);
    const urgent = await pool.query(`
      SELECT COUNT(*) FROM summaries
      WHERE urgency = 'urgent' AND reviewed_at IS NULL
    `);
    res.json({
      today: parseInt(today.rows[0].count),
      week: parseInt(week.rows[0].count),
      urgent: parseInt(urgent.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.patch('/:summaryId/notes', authMiddleware, requireRole('doctor'), async (req, res) => {
  const { summaryId } = req.params;
  const { doctor_notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE summaries SET doctor_notes = $1, reviewed_at = NOW()
       WHERE id = $2 RETURNING *`,
      [doctor_notes, summaryId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Summary not found' });
    await pool.query(
      'UPDATE sessions SET status = $1 WHERE id = $2',
      ['reviewed', result.rows[0].session_id]
    );
    res.json({ summary: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save notes' });
  }
});

router.get('/my-sessions', authMiddleware, requireRole('patient'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.status, s.created_at, s.completed_at,
             sm.ai_summary, sm.symptoms, sm.doctor_notes, sm.reviewed_at
      FROM sessions s
      LEFT JOIN summaries sm ON sm.session_id = s.id
      WHERE s.patient_id = $1
      ORDER BY s.created_at DESC
    `, [req.user.id]);
    res.json({ sessions: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

export default router;
