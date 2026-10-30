import { Request, Response } from 'express';
import { getDatabase } from '../db/database';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../utils/password';
import { generateAccessToken, generateRefreshToken, hashToken, getRefreshTokenExpiry, generateSecureToken, getTokenExpiry } from '../utils/tokens';
import { AuthenticatedRequest } from '../middleware/auth';
import { emailService } from '../services/email/service';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export async function register(req: Request, res: Response) {
  try {
    const { email, name, password, role } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ success: false, error: { message: 'Email, name and password are required' } });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid email address' } });
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({ success: false, error: { message: passwordError } });
    }

    const validRoles = ['lender', 'msme_owner'];
    const userRole = validRoles.includes(role) ? role : 'msme_owner';

    const db = getDatabase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);

    if (existing) {
      return res.status(409).json({ success: false, error: { message: 'An account with this email already exists' } });
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO users (id, email, name, role, password_hash, email_verified, failed_login_attempts, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)`,
    ).run(userId, normalizedEmail, name.trim(), userRole, passwordHash, now, now);

    // Generate verification token
    const verifyToken = generateSecureToken();
    const verifyTokenHash = hashToken(verifyToken);
    const verifyTokenId = `vt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(
      `INSERT INTO auth_tokens (id, user_id, token_hash, type, expires_at, created_at)
       VALUES (?, ?, ?, 'verify_email', ?, ?)`,
    ).run(verifyTokenId, userId, verifyTokenHash, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), now);

    await emailService.sendVerificationEmail(normalizedEmail, verifyToken);

    const accessToken = generateAccessToken({ userId, email: normalizedEmail, role: userRole });
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    db.prepare(
      `INSERT INTO sessions (id, user_id, refresh_token_hash, expires_at, created_at, last_used_at, user_agent, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      sessionId,
      userId,
      refreshTokenHash,
      getRefreshTokenExpiry().toISOString(),
      now,
      now,
      req.headers['user-agent'] || null,
      req.ip || (req.headers['x-forwarded-for'] as string) || null,
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: (process.env.COOKIE_SAME_SITE as any) || 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

    res.status(201).json({
      success: true,
      data: {
        user: { id: userId, email: normalizedEmail, name: name.trim(), role: userRole, emailVerified: false },
        accessToken,
        message: 'Registration successful. Please check your email to verify your account.',
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: { message: 'Registration failed' } });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: { message: 'Email and password are required' } });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = getDatabase();

    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);

    if (!user) {
      return res.status(401).json({ success: false, error: { message: 'Invalid email or password' } });
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(423).json({ success: false, error: { message: 'Account temporarily locked. Please try again later.' } });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
      db.prepare('UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?').run(
        attempts,
        lockUntil,
        user.id,
      );
      return res.status(401).json({ success: false, error: { message: 'Invalid email or password' } });
    }

    db.prepare('UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = ? WHERE id = ?').run(
      new Date().toISOString(),
      user.id,
    );

    const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO sessions (id, user_id, refresh_token_hash, expires_at, created_at, last_used_at, user_agent, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      sessionId,
      user.id,
      refreshTokenHash,
      getRefreshTokenExpiry().toISOString(),
      now,
      now,
      req.headers['user-agent'] || null,
      req.ip || (req.headers['x-forwarded-for'] as string) || null,
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: (process.env.COOKIE_SAME_SITE as any) || 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role, emailVerified: !!user.email_verified },
        accessToken,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: { message: 'Login failed' } });
  }
}

export async function refreshToken(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ success: false, error: { message: 'Refresh token required' } });
    }

    const tokenHash = hashToken(refreshToken);
    const db = getDatabase();

    const session: any = db
      .prepare(
        `SELECT s.*, u.email, u.role FROM sessions s 
         JOIN users u ON u.id = s.user_id 
         WHERE s.refresh_token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ?`,
      )
      .get(tokenHash, new Date().toISOString());

    if (!session) {
      return res.status(401).json({ success: false, error: { message: 'Invalid or expired refresh token' } });
    }

    // Rotate refresh token
    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = hashToken(newRefreshToken);
    db.prepare('UPDATE sessions SET refresh_token_hash = ?, last_used_at = ? WHERE id = ?').run(
      newRefreshTokenHash,
      new Date().toISOString(),
      session.id,
    );

    const accessToken = generateAccessToken({ userId: session.user_id, email: session.email, role: session.role });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: (process.env.COOKIE_SAME_SITE as any) || 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

    res.json({ success: true, data: { accessToken } });
  } catch (error: any) {
    console.error('Refresh token error:', error);
    res.status(500).json({ success: false, error: { message: 'Token refresh failed' } });
  }
}

export async function logout(req: AuthenticatedRequest, res: Response) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      const db = getDatabase();
      db.prepare('UPDATE sessions SET revoked_at = ? WHERE refresh_token_hash = ?').run(new Date().toISOString(), tokenHash);
    }

    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, error: { message: 'Logout failed' } });
  }
}

export async function verifyEmail(req: Request, res: Response) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: { message: 'Verification token is required' } });
    }

    const tokenHash = hashToken(token);
    const db = getDatabase();

    const tokenRecord: any = db
      .prepare(
        `SELECT * FROM auth_tokens WHERE token_hash = ? AND type = 'verify_email' AND used_at IS NULL AND expires_at > ?`,
      )
      .get(tokenHash, new Date().toISOString());

    if (!tokenRecord) {
      return res.status(400).json({ success: false, error: { message: 'Invalid or expired verification token' } });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE users SET email_verified = 1, email_verified_at = ? WHERE id = ?').run(now, tokenRecord.user_id);
    db.prepare('UPDATE auth_tokens SET used_at = ? WHERE id = ?').run(now, tokenRecord.id);

    res.json({ success: true, data: { message: 'Email verified successfully' } });
  } catch (error: any) {
    console.error('Verify email error:', error);
    res.status(500).json({ success: false, error: { message: 'Email verification failed' } });
  }
}

export async function requestPasswordReset(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: { message: 'Email is required' } });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = getDatabase();
    const user: any = db.prepare('SELECT id, email FROM users WHERE email = ?').get(normalizedEmail);

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, data: { message: 'If an account exists, a password reset link has been sent.' } });
    }

    const resetToken = generateSecureToken();
    const resetTokenHash = hashToken(resetToken);
    const tokenId = `rt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO auth_tokens (id, user_id, token_hash, type, expires_at, created_at)
       VALUES (?, ?, ?, 'reset_password', ?, ?)`,
    ).run(tokenId, user.id, resetTokenHash, new Date(Date.now() + 60 * 60 * 1000).toISOString(), now);

    await emailService.sendPasswordResetEmail(user.email, resetToken);

    res.json({ success: true, data: { message: 'If an account exists, a password reset link has been sent.' } });
  } catch (error: any) {
    console.error('Password reset request error:', error);
    res.status(500).json({ success: false, error: { message: 'Password reset request failed' } });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, error: { message: 'Token and password are required' } });
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({ success: false, error: { message: passwordError } });
    }

    const tokenHash = hashToken(token);
    const db = getDatabase();

    const tokenRecord: any = db
      .prepare(
        `SELECT * FROM auth_tokens WHERE token_hash = ? AND type = 'reset_password' AND used_at IS NULL AND expires_at > ?`,
      )
      .get(tokenHash, new Date().toISOString());

    if (!tokenRecord) {
      return res.status(400).json({ success: false, error: { message: 'Invalid or expired reset token' } });
    }

    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(passwordHash, now, tokenRecord.user_id);
    db.prepare('UPDATE auth_tokens SET used_at = ? WHERE id = ?').run(now, tokenRecord.id);
    db.prepare('UPDATE sessions SET revoked_at = ? WHERE user_id = ?').run(now, tokenRecord.user_id);

    res.json({ success: true, data: { message: 'Password reset successfully' } });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: { message: 'Password reset failed' } });
  }
}

export async function getCurrentUser(req: AuthenticatedRequest, res: Response) {
  try {
    const db = getDatabase();
    const user: any = db
      .prepare('SELECT id, email, name, role, email_verified, created_at FROM users WHERE id = ?')
      .get(req.user?.userId);

    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: !!user.email_verified,
          createdAt: user.created_at,
        },
      },
    });
  } catch (error: any) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to get user' } });
  }
}
