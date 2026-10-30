import { Router } from 'express';
import { register, login, refreshToken, logout, verifyEmail, requestPasswordReset, resetPassword, getCurrentUser } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimit';

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, register);
authRouter.post('/login', authRateLimiter, login);
authRouter.post('/refresh', refreshToken);
authRouter.post('/logout', authenticateToken, logout);
authRouter.post('/verify-email', verifyEmail);
authRouter.post('/forgot-password', authRateLimiter, requestPasswordReset);
authRouter.post('/reset-password', authRateLimiter, resetPassword);
authRouter.get('/me', authenticateToken, getCurrentUser);
