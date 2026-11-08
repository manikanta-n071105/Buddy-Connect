import { Request, Response, NextFunction } from 'express';
import { encryptPayload, decryptPayload } from '../utils/encryption';
import { logger } from '../utils/logger';

// Paths that should not be encrypted (health checks, binary files, diagnosis)
const BYPASS_PATHS = [
  '/api/health',
  '/api/diagnosis',
  '/api/reports/generate-consolidated-pdf',
  '/api/reports/latex',
  '/api/reports/export'
];

/**
 * End-to-End Application-Layer Payload Encryption Middleware (AES-256-GCM)
 *
 * 1. Automatically intercepts and decrypts incoming request payloads.
 * 2. Automatically intercepts and encrypts outgoing res.json responses.
 */
export const e2eeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const isBypass = BYPASS_PATHS.some((path) => req.originalUrl?.startsWith(path));

  // 1. Decrypt incoming request payload if encrypted
  if (!isBypass && req.body) {
    const isEncrypted =
      req.body.__e2ee === true ||
      req.headers['x-payload-encrypted'] === 'true' ||
      req.headers['x-payload-encrypted'] === '1';

    if (isEncrypted) {
      try {
        req.body = decryptPayload(req.body);
      } catch (err: any) {
        logger.error('Failed to decrypt incoming E2EE request payload:', err.message);
        return res.status(400).json({
          status: 'error',
          message: 'Invalid or corrupted encrypted payload',
        });
      }
    } else if (
      (req.originalUrl?.includes('/api/auth/login') || req.originalUrl?.includes('/api/auth/change-password')) &&
      process.env.ENFORCE_E2EE === 'true'
    ) {
      // Reject raw plaintext credentials when ENFORCE_E2EE is active
      return res.status(403).json({
        success: false,
        message: 'Direct plaintext authentication rejected. Requests must be End-to-End Encrypted.',
        code: 'E2EE_REQUIRED',
      });
    }
  }

  // 2. Intercept res.json to encrypt outgoing responses if client requested E2EE
  const clientWantsE2EE =
    !isBypass &&
    (req.headers['x-client-e2ee'] === 'true' ||
      req.headers['x-client-e2ee'] === '1' ||
      req.headers['x-payload-encrypted'] === 'true' ||
      req.headers['x-payload-encrypted'] === '1');

  if (clientWantsE2EE) {
    const originalJson = res.json.bind(res);

    res.json = function (body: any): Response {
      try {
        // Do not double-encrypt if already formatted as E2EE
        if (body && body.__e2ee) {
          return originalJson(body);
        }

        const encrypted = encryptPayload(body);
        res.setHeader('X-Payload-Encrypted', 'true');
        return originalJson(encrypted);
      } catch (err: any) {
        logger.error('Failed to encrypt outgoing E2EE response payload:', err.message);
        return originalJson(body); // Gracefully fallback to plain JSON if encryption fails
      }
    };
  }

  next();
};

