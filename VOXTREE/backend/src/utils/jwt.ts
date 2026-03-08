import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
  isFreelancer: boolean;
}

export interface RefreshTokenPayload {
  userId: number;
  tokenId: string;
}

export class JWTService {
  private static readonly ACCESS_TOKEN_EXPIRY = '15m';
  private static readonly REFRESH_TOKEN_EXPIRY = '30d';
  private static readonly PASSWORD_RESET_EXPIRY = '1h';

  static generateAccessToken(payload: TokenPayload): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    return jwt.sign(payload, secret, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      issuer: 'voxtree',
      audience: 'voxtree-users'
    });
  }

  static generateRefreshToken(userId: number): { token: string; tokenId: string } {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not defined');
    }

    const tokenId = crypto.randomUUID();
    const payload: RefreshTokenPayload = { userId, tokenId };

    const token = jwt.sign(payload, secret, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
      issuer: 'voxtree',
      audience: 'voxtree-refresh'
    });

    return { token, tokenId };
  }

  static generatePasswordResetToken(userId: number): { token: string; tokenId: string } {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const tokenId = crypto.randomUUID();
    const payload = { userId, tokenId, type: 'password-reset' };

    const token = jwt.sign(payload, secret, {
      expiresIn: this.PASSWORD_RESET_EXPIRY,
      issuer: 'voxtree',
      audience: 'voxtree-password-reset'
    });

    return { token, tokenId };
  }

  static verifyAccessToken(token: string): TokenPayload {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    try {
      const decoded = jwt.verify(token, secret, {
        issuer: 'voxtree',
        audience: 'voxtree-users'
      }) as TokenPayload;

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  static verifyRefreshToken(token: string): RefreshTokenPayload {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not defined');
    }

    try {
      const decoded = jwt.verify(token, secret, {
        issuer: 'voxtree',
        audience: 'voxtree-refresh'
      }) as RefreshTokenPayload;

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  static verifyPasswordResetToken(token: string): { userId: number; tokenId: string } {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    try {
      const decoded = jwt.verify(token, secret, {
        issuer: 'voxtree',
        audience: 'voxtree-password-reset'
      }) as { userId: number; tokenId: string; type: string };

      if (decoded.type !== 'password-reset') {
        throw new Error('Invalid token type');
      }

      return { userId: decoded.userId, tokenId: decoded.tokenId };
    } catch (error) {
      throw new Error('Invalid or expired password reset token');
    }
  }

  static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

