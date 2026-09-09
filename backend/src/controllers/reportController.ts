import { Response } from 'express';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../types';
import { cache } from '../utils/cache';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user!.role;
    const userId = req.user!.id;
    const cacheKey = `dashboard_stats:${userRole}:${userId}`;
    const cachedStats = await cache.get<any>(cacheKey);
    if (cachedStats) {
      return res.json({ success: true, data: cachedStats });
    }

    // Scoped issue statistics
    let issueScopeSql = `WHERE 1=1`;
    const params: any[] = [];

    if (userRole === 'MENTOR') {
      issueScopeSql += ` AND i.mentor_id = $1`;
      params.push(req.user!.mentorId);
    } else if (userRole === 'SENIOR') {
      issueScopeSql += ` AND i.senior_id = $1`;
      params.push(req.user!.seniorId);
    } else if (userRole === 'JUNIOR') {
      issueScopeSql += ` AND i.junior_id = $1`;
      params.push(req.user!.juniorId);
    }

    // Execute basic count & issue queries in parallel using Promise.all
    const [
      directorsCountRes,
      seniorsCountRes,
      juniorsCountRes,
      issuesTotalRes,
      openIssuesRes,
      resolvedIssuesRes,
      escalatedIssuesRes,
      reopenedIssuesRes,
      votingIssuesRes,
      categoryChartRes,
      votesRes
    ] = await Promise.all([
      query(`SELECT COUNT(*) FROM mentors`),
      query(`SELECT COUNT(*) FROM seniors`),
      query(`SELECT COUNT(*) FROM juniors`),
      query(`SELECT COUNT(*) FROM issues i ${issueScopeSql}`, params),
      query(`SELECT COUNT(*) FROM issues i ${issueScopeSql} AND i.status IN ('OPEN', 'UNDER_REVIEW', 'IN_PROGRESS')`, params),
      query(`SELECT COUNT(*) FROM issues i ${issueScopeSql} AND i.status IN ('RESOLVED', 'CLOSED')`, params),
      query(`SELECT COUNT(*) FROM issues i ${issueScopeSql} AND i.status = 'ESCALATED'`, params),
      query(`SELECT COUNT(*) FROM issues i ${issueScopeSql} AND i.status = 'REOPENED'`, params),
      query(`SELECT COUNT(*) FROM issues i ${issueScopeSql} AND i.status = 'VOTING'`, params),
      query(
        `SELECT c.name as category, COUNT(i.id)::int as count
         FROM issue_categories c
         LEFT JOIN issues i ON c.id = i.category_id ${issueScopeSql.replace('WHERE 1=1', '')}
         WHERE c.is_active = true
         GROUP BY c.name ORDER BY count DESC, c.name ASC LIMIT 8`,
        params
      ),
      query(
        `SELECT v.vote_type, COUNT(v.id)::int as count
         FROM issue_votes v
         JOIN issues i ON v.issue_id = i.id ${issueScopeSql.replace('WHERE 1=1', '')}
         GROUP BY v.vote_type`,
        params
      )
    ]);

    const totalIssuesCount = parseInt(issuesTotalRes.rows[0].count || '0');
    const openCount = parseInt(openIssuesRes.rows[0].count || '0');
    const resolvedCount = parseInt(resolvedIssuesRes.rows[0].count || '0');
    const escalatedCount = parseInt(escalatedIssuesRes.rows[0].count || '0');
    const reopenedCount = parseInt(reopenedIssuesRes.rows[0].count || '0');
    const votingCount = parseInt(votingIssuesRes.rows[0].count || '0');

    let satisfied = 0, partiallySatisfied = 0, notSatisfied = 0;
    votesRes.rows.forEach(r => {
      if (r.vote_type === 'SATISFIED') satisfied = parseInt(r.count || '0');
      else if (r.vote_type === 'PARTIALLY_SATISFIED') partiallySatisfied = parseInt(r.count || '0');
      else if (r.vote_type === 'NOT_SATISFIED') notSatisfied = parseInt(r.count || '0');
    });

    const totalVotes = satisfied + partiallySatisfied + notSatisfied;

    // Calculate Resolution Satisfaction % dynamically based on Solved vs Total Issues
    // If solved issues are less, the percentage is lower!
    let satisfactionRate = 100;
    if (totalIssuesCount > 0) {
      satisfactionRate = Math.round((resolvedCount / totalIssuesCount) * 100);
    } else if (totalVotes > 0) {
      satisfactionRate = Math.round((satisfied / totalVotes) * 100);
    }

    // Director / Management Aggregated Departmental Onboarding & Question Averages (No Individual Answers Exposed!)
    let overallOnboardingRate = 0;
    let overallQuestionsRate = 0;

    if (['SUPER_ADMIN', 'ADMIN', 'MENTOR', 'SENIOR'].includes(req.user!.role)) {
      let deptScopeSql = ``;
      const deptParams: any[] = [];
      if (req.user!.role === 'MENTOR') {
        deptScopeSql = ` WHERE s.mentor_id = $1`;
        deptParams.push(req.user!.mentorId);
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
    if (['SUPER_ADMIN', 'ADMIN', 'MENTOR'].includes(req.user!.role)) {
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
      if (req.user!.role === 'MENTOR') {
        senPerfSql += ` WHERE s.mentor_id = $1`;
        senParams.push(req.user!.mentorId);
      }
      senPerfSql += ` ORDER BY total_issues DESC`;
      const perfRes = await query(senPerfSql, senParams);
      seniorPerformance = perfRes.rows;
    }

    const responseData = {
      totalMentors: parseInt(directorsCountRes.rows[0].count),
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
        satisfied: totalVotes > 0 ? satisfied : resolvedCount,
        partiallySatisfied: totalVotes > 0 ? partiallySatisfied : (openCount + votingCount),
        notSatisfied: totalVotes > 0 ? notSatisfied : (escalatedCount + reopenedCount),
        totalVotes: totalVotes > 0 ? totalVotes : totalIssuesCount,
        resolvedCount,
        pendingCount: openCount + escalatedCount + reopenedCount + votingCount
      },
      categoryBreakdown: categoryChartRes.rows,
      seniorPerformance
    };

    await cache.set(cacheKey, responseData, 15000); // 15s TTL Cache

    res.json({
      success: true,
      data: responseData
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Get Detailed Solved vs Unsolved Issues Report for Super Admin
export const getDetailedIssuesReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    let scopeSql = `WHERE 1=1`;
    const params: any[] = [];

    if (req.user!.role === 'MENTOR') {
      scopeSql += ` AND i.mentor_id = $1`;
      params.push(req.user!.mentorId);
    } else if (req.user!.role === 'SENIOR') {
      scopeSql += ` AND i.senior_id = $1`;
      params.push(req.user!.seniorId);
    } else if (req.user!.role === 'JUNIOR') {
      scopeSql += ` AND i.junior_id = $1`;
      params.push(req.user!.juniorId);
    }

    const issuesRes = await query(
      `SELECT i.id, i.issue_number, i.title, i.description, i.status, i.priority,
              (CASE WHEN i.status = 'ESCALATED' THEN 1 ELSE 0 END) as escalation_level,
              i.resolution, i.created_at, i.updated_at,
              COALESCE(c.name, 'General') as category_name,
              COALESCE(uj.name, 'Student') as junior_name,
              COALESCE(uj.username, 'junior') as junior_username,
              uj.email as junior_email,
              COALESCE(j.department, 'Campus') as junior_department,
              us.name as senior_name, s.senior_code,
              ud.name as mentor_name, d.department as director_department
       FROM issues i
       LEFT JOIN issue_categories c ON i.category_id = c.id
       LEFT JOIN juniors j ON (i.junior_id = j.id OR i.junior_id = j.user_id)
       LEFT JOIN users uj ON (j.user_id = uj.id OR i.junior_id = uj.id)
       LEFT JOIN seniors s ON (i.senior_id = s.id OR i.senior_id = s.user_id)
       LEFT JOIN users us ON (s.user_id = us.id OR i.senior_id = us.id)
       LEFT JOIN mentors d ON (i.mentor_id = d.id OR i.mentor_id = d.user_id)
       LEFT JOIN users ud ON (d.user_id = ud.id OR i.mentor_id = ud.id)
       ${scopeSql}
       ORDER BY i.created_at DESC`,
      params
    );

    const allIssues = issuesRes.rows;

    const solvedIssues = allIssues.filter((i: any) => ['RESOLVED', 'CLOSED'].includes(i.status));
    const unsolvedIssues = allIssues.filter((i: any) => !['RESOLVED', 'CLOSED'].includes(i.status));

    const totalCount = allIssues.length;
    const solvedCount = solvedIssues.length;
    const unsolvedCount = unsolvedIssues.length;
    const resolutionRate = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 100;

    res.json({
      success: true,
      data: {
        summary: {
          totalCount,
          solvedCount,
          unsolvedCount,
          resolutionRate,
          generatedAt: new Date().toISOString()
        },
        solvedIssues,
        unsolvedIssues,
        allIssues
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};
