import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { query, executeTransaction } from '../config/db';

export const ensureQuizTables = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS quizzes (
          id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
          faculty_id VARCHAR(36) NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          department VARCHAR(100) NOT NULL,
          year VARCHAR(50),
          duration_minutes INT DEFAULT 15,
          status VARCHAR(30) DEFAULT 'ACTIVE',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS quiz_questions (
          id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
          quiz_id VARCHAR(36) NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
          question_text TEXT NOT NULL,
          option_a TEXT NOT NULL,
          option_b TEXT NOT NULL,
          option_c TEXT NOT NULL,
          option_d TEXT NOT NULL,
          correct_option VARCHAR(10) NOT NULL,
          points INT DEFAULT 1,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS quiz_submissions (
          id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
          quiz_id VARCHAR(36) NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
          junior_id VARCHAR(36) NOT NULL REFERENCES juniors(id) ON DELETE CASCADE,
          score INT NOT NULL DEFAULT 0,
          total_points INT NOT NULL DEFAULT 0,
          percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
          answers_json JSONB,
          is_invalidated BOOLEAN DEFAULT false,
          tab_switches INT DEFAULT 0,
          violation_reason TEXT,
          submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(quiz_id, junior_id)
      );

      ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS is_invalidated BOOLEAN DEFAULT false;
      ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS tab_switches INT DEFAULT 0;
      ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS violation_reason TEXT;
    `);
  } catch (err) {
    console.error('Quiz tables migration notice:', err);
  }
};

// Create Quiz (Faculty uploads spreadsheet data / questions array)
export const createQuiz = async (req: AuthenticatedRequest, res: Response) => {
  const { title, description, durationMinutes, department: reqDept, year: reqYear, questions } = req.body;

  if (!title || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Title and at least one quiz question are required.',
      code: 'INVALID_INPUT'
    });
  }

  try {
    let facultyId = req.user!.facultyId;
    let facultyDept = reqDept || req.user!.department || 'CSE-A';
    let facultyYear = reqYear || req.user!.year || '3rd Year';

    if (req.user!.role === 'FACULTY' && !facultyId) {
      const fRes = await query(`SELECT id, department, year FROM faculty WHERE user_id = $1`, [req.user!.id]);
      if (fRes.rowCount! > 0) {
        facultyId = fRes.rows[0].id;
        if (!reqDept && fRes.rows[0].department) facultyDept = fRes.rows[0].department;
        if (!reqYear && fRes.rows[0].year) facultyYear = fRes.rows[0].year;
      }
    }

    if (!facultyId) {
      const anyFac = await query(`SELECT id FROM faculty LIMIT 1`);
      if (anyFac.rowCount! > 0) facultyId = anyFac.rows[0].id;
    }

    if (!facultyId) {
      return res.status(400).json({
        success: false,
        message: 'Faculty account required to create quiz.',
        code: 'NO_FACULTY'
      });
    }

    const duration = durationMinutes ? parseInt(durationMinutes) : 15;

    const result = await executeTransaction(async (client) => {
      const qRes = await client.query(
        `INSERT INTO quizzes (faculty_id, title, description, department, year, duration_minutes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, faculty_id, title, description, department, year, duration_minutes, status, created_at`,
        [facultyId, title.trim(), description ? description.trim() : null, facultyDept.trim(), facultyYear ? facultyYear.trim() : null, duration]
      );
      const quiz = qRes.rows[0];

      const insertedQuestions = [];
      for (const q of questions) {
        const text = q.questionText || q.question || q['Question'] || '';
        const opA = q.optionA || q.option_a || q['Option A'] || '';
        const opB = q.optionB || q.option_b || q['Option B'] || '';
        const opC = q.optionC || q.option_c || q['Option C'] || '';
        const opD = q.optionD || q.option_d || q['Option D'] || '';
        let correct = String(q.correctOption || q.correct_option || q['Correct Option'] || 'A').toUpperCase().trim();

        if (correct.startsWith('OPTION_')) correct = correct.replace('OPTION_', '');
        if (correct.startsWith('OPTION ')) correct = correct.replace('OPTION ', '');
        if (!['A', 'B', 'C', 'D'].includes(correct)) correct = 'A';

        if (text && opA && opB) {
          const questRes = await client.query(
            `INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, points)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
             RETURNING id, question_text, option_a, option_b, option_c, option_d, correct_option, points`,
            [quiz.id, text.trim(), opA.trim(), opB.trim(), opC ? opC.trim() : '-', opD ? opD.trim() : '-', correct]
          );
          insertedQuestions.push(questRes.rows[0]);
        }
      }

      return { quiz, questionsCount: insertedQuestions.length, questions: insertedQuestions };
    });

    res.status(201).json({
      success: true,
      message: `Quiz "${title}" created successfully with ${result.questionsCount} questions!`,
      data: result
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Get Quizzes (Scoped for Faculty & Students)
export const getQuizzes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureQuizTables();

    if (req.user!.role === 'FACULTY' || req.user!.role === 'SUPER_ADMIN' || req.user!.role === 'ADMIN' || req.user!.role === 'MENTOR') {
      let facultyId = req.user!.facultyId;
      if (!facultyId && req.user!.role === 'FACULTY') {
        const fRes = await query(`SELECT id FROM faculty WHERE user_id = $1`, [req.user!.id]);
        if (fRes.rowCount! > 0) facultyId = fRes.rows[0].id;
      }

      let sql = `
        SELECT q.id, q.title, q.description, q.department, q.year, q.duration_minutes, q.status, q.created_at,
               uf.name as faculty_name,
               (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) as total_questions,
               (SELECT COUNT(*) FROM quiz_submissions qs WHERE qs.quiz_id = q.id) as total_submissions,
               (SELECT COALESCE(AVG(qs.percentage), 0) FROM quiz_submissions qs WHERE qs.quiz_id = q.id) as avg_score
        FROM quizzes q
        JOIN faculty f ON q.faculty_id = f.id
        JOIN users uf ON f.user_id = uf.id
      `;
      const params: any[] = [];

      if (req.user!.role === 'FACULTY' && facultyId) {
        sql += ` WHERE q.faculty_id = $1`;
        params.push(facultyId);
      }

      sql += ` ORDER BY q.created_at DESC`;
      const result = await query(sql, params);
      return res.json({ success: true, data: result.rows });
    } else {
      // Junior Student view
      let juniorId = req.user!.juniorId;
      let junDept = req.user!.department;
      let junYear = req.user!.year;

      if (!juniorId) {
        const jRes = await query(`SELECT id, department, year FROM juniors WHERE user_id = $1`, [req.user!.id]);
        if (jRes.rowCount! > 0) {
          juniorId = jRes.rows[0].id;
          junDept = jRes.rows[0].department;
          junYear = jRes.rows[0].year;
        }
      }

      const sql = `
        SELECT q.id, q.title, q.description, q.department, q.year, q.duration_minutes, q.status, q.created_at,
               uf.name as faculty_name,
               (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) as total_questions,
               qs.id as submission_id, qs.score, qs.total_points, qs.percentage, qs.submitted_at
        FROM quizzes q
        JOIN faculty f ON q.faculty_id = f.id
        JOIN users uf ON f.user_id = uf.id
        LEFT JOIN quiz_submissions qs ON q.id = qs.quiz_id AND qs.junior_id = $1
        WHERE q.status = 'ACTIVE'
          AND (q.department = $2 OR q.department ILIKE $3)
          AND (q.year IS NULL OR q.year = '' OR q.year = 'All Years' OR q.year = $4 OR q.year ILIKE $5)
        ORDER BY q.created_at DESC
      `;
      const params = [juniorId || '', junDept || '', `%${junDept || ''}%`, junYear || '', `%${junYear || ''}%`].map(v => v || '');
      const result = await query(sql, params);
      return res.json({ success: true, data: result.rows });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Get Quiz Details & Questions by ID
export const getQuizById = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    await ensureQuizTables();

    const qRes = await query(
      `SELECT q.id, q.title, q.description, q.department, q.year, q.duration_minutes, q.status, q.created_at,
              uf.name as faculty_name
       FROM quizzes q
       JOIN faculty f ON q.faculty_id = f.id
       JOIN users uf ON f.user_id = uf.id
       WHERE q.id = $1`,
      [id]
    );

    if (qRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Quiz not found', code: 'NOT_FOUND' });
    }

    const quiz = qRes.rows[0];

    const isStudent = req.user!.role === 'JUNIOR';
    const questionsRes = await query(
      `SELECT id, question_text, option_a, option_b, option_c, option_d, points
              ${isStudent ? '' : ', correct_option'}
       FROM quiz_questions
       WHERE quiz_id = $1
       ORDER BY created_at ASC`,
      [id]
    );

    let submission = null;
    if (isStudent && req.user!.juniorId) {
      const subRes = await query(
        `SELECT id, score, total_points, percentage, answers_json, submitted_at
         FROM quiz_submissions
         WHERE quiz_id = $1 AND junior_id = $2`,
        [id, req.user!.juniorId]
      );
      if (subRes.rowCount! > 0) {
        submission = subRes.rows[0];
      }
    }

    res.json({
      success: true,
      data: {
        quiz,
        questions: questionsRes.rows,
        submission
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Submit Quiz (Student Auto-Grading)
export const submitQuiz = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { answers, isViolation, tabSwitches, violationReason } = req.body; // { questionId: 'A' | 'B' | 'C' | 'D' }

  try {
    await ensureQuizTables();

    let juniorId = req.user!.juniorId;
    if (!juniorId) {
      const jRes = await query(`SELECT id FROM juniors WHERE user_id = $1`, [req.user!.id]);
      if (jRes.rowCount! > 0) juniorId = jRes.rows[0].id;
    }

    if (!juniorId) {
      return res.status(400).json({ success: false, message: 'Student record required to submit quiz', code: 'NO_STUDENT' });
    }

    // Check existing submission
    const existingSub = await query(`SELECT id FROM quiz_submissions WHERE quiz_id = $1 AND junior_id = $2`, [id, juniorId]);
    if (existingSub.rowCount! > 0) {
      return res.status(400).json({ success: false, message: 'You have already submitted this quiz.', code: 'ALREADY_SUBMITTED' });
    }

    // Fetch questions & correct answers
    const qRes = await query(`SELECT id, correct_option, points FROM quiz_questions WHERE quiz_id = $1`, [id]);
    if (qRes.rowCount === 0) {
      return res.status(400).json({ success: false, message: 'Quiz has no questions', code: 'NO_QUESTIONS' });
    }

    let score = 0;
    let totalPoints = 0;

    for (const q of qRes.rows) {
      totalPoints += q.points || 1;
      const studentAns = String(answers?.[q.id] || '').toUpperCase().trim();
      if (studentAns === String(q.correct_option).toUpperCase().trim()) {
        score += q.points || 1;
      }
    }

    const percentage = totalPoints > 0 ? parseFloat(((score / totalPoints) * 100).toFixed(2)) : 0;
    const isInvalidated = Boolean(isViolation);

    const subRes = await query(
      `INSERT INTO quiz_submissions (quiz_id, junior_id, score, total_points, percentage, answers_json, is_invalidated, tab_switches, violation_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, quiz_id, junior_id, score, total_points, percentage, is_invalidated, tab_switches, violation_reason, submitted_at`,
      [id, juniorId, score, totalPoints, percentage, JSON.stringify(answers || {}), isInvalidated, tabSwitches || 0, violationReason || null]
    );

    res.status(201).json({
      success: true,
      message: `Quiz submitted successfully! Score: ${score}/${totalPoints} (${percentage}%)`,
      data: subRes.rows[0]
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Get Quiz Analytics & Performance Breakdown for Faculty
export const getQuizResults = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    await ensureQuizTables();

    // 1. Fetch Quiz Details
    const qRes = await query(`SELECT * FROM quizzes WHERE id = $1`, [id]);
    if (qRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Quiz not found', code: 'NOT_FOUND' });
    }
    const quiz = qRes.rows[0];

    // 2. Fetch Total Class Roster (Assigned Students)
    const rosterRes = await query(
      `SELECT j.id as junior_id, j.register_number, j.department, j.year, j.batch, u.name, u.email
       FROM juniors j
       JOIN users u ON j.user_id = u.id
       WHERE j.department = $1 AND (j.year = $2 OR $2 IS NULL OR $2 = '' OR $2 = 'All Years' OR j.year ILIKE '%' || $2 || '%')
       ORDER BY u.name ASC`,
      [quiz.department, quiz.year]
    );
    const assignedStudents = rosterRes.rows;

    // 3. Fetch Submissions
    const subRes = await query(
      `SELECT qs.id as submission_id, qs.junior_id, qs.score, qs.total_points, qs.percentage,
              qs.is_invalidated, qs.tab_switches, qs.violation_reason, qs.submitted_at,
              u.name as student_name, j.register_number
       FROM quiz_submissions qs
       JOIN juniors j ON qs.junior_id = j.id
       JOIN users u ON j.user_id = u.id
       WHERE qs.quiz_id = $1
       ORDER BY qs.percentage DESC, u.name ASC`,
      [id]
    );
    const submissions = subRes.rows;

    // 4. Calculate Performance Analytics & Score Distribution Ranges
    const totalAssigned = assignedStudents.length || submissions.length;
    const completedCount = submissions.length;
    const pendingCount = Math.max(0, totalAssigned - completedCount);

    const percentages = submissions.map(s => parseFloat(s.percentage));
    const avgPercentage = percentages.length > 0
      ? parseFloat((percentages.reduce((a, b) => a + b, 0) / percentages.length).toFixed(2))
      : 0;

    const highestScore = percentages.length > 0 ? Math.max(...percentages) : 0;
    const lowestScore = percentages.length > 0 ? Math.min(...percentages) : 0;
    const passCount = submissions.filter(s => parseFloat(s.percentage) >= 50 && !s.is_invalidated).length;

    // Score distribution buckets for performance graph
    const scoreRanges = {
      excellent: percentages.filter(p => p >= 90).length,   // 90% - 100%
      good: percentages.filter(p => p >= 75 && p < 90).length, // 75% - 89%
      average: percentages.filter(p => p >= 50 && p < 75).length, // 50% - 74%
      needsImprovement: percentages.filter(p => p < 50).length   // < 50%
    };

    // Full Student Performance Roster with submission status
    const studentPerformanceRoster = assignedStudents.map(student => {
      const sub = submissions.find(s => s.junior_id === student.junior_id);
      return {
        junior_id: student.junior_id,
        register_number: student.register_number,
        name: student.name,
        email: student.email,
        department: student.department,
        year: student.year,
        status: sub ? (sub.is_invalidated ? 'INVALIDATED' : 'COMPLETED') : 'PENDING',
        score: sub ? sub.score : 0,
        total_points: sub ? sub.total_points : 0,
        percentage: sub ? parseFloat(sub.percentage) : 0,
        is_invalidated: sub ? Boolean(sub.is_invalidated) : false,
        tab_switches: sub ? sub.tab_switches : 0,
        violation_reason: sub ? sub.violation_reason : null,
        submitted_at: sub ? sub.submitted_at : null
      };
    });

    const invalidatedCount = submissions.filter(s => Boolean(s.is_invalidated)).length;

    res.json({
      success: true,
      data: {
        quiz,
        summary: {
          totalAssigned,
          completedCount,
          pendingCount,
          invalidatedCount,
          avgPercentage,
          highestScore,
          lowestScore,
          passCount,
          passRatePercentage: completedCount > 0 ? parseFloat(((passCount / completedCount) * 100).toFixed(2)) : 0
        },
        scoreRanges,
        submissions,
        roster: studentPerformanceRoster
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Re-conduct Quiz (Faculty resets submission for a single student or for all students)
export const reconductQuiz = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { juniorId } = req.body;

  try {
    if (juniorId) {
      // Reconduct for single student
      await query(
        `DELETE FROM quiz_submissions WHERE quiz_id = $1 AND junior_id = $2`,
        [id, juniorId]
      );
      return res.json({
        success: true,
        message: 'Quiz attempt reset successfully. Student can now retake the quiz.',
        code: 'QUIZ_RECONDUCTED_STUDENT'
      });
    } else {
      // Reconduct for ALL assigned students in this quiz
      await query(
        `DELETE FROM quiz_submissions WHERE quiz_id = $1`,
        [id]
      );
      return res.json({
        success: true,
        message: 'Quiz reconducted for all students. Previous attempts cleared.',
        code: 'QUIZ_RECONDUCTED_ALL'
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};
