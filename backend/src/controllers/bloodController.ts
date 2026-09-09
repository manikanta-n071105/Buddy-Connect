import { Response } from 'express';
import { query, executeTransaction } from '../config/db';
import { AuthenticatedRequest } from '../types';
import { logAudit } from '../utils/audit';

export const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

/**
 * GET /api/blood/requests
 * Get all blood donation requests with volunteer stats
 */
export const getBloodRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { blood_group, status } = req.query;

    let queryText = `
      SELECT 
        br.id,
        br.requester_id,
        br.patient_name,
        br.contact_number,
        br.blood_group,
        br.units_needed,
        br.urgency,
        br.hospital_name,
        br.additional_notes,
        br.status,
        br.created_at,
        br.updated_at,
        u.name as requester_name,
        u.email as requester_email,
        u.role as requester_role,
        COALESCE(bd_stats.volunteer_count, 0)::int as volunteer_count,
        CASE WHEN my_bd.id IS NOT NULL THEN true ELSE false END as has_pledged
      FROM blood_requests br
      JOIN users u ON br.requester_id = u.id
      LEFT JOIN (
        SELECT request_id, COUNT(*) as volunteer_count 
        FROM blood_donors 
        WHERE status = 'PLEDGED' 
        GROUP BY request_id
      ) bd_stats ON br.id = bd_stats.request_id
      LEFT JOIN blood_donors my_bd ON br.id = my_bd.request_id AND my_bd.donor_id = $1 AND my_bd.status = 'PLEDGED'
      WHERE 1=1
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    if (status) {
      queryText += ` AND br.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (blood_group) {
      queryText += ` AND UPPER(br.blood_group) = UPPER($${paramIndex})`;
      params.push(blood_group);
      paramIndex++;
    }

    queryText += `
      ORDER BY 
        CASE 
          WHEN br.status = 'OPEN' THEN 1 
          WHEN br.status = 'FULFILLED' THEN 2 
          ELSE 3 
        END,
        CASE 
          WHEN br.urgency = 'CRITICAL' THEN 1
          WHEN br.urgency = 'URGENT' THEN 2
          ELSE 3
        END,
        br.created_at DESC
    `;

    const result = await query(queryText, params);

    const isPrivileged = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN';

    const sanitizedRows = result.rows.map(row => {
      const isOwner = row.requester_id === userId;
      const isFulfilledAndPledged = row.has_pledged && row.volunteer_count >= row.units_needed;
      const canViewContact = isPrivileged || isOwner || isFulfilledAndPledged || row.has_pledged;

      return {
        ...row,
        contact_number: canViewContact ? row.contact_number : maskPhoneNumber(row.contact_number),
        can_view_contact: canViewContact,
        is_owner: isOwner
      };
    });

    res.json({
      success: true,
      data: sanitizedRows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

/**
 * POST /api/blood/requests
 * Create a new blood request and trigger notifications to matching users
 */
export const createBloodRequest = async (req: AuthenticatedRequest, res: Response) => {
  const { patient_name, contact_number, blood_group, units_needed = 1, urgency = 'NORMAL', hospital_name, additional_notes } = req.body;

  if (!patient_name || !contact_number || !blood_group) {
    return res.status(400).json({
      success: false,
      message: 'Patient name, contact number, and blood group are required.',
      code: 'INVALID_INPUT'
    });
  }

  const normalizedBloodGroup = blood_group.trim().toUpperCase();
  if (!VALID_BLOOD_GROUPS.includes(normalizedBloodGroup)) {
    return res.status(400).json({
      success: false,
      message: `Invalid blood group. Must be one of: ${VALID_BLOOD_GROUPS.join(', ')}`,
      code: 'INVALID_BLOOD_GROUP'
    });
  }

  const parsedUnits = Math.max(1, parseInt(units_needed) || 1);
  const normalizedUrgency = ['NORMAL', 'URGENT', 'CRITICAL'].includes(urgency?.toUpperCase())
    ? urgency.toUpperCase()
    : 'NORMAL';

  try {
    const result = await executeTransaction(async (client) => {
      // 1. Insert blood request
      const insertRes = await client.query(
        `INSERT INTO blood_requests (
          requester_id, patient_name, contact_number, blood_group, 
          units_needed, urgency, hospital_name, additional_notes, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'OPEN')
        RETURNING *`,
        [
          req.user!.id,
          patient_name.trim(),
          contact_number.trim(),
          normalizedBloodGroup,
          parsedUnits,
          normalizedUrgency,
          hospital_name?.trim() || null,
          additional_notes?.trim() || null
        ]
      );

      const newRequest = insertRes.rows[0];

      // 2. Find matching active users with this blood group (excluding requester)
      const matchingUsersRes = await client.query(
        `SELECT id, name, email FROM users WHERE is_active = true AND UPPER(blood_group) = $1 AND id != $2`,
        [normalizedBloodGroup, req.user!.id]
      );

      // 3. Send notifications to all matching users
      if (matchingUsersRes.rows.length > 0) {
        const urgencyEmoji = normalizedUrgency === 'CRITICAL' ? '🚨 CRITICAL:' : normalizedUrgency === 'URGENT' ? '⚠️ URGENT:' : '🩸';
        const notifTitle = `${urgencyEmoji} ${normalizedBloodGroup} Blood Donation Needed`;
        const notifMessage = `${req.user!.name} posted a blood request for ${patient_name} needing ${parsedUnits} unit(s) of ${normalizedBloodGroup} blood at ${hospital_name || 'Hospital'}. Your blood group matches!`;

        for (const targetUser of matchingUsersRes.rows) {
          await client.query(
            `INSERT INTO notifications (recipient_id, title, message, type, metadata)
             VALUES ($1, $2, $3, 'BLOOD_REQUEST_MATCH', $4)`,
            [
              targetUser.id,
              notifTitle,
              notifMessage,
              JSON.stringify({
                requestId: newRequest.id,
                bloodGroup: normalizedBloodGroup,
                patientName: patient_name,
                hospitalName: hospital_name,
                unitsNeeded: parsedUnits,
                urgency: normalizedUrgency
              })
            ]
          );
        }
      }

      return { request: newRequest, matchedUsersCount: matchingUsersRes.rows.length };
    });

    await logAudit(req.user!.id, 'CREATE_BLOOD_REQUEST', 'BLOOD_REQUEST', result.request.id, {
      blood_group: normalizedBloodGroup,
      units_needed: parsedUnits,
      urgency: normalizedUrgency,
      notified_users_count: result.matchedUsersCount
    }, req.ip);

    res.status(201).json({
      success: true,
      message: `Blood request created successfully! ${result.matchedUsersCount} matching donors have been notified.`,
      data: result.request
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

/**
 * POST /api/blood/requests/:id/volunteer
 * Volunteer to donate blood for a specific request
 */
export const volunteerForBloodRequest = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const donorId = req.user!.id;

  try {
    const result = await executeTransaction(async (client) => {
      // 1. Fetch the request
      const reqRes = await client.query(
        `SELECT br.*, u.name as requester_name, u.email as requester_email
         FROM blood_requests br
         JOIN users u ON br.requester_id = u.id
         WHERE br.id = $1`,
        [id]
      );

      if (reqRes.rowCount === 0) {
        throw new Error('Blood request not found.');
      }

      const bloodReq = reqRes.rows[0];

      if (bloodReq.status === 'CANCELLED') {
        throw new Error('This blood request has been cancelled.');
      }

      // 2. Add or update volunteer pledge
      await client.query(
        `INSERT INTO blood_donors (request_id, donor_id, status)
         VALUES ($1, $2, 'PLEDGED')
         ON CONFLICT (request_id, donor_id) DO UPDATE SET status = 'PLEDGED'`,
        [id, donorId]
      );

      // 3. Count total active volunteers
      const countRes = await client.query(
        `SELECT COUNT(*) as count FROM blood_donors WHERE request_id = $1 AND status = 'PLEDGED'`,
        [id]
      );
      const totalVolunteers = parseInt(countRes.rows[0].count);

      // 4. Check if required units met
      const isFulfilled = totalVolunteers >= bloodReq.units_needed;
      if (isFulfilled && bloodReq.status === 'OPEN') {
        await client.query(
          `UPDATE blood_requests SET status = 'FULFILLED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [id]
        );
      }

      // 5. Notify Requester about this volunteer
      await client.query(
        `INSERT INTO notifications (recipient_id, title, message, type, metadata)
         VALUES ($1, $2, $3, 'BLOOD_VOLUNTEER_PLEDGED', $4)`,
        [
          bloodReq.requester_id,
          `🩸 New Blood Donor Volunteer!`,
          `${req.user!.name} volunteered to donate ${bloodReq.blood_group} blood for ${bloodReq.patient_name} (${totalVolunteers}/${bloodReq.units_needed} units secured).`,
          JSON.stringify({
            requestId: id,
            donorId,
            donorName: req.user!.name,
            totalVolunteers,
            unitsNeeded: bloodReq.units_needed
          })
        ]
      );

      // 6. If target units are met, send contact details notification to all donors and requester
      if (isFulfilled) {
        const donorsRes = await client.query(
          `SELECT bd.donor_id, u.name, u.email 
           FROM blood_donors bd 
           JOIN users u ON bd.donor_id = u.id 
           WHERE bd.request_id = $1 AND bd.status = 'PLEDGED'`,
          [id]
        );

        for (const donor of donorsRes.rows) {
          await client.query(
            `INSERT INTO notifications (recipient_id, title, message, type, metadata)
             VALUES ($1, $2, $3, 'BLOOD_DONOR_DETAILS_REVEALED', $4)`,
            [
              donor.donor_id,
              `✅ Blood Donation Requirement Met — Contact Details`,
              `The target of ${bloodReq.units_needed} donor(s) for ${bloodReq.patient_name} (${bloodReq.blood_group}) is met! Please contact: ${bloodReq.patient_name} (${bloodReq.contact_number}) at ${bloodReq.hospital_name || 'Hospital'}.`,
              JSON.stringify({
                requestId: id,
                patientName: bloodReq.patient_name,
                contactNumber: bloodReq.contact_number,
                hospitalName: bloodReq.hospital_name,
                bloodGroup: bloodReq.blood_group
              })
            ]
          );
        }
      }

      return {
        requestId: id,
        totalVolunteers,
        unitsNeeded: bloodReq.units_needed,
        isFulfilled,
        patientName: bloodReq.patient_name,
        contactNumber: bloodReq.contact_number,
        hospitalName: bloodReq.hospital_name
      };
    });

    await logAudit(req.user!.id, 'VOLUNTEER_BLOOD_REQUEST', 'BLOOD_REQUEST', id as string, {
      totalVolunteers: result.totalVolunteers,
      isFulfilled: result.isFulfilled
    }, req.ip);

    res.json({
      success: true,
      message: result.isFulfilled
        ? `Thank you! Target reached (${result.totalVolunteers}/${result.unitsNeeded}). Contact details are now available.`
        : `Thank you for volunteering! (${result.totalVolunteers}/${result.unitsNeeded} donors pledged).`,
      data: result
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message, code: 'VOLUNTEER_ERROR' });
  }
};

/**
 * DELETE /api/blood/requests/:id/volunteer
 * Withdraw donation pledge
 */
export const cancelVolunteerPledge = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const donorId = req.user!.id;

  try {
    await executeTransaction(async (client) => {
      await client.query(
        `UPDATE blood_donors SET status = 'CANCELLED' WHERE request_id = $1 AND donor_id = $2`,
        [id, donorId]
      );

      // Check remaining volunteer count
      const countRes = await client.query(
        `SELECT COUNT(*) as count FROM blood_donors WHERE request_id = $1 AND status = 'PLEDGED'`,
        [id]
      );
      const remaining = parseInt(countRes.rows[0].count);

      const reqRes = await client.query(`SELECT units_needed, status FROM blood_requests WHERE id = $1`, [id]);
      if (reqRes.rowCount! > 0) {
        const unitsNeeded = reqRes.rows[0].units_needed;
        if (remaining < unitsNeeded && reqRes.rows[0].status === 'FULFILLED') {
          await client.query(`UPDATE blood_requests SET status = 'OPEN', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
        }
      }
    });

    await logAudit(req.user!.id, 'CANCEL_BLOOD_PLEDGE', 'BLOOD_REQUEST', id as string, {}, req.ip);

    res.json({
      success: true,
      message: 'Donation pledge withdrawn successfully.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

/**
 * PATCH /api/blood/requests/:id/cancel
 * Cancel a blood donation request
 */
export const cancelBloodRequest = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const isPrivileged = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN';

  try {
    const reqRes = await query(`SELECT * FROM blood_requests WHERE id = $1`, [id]);
    if (reqRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Blood request not found.', code: 'NOT_FOUND' });
    }

    const bloodReq = reqRes.rows[0];
    if (bloodReq.requester_id !== userId && !isPrivileged) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this request.', code: 'FORBIDDEN' });
    }

    await query(`UPDATE blood_requests SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);

    // Notify active donors
    const donorsRes = await query(
      `SELECT donor_id FROM blood_donors WHERE request_id = $1 AND status = 'PLEDGED'`,
      [id]
    );

    for (const donor of donorsRes.rows) {
      await query(
        `INSERT INTO notifications (recipient_id, title, message, type, metadata)
         VALUES ($1, $2, $3, 'BLOOD_REQUEST_CANCELLED', $4)`,
        [
          donor.donor_id,
          'Blood Donation Request Cancelled',
          `The blood request for ${bloodReq.patient_name} (${bloodReq.blood_group}) has been cancelled by the requester.`,
          JSON.stringify({ requestId: id })
        ]
      );
    }

    await logAudit(userId, 'CANCEL_BLOOD_REQUEST', 'BLOOD_REQUEST', id as string, {}, req.ip);

    res.json({
      success: true,
      message: 'Blood request cancelled successfully.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

/**
 * PUT /api/blood/user/blood-group
 * Update current user's blood group
 */
export const updateUserBloodGroup = async (req: AuthenticatedRequest, res: Response) => {
  const { blood_group } = req.body;

  if (!blood_group || typeof blood_group !== 'string') {
    return res.status(400).json({ success: false, message: 'Blood group is required.', code: 'INVALID_INPUT' });
  }

  const normalized = blood_group.trim().toUpperCase();
  if (!VALID_BLOOD_GROUPS.includes(normalized)) {
    return res.status(400).json({
      success: false,
      message: `Invalid blood group. Must be one of: ${VALID_BLOOD_GROUPS.join(', ')}`,
      code: 'INVALID_BLOOD_GROUP'
    });
  }

  try {
    await query(`UPDATE users SET blood_group = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [normalized, req.user!.id]);
    await logAudit(req.user!.id, 'UPDATE_BLOOD_GROUP', 'USER', req.user!.id, { blood_group: normalized }, req.ip);

    res.json({
      success: true,
      message: `Blood group updated to ${normalized} successfully!`,
      data: { blood_group: normalized }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

/**
 * GET /api/blood/my-donations
 * Get all requests user has volunteered for
 */
export const getMyDonations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT 
        br.*,
        bd.status as pledge_status,
        bd.created_at as pledged_at,
        u.name as requester_name,
        u.email as requester_email,
        COALESCE(bd_stats.volunteer_count, 0)::int as volunteer_count
      FROM blood_donors bd
      JOIN blood_requests br ON bd.request_id = br.id
      JOIN users u ON br.requester_id = u.id
      LEFT JOIN (
        SELECT request_id, COUNT(*) as volunteer_count 
        FROM blood_donors 
        WHERE status = 'PLEDGED' 
        GROUP BY request_id
      ) bd_stats ON br.id = bd_stats.request_id
      WHERE bd.donor_id = $1 AND bd.status = 'PLEDGED'
      ORDER BY bd.created_at DESC`,
      [req.user!.id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

/**
 * GET /api/blood/my-requests
 * Get all blood requests created by user along with donor volunteers
 */
export const getMyRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestsRes = await query(
      `SELECT br.*, 
        COALESCE(bd_stats.volunteer_count, 0)::int as volunteer_count
       FROM blood_requests br
       LEFT JOIN (
         SELECT request_id, COUNT(*) as volunteer_count 
         FROM blood_donors 
         WHERE status = 'PLEDGED' 
         GROUP BY request_id
       ) bd_stats ON br.id = bd_stats.request_id
       WHERE br.requester_id = $1
       ORDER BY br.created_at DESC`,
      [req.user!.id]
    );

    const donorsRes = await query(
      `SELECT 
        bd.request_id,
        bd.status as pledge_status,
        bd.created_at as pledged_at,
        u.id as donor_id,
        u.name as donor_name,
        u.email as donor_email,
        u.phone as donor_phone,
        u.blood_group as donor_blood_group,
        u.role as donor_role
       FROM blood_donors bd
       JOIN users u ON bd.donor_id = u.id
       JOIN blood_requests br ON bd.request_id = br.id
       WHERE br.requester_id = $1 AND bd.status = 'PLEDGED'
       ORDER BY bd.created_at ASC`,
      [req.user!.id]
    );

    const donorsByRequestId: Record<string, any[]> = {};
    for (const donor of donorsRes.rows) {
      if (!donorsByRequestId[donor.request_id]) {
        donorsByRequestId[donor.request_id] = [];
      }
      donorsByRequestId[donor.request_id].push(donor);
    }

    const data = requestsRes.rows.map(r => ({
      ...r,
      donors: donorsByRequestId[r.id] || []
    }));

    res.json({
      success: true,
      data
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

function maskPhoneNumber(phone: string): string {
  if (!phone) return 'Hidden until requirement met';
  const clean = phone.trim();
  if (clean.length <= 4) return '***';
  return clean.slice(0, 3) + '*****' + clean.slice(-2);
}
