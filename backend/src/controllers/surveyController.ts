import { Response } from 'express';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../types';

export const getSurveys = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query(`SELECT * FROM surveys WHERE is_active = true ORDER BY created_at DESC`);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

export const getSurveyDetails = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const surveyRes = await query(`SELECT * FROM surveys WHERE id = $1`, [id]);
    if (surveyRes.rowCount === 0) return res.status(404).json({ success: false, message: 'Survey not found', code: 'NOT_FOUND' });

    const questionsRes = await query(`SELECT * FROM survey_questions WHERE survey_id = $1 ORDER BY sequence_order ASC`, [id]);
    res.json({ success: true, data: { survey: surveyRes.rows[0], questions: questionsRes.rows } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

export const submitSurvey = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { answers } = req.body; // array of { questionId, responseText, responseRating }

  if (!req.user!.juniorId) {
    return res.status(403).json({ success: false, message: 'Only juniors can submit survey responses', code: 'FORBIDDEN' });
  }

  try {
    if (Array.isArray(answers)) {
      for (const a of answers) {
        await query(
          `INSERT INTO survey_responses (survey_id, question_id, junior_id, response_text, response_rating)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, a.questionId, req.user!.juniorId, a.responseText || null, a.responseRating || null]
        );
      }
    }
    res.json({ success: true, message: 'Survey submitted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Calculate Junior Support Attention Indicator
export const getSupportIndicators = async (req: AuthenticatedRequest, res: Response) => {
  try {
    let sql = `
      SELECT j.id as junior_id, u.name as junior_name, u.email as junior_email,
             s.id as senior_id, us.name as senior_name,
             (SELECT COUNT(*) FROM issues WHERE junior_id = j.id AND status IN ('OPEN', 'UNDER_REVIEW', 'IN_PROGRESS', 'REOPENED')) as open_issues_count,
             (SELECT COUNT(*) FROM issue_votes WHERE voter_id = u.id AND vote_type = 'NOT_SATISFIED') as negative_votes_count,
             (SELECT COUNT(*) FROM onboarding_progress WHERE junior_id = j.id AND is_completed = true) as completed_onboarding_count,
             (SELECT COUNT(*) FROM onboarding_items WHERE is_required = true) as total_onboarding_count
      FROM juniors j
      JOIN users u ON j.user_id = u.id
      JOIN seniors s ON j.senior_id = s.id
      JOIN users us ON s.user_id = us.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (req.user!.role === 'SENIOR') {
      sql += ` AND j.senior_id = $1`;
      params.push(req.user!.seniorId);
    } else if (req.user!.role === 'DIRECTOR') {
      sql += ` AND s.director_id = $1`;
      params.push(req.user!.directorId);
    }

    const result = await query(sql, params);

    const indicators = result.rows.map(row => {
      const openIssues = parseInt(row.open_issues_count || '0');
      const negativeVotes = parseInt(row.negative_votes_count || '0');
      const completedOnboarding = parseInt(row.completed_onboarding_count || '0');
      const totalOnboarding = parseInt(row.total_onboarding_count || '0');
      const onboardingRatio = totalOnboarding > 0 ? completedOnboarding / totalOnboarding : 1;

      let status = 'NORMAL';
      let score = 0;

      if (openIssues > 2 || negativeVotes > 1 || onboardingRatio < 0.5) {
        status = 'HIGH_ATTENTION';
        score = 3;
      } else if (openIssues > 0 || negativeVotes > 0 || onboardingRatio < 0.8) {
        status = 'ATTENTION';
        score = 2;
      }

      return {
        ...row,
        onboardingProgress: totalOnboarding > 0 ? Math.round((completedOnboarding / totalOnboarding) * 100) : 0,
        supportStatus: status,
        score
      };
    });

    res.json({ success: true, data: indicators });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};
