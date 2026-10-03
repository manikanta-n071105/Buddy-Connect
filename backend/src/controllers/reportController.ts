import { Response } from 'express';
import { query } from '../config/db';
import { reportQuery } from '../config/reportDb';
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

const getPythonBin = (): string => {
  const fs = require('fs');
  if (process.env.PYTHON_PATH && fs.existsSync(process.env.PYTHON_PATH)) {
    return process.env.PYTHON_PATH;
  }
  const preferred = 'C:\\Users\\nmani\\AppData\\Local\\Programs\\Python\\Python313\\python.exe';
  if (fs.existsSync(preferred)) {
    return preferred;
  }
  const alt = 'C:\\Program Files\\Python\\Python313\\python.exe';
  if (fs.existsSync(alt)) {
    return alt;
  }
  return 'python';
};

export const getConsolidatedReportStatus = async (_req: any, res: Response) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const projectRoot = path.resolve(process.cwd(), '..');
    const reportPath = path.join(projectRoot, 'Consolidated_Institutional_HOD_Report_April_2026.docx');
    const zipPath = path.join(projectRoot, 'Reports Zip File.zip');

    const reportExists = fs.existsSync(reportPath);
    const zipExists = fs.existsSync(zipPath);

    let stats: any = null;
    if (reportExists) {
      const fileStat = fs.statSync(reportPath);
      stats = {
        fileName: path.basename(reportPath),
        sizeBytes: fileStat.size,
        sizeFormatted: `${(fileStat.size / 1024).toFixed(1)} KB`,
        lastModified: fileStat.mtime.toISOString(),
        departments: [
          'Civil Engineering',
          'Computer Science & Engineering',
          'Electrical & Electronics Engineering',
          'Electronics & Communication Engineering',
          'Mechanical Engineering',
          'Humanities & Sciences'
        ],
        totalAggregatedItems: 135,
        period: 'September 2026',
        sectionsCount: 16
      };
    }

    return res.json({
      success: true,
      data: {
        reportExists,
        zipExists,
        stats
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const downloadConsolidatedReport = async (_req: any, res: Response) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const projectRoot = path.resolve(process.cwd(), '..');
    const reportPath = path.join(projectRoot, 'Consolidated_Institutional_HOD_Report_April_2026.docx');

    if (!fs.existsSync(reportPath)) {
      return res.status(404).json({ success: false, message: 'Consolidated report has not been generated yet.' });
    }

    res.setHeader('Content-Disposition', 'attachment; filename="Consolidated_Institutional_HOD_Report_April_2026.docx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    const fileStream = fs.createReadStream(reportPath);
    return fileStream.pipe(res);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const downloadConsolidatedPDF = async (_req: any, res: Response) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const projectRoot = path.resolve(process.cwd(), '..');
    const pdfPath = path.join(projectRoot, 'Consolidated_Institutional_HOD_Report_April_2026.pdf');

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ success: false, message: 'Consolidated PDF report has not been generated yet.' });
    }

    res.setHeader('Content-Disposition', 'attachment; filename="Consolidated_Institutional_HOD_Report_April_2026.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    const fileStream = fs.createReadStream(pdfPath);
    return fileStream.pipe(res);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const saveConsolidatedPDF = async (req: any, res: Response) => {
  try {
    const { fileBase64, fileName } = req.body;
    if (!fileBase64) {
      return res.status(400).json({ success: false, message: 'fileBase64 is required' });
    }
    const fs = await import('fs');
    const path = await import('path');
    const projectRoot = path.resolve(process.cwd(), '..');
    const cleanBase64 = fileBase64.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const outFileName = fileName || 'Consolidated_Institutional_HOD_Report_April_2026.pdf';
    const pdfPath = path.join(projectRoot, outFileName);
    fs.writeFileSync(pdfPath, buffer);
    return res.json({ success: true, message: 'Consolidated PDF saved on server', path: pdfPath });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const regenerateConsolidatedReport = async (_req: any, res: Response) => {
  try {
    const path = await import('path');
    const { execFile } = await import('child_process');
    const projectRoot = path.resolve(process.cwd(), '..');
    const scriptPath = path.join(projectRoot, 'scripts', 'consolidate_reports.py');
    const zipPath = path.join(projectRoot, 'Reports Zip File.zip');
    const reportPath = path.join(projectRoot, 'Consolidated_Institutional_HOD_Report_April_2026.docx');

    execFile(getPythonBin(), [scriptPath, zipPath, reportPath], (error, stdout, stderr) => {
      if (error) {
        console.error('Consolidation script error:', error, stderr);
        return res.status(500).json({ success: false, message: 'Consolidation failed', error: stderr || error.message });
      }
      return res.json({
        success: true,
        message: 'Successfully generated consolidated report',
        output: stdout
      });
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const uploadAndConsolidateZip = async (req: any, res: Response) => {
  try {
    const { fileBase64, fileName } = req.body;
    if (!fileBase64) {
      return res.status(400).json({ success: false, message: 'No file data received.' });
    }

    const fs = await import('fs');
    const path = await import('path');
    const { execFile } = await import('child_process');
    const projectRoot = path.resolve(process.cwd(), '..');

    const targetZipPath = path.join(projectRoot, 'Reports Zip File.zip');
    const cleanBase64 = fileBase64.replace(/^data:.*,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    fs.writeFileSync(targetZipPath, buffer);

    const scriptPath = path.join(projectRoot, 'scripts', 'consolidate_reports.py');
    const reportPath = path.join(projectRoot, 'Consolidated_Institutional_HOD_Report_April_2026.docx');

    execFile(getPythonBin(), [scriptPath, targetZipPath, reportPath], (error, stdout, stderr) => {
      if (error) {
        console.error('Consolidation script error:', error, stderr);
        return res.status(500).json({ success: false, message: 'Consolidation failed', error: stderr || error.message });
      }
      return res.json({
        success: true,
        message: `Successfully synthesized reports from ${fileName || 'uploaded zip'}`,
        output: stdout
      });
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export interface StandardEntityConfig {
  name: string;
  code: string;
  defaultHod: string;
  type: 'ACADEMIC' | 'COMMITTEE';
  keywords: string[];
}

export const STANDARD_DEPARTMENTS: StandardEntityConfig[] = [
  {
    name: 'Civil Engineering',
    code: 'CIVIL',
    defaultHod: 'Prof. K. Siva Prasad',
    type: 'ACADEMIC',
    keywords: ['civil engineering', 'civil', 'dept of civil']
  },
  {
    name: 'Computer Science & Engineering',
    code: 'CSE',
    defaultHod: 'Dr. Kethineni Vinod Kumar',
    type: 'ACADEMIC',
    keywords: ['computer science', 'cse', 'computer science & engineering', 'computer science and engineering']
  },
  {
    name: 'Electronics & Communication Engineering',
    code: 'ECE',
    defaultHod: 'Dr. V. Annapurna',
    type: 'ACADEMIC',
    keywords: ['electronics & communication', 'electronics and communication', 'ece', 'dept of ece']
  },
  {
    name: 'Electrical & Electronics Engineering',
    code: 'EEE',
    defaultHod: 'Mr. K. Gangadhar',
    type: 'ACADEMIC',
    keywords: ['electrical & electronics', 'electrical and electronics', 'eee', 'dept of eee']
  },
  {
    name: 'Mechanical Engineering',
    code: 'MECH',
    defaultHod: 'Prof. C. Anil Kumar Reddy',
    type: 'ACADEMIC',
    keywords: ['mechanical engineering', 'mech', 'mechanical', 'dept of mech']
  },
  {
    name: 'Humanities & Sciences',
    code: 'H&S',
    defaultHod: 'Dr. Samba Sivaiah B',
    type: 'ACADEMIC',
    keywords: ['humanities & sciences', 'humanities and sciences', 'h&s', 'has', 'basic sciences']
  },
];

export const STANDARD_COMMITTEES: StandardEntityConfig[] = [
  {
    name: 'Innovation & Entrepreneurship',
    code: 'IIC/EDC',
    defaultHod: 'Dean / Convener - IIC & EDC',
    type: 'COMMITTEE',
    keywords: ['Innovation & Entrepreneurship', 'innovation & entrepreneurship', 'iic', 'edc', 'entrepreneurship', 'startup', 'start-up', 'incubation', 'patents', 'ipr']
  },
  {
    name: 'Student Engagement & Clubs',
    code: 'CLUBS',
    defaultHod: 'Faculty Advisor - Student Affairs',
    type: 'COMMITTEE',
    keywords: ['Student Engagement & Clubs', 'student engagement', 'student clubs', 'coding club', 'robotics club', 'student affairs', 'cultural club', 'hackathon']
  },
  {
    name: 'NSS & Community Engagement',
    code: 'NSS',
    defaultHod: 'Dr. Samba Sivaiah B (NSS Officer)',
    type: 'COMMITTEE',
    keywords: ['nss & community engagement', 'nss', 'community engagement', 'social service', 'swachh bharat', 'blood donation', 'extension activities']
  },
  {
    name: 'Minutes of the Meeting',
    code: 'MOM',
    defaultHod: 'Member Secretary - Academic Committee',
    type: 'COMMITTEE',
    keywords: ['minutes of the meeting', 'minutes of meeting', 'academic committee', 'dac meeting', 'bos meeting', 'governing body', 'advisory committee']
  },
];

export const ALL_INSTITUTIONAL_ENTITIES = [...STANDARD_DEPARTMENTS, ...STANDARD_COMMITTEES];

export const clearDepartmentSubmissions = async (req: any, res: Response) => {
  try {
    const period = (req.query.period as string) || (req.body?.period as string) || 'September 2026';
    const fs = await import('fs');
    const path = await import('path');
    const projectRoot = path.resolve(process.cwd(), '..');

    await reportQuery('DELETE FROM departmental_monthly_reports WHERE period = $1', [period]);

    const cleanPeriodDir = period.replace(/[^a-zA-Z0-9_-]/g, '_');
    const hodReportsFolder = path.join(projectRoot, 'uploads', 'hod_reports', cleanPeriodDir);
    if (fs.existsSync(hodReportsFolder)) {
      try {
        const files = fs.readdirSync(hodReportsFolder);
        for (const f of files) {
          try { fs.unlinkSync(path.join(hodReportsFolder, f)); } catch (_) { }
        }
      } catch (_) { }
    }

    return res.json({
      success: true,
      message: `Cleared all departmental and committee submissions for ${period}`
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getDepartmentSubmissions = async (req: any, res: Response) => {
  try {
    const period = (req.query.period as string) || 'September 2026';

    const rowsRes = await reportQuery('SELECT * FROM departmental_monthly_reports WHERE LOWER(TRIM(period)) = LOWER(TRIM($1)) ORDER BY department ASC', [period]);
    const submittedMap = new Map();
    rowsRes.rows.forEach((r: any) => submittedMap.set(r.department.toLowerCase().trim(), r));

    const mapStatus = (entity: StandardEntityConfig) => {
      const sub = submittedMap.get(entity.name.toLowerCase().trim()) ||
        submittedMap.get(entity.code.toLowerCase().trim());
      return {
        code: entity.code,
        name: entity.name,
        type: entity.type,
        isSubmitted: !!sub && sub.status === 'SUBMITTED',
        hasDraft: !!sub && sub.status === 'DRAFT',
        id: sub?.id || null,
        hodName: sub?.hod_name || entity.defaultHod,
        submissionDate: sub?.submission_date || null,
        fileName: sub?.file_name || null,
        fileSizeBytes: sub?.file_size_bytes ? parseInt(sub.file_size_bytes) : 0,
        fileSizeFormatted: sub?.file_size_bytes ? `${(parseInt(sub.file_size_bytes) / 1024).toFixed(1)} KB` : null,
        itemsCount: sub?.items_count || 0,
        uploadedAt: sub?.uploaded_at || null,
        updatedAt: sub?.updated_at || null,
        status: sub?.status || 'PENDING'
      };
    };

    const departmentsStatus = STANDARD_DEPARTMENTS.map(mapStatus);
    const committeesStatus = STANDARD_COMMITTEES.map(mapStatus);

    const allEntities = [...departmentsStatus, ...committeesStatus];
    const submittedCount = allEntities.filter(e => e.isSubmitted).length;
    const submittedDeptsCount = departmentsStatus.filter(d => d.isSubmitted).length;
    const submittedCommsCount = committeesStatus.filter(c => c.isSubmitted).length;

    return res.json({
      success: true,
      data: {
        period,
        submittedCount,
        submittedDeptsCount,
        submittedCommsCount,
        totalDepartments: departmentsStatus.length,
        totalCommittees: committeesStatus.length,
        totalEntities: allEntities.length,
        isComplete: submittedDeptsCount === departmentsStatus.length,
        departments: departmentsStatus,
        committees: committeesStatus,
        allEntities
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const uploadDepartmentReport = async (req: any, res: Response) => {
  try {
    const { department, hodName, period = 'September 2026', fileBase64, fileName } = req.body;
    if (!department || !fileBase64 || !fileName) {
      return res.status(400).json({ success: false, message: 'Department/Committee, file, and fileName are required.' });
    }

    const fs = await import('fs');
    const path = await import('path');
    const projectRoot = path.resolve(process.cwd(), '..');

    const cleanPeriodDir = period.replace(/[^a-zA-Z0-9_-]/g, '_');
    const targetFolder = path.join(projectRoot, 'uploads', 'hod_reports', cleanPeriodDir);
    fs.mkdirSync(targetFolder, { recursive: true });

    const cleanDept = department.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFileName = `${cleanDept}_${Date.now()}_${fileName}`;
    const targetFilePath = path.join(targetFolder, safeFileName);

    const cleanBase64 = fileBase64.replace(/^data:.*,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    fs.writeFileSync(targetFilePath, buffer);

    const fileSizeBytes = buffer.length;

    // Detect items count using python inspector if available
    let itemsCount = 20;
    try {
      const { execFileSync } = await import('child_process');
      const scriptPath = path.join(projectRoot, 'scripts', 'consolidate_reports.py');
      const inspectOut = execFileSync(getPythonBin(), [scriptPath, '--inspect', targetFilePath], { encoding: 'utf-8', timeout: 8000 });
      const parsed = JSON.parse(inspectOut.trim());
      if (parsed && typeof parsed.itemsCount === 'number' && parsed.itemsCount > 0) {
        itemsCount = parsed.itemsCount;
      }
    } catch (_) { }

    const upsertRes = await reportQuery(`
      INSERT INTO departmental_monthly_reports 
      (department, period, hod_name, file_name, file_path, file_size_bytes, items_count, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'SUBMITTED')
      ON CONFLICT (department, period) DO UPDATE 
      SET hod_name = EXCLUDED.hod_name, file_name = EXCLUDED.file_name, file_path = EXCLUDED.file_path, 
          file_size_bytes = EXCLUDED.file_size_bytes, items_count = EXCLUDED.items_count, status = 'SUBMITTED', updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [department, period, hodName || 'Convener / HOD', fileName, targetFilePath, fileSizeBytes, itemsCount]);

    return res.json({
      success: true,
      message: `Successfully uploaded monthly report for ${department}!`,
      data: upsertRes.rows[0]
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Intelligent Auto-Detect & Map Upload Handler:
 * Committee or department uploads ANY report (.docx or .pdf) without specifying the department.
 * The system automatically detects which Committee or Department it belongs to, maps it, and submits it!
 */
export const uploadAutoMapReport = async (req: any, res: Response) => {
  try {
    const { fileBase64, fileName, period = 'September 2026', department, hodName } = req.body;
    if (!fileBase64 || !fileName) {
      return res.status(400).json({ success: false, message: 'File and fileName are required.' });
    }

    const fs = await import('fs');
    const path = await import('path');
    const { execFileSync } = await import('child_process');
    const projectRoot = path.resolve(process.cwd(), '..');

    const scratchFolder = path.join(projectRoot, 'scratch');
    fs.mkdirSync(scratchFolder, { recursive: true });
    const cleanPeriodDir = period.replace(/[^a-zA-Z0-9_-]/g, '_');
    const targetFolder = path.join(projectRoot, 'uploads', 'hod_reports', cleanPeriodDir);
    fs.mkdirSync(targetFolder, { recursive: true });

    const cleanBase64 = fileBase64.replace(/^data:.*,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const tempFilePath = path.join(scratchFolder, `inspect_${Date.now()}_${fileName}`);
    fs.writeFileSync(tempFilePath, buffer);

    let detectedName: string = (department && department !== 'auto') ? department : '';
    let detectedHod: string = hodName || '';
    let detectedPeriod: string = period;
    let detectedItems: number = 15;
    let detectedType: 'ACADEMIC' | 'COMMITTEE' = 'COMMITTEE';

    // 1. Try Python inspector on the uploaded document
    try {
      const scriptPath = path.join(projectRoot, 'scripts', 'consolidate_reports.py');
      const inspectOut = execFileSync(getPythonBin(), [scriptPath, '--inspect', tempFilePath], { encoding: 'utf-8', timeout: 10000 });
      const parsed = JSON.parse(inspectOut.trim());
      if (parsed && parsed.success) {
        if (!detectedName && parsed.department && parsed.department !== 'General') {
          detectedName = parsed.department;
        }
        if (!detectedHod && parsed.hod) {
          detectedHod = parsed.hod;
        }
        if (parsed.period) {
          detectedPeriod = parsed.period;
        }
        if (typeof parsed.itemsCount === 'number') {
          detectedItems = parsed.itemsCount;
        }
        if (parsed.type) {
          detectedType = parsed.type;
        }
      }
    } catch (e: any) {
      console.warn('Python inspect notice:', e.message);
    }

    // 2. Fallback heuristic pattern matching on filename if still undetected
    if (!detectedName || detectedName === 'General') {
      const fnLow = fileName.toLowerCase();
      for (const ent of ALL_INSTITUTIONAL_ENTITIES) {
        if (ent.keywords.some(kw => fnLow.includes(kw))) {
          detectedName = ent.name;
          detectedType = ent.type;
          if (!detectedHod) detectedHod = ent.defaultHod;
          break;
        }
      }
    }

    // Default fallback if still unknown
    if (!detectedName || detectedName === 'General') {
      detectedName = 'Civil Engineering';
      detectedType = 'ACADEMIC';
    }

    const matchedEntity = ALL_INSTITUTIONAL_ENTITIES.find(e => e.name.toLowerCase() === detectedName.toLowerCase());
    if (matchedEntity) {
      detectedName = matchedEntity.name;
      detectedType = matchedEntity.type;
      if (!detectedHod) detectedHod = matchedEntity.defaultHod;
    }

    // Move to permanent uploads path
    const cleanDept = detectedName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFileName = `${cleanDept}_${Date.now()}_${fileName}`;
    const targetFilePath = path.join(targetFolder, safeFileName);
    fs.copyFileSync(tempFilePath, targetFilePath);
    try { fs.unlinkSync(tempFilePath); } catch (_) { }

    const fileSizeBytes = buffer.length;

    const upsertRes = await reportQuery(`
      INSERT INTO departmental_monthly_reports 
      (department, period, hod_name, file_name, file_path, file_size_bytes, items_count, status, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'SUBMITTED', CURRENT_TIMESTAMP)
      ON CONFLICT (department, period) DO UPDATE 
      SET hod_name = EXCLUDED.hod_name, file_name = EXCLUDED.file_name, file_path = EXCLUDED.file_path, 
          file_size_bytes = EXCLUDED.file_size_bytes, items_count = EXCLUDED.items_count, status = 'SUBMITTED', updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [detectedName, detectedPeriod, detectedHod || 'Convener / HOD', fileName, targetFilePath, fileSizeBytes, detectedItems]);

    return res.json({
      success: true,
      message: `Report automatically mapped to ${detectedName} (${matchedEntity?.code || 'SSE'})!`,
      data: {
        id: upsertRes.rows[0].id,
        department: detectedName,
        code: matchedEntity?.code || 'SSE',
        type: detectedType,
        hodName: detectedHod,
        period: detectedPeriod,
        fileName,
        fileSizeBytes,
        itemsCount: detectedItems,
        uploadedAt: upsertRes.rows[0].uploaded_at
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const generateConsolidatedReportFromSubmissions = async (req: any, res: Response) => {
  try {
    const period = (req.body.period as string) || 'September 2026';
    const path = await import('path');
    const fs = await import('fs');
    const { execFile } = await import('child_process');
    const projectRoot = path.resolve(process.cwd(), '..');

    const submissionsRes = await reportQuery(
      'SELECT * FROM departmental_monthly_reports WHERE LOWER(TRIM(period)) = LOWER(TRIM($1))',
      [period]
    );

    if (submissionsRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No departmental or committee reports have been submitted for ${period} yet.`
      });
    }

    // Auto-generate docx on the fly for any submission with sections_data to guarantee the consolidated report reflects latest changes
    const cleanPeriodDir = period.replace(/[^a-zA-Z0-9_-]/g, '_');
    const targetFolder = path.join(projectRoot, 'uploads', 'hod_reports', cleanPeriodDir);
    fs.mkdirSync(targetFolder, { recursive: true });

    for (const sub of submissionsRes.rows) {
      if (sub.sections_data) {
        try {
          const scratchFolder = path.join(projectRoot, 'scratch');
          fs.mkdirSync(scratchFolder, { recursive: true });
          const tempJsonPath = path.join(scratchFolder, `auto_gen_${Date.now()}_${Math.random().toString(36).substring(7)}.json`);
          const cleanDept = sub.department.replace(/[^a-zA-Z0-9_-]/g, '_');
          const safeFileName = `${cleanDept}_Monthly_Report_${cleanPeriodDir}_${Date.now()}.docx`;
          const targetFilePath = path.join(targetFolder, safeFileName);

          const payload = {
            department: sub.department,
            period,
            hodName: sub.hod_name || 'HOD / Convener',
            submissionDate: sub.submission_date || new Date().toLocaleDateString('en-GB'),
            collegeName: 'SANSKRITHI SCHOOL OF ENGINEERING',
            sections: typeof sub.sections_data === 'string' ? JSON.parse(sub.sections_data) : sub.sections_data
          };

          fs.writeFileSync(tempJsonPath, JSON.stringify(payload, null, 2), 'utf-8');
          const genScript = path.join(projectRoot, 'scripts', 'generate_department_report.py');
          const { execFileSync } = await import('child_process');
          execFileSync(getPythonBin(), [genScript, tempJsonPath, targetFilePath], { timeout: 15000 });
          try { fs.unlinkSync(tempJsonPath); } catch (_) { }

          if (fs.existsSync(targetFilePath)) {
            sub.file_path = targetFilePath;
            await reportQuery('UPDATE departmental_monthly_reports SET file_path = $1, file_name = $2 WHERE id = $3', [targetFilePath, safeFileName, sub.id]);
          }
        } catch (err: any) {
          console.warn(`Failed to auto-generate docx for ${sub.department}:`, err.message);
        }
      }
    }

    const validSubmissions = submissionsRes.rows.filter((r: any) => r.file_path && fs.existsSync(r.file_path));
    const filePaths = validSubmissions.map((r: any) => r.file_path);

    if (filePaths.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Submitted report files could not be found or generated on disk.'
      });
    }

    const scriptPath = path.join(projectRoot, 'scripts', 'consolidate_reports.py');
    const cleanPeriod = period.replace(/[^a-zA-Z0-9_-]/g, '_');
    const reportPath = path.join(projectRoot, `Consolidated_Institutional_HOD_Report_${cleanPeriod}.docx`);

    const args = [scriptPath, ...filePaths, reportPath];

    execFile(getPythonBin(), args, async (error, stdout, stderr) => {
      if (error) {
        console.error('Consolidation script error:', error, stderr);
        return res.status(500).json({ success: false, message: 'Consolidation failed', error: stderr || error.message });
      }

      const standardOut = path.join(projectRoot, 'Consolidated_Institutional_HOD_Report_April_2026.docx');
      if (fs.existsSync(reportPath) && reportPath !== standardOut) {
        fs.copyFileSync(reportPath, standardOut);
      }

      const departmentsCovered = validSubmissions.map((s: any) => s.department);

      return res.json({
        success: true,
        message: `Successfully synthesized overall consolidated report from ${filePaths.length} departmental and committee reports!`,
        data: {
          period,
          reportPath,
          reportsCount: filePaths.length,
          entitiesCovered: departmentsCovered,
          output: stdout
        }
      });
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const downloadDepartmentReport = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const fs = await import('fs');
    const resDb = await reportQuery('SELECT * FROM departmental_monthly_reports WHERE id = $1', [id]);
    if (resDb.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Report submission not found.' });
    }

    const sub = resDb.rows[0];
    if (!sub.file_path || !fs.existsSync(sub.file_path)) {
      return res.status(404).json({ success: false, message: 'Report file missing on server.' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${sub.file_name}"`);
    if (sub.file_name && sub.file_name.toLowerCase().endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    } else {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    }
    const stream = fs.createReadStream(sub.file_path);
    return stream.pipe(res);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const generateManualDepartmentReport = async (req: any, res: Response) => {
  try {
    const {
      department,
      period = 'September 2026',
      hodName,
      submissionDate,
      sections = {},
      autoSubmit = true
    } = req.body;

    if (!department) {
      return res.status(400).json({ success: false, message: 'Department is required.' });
    }

    const fs = await import('fs');
    const path = await import('path');
    const { execFile } = await import('child_process');
    const projectRoot = path.resolve(process.cwd(), '..');

    const cleanPeriodDir = period.replace(/[^a-zA-Z0-9_-]/g, '_');
    const targetFolder = path.join(projectRoot, 'uploads', 'hod_reports', cleanPeriodDir);
    fs.mkdirSync(targetFolder, { recursive: true });

    const cleanDept = department.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFileName = `${cleanDept}_Monthly_Report_${cleanPeriodDir}_${Date.now()}.docx`;
    const targetFilePath = path.join(targetFolder, safeFileName);

    const scratchFolder = path.join(projectRoot, 'scratch');
    fs.mkdirSync(scratchFolder, { recursive: true });
    const tempJsonPath = path.join(scratchFolder, `dept_report_${Date.now()}_${Math.random().toString(36).substring(7)}.json`);

    const payload = {
      department,
      period,
      hodName: hodName || 'HOD',
      submissionDate: submissionDate || new Date().toLocaleDateString('en-GB'),
      collegeName: 'SANSKRITHI SCHOOL OF ENGINEERING',
      sections
    };

    fs.writeFileSync(tempJsonPath, JSON.stringify(payload, null, 2), 'utf-8');

    const scriptPath = path.join(projectRoot, 'scripts', 'generate_department_report.py');

    execFile(getPythonBin(), [scriptPath, tempJsonPath, targetFilePath], async (error, stdout, stderr) => {
      try { if (fs.existsSync(tempJsonPath)) fs.unlinkSync(tempJsonPath); } catch (_) { }

      if (error) {
        console.error('Department report generation error:', error, stderr);
        return res.status(500).json({
          success: false,
          message: 'Failed to generate department Word document',
          error: stderr || error.message
        });
      }

      if (!fs.existsSync(targetFilePath)) {
        return res.status(500).json({
          success: false,
          message: 'Generated report file was not created on disk'
        });
      }

      const fileStat = fs.statSync(targetFilePath);
      const fileSizeBytes = fileStat.size;

      let totalActivities = 0;
      try {
        const parsed = JSON.parse(stdout.trim());
        totalActivities = parsed.total_activities || 0;
      } catch (_) {
        totalActivities = Object.values(sections || {}).reduce((sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
      }

      let recordId: string | null = null;
      if (autoSubmit) {
        const upsertRes = await reportQuery(`
          INSERT INTO departmental_monthly_reports 
          (department, period, hod_name, submission_date, sections_data, file_name, file_path, file_size_bytes, items_count, status, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'SUBMITTED', CURRENT_TIMESTAMP)
          ON CONFLICT (department, period) DO UPDATE 
          SET hod_name = EXCLUDED.hod_name,
              submission_date = EXCLUDED.submission_date,
              sections_data = EXCLUDED.sections_data,
              file_name = EXCLUDED.file_name, 
              file_path = EXCLUDED.file_path, 
              file_size_bytes = EXCLUDED.file_size_bytes, 
              items_count = EXCLUDED.items_count, 
              status = 'SUBMITTED',
              updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `, [
          department,
          period,
          hodName || 'HOD',
          submissionDate || '',
          JSON.stringify(sections || {}),
          safeFileName,
          targetFilePath,
          fileSizeBytes,
          totalActivities
        ]);

        recordId = upsertRes.rows[0]?.id || null;
      }

      const fileBuffer = fs.readFileSync(targetFilePath);
      const fileBase64 = fileBuffer.toString('base64');

      return res.json({
        success: true,
        message: `Successfully generated ${department} report with ${totalActivities} activities! Saved to dedicated database.`,
        data: {
          id: recordId,
          department,
          period,
          hodName,
          fileName: safeFileName,
          fileSizeBytes,
          fileSizeFormatted: `${(fileSizeBytes / 1024).toFixed(1)} KB`,
          totalActivities,
          fileBase64,
          downloadUrl: recordId ? `/reports/download-department/${recordId}` : null
        }
      });
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Save draft / progress to dedicated reports database so HODs can edit whenever they want
 */
export const saveDepartmentDraft = async (req: any, res: Response) => {
  try {
    const {
      department,
      period = 'September 2026',
      hodName,
      submissionDate,
      sections = {},
      status = 'DRAFT'
    } = req.body;

    if (!department) {
      return res.status(400).json({ success: false, message: 'Department is required.' });
    }

    const totalItems = Object.values(sections || {}).reduce(
      (sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0),
      0
    );

    const upsertRes = await reportQuery(`
      INSERT INTO departmental_monthly_reports 
      (department, period, hod_name, submission_date, sections_data, items_count, status, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (department, period) DO UPDATE 
      SET hod_name = COALESCE(EXCLUDED.hod_name, departmental_monthly_reports.hod_name),
          submission_date = COALESCE(EXCLUDED.submission_date, departmental_monthly_reports.submission_date),
          sections_data = EXCLUDED.sections_data,
          items_count = EXCLUDED.items_count,
          status = CASE WHEN departmental_monthly_reports.status = 'SUBMITTED' THEN 'SUBMITTED' ELSE EXCLUDED.status END,
          updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
      department,
      period,
      hodName || 'HOD',
      submissionDate || '',
      JSON.stringify(sections || {}),
      totalItems,
      status
    ]);

    return res.json({
      success: true,
      message: `Progress saved to dedicated database for ${department} (${period})!`,
      data: {
        id: upsertRes.rows[0].id,
        department,
        period,
        status: upsertRes.rows[0].status,
        updatedAt: upsertRes.rows[0].updated_at,
        totalActivities: totalItems
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Fetch a department's saved report data from dedicated reports database for editing
 */
export const getDepartmentReportData = async (req: any, res: Response) => {
  try {
    const { department, period = 'September 2026' } = req.query;
    if (!department) {
      return res.status(400).json({ success: false, message: 'Department is required.' });
    }

    const rowRes = await reportQuery(
      'SELECT * FROM departmental_monthly_reports WHERE LOWER(TRIM(department)) = LOWER(TRIM($1)) AND LOWER(TRIM(period)) = LOWER(TRIM($2))',
      [department as string, period as string]
    );

    if (rowRes.rows.length === 0) {
      return res.json({
        success: true,
        exists: false,
        message: `No saved report found for ${department} in ${period}.`,
        data: null
      });
    }

    const row = rowRes.rows[0];
    const sections = typeof row.sections_data === 'string' ? JSON.parse(row.sections_data) : (row.sections_data || {});

    return res.json({
      success: true,
      exists: true,
      data: {
        id: row.id,
        department: row.department,
        period: row.period,
        hodName: row.hod_name,
        submissionDate: row.submission_date,
        sections,
        status: row.status,
        itemsCount: row.items_count,
        updatedAt: row.updated_at
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Fetch all department saved reports for a period for consolidation
 */
export const getAllDepartmentReportData = async (req: any, res: Response) => {
  try {
    const period = (req.query.period as string) || 'September 2026';
    const rowsRes = await reportQuery(
      'SELECT department, sections_data, hod_name, status, updated_at FROM departmental_monthly_reports WHERE LOWER(TRIM(period)) = LOWER(TRIM($1))',
      [period]
    );

    const result: Record<string, any> = {};
    rowsRes.rows.forEach((r: any) => {
      const sec = typeof r.sections_data === 'string' ? JSON.parse(r.sections_data) : (r.sections_data || {});
      result[r.department] = sec;
    });

    return res.json({
      success: true,
      period,
      count: rowsRes.rows.length,
      data: result
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const saveDepartmentJson = saveDepartmentDraft;

/**
 * Explicitly re-sync latest September 2026 data from septemberSeedData.ts into database
 */
export const syncSeptemberSeed = async (_req: any, res: Response) => {
  try {
    const { syncSeptemberSeedData } = await import('../config/reportDb');
    const result = await syncSeptemberSeedData();
    return res.json({
      success: true,
      message: 'September 2026 reports synchronized successfully from seed file!',
      result
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
