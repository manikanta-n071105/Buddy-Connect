import { Response } from 'express';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../types';

// Ensure 2FA columns exist in database
export const ensure2FAColumns = async () => {
  try {
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(255)`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT false`);
  } catch (err) {
    console.error('2FA columns migration notice:', err);
  }
};

// Setup Google Authenticator 2FA (Generates QR Code + Secret Key)
export const setup2FA = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensure2FAColumns();
    const userId = req.user!.id;
    const uRes = await query(`SELECT email, totp_secret, totp_enabled FROM users WHERE id = $1`, [userId]);
    const user = uRes.rows[0];

    let secret = user.totp_secret;
    let otpauthUrl = '';

    if (!secret) {
      const generated = speakeasy.generateSecret({
        name: `SanskrithiBuddy:${user.email}`,
        issuer: 'SanskrithiBuddy'
      });
      secret = generated.base32;
      otpauthUrl = generated.otpauth_url || '';
      await query(`UPDATE users SET totp_secret = $1 WHERE id = $2`, [secret, userId]);
    } else {
      otpauthUrl = speakeasy.otpauthURL({
        secret,
        label: `SanskrithiBuddy:${user.email}`,
        issuer: 'SanskrithiBuddy',
        encoding: 'base32'
      });
    }

    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    res.json({
      success: true,
      data: {
        qrCodeUrl,
        secret,
        totpEnabled: Boolean(user.totp_enabled)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Verify 2FA Setup (Enables TOTP on valid 6-digit Google Authenticator code)
export const verifySetup2FA = async (req: AuthenticatedRequest, res: Response) => {
  const { code } = req.body;
  if (!code || code.toString().trim().length !== 6) {
    return res.status(400).json({ success: false, message: 'A valid 6-digit code from Google Authenticator App is required.', code: 'INVALID_INPUT' });
  }

  try {
    await ensure2FAColumns();
    const userId = req.user!.id;
    const uRes = await query(`SELECT totp_secret FROM users WHERE id = $1`, [userId]);
    const secret = uRes.rows[0]?.totp_secret;

    if (!secret) {
      return res.status(400).json({ success: false, message: 'Please setup 2FA first before verifying.', code: 'NO_SECRET' });
    }

    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code.toString().trim(),
      window: 1
    });

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid 6-digit code. Please check your Google Authenticator app.', code: 'INVALID_CODE' });
    }

    await query(`UPDATE users SET totp_enabled = true WHERE id = $1`, [userId]);

    res.json({
      success: true,
      message: 'Google Authenticator 2FA enabled successfully! All permission updates will now require 2FA authentication.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Disable 2FA for Super Admin
export const disable2FA = async (req: AuthenticatedRequest, res: Response) => {
  const { code } = req.body;
  if (!code || code.toString().trim().length !== 6) {
    return res.status(400).json({ success: false, message: '6-digit Google Authenticator code required to disable 2FA.', code: 'INVALID_INPUT' });
  }

  try {
    await ensure2FAColumns();
    const userId = req.user!.id;
    const uRes = await query(`SELECT totp_secret, totp_enabled FROM users WHERE id = $1`, [userId]);
    const secret = uRes.rows[0]?.totp_secret;

    if (!secret || !uRes.rows[0]?.totp_enabled) {
      return res.status(400).json({ success: false, message: '2FA is not currently enabled.', code: 'NOT_ENABLED' });
    }

    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code.toString().trim(),
      window: 1
    });

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid 6-digit code.', code: 'INVALID_CODE' });
    }

    await query(`UPDATE users SET totp_enabled = false, totp_secret = NULL WHERE id = $1`, [userId]);

    res.json({
      success: true,
      message: 'Google Authenticator 2FA disabled successfully.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};
