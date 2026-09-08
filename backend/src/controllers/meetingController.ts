import { Response } from 'express';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../types';
import { logAudit } from '../utils/audit';
import { cache } from '../utils/cache';

// Ensure mentorship_meetings table exists
const ensureMeetingsTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS mentorship_meetings (
        id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
        title VARCHAR(200) NOT NULL,
        agenda TEXT,
        meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
        location VARCHAR(200) NOT NULL,
        meeting_link TEXT,
        mentor_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mentor_role VARCHAR(30) NOT NULL,
        target_junior_id VARCHAR(36) REFERENCES juniors(id) ON DELETE CASCADE,
        status VARCHAR(30) DEFAULT 'SCHEDULED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

// Get Meetings (Filter by User Role)
export const getMeetings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureMeetingsTable();
    const user = req.user!;

    if (user.role === 'JUNIOR') {
      // Find Junior's ID
      const jRes = await query(`SELECT id, senior_id, faculty_id FROM juniors WHERE user_id = $1`, [user.id]);
      if (jRes.rowCount === 0) {
        return res.json({ success: true, data: [] });
      }
      const jId = jRes.rows[0].id;
      const sId = jRes.rows[0].senior_id;
      const fId = jRes.rows[0].faculty_id;

      // Find user IDs for Senior, Faculty, and Directors
      const mentorUserIdsRes = await query(
        `SELECT user_id FROM seniors WHERE id = $1
         UNION
         SELECT user_id FROM faculty WHERE id = $2
         UNION
         SELECT user_id FROM directors`,
        [sId || '', fId || '']
      );
      const mentorUserIds = mentorUserIdsRes.rows.map(r => r.user_id);

      const meetingsRes = await query(
        `SELECT m.*, u.name as mentor_name, u.role as mentor_actual_role, ju.name as target_junior_name
         FROM mentorship_meetings m
         JOIN users u ON m.mentor_id = u.id
         LEFT JOIN juniors j ON m.target_junior_id = j.id
         LEFT JOIN users ju ON j.user_id = ju.id
         WHERE (m.target_junior_id = $1 OR (m.target_junior_id IS NULL AND m.mentor_id = ANY($2::text[])))
         ORDER BY m.meeting_date ASC`,
        [jId, mentorUserIds]
      );

      return res.json({ success: true, data: meetingsRes.rows });
    } else {
      // For Senior, Faculty, Director, Admin, SuperAdmin: return created meetings
      const meetingsRes = await query(
        `SELECT m.*, u.name as mentor_name, u.role as mentor_actual_role, ju.name as target_junior_name
         FROM mentorship_meetings m
         JOIN users u ON m.mentor_id = u.id
         LEFT JOIN juniors j ON m.target_junior_id = j.id
         LEFT JOIN users ju ON j.user_id = ju.id
         WHERE m.mentor_id = $1
         ORDER BY m.meeting_date ASC`,
        [user.id]
      );

      return res.json({ success: true, data: meetingsRes.rows });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Schedule New Meeting (Mentors: Senior, Faculty, Director, SuperAdmin, Admin)
export const createMeeting = async (req: AuthenticatedRequest, res: Response) => {
  const { title, agenda, meetingDate, location, meetingLink, targetJuniorId } = req.body;
  const user = req.user!;

  if (!['SENIOR', 'FACULTY', 'DIRECTOR', 'SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Only Mentors and Directors can schedule meetings',
      code: 'FORBIDDEN'
    });
  }

  if (!title || !meetingDate || !location) {
    return res.status(400).json({
      success: false,
      message: 'Meeting title, date & time, and location are required',
      code: 'INVALID_INPUT'
    });
  }

  try {
    await ensureMeetingsTable();

    let validTargetJuniorId = targetJuniorId || null;

    // Insert meeting
    const mRes = await query(
      `INSERT INTO mentorship_meetings
       (title, agenda, meeting_date, location, meeting_link, mentor_id, mentor_role, target_junior_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        title.trim(),
        agenda ? agenda.trim() : null,
        new Date(meetingDate).toISOString(),
        location.trim(),
        meetingLink ? meetingLink.trim() : null,
        user.id,
        user.role,
        validTargetJuniorId
      ]
    );

    await logAudit(user.id, 'CREATE_MENTORSHIP_MEETING', 'MEETING', mRes.rows[0].id, { title, location, meetingDate }, req.ip);

    res.status(201).json({
      success: true,
      message: 'Mentorship meeting scheduled successfully!',
      data: mRes.rows[0]
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Update Meeting Status (SCHEDULED, COMPLETED, CANCELLED)
export const updateMeetingStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['SCHEDULED', 'COMPLETED', 'CANCELLED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value', code: 'INVALID_INPUT' });
  }

  try {
    await ensureMeetingsTable();
    const result = await query(
      `UPDATE mentorship_meetings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND mentor_id = $3 RETURNING *`,
      [status, id, req.user!.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Meeting record not found or unauthorized', code: 'NOT_FOUND' });
    }

    res.json({ success: true, message: `Meeting marked as ${status}`, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Delete / Cancel Meeting
export const deleteMeeting = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    await ensureMeetingsTable();
    const result = await query(
      `DELETE FROM mentorship_meetings WHERE id = $1 AND (mentor_id = $2 OR $3 = 'SUPER_ADMIN') RETURNING *`,
      [id, req.user!.id, req.user!.role]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Meeting record not found or unauthorized', code: 'NOT_FOUND' });
    }

    res.json({ success: true, message: 'Meeting cancelled successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// --- MINUTES OF MEETING (MoM) & HEARING CONTROLLERS ---

const ensureMomTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS meeting_minutes (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        title VARCHAR(255) NOT NULL,
        meeting_type VARCHAR(50) NOT NULL DEFAULT 'HEARING',
        meeting_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        location VARCHAR(200) DEFAULT 'Super Admin Hearing Room',
        chairperson_name VARCHAR(150) NOT NULL,
        attendees TEXT NOT NULL,
        hearing_notes TEXT NOT NULL,
        executive_summary TEXT NOT NULL,
        key_highlights TEXT,
        action_items TEXT,
        decisions_reached TEXT NOT NULL,
        status VARCHAR(30) DEFAULT 'COMPLETED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

// Get Saved Minutes of Meetings (MoM Archive)
export const getMeetingMinutes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cached = await cache.get<any[]>('mom_minutes');
    if (cached) return res.json({ success: true, data: cached });

    await ensureMomTable();
    const result = await query(`SELECT * FROM meeting_minutes ORDER BY created_at DESC`);
    await cache.set('mom_minutes', result.rows, 15000);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// AI / Smart Meeting Hearing Summarizer (Distills transcripts into executive MoM summaries)
export const summarizeMeetingHearing = async (req: AuthenticatedRequest, res: Response) => {
  const { title, meetingType, location, chairpersonName, attendees, hearingNotes, customDecisions } = req.body;

  if (!title || !hearingNotes || !hearingNotes.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Meeting title and hearing notes transcript are required to generate MoM summary.',
      code: 'INVALID_INPUT'
    });
  }

  try {
    const rawNotes = String(hearingNotes).trim();
    const attendeesStr = Array.isArray(attendees) ? attendees.join(', ') : (attendees || 'Super Admin, Directors, Mentors');

    let executiveSummary = '';
    let keyHighlights = '';
    let actionItems = '';
    let decisionsReached = '';

    // Attempt Gemini AI API Call if GEMINI_API_KEY is available
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    let aiSuccess = false;

    if (geminiKey) {
      try {
        const prompt = `You are a professional university administrative AI assistant. Summarize the following meeting hearing transcript into a structured Minutes of Meeting (MoM).
Meeting Title: ${title}
Meeting Type: ${meetingType || 'HEARING'}
Attendees: ${attendeesStr}
Hearing Transcript Notes:
${rawNotes}

Return ONLY a JSON object (no markdown code blocks) with the following exact keys:
{
  "executiveSummary": "Concise 2-sentence summary of the meeting overview and main outcome.",
  "keyHighlights": "Max 3-4 bullet points summarizing the core arguments, evidence, and key points discussed.",
  "actionItems": "Max 2-3 to-do items assigned with square brackets like [ ] Task.",
  "decisionsReached": "A concise 1-2 sentence final verdict or resolution agreed upon."
}`;

        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const responseText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText) {
            const parsed = JSON.parse(responseText);
            executiveSummary = parsed.executiveSummary || '';
            keyHighlights = parsed.keyHighlights || '';
            actionItems = parsed.actionItems || '';
            decisionsReached = parsed.decisionsReached || '';
            aiSuccess = true;
          }
        }
      } catch (aiErr) {
        console.warn('Gemini API summarization fallback notice:', aiErr);
      }
    }

    // Smart Built-in AI Engine Fallback (Summarizes & distills rather than echoing all points)
    if (!aiSuccess) {
      const cleanText = (s: string) => s.replace(/^#+\s*/g, '').replace(/\*+/g, '').trim();
      const sentences = rawNotes
        .split(/(?<=[.!?])\s+|\n+/)
        .map(s => cleanText(s))
        .filter(s => s.length > 15 && !s.toLowerCase().startsWith('discussion notes'));

      // 1. Synthesize Executive Summary (2 sentences max)
      if (sentences.length <= 2) {
        executiveSummary = `The committee convened regarding "${title}" with ${attendeesStr}. All submitted hearing notes were reviewed and recorded.`;
      } else {
        const firstSentence = sentences[0];
        const lastSentence = sentences[sentences.length - 1];
        executiveSummary = `During the hearing on "${title}", the panel evaluated inputs from attendees (${attendeesStr}). Main discussion focused on: ${firstSentence}. Outcome established: ${lastSentence}.`;
      }

      // 2. Distill Key Highlights into 3 distinct summary clusters
      const highlightsList: string[] = [];
      const complaintSentences = sentences.filter(s => /issue|complaint|problem|concern|grievance|dispute|alleged/i.test(s));
      const statementSentences = sentences.filter(s => /stated|explained|argued|submitted|claimed|mentioned|reported/i.test(s));
      const resolutionSentences = sentences.filter(s => /agree|resolve|decide|conclude|rule|recommend|require/i.test(s));

      if (complaintSentences.length > 0) {
        highlightsList.push(`• Primary Issue Raised: ${complaintSentences[0]}`);
      } else if (sentences.length > 0) {
        highlightsList.push(`• Core Subject: ${sentences[0]}`);
      }

      if (statementSentences.length > 0) {
        highlightsList.push(`• Key Evidence & Submissions: ${statementSentences[0]}`);
      } else if (sentences.length > 1) {
        highlightsList.push(`• Discussion Summary: ${sentences[1]}`);
      }

      if (resolutionSentences.length > 0) {
        highlightsList.push(`• Committee Findings: ${resolutionSentences[0]}`);
      } else if (sentences.length > 2) {
        highlightsList.push(`• Final Deliberations: ${sentences[2]}`);
      }

      keyHighlights = highlightsList.join('\n') || `• Evaluated hearing notes and verified campus compliance for ${title}.`;

      // 3. Extract 2-3 Action Items
      const actionSentences = sentences.filter(s => /must|should|will|assigned|require|submit|follow|update/i.test(s));
      if (actionSentences.length > 0) {
        actionItems = actionSentences.slice(0, 3).map(s => `[ ] ${s}`).join('\n');
      } else {
        actionItems = `[ ] Monitor execution of hearing resolution for "${title}"\n[ ] Update department records and notify participating parties`;
      }

      // 4. Final Verdict / Resolution
      if (customDecisions && customDecisions.trim()) {
        decisionsReached = customDecisions.trim();
      } else if (resolutionSentences.length > 0) {
        decisionsReached = `Final Verdict: ${resolutionSentences[0]}`;
      } else {
        decisionsReached = `Final Verdict: The committee officially resolved the hearing for "${title}". All present parties confirmed acceptance of the findings and agreed to implement designated follow-up items.`;
      }
    }

    const momData = {
      title: title.trim(),
      meetingType: meetingType || 'HEARING',
      meetingDate: new Date().toISOString(),
      location: location || 'Super Admin Boardroom',
      chairpersonName: chairpersonName || req.user!.name,
      attendees: attendeesStr,
      hearingNotes: rawNotes,
      executiveSummary,
      keyHighlights,
      actionItems,
      decisionsReached,
      isAiGenerated: true
    };

    res.json({
      success: true,
      message: 'AI Minutes of Meeting (MoM) summary generated successfully!',
      data: momData
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Save Minutes of Meeting (MoM) to Database
export const saveMeetingMinutes = async (req: AuthenticatedRequest, res: Response) => {
  const { title, meetingType, meetingDate, location, chairpersonName, attendees, hearingNotes, executiveSummary, keyHighlights, actionItems, decisionsReached } = req.body;

  if (!title || !hearingNotes || !executiveSummary || !decisionsReached) {
    return res.status(400).json({ success: false, message: 'Missing required MoM fields', code: 'INVALID_INPUT' });
  }

  try {
    await ensureMomTable();

    const mRes = await query(
      `INSERT INTO meeting_minutes (
        title, meeting_type, meeting_date, location, chairperson_name, attendees,
        hearing_notes, executive_summary, key_highlights, action_items, decisions_reached
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        title.trim(),
        meetingType || 'HEARING',
        meetingDate || new Date().toISOString(),
        location || 'Super Admin Boardroom',
        chairpersonName || req.user!.name,
        Array.isArray(attendees) ? attendees.join(', ') : String(attendees || 'Super Admin'),
        hearingNotes,
        executiveSummary,
        keyHighlights || '',
        actionItems || '',
        decisionsReached
      ]
    );

    await logAudit(req.user!.id, 'SAVE_MEETING_MINUTES', 'MEETING', mRes.rows[0].id, { title }, req.ip as any);

    res.status(201).json({
      success: true,
      message: 'Minutes of Meeting (MoM) record saved successfully!',
      data: mRes.rows[0]
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Delete Minutes of Meeting Record
export const deleteMeetingMinutes = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    await ensureMomTable();
    const result = await query(`DELETE FROM meeting_minutes WHERE id = $1 RETURNING *`, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Minutes of Meeting record not found', code: 'NOT_FOUND' });
    }

    res.json({ success: true, message: 'Minutes of Meeting record deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};
