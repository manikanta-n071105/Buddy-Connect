import { Response } from 'express';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../types';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Basic counts
    const directorsCountRes = await query(`SELECT COUNT(*) FROM directors`);
    const seniorsCountRes = await query(`SELECT COUNT(*) FROM seniors`);
    const juniorsCountRes = await query(`SELECT COUNT(*) FROM juniors`);

    // Scoped issue statistics
    let issueScopeSql = `WHERE 1=1`;
    const params: any[] = [];

    if (req.user!.role === 'DIRECTOR') {
      issueScopeSql += ` AND director_id = $1`;
      params.push(req.user!.directorId);
    } else if (req.user!.role === 'SENIOR') {
      issueScopeSql += ` AND senior_id = $1`;
      params.push(req.user!.seniorId);
    } else if (req.user!.role === 'JUNIOR') {
      issueScopeSql += ` AND junior_id = $1`;
      params.push(req.user!.juniorId);
    }

    const issuesTotalRes = await query(`SELECT COUNT(*) FROM issues ${issueScopeSql}`, params);
    const openIssuesRes = await query(`SELECT COUNT(*) FROM issues ${issueScopeSql} AND status IN ('OPEN', 'UNDER_REVIEW', 'IN_PROGRESS')`, params);
    const resolvedIssuesRes = await query(`SELECT COUNT(*) FROM issues ${issueScopeSql} AND status IN ('RESOLVED', 'CLOSED')`, params);
    const escalatedIssuesRes = await query(`SELECT COUNT(*) FROM issues ${issueScopeSql} AND status = 'ESCALATED'`, params);
    const reopenedIssuesRes = await query(`SELECT COUNT(*) FROM issues ${issueScopeSql} AND status = 'REOPENED'`, params);
    const votingIssuesRes = await query(`SELECT COUNT(*) FROM issues ${issueScopeSql} AND status = 'VOTING'`, params);

    // Issues by category chart data
    const categoryChartRes = await query(
      `SELECT c.name as category, COUNT(i.id) as count
       FROM issue_categories c
       LEFT JOIN issues i ON c.id = i.category_id ${issueScopeSql.replace('WHERE', 'AND')}
       GROUP BY c.name ORDER BY count DESC LIMIT 8`,
      params
    );

    // 3-Color Satisfaction Voting metrics
    const votesRes = await query(
      `SELECT v.vote_type, COUNT(v.id) as count
       FROM issue_votes v
       JOIN issues i ON v.issue_id = i.id ${issueScopeSql.replace('WHERE', 'AND')}
       GROUP BY v.vote_type`,
      params
    );

    let satisfied = 0, partiallySatisfied = 0, notSatisfied = 0;
    votesRes.rows.forEach(r => {
      if (r.vote_type === 'SATISFIED') satisfied = parseInt(r.count);
      else if (r.vote_type === 'PARTIALLY_SATISFIED') partiallySatisfied = parseInt(r.count);
      else if (r.vote_type === 'NOT_SATISFIED') notSatisfied = parseInt(r.count);
    });

    const totalVotes = satisfied + partiallySatisfied + notSatisfied;
    const satisfactionRate = totalVotes > 0 ? Math.round((satisfied / totalVotes) * 100) : 100;

    // Director / Management Aggregated Departmental Onboarding & Question Averages (No Individual Answers Exposed!)
    let overallOnboardingRate = 0;
    let overallQuestionsRate = 0;

    if (['SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'SENIOR'].includes(req.user!.role)) {
      let deptScopeSql = ``;
      const deptParams: any[] = [];
      if (req.user!.role === 'DIRECTOR') {
        deptScopeSql = ` WHERE s.director_id = $1`;
        deptParams.push(req.user!.directorId);
      } else if (req.user!.role === 'SENIOR') {
        deptScopeSql = ` WHERE j.senior_id = $1`;
        deptParams.push(req.user!.seniorId);
      }

      // Department Overall Onboarding %
      const deptOnbRes = await query(
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
           ${deptScopeSql}
           GROUP BY j.id
         ) sub`,
        deptParams
      );
      overallOnboardingRate = parseInt(deptOnbRes.rows[0]?.avg_pct || '0');

      // Department Overall Questions Response Rate %
      const deptQRes = await query(
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
           ${deptScopeSql}
           GROUP BY j.id
         ) sub`,
        deptParams
      );
      overallQuestionsRate = parseInt(deptQRes.rows[0]?.avg_pct || '0');
    }

    // Senior Scorecards (Aggregated Average Scores per Senior)
    let seniorPerformance: any[] = [];
    if (['SUPER_ADMIN', 'ADMIN', 'DIRECTOR'].includes(req.user!.role)) {
      let senPerfSql = `
        SELECT s.id as senior_id, s.senior_code, u.name as senior_name,
               (SELECT COUNT(*) FROM juniors WHERE senior_id = s.id) as junior_count,
               (SELECT COUNT(*) FROM issues WHERE senior_id = s.id) as total_issues,
               (SELECT COUNT(*) FROM issues WHERE senior_id = s.id AND status IN ('OPEN', 'UNDER_REVIEW', 'IN_PROGRESS')) as open_issues,
               (SELECT COUNT(*) FROM issues WHERE senior_id = s.id AND status IN ('RESOLVED', 'CLOSED')) as resolved_issues,
               COALESCE((
                 SELECT ROUND(AVG(
                   CASE WHEN sub.total_items > 0 THEN (sub.completed_items::decimal / sub.total_items::decimal) * 100 ELSE 0 END
                 ))
                 FROM (
                   SELECT j.id,
                          COUNT(CASE WHEN op.is_completed THEN 1 END) as completed_items,
                          COUNT(op.onboarding_item_id) as total_items
                   FROM juniors j
                   LEFT JOIN onboarding_progress op ON j.id = op.junior_id
                   WHERE j.senior_id = s.id
                   GROUP BY j.id
                 ) sub
               ), 0) as avg_junior_onboarding_pct,
               COALESCE((
                 SELECT ROUND(AVG(
                   CASE WHEN sub.total_q > 0 THEN (sub.answered_q::decimal / sub.total_q::decimal) * 100 ELSE 0 END
                 ))
                 FROM (
                   SELECT j.id,
                          COUNT(qr.question_id) as answered_q,
                          (SELECT COUNT(*) FROM questions) as total_q
                   FROM juniors j
                   LEFT JOIN question_responses qr ON j.id = qr.junior_id
                   WHERE j.senior_id = s.id
                   GROUP BY j.id
                 ) sub
               ), 0) as avg_junior_questions_pct
        FROM seniors s
        JOIN users u ON s.user_id = u.id
      `;
      const senParams: any[] = [];
      if (req.user!.role === 'DIRECTOR') {
        senPerfSql += ` WHERE s.director_id = $1`;
        senParams.push(req.user!.directorId);
      }
      senPerfSql += ` ORDER BY total_issues DESC`;
      const perfRes = await query(senPerfSql, senParams);
      seniorPerformance = perfRes.rows;
    }

    res.json({
      success: true,
      data: {
        totalDirectors: parseInt(directorsCountRes.rows[0].count),
        totalSeniors: parseInt(seniorsCountRes.rows[0].count),
        totalJuniors: parseInt(juniorsCountRes.rows[0].count),
        totalIssues: parseInt(issuesTotalRes.rows[0].count),
        openIssues: parseInt(openIssuesRes.rows[0].count),
        resolvedIssues: parseInt(resolvedIssuesRes.rows[0].count),
        escalatedIssues: parseInt(escalatedIssuesRes.rows[0].count),
        reopenedIssues: parseInt(reopenedIssuesRes.rows[0].count),
        votingIssues: parseInt(votingIssuesRes.rows[0].count),
        satisfactionRate,
        overallOnboardingRate,
        overallQuestionsRate,
        satisfactionBreakdown: {
          satisfied,
          partiallySatisfied,
          notSatisfied,
          totalVotes
        },
        categoryBreakdown: categoryChartRes.rows,
        seniorPerformance
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};
