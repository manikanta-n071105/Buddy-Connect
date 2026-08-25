import { Response } from 'express';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../types';

const ensureChatTables = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS mentor_conversations (
        id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
        junior_id VARCHAR(36) NOT NULL REFERENCES juniors(id) ON DELETE CASCADE,
        senior_id VARCHAR(36) NOT NULL REFERENCES seniors(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(junior_id, senior_id)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS mentor_messages (
        id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
        conversation_id VARCHAR(36) NOT NULL REFERENCES mentor_conversations(id) ON DELETE CASCADE,
        sender_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS director_conversations (
        id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
        junior_id VARCHAR(36) NOT NULL REFERENCES juniors(id) ON DELETE CASCADE,
        director_id VARCHAR(36) NOT NULL REFERENCES directors(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(junior_id, director_id)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS director_messages (
        id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
        conversation_id VARCHAR(36) NOT NULL REFERENCES director_conversations(id) ON DELETE CASCADE,
        sender_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS faculty_conversations (
        id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
        junior_id VARCHAR(36) NOT NULL REFERENCES juniors(id) ON DELETE CASCADE,
        faculty_id VARCHAR(36) NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(junior_id, faculty_id)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS faculty_messages (
        id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
        conversation_id VARCHAR(36) NOT NULL REFERENCES faculty_conversations(id) ON DELETE CASCADE,
        sender_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

// Get List of Conversations / Contacts for Chat Page
export const getConversationsList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureChatTables();
    const userRole = req.user!.role;
    const chatType = (req.query.chatType as string) || (userRole === 'FACULTY' ? 'FACULTY' : userRole === 'DIRECTOR' ? 'DIRECTOR' : 'SENIOR');

    if (userRole === 'DIRECTOR' || chatType === 'DIRECTOR') {
      if (userRole === 'JUNIOR') {
        // Fetch Department Director(s) for this Junior
        const dirRes = await query(
          `SELECT d.id as director_id, u.id as user_id, u.name, u.email, d.director_code, d.department
           FROM directors d
           JOIN users u ON d.user_id = u.id
           ORDER BY u.name ASC`
        );
        return res.json({ success: true, data: dirRes.rows });
      } else if (userRole === 'DIRECTOR') {
        if (!req.user!.directorId) {
          return res.status(400).json({ success: false, message: 'Director record not found', code: 'NOT_FOUND' });
        }

        // Fetch all Juniors under Seniors belonging to this Director
        const junRes = await query(
          `SELECT j.id as junior_id, u.id as user_id, u.name, u.email, j.register_number, j.batch, j.year, j.department
           FROM juniors j
           JOIN users u ON j.user_id = u.id
           JOIN seniors s ON j.senior_id = s.id
           WHERE s.director_id = $1
           ORDER BY u.name ASC`,
          [req.user!.directorId]
        );
        return res.json({ success: true, data: junRes.rows });
      }
    }

    if (userRole === 'FACULTY' || chatType === 'FACULTY') {
      if (userRole === 'JUNIOR') {
        // Fetch Assigned Faculty Mentor for this Junior
        const facRes = await query(
          `SELECT f.id as faculty_id, u.id as user_id, u.name, u.email, f.faculty_code, f.department
           FROM juniors j
           JOIN faculty f ON j.faculty_id = f.id
           JOIN users u ON f.user_id = u.id
           WHERE j.user_id = $1 OR j.id = $2`,
          [req.user!.id, req.user!.juniorId || '']
        );
        return res.json({ success: true, data: facRes.rows });
      } else {
        let facultyId = req.user!.facultyId;
        if (!facultyId) {
          const fRes = await query(`SELECT id FROM faculty WHERE user_id = $1`, [req.user!.id]);
          if (fRes.rowCount! > 0) facultyId = fRes.rows[0].id;
        }
        if (!facultyId && req.user!.role === 'SUPER_ADMIN') {
          const firstFac = await query(`SELECT id FROM faculty LIMIT 1`);
          if (firstFac.rowCount! > 0) facultyId = firstFac.rows[0].id;
        }

        if (!facultyId) {
          return res.status(400).json({ success: false, message: 'Faculty record not found', code: 'NOT_FOUND' });
        }
        const junRes = await query(
          `SELECT j.id as junior_id, u.id as user_id, u.name, u.email, j.register_number, j.batch, j.year, j.department
           FROM juniors j
           JOIN users u ON j.user_id = u.id
           WHERE j.faculty_id = $1
           ORDER BY u.name ASC`,
          [facultyId]
        );
        return res.json({ success: true, data: junRes.rows });
      }
    }

    if (userRole === 'SENIOR') {
      if (!req.user!.seniorId) {
        return res.status(400).json({ success: false, message: 'Senior record not found', code: 'NOT_FOUND' });
      }

      // Fetch all assigned juniors for this Senior mentor
      const junRes = await query(
        `SELECT j.id as junior_id, u.id as user_id, u.name, u.email, j.register_number, j.batch, j.year
         FROM juniors j
         JOIN users u ON j.user_id = u.id
         WHERE j.senior_id = $1
         ORDER BY u.name ASC`,
        [req.user!.seniorId]
      );

      return res.json({ success: true, data: junRes.rows });
    } else if (userRole === 'JUNIOR') {
      if (!req.user!.juniorId) {
        return res.status(400).json({ success: false, message: 'Junior record not found', code: 'NOT_FOUND' });
      }

      const senRes = await query(
        `SELECT s.id as senior_id, u.id as user_id, u.name, u.email, s.senior_code, s.department
         FROM juniors j
         JOIN seniors s ON j.senior_id = s.id
         JOIN users u ON s.user_id = u.id
         WHERE j.id = $1`,
        [req.user!.juniorId]
      );

      return res.json({ success: true, data: senRes.rows });
    } else {
      return res.json({ success: true, data: [] });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Get Conversation & Messages (Supports Senior, Director & Faculty Chat)
export const getConversation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureChatTables();

    const chatType = (req.query.chatType as string) || (req.user!.role === 'FACULTY' ? 'FACULTY' : req.user!.role === 'DIRECTOR' ? 'DIRECTOR' : 'SENIOR');
    const isDirectorChat = chatType === 'DIRECTOR' || req.query.directorId !== undefined || req.user!.role === 'DIRECTOR';
    const isFacultyChat = chatType === 'FACULTY' || req.query.facultyId !== undefined || req.user!.role === 'FACULTY';

    // 1. DIRECTOR CHAT
    if (isDirectorChat) {
      let juniorId: string | undefined;
      let directorId: string | undefined;

      if (req.user!.role === 'JUNIOR') {
        juniorId = req.user!.juniorId;
        directorId = req.query.directorId as string || req.user!.directorId;
        if (!directorId) {
          const firstDir = await query(`SELECT id FROM directors LIMIT 1`);
          if (firstDir.rowCount! > 0) directorId = firstDir.rows[0].id;
        }
      } else if (req.user!.role === 'DIRECTOR') {
        directorId = req.user!.directorId;
        juniorId = req.query.juniorId as string;
        if (!juniorId && directorId) {
          const firstJun = await query(
            `SELECT j.id FROM juniors j JOIN seniors s ON j.senior_id = s.id WHERE s.director_id = $1 LIMIT 1`,
            [directorId]
          );
          if (firstJun.rowCount! > 0) juniorId = firstJun.rows[0].id;
        }
      } else {
        juniorId = req.query.juniorId as string;
        directorId = req.query.directorId as string;
      }

      if (juniorId) {
        const checkJ = await query(`SELECT id FROM juniors WHERE id = $1 OR user_id = $1`, [juniorId]);
        if (checkJ.rowCount! > 0) juniorId = checkJ.rows[0].id;
      }
      if (directorId) {
        const checkD = await query(`SELECT id FROM directors WHERE id = $1 OR user_id = $1`, [directorId]);
        if (checkD.rowCount! > 0) directorId = checkD.rows[0].id;
      }

      if (!juniorId || !directorId) {
        return res.status(400).json({
          success: false,
          message: 'No active Junior or Director conversation partner found.',
          code: 'NO_PARTNER'
        });
      }

      // Get or Create director conversation
      let convRes = await query(
        `SELECT * FROM director_conversations WHERE junior_id = $1 AND director_id = $2`,
        [juniorId, directorId]
      );

      if (convRes.rowCount === 0) {
        convRes = await query(
          `INSERT INTO director_conversations (junior_id, director_id) VALUES ($1, $2) RETURNING *`,
          [juniorId, directorId]
        );
      }

      const conversation = convRes.rows[0];

      let partnerInfo: any = {};
      if (req.user!.role === 'JUNIOR') {
        const pRes = await query(
          `SELECT u.name, u.email, d.director_code, d.department
           FROM directors d JOIN users u ON d.user_id = u.id WHERE d.id = $1`,
          [directorId]
        );
        partnerInfo = pRes.rows[0] || {};
      } else {
        const pRes = await query(
          `SELECT u.name, u.email, j.register_number, j.batch, j.year
           FROM juniors j JOIN users u ON j.user_id = u.id WHERE j.id = $1`,
          [juniorId]
        );
        partnerInfo = pRes.rows[0] || {};
      }

      const messagesRes = await query(
        `SELECT m.*, u.name as sender_name, u.role as sender_role
         FROM director_messages m JOIN users u ON m.sender_id = u.id
         WHERE m.conversation_id = $1 ORDER BY m.created_at ASC`,
        [conversation.id]
      );

      await query(
        `UPDATE director_messages SET is_read = true WHERE conversation_id = $1 AND sender_id != $2`,
        [conversation.id, req.user!.id]
      );

      return res.json({
        success: true,
        data: {
          conversation,
          partnerInfo,
          activeJuniorId: juniorId,
          activeDirectorId: directorId,
          chatType: 'DIRECTOR',
          messages: messagesRes.rows
        }
      });
    }

    // 2. FACULTY CHAT
    if (isFacultyChat) {
      let juniorId: string | undefined;
      let facultyId: string | undefined;

      if (req.user!.role === 'JUNIOR') {
        const jRes = await query(`SELECT id, faculty_id FROM juniors WHERE user_id = $1 OR id = $2`, [req.user!.id, req.user!.juniorId || '']);
        if (jRes.rowCount! > 0) {
          juniorId = jRes.rows[0].id;
          facultyId = req.query.facultyId as string || jRes.rows[0].faculty_id;
        }
      } else if (req.user!.role === 'FACULTY') {
        const fRes = await query(`SELECT id FROM faculty WHERE user_id = $1 OR id = $2`, [req.user!.id, req.user!.facultyId || '']);
        if (fRes.rowCount! > 0) facultyId = fRes.rows[0].id;

        juniorId = req.query.juniorId as string;
        if (!juniorId && facultyId) {
          const firstJun = await query(
            `SELECT id FROM juniors WHERE faculty_id = $1 LIMIT 1`,
            [facultyId]
          );
          if (firstJun.rowCount! > 0) juniorId = firstJun.rows[0].id;
        }
      } else {
        juniorId = req.query.juniorId as string;
        facultyId = req.query.facultyId as string;
      }

      if (juniorId) {
        const checkJ = await query(`SELECT id FROM juniors WHERE id = $1 OR user_id = $1`, [juniorId]);
        if (checkJ.rowCount! > 0) juniorId = checkJ.rows[0].id;
      }
      if (facultyId) {
        const checkF = await query(`SELECT id FROM faculty WHERE id = $1 OR user_id = $1`, [facultyId]);
        if (checkF.rowCount! > 0) facultyId = checkF.rows[0].id;
      }

      if (!juniorId || !facultyId) {
        return res.status(400).json({
          success: false,
          message: 'No active Junior or Faculty conversation partner assigned.',
          code: 'NO_PARTNER'
        });
      }

      // Get or Create faculty conversation
      let convRes = await query(
        `SELECT * FROM faculty_conversations WHERE junior_id = $1 AND faculty_id = $2`,
        [juniorId, facultyId]
      );

      if (convRes.rowCount === 0) {
        convRes = await query(
          `INSERT INTO faculty_conversations (junior_id, faculty_id) VALUES ($1, $2) RETURNING *`,
          [juniorId, facultyId]
        );
      }

      const conversation = convRes.rows[0];

      let partnerInfo: any = {};
      if (req.user!.role === 'JUNIOR') {
        const pRes = await query(
          `SELECT u.name, u.email, f.faculty_code, f.department
           FROM faculty f JOIN users u ON f.user_id = u.id WHERE f.id = $1`,
          [facultyId]
        );
        partnerInfo = pRes.rows[0] || {};
      } else {
        const pRes = await query(
          `SELECT u.name, u.email, j.register_number, j.batch, j.year
           FROM juniors j JOIN users u ON j.user_id = u.id WHERE j.id = $1`,
          [juniorId]
        );
        partnerInfo = pRes.rows[0] || {};
      }

      const messagesRes = await query(
        `SELECT m.*, u.name as sender_name, u.role as sender_role
         FROM faculty_messages m JOIN users u ON m.sender_id = u.id
         WHERE m.conversation_id = $1 ORDER BY m.created_at ASC`,
        [conversation.id]
      );

      await query(
        `UPDATE faculty_messages SET is_read = true WHERE conversation_id = $1 AND sender_id != $2`,
        [conversation.id, req.user!.id]
      );

      return res.json({
        success: true,
        data: {
          conversation,
          partnerInfo,
          activeJuniorId: juniorId,
          activeFacultyId: facultyId,
          chatType: 'FACULTY',
          messages: messagesRes.rows
        }
      });
    }

    // 3. SENIOR CHAT (DEFAULT)
    let juniorId: string | undefined;
    let seniorId: string | undefined;

    if (req.user!.role === 'JUNIOR') {
      juniorId = req.user!.juniorId;
      seniorId = req.user!.seniorId;

      if (!seniorId) {
        const jRes = await query(`SELECT senior_id FROM juniors WHERE user_id = $1`, [req.user!.id]);
        if (jRes.rowCount! > 0) seniorId = jRes.rows[0].senior_id;
      }
    } else if (req.user!.role === 'SENIOR') {
      seniorId = req.user!.seniorId;
      if (!seniorId) {
        const sRes = await query(`SELECT id FROM seniors WHERE user_id = $1`, [req.user!.id]);
        if (sRes.rowCount! > 0) seniorId = sRes.rows[0].id;
      }

      juniorId = req.query.juniorId as string;

      if (!juniorId && seniorId) {
        const firstJun = await query(`SELECT id FROM juniors WHERE senior_id = $1 LIMIT 1`, [seniorId]);
        if (firstJun.rowCount! > 0) {
          juniorId = firstJun.rows[0].id;
        }
      }
    } else if (['SUPER_ADMIN', 'ADMIN'].includes(req.user!.role)) {
      juniorId = req.query.juniorId as string;
      seniorId = req.query.seniorId as string;
    }

    if (!juniorId || !seniorId) {
      return res.status(400).json({
        success: false,
        message: 'No assigned mentor/student conversation partner found.',
        code: 'NO_PARTNER'
      });
    }

    // Get or Create conversation
    let convRes = await query(
      `SELECT * FROM mentor_conversations WHERE junior_id = $1 AND senior_id = $2`,
      [juniorId, seniorId]
    );

    if (convRes.rowCount === 0) {
      convRes = await query(
        `INSERT INTO mentor_conversations (junior_id, senior_id) VALUES ($1, $2) RETURNING *`,
        [juniorId, seniorId]
      );
    }

    const conversation = convRes.rows[0];

    let partnerInfo: any = {};
    if (req.user!.role === 'JUNIOR') {
      const pRes = await query(
        `SELECT u.name, u.email, s.senior_code, s.department
         FROM seniors s JOIN users u ON s.user_id = u.id WHERE s.id = $1`,
        [seniorId]
      );
      partnerInfo = pRes.rows[0] || {};
    } else {
      const pRes = await query(
        `SELECT u.name, u.email, j.register_number, j.batch, j.year
         FROM juniors j JOIN users u ON j.user_id = u.id WHERE j.id = $1`,
        [juniorId]
      );
      partnerInfo = pRes.rows[0] || {};
    }

    const messagesRes = await query(
      `SELECT m.*, u.name as sender_name, u.role as sender_role
       FROM mentor_messages m JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = $1 ORDER BY m.created_at ASC`,
      [conversation.id]
    );

    await query(
      `UPDATE mentor_messages SET is_read = true WHERE conversation_id = $1 AND sender_id != $2`,
      [conversation.id, req.user!.id]
    );

    res.json({
      success: true,
      data: {
        conversation,
        partnerInfo,
        activeJuniorId: juniorId,
        activeSeniorId: seniorId,
        chatType: 'SENIOR',
        messages: messagesRes.rows
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Send Message in Conversation
export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  const { conversationId, content, chatType } = req.body;
  if (!conversationId || !content) {
    return res.status(400).json({ success: false, message: 'Conversation ID and message content required', code: 'INVALID_INPUT' });
  }

  try {
    await ensureChatTables();

    // Check if conversationId belongs to director_conversations
    const dirConvCheck = await query(`SELECT id FROM director_conversations WHERE id = $1`, [conversationId]);
    if (dirConvCheck.rowCount! > 0 || chatType === 'DIRECTOR') {
      const msgRes = await query(
        `INSERT INTO director_messages (conversation_id, sender_id, content)
         VALUES ($1, $2, $3) RETURNING *`,
        [conversationId, req.user!.id, content.trim()]
      );

      await query(`UPDATE director_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [conversationId]);

      return res.status(201).json({ success: true, data: msgRes.rows[0] });
    }

    // Check if conversationId belongs to faculty_conversations
    const facConvCheck = await query(`SELECT id FROM faculty_conversations WHERE id = $1`, [conversationId]);
    if (facConvCheck.rowCount! > 0 || chatType === 'FACULTY') {
      const msgRes = await query(
        `INSERT INTO faculty_messages (conversation_id, sender_id, content)
         VALUES ($1, $2, $3) RETURNING *`,
        [conversationId, req.user!.id, content.trim()]
      );

      await query(`UPDATE faculty_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [conversationId]);

      return res.status(201).json({ success: true, data: msgRes.rows[0] });
    }

    // Default: Senior Mentor Messages
    const msgRes = await query(
      `INSERT INTO mentor_messages (conversation_id, sender_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [conversationId, req.user!.id, content.trim()]
    );

    await query(`UPDATE mentor_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [conversationId]);

    res.status(201).json({ success: true, data: msgRes.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};
