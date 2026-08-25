import cron from 'node-cron';
import { query } from '../config/db';
import { logger } from '../utils/logger';

export const startSlaCronJob = () => {
  // Run SLA Escalation check every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    logger.info('Running background SLA Escalation Job...');

    try {
      // Get SLA Escalation thresholds from settings
      const stdHoursRes = await query(`SELECT value FROM system_settings WHERE key = 'ISSUE_ESCALATION_HOURS'`);
      const critHoursRes = await query(`SELECT value FROM system_settings WHERE key = 'CRITICAL_ISSUE_ESCALATION_HOURS'`);

      const standardHours = parseInt(stdHoursRes.rows[0]?.value || '24');
      const criticalHours = parseInt(critHoursRes.rows[0]?.value || '6');

      // Find standard issues pending longer than standardHours
      const stdEscalationRes = await query(
        `SELECT i.id, i.issue_number, i.title, i.priority, i.director_id, d.user_id as director_user_id
         FROM issues i
         JOIN directors d ON i.director_id = d.id
         WHERE i.status IN ('OPEN', 'UNDER_REVIEW', 'IN_PROGRESS')
           AND i.priority != 'CRITICAL'
           AND i.created_at < NOW() - INTERVAL '1 hour' * $1`,
        [standardHours]
      );

      // Find critical issues pending longer than criticalHours
      const critEscalationRes = await query(
        `SELECT i.id, i.issue_number, i.title, i.priority, i.director_id, d.user_id as director_user_id
         FROM issues i
         JOIN directors d ON i.director_id = d.id
         WHERE i.status IN ('OPEN', 'UNDER_REVIEW', 'IN_PROGRESS')
           AND i.priority = 'CRITICAL'
           AND i.created_at < NOW() - INTERVAL '1 hour' * $1`,
        [criticalHours]
      );

      const toEscalate = [...stdEscalationRes.rows, ...critEscalationRes.rows];

      for (const issue of toEscalate) {
        await query(
          `UPDATE issues SET status = 'ESCALATED', escalated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1 AND status != 'ESCALATED'`,
          [issue.id]
        );

        // Notify Director
        await query(
          `INSERT INTO notifications (recipient_id, title, message, type, metadata)
           VALUES ($1, $2, $3, 'ISSUE_ESCALATED', $4)`,
          [
            issue.director_user_id,
            `ESCALATION ALERT: Issue #${issue.issue_number}`,
            `Issue "${issue.title}" (${issue.priority} Priority) has breached SLA time limit and has been escalated to you.`,
            JSON.stringify({ issueId: issue.id, issueNumber: issue.issue_number })
          ]
        );
      }

      if (toEscalate.length > 0) {
        logger.info(`SLA Cron Job escalated ${toEscalate.length} issues.`);
      }
    } catch (err) {
      logger.error('Error executing SLA Escalation Job:', err);
    }
  });
};
