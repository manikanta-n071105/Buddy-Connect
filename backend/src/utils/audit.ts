import { query } from '../config/db';

export const logAudit = async (
  actorId: string | null,
  action: string,
  entityType: string,
  entityId?: string | null,
  details?: Record<string, any>,
  ipAddress?: string | string[] | null
) => {
  try {
    const formattedIp = Array.isArray(ipAddress) ? ipAddress[0] : ipAddress || null;
    await query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [actorId, action, entityType, entityId || null, details ? JSON.stringify(details) : null, formattedIp]
    );
  } catch (err) {
    console.error('Failed to log audit entry:', err);
  }
};
