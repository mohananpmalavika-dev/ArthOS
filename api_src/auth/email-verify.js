// api_src/auth/email-verify.js
// Email verification endpoints
//
// POST /api/auth/verify-email  — Verify email via token
// POST /api/auth/resend-verify — Resend verification email
//
// Requires database configuration (DATABASE_URL or Supabase).

import jwt from "jsonwebtoken";
import { JWT_CONFIG } from "./jwt.js";
import { hasDatabaseConfig, query } from "../dbClient.js";

export default async function handler(req, res) {
  const pathname = req.url?.split("?")[0] || "";

  if (req.method === "POST" && pathname === "/api/auth/verify-email") {
    return handleVerify(req, res);
  }

  if (req.method === "POST" && pathname === "/api/auth/resend-verify") {
    return handleResend(req, res);
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}

/**
 * POST /api/auth/verify-email
 * Body: { token: "<verification_jwt>" }
 */
async function handleVerify(req, res) {
  if (!hasDatabaseConfig()) {
    return res.status(200).json({
      status: "verified",
      message: "Demo mode — email verification skipped.",
      demo: true,
    });
  }

  try {
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ error: "Verification token is required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_CONFIG.secret, { algorithms: ["HS256"] });
    } catch (err) {
      return res.status(401).json({
        error: "Invalid or expired verification token",
        detail: err.message,
      });
    }

    if (decoded.purpose !== "email_verification") {
      return res.status(400).json({ error: "Invalid token purpose" });
    }

    const userId = decoded.userId;
    if (!userId) {
      return res.status(400).json({ error: "Token missing userId" });
    }

    // Update user record
    try {
      await query(
        `UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = $1`,
        [userId]
      );
    } catch (queryError) {
      console.error("[EmailVerify] DB update error:", queryError.message);
      return res.status(500).json({ error: "Verification failed" });
    }

    console.log(`[EmailVerify] User ${userId} (${decoded.email}) verified successfully`);
    return res.status(200).json({
      status: "verified",
      message: "Email verified successfully. You now have full access.",
    });
  } catch (error) {
    console.error("[EmailVerify] handler error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * POST /api/auth/resend-verify
 * Body: { email: "user@example.com" }
 *
 * In production this would send an actual email via SendGrid / Resend / etc.
 * Here we generate the token and log it (simulated).
 */
async function handleResend(req, res) {
  if (!hasDatabaseConfig()) {
    return res.status(200).json({
      status: "sent",
      message: "Demo mode — verification email simulated.",
      demo: true,
    });
  }

  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const cleanedEmail = email.toLowerCase().trim();

    // Find user
    let rows;
    try {
      rows = await query(
        `SELECT id, email_verified FROM users WHERE email = $1`,
        [cleanedEmail]
      );
    } catch (queryError) {
      console.error("[EmailVerify] DB query error:", queryError.message);
      return res.status(500).json({ error: "Failed to find user" });
    }

    if (!rows || rows.length === 0) {
      // Don't reveal whether account exists
      return res.status(200).json({
        status: "sent",
        message: "If an account exists with this email, a verification link has been sent.",
      });
    }

    const user = rows[0];
    if (user.email_verified) {
      return res.status(200).json({
        status: "already_verified",
        message: "Email is already verified.",
      });
    }

    // Generate new verification token (valid 24h)
    const verificationToken = jwt.sign(
      { userId: user.id, email: cleanedEmail, purpose: "email_verification" },
      JWT_CONFIG.secret,
      { expiresIn: "24h" },
    );

    // In production: send via email provider
    console.log(`[EmailVerify] Resend verification for ${cleanedEmail}:`);
    console.log(`[EmailVerify] Token (simulated): ${verificationToken.substring(0, 20)}...`);

    return res.status(200).json({
      status: "sent",
      message: "Verification email sent (simulated).",
    });
  } catch (error) {
    console.error("[EmailVerify] handler error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
