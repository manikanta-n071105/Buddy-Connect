import { Response } from 'express';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../types';

// Get Onboarding Checklist for Junior or Senior Viewing Assigned Junior
export const getOnboardingProgress = async (req: AuthenticatedRequest, res: Response) => {
  const targetJuniorId = req.user!.role === 'JUNIOR' ? req.user!.juniorId : (req.query.juniorId as string);

  // Director / Non-Senior scope check for individual student answers
  if (req.user!.role === 'DIRECTOR' && targetJuniorId) {
    return res.status(403).json({
      success: false,
      message: 'Directors can only view overall department percentages and senior averages, not individual student answers',
      code: 'FORBIDDEN'
    });
  }

  if (req.user!.role === 'SENIOR' && targetJuniorId) {
    const checkRes = await query(`SELECT 1 FROM juniors WHERE id = $1 AND senior_id = $2`, [targetJuniorId, req.user!.seniorId]);
    if (checkRes.rowCount === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Senior mentors can only view checklist progress for their assigned juniors',
        code: 'FORBIDDEN'
      });
    }
  }

  try {
    let items;
    if (targetJuniorId) {
      const itemsRes = await query(
        `SELECT i.id, i.title, i.description, i.category, i.sequence_order, i.is_required,
                COALESCE(p.is_completed, false) as is_completed, p.completed_at
         FROM onboarding_items i
         LEFT JOIN onboarding_progress p ON i.id = p.onboarding_item_id AND p.junior_id = $1
         ORDER BY i.sequence_order ASC, i.created_at ASC`,
        [targetJuniorId]
      );
      items = itemsRes.rows;
    } else {
      const itemsRes = await query(
        `SELECT i.id, i.title, i.description, i.category, i.sequence_order, i.is_required
         FROM onboarding_items i
         ORDER BY i.sequence_order ASC, i.created_at ASC`
      );
      items = itemsRes.rows.map(item => ({ ...item, is_completed: false }));
    }

    const completedCount = items.filter(i => i.is_completed).length;
    const totalCount = items.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    let overallAveragePercent = 0;
    if (['SENIOR', 'DIRECTOR', 'SUPER_ADMIN', 'ADMIN'].includes(req.user!.role)) {
      let scopeSql = ``;
      const scopeParams: any[] = [];
      if (req.user!.role === 'SENIOR') {
        scopeSql = ` WHERE j.senior_id = $1`;
        scopeParams.push(req.user!.seniorId);
      } else if (req.user!.role === 'DIRECTOR') {
        scopeSql = ` WHERE s.director_id = $1`;
        scopeParams.push(req.user!.directorId);
      }

      const avgRes = await query(
        `SELECT COALESCE(ROUND(AVG(
           CASE WHEN sub.total_items > 0 THEN (sub.completed_items::decimal / sub.total_items::decimal) * 100 ELSE 0 END
         )), 0) as avg_pct
         FROM (
           SELECT j.id,
                  COUNT(CASE WHEN op.is_completed THEN 1 END) as completed_items,
                  COUNT(op.onboarding_item_id) as total_items
           FROM juniors j
           JOIN seniors s ON j.senior_id = s.id
           LEFT JOIN onboarding_progress op ON j.id = op.junior_id
           ${scopeSql}
           GROUP BY j.id
         ) sub`,
        scopeParams
      );
      overallAveragePercent = parseInt(avgRes.rows[0]?.avg_pct || '0');
    }

    res.json({
      success: true,
      data: {
        items,
        completedCount,
        totalCount,
        progressPercent,
        overallAveragePercent
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Create new Onboarding Checklist Item (Super Admin only)
export const createOnboardingItem = async (req: AuthenticatedRequest, res: Response) => {
  const { title, description, category, sequenceOrder, isRequired } = req.body;
  if (!title || !category) {
    return res.status(400).json({ success: false, message: 'Title and category required', code: 'INVALID_INPUT' });
  }

  if (!['SUPER_ADMIN', 'ADMIN', 'DIRECTOR'].includes(req.user!.role) && !req.user!.permissions?.includes('MANAGE_ONBOARDING')) {
    return res.status(403).json({ success: false, message: 'Permission MANAGE_ONBOARDING required to create onboarding checklist items', code: 'FORBIDDEN' });
  }

  try {
    const itemRes = await query(
      `INSERT INTO onboarding_items (title, description, category, sequence_order, is_required)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title.trim(), description ? description.trim() : null, category.trim(), sequenceOrder || 0, isRequired !== false]
    );
    const item = itemRes.rows[0];

    // Automatically attach new onboarding item to all active juniors
    const juniorsRes = await query(`SELECT id FROM juniors`);
    for (const jun of juniorsRes.rows) {
      await query(
        `INSERT INTO onboarding_progress (junior_id, onboarding_item_id, is_completed)
         VALUES ($1, $2, false)
         ON CONFLICT (junior_id, onboarding_item_id) DO NOTHING`,
        [jun.id, item.id]
      );
    }

    res.status(201).json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Toggle Onboarding Item Completion
export const toggleOnboardingItem = async (req: AuthenticatedRequest, res: Response) => {
  const { itemId } = req.params;
  const { isCompleted } = req.body;

  const juniorId = req.user!.role === 'JUNIOR' ? req.user!.juniorId : req.body.juniorId;

  if (!juniorId) {
    return res.status(400).json({ success: false, message: 'Junior ID required', code: 'INVALID_INPUT' });
  }

  try {
    await query(
      `INSERT INTO onboarding_progress (junior_id, onboarding_item_id, is_completed, completed_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (junior_id, onboarding_item_id)
       DO UPDATE SET is_completed = EXCLUDED.is_completed, completed_at = EXCLUDED.completed_at`,
      [juniorId, itemId, isCompleted, isCompleted ? new Date() : null]
    );

    res.json({ success: true, message: 'Onboarding progress updated' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Get Common Questions with Role & Scoping Rules
export const getQuestions = async (req: AuthenticatedRequest, res: Response) => {
  const targetJuniorId = req.user!.role === 'JUNIOR' ? req.user!.juniorId : (req.query.juniorId as string);

  // Director Privacy Protection: Directors cannot inspect individual student answers
  if (req.user!.role === 'DIRECTOR' && targetJuniorId) {
    return res.status(403).json({
      success: false,
      message: 'Directors can only view overall department percentages and senior averages, not individual student answers',
      code: 'FORBIDDEN'
    });
  }

  // Senior Scope Check: Senior can view answers ONLY for their assigned Juniors
  if (req.user!.role === 'SENIOR' && targetJuniorId) {
    const checkRes = await query(`SELECT 1 FROM juniors WHERE id = $1 AND senior_id = $2`, [targetJuniorId, req.user!.seniorId]);
    if (checkRes.rowCount === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Senior mentors can only view questionnaire answers for their assigned juniors',
        code: 'FORBIDDEN'
      });
    }
  }

  try {
    await query(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS answer_guide TEXT`);
    await query(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS category VARCHAR(100)`);

    const questionsRes = await query(`SELECT * FROM questions ORDER BY created_at DESC`);
    
    let responsesMap: Record<string, any> = {};
    if (targetJuniorId) {
      const respRes = await query(`SELECT question_id, response_text, response_rating FROM question_responses WHERE junior_id = $1`, [targetJuniorId]);
      respRes.rows.forEach(r => {
        responsesMap[r.question_id] = { text: r.response_text, rating: r.response_rating };
      });
    }

    let overallQuestionsPercent = 0;
    if (['SENIOR', 'DIRECTOR', 'SUPER_ADMIN', 'ADMIN'].includes(req.user!.role)) {
      let scopeSql = ``;
      const scopeParams: any[] = [];
      if (req.user!.role === 'SENIOR') {
        scopeSql = ` WHERE j.senior_id = $1`;
        scopeParams.push(req.user!.seniorId);
      } else if (req.user!.role === 'DIRECTOR') {
        scopeSql = ` WHERE s.director_id = $1`;
        scopeParams.push(req.user!.directorId);
      }

      const qAvgRes = await query(
        `SELECT COALESCE(ROUND(AVG(
           CASE WHEN sub.total_q > 0 THEN (sub.answered_q::decimal / sub.total_q::decimal) * 100 ELSE 0 END
         )), 0) as avg_pct
         FROM (
           SELECT j.id,
                  COUNT(qr.question_id) as answered_q,
                  (SELECT COUNT(*) FROM questions) as total_q
           FROM juniors j
           JOIN seniors s ON j.senior_id = s.id
           LEFT JOIN question_responses qr ON j.id = qr.junior_id
           ${scopeSql}
           GROUP BY j.id
         ) sub`,
        scopeParams
      );
      overallQuestionsPercent = parseInt(qAvgRes.rows[0]?.avg_pct || '0');
    }

    res.json({
      success: true,
      data: {
        questions: questionsRes.rows,
        responses: responsesMap,
        overallQuestionsPercent
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Create Common Question (Super Admin only)
export const createCommonQuestion = async (req: AuthenticatedRequest, res: Response) => {
  const { questionText, questionType, category, answerGuide, options, isRequired } = req.body;
  if (!questionText) {
    return res.status(400).json({ success: false, message: 'Question text required', code: 'INVALID_INPUT' });
  }

  if (!['SUPER_ADMIN', 'ADMIN', 'DIRECTOR'].includes(req.user!.role) && !req.user!.permissions?.includes('MANAGE_QUESTIONS')) {
    return res.status(403).json({ success: false, message: 'Permission MANAGE_QUESTIONS required to create common questions', code: 'FORBIDDEN' });
  }

  try {
    await query(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS answer_guide TEXT`);
    await query(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS category VARCHAR(100)`);

    const qRes = await query(
      `INSERT INTO questions (question_text, question_type, category, answer_guide, options, is_required)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        questionText.trim(),
        questionType || 'TEXT',
        category ? category.trim() : 'GENERAL',
        answerGuide ? answerGuide.trim() : null,
        options ? JSON.stringify(options) : null,
        isRequired !== false
      ]
    );

    res.status(201).json({ success: true, data: qRes.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Submit Question Responses
export const submitQuestionResponse = async (req: AuthenticatedRequest, res: Response) => {
  const { responses } = req.body;

  if (!req.user!.juniorId) {
    return res.status(403).json({ success: false, message: 'Only juniors can submit question responses', code: 'FORBIDDEN' });
  }

  try {
    if (Array.isArray(responses)) {
      for (const r of responses) {
        await query(
          `INSERT INTO question_responses (junior_id, question_id, response_text, response_rating)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (junior_id, question_id)
           DO UPDATE SET response_text = EXCLUDED.response_text, response_rating = EXCLUDED.response_rating`,
          [req.user!.juniorId, r.questionId, r.responseText || null, r.responseRating || null]
        );
      }
    }
    res.json({ success: true, message: 'Question responses saved' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};
