/**
 * Password Reset Endpoints
 * 
 * POST /api/auth/reset-password/request - Request password reset email
 * POST /api/auth/reset-password/verify  - Verify token and reset password
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_CONFIG } from './jwt.js';
import { hasDatabaseConfig, query } from '../dbClient.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req, res) {
  const pathname = req.url?.split('?')[0] || '';

  if (req.method === 'POST' && pathname === '/api/auth/reset-password/request') {
    return handleRequestReset(req, res);
  }

  if (req.method === 'POST' && pathname === '/api/auth/reset-password/verify') {
    return handleVerifyReset(req, res);
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}

/**
 * POST /api/auth/reset-password/request
 * Body: { email: "user@example.com" }
 * 
 * Generates a password reset token and sends email (demo: logs to console)
 */
async function handleRequestReset(req, res) {
  if (!hasDatabaseConfig()) {
    return res.status(200).json({
      status: 'ok',
      message: 'Demo mode — password reset email would be sent.',
      demo: true,
    });
  }

  try {
    const { email } = req.body || {};
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const users = await query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    );

    if (!users || users.length === 0) {
      // Don't reveal if email exists (security best practice)
      return res.status(200).json({
        status: 'ok',
        message: 'If this email exists, a password reset link has been sent.',
      });
    }

    const user = users[0];

    // Generate reset token (valid for 24 hours)
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password_reset' },
      JWT_CONFIG.secret,
      { expiresIn: '24h', algorithm: 'HS256' }
    );

    // In production, send email with reset link:
    // const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
    // await sendPasswordResetEmail(email, resetLink);

    // For demo: log to console
    console.log(
      `\n📧 Password reset requested for ${email}\n` +
      `Reset token (valid 24h): ${resetToken}\n` +
      `Frontend link: http://localhost:5173/auth/reset-password?token=${resetToken}\n`
    );

    return res.status(200).json({
      status: 'ok',
      message: 'If this email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/auth/reset-password/verify
 * Body: { token: "jwt_token", newPassword: "newpassword123" }
 * 
 * Verifies reset token and updates password
 */
async function handleVerifyReset(req, res) {
  if (!hasDatabaseConfig()) {
    return res.status(200).json({
      status: 'ok',
      message: 'Demo mode — password would be reset.',
      demo: true,
    });
  }

  try {
    const { token, newPassword } = req.body || {};

    if (!token) {
      return res.status(400).json({ error: 'Reset token is required' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        error: 'New password must be at least 6 characters',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_CONFIG.secret, { algorithms: ['HS256'] });
    } catch (err) {
      return res.status(401).json({
        error: 'Invalid or expired reset token',
      });
    }

    if (decoded.type !== 'password_reset') {
      return res.status(401).json({
        error: 'Invalid token type',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password in database
    const result = await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email',
      [hashedPassword, decoded.userId]
    );

    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`✅ Password reset successful for user ${decoded.userId}`);

    return res.status(200).json({
      status: 'ok',
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('Password reset verify error:', error);
    return res.status(500).json({ error: error.message });
  }
}
