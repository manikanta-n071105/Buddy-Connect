import jwt from 'jsonwebtoken';
import { UserPayload } from '../types';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'super_secret_access_token_juniorconnect_key_2026';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_token_juniorconnect_key_2026';

export const generateTokens = (payload: UserPayload) => {
  const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: '1d' });
  const refreshToken = jwt.sign({ id: payload.id }, REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): UserPayload => {
  return jwt.verify(token, ACCESS_SECRET) as UserPayload;
};

export const verifyRefreshToken = (token: string): { id: string } => {
  return jwt.verify(token, REFRESH_SECRET) as { id: string };
};
