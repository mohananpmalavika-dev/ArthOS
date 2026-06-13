// api/auth/register.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { hasDatabaseConfig, insertIntoTable } from "../dbClient.js";
import { JWT_CONFIG } from "./jwt.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { name, email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const cleanedEmail = email.toLowerCase().trim();

    // Demo mode when no DB configured
    if (!hasDatabaseConfig()) {
      const token = jwt.sign(
        { userId: cleanedEmail, email: cleanedEmail, name: name || cleanedEmail.split("@")[0] },
        JWT_CONFIG.secret,
        { expiresIn: JWT_CONFIG.expiresIn },
      );

      return res.status(201).json({
        user: { id: cleanedEmail, email: cleanedEmail, name: name || cleanedEmail.split("@")[0] },
        token,
        demo: true,
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRecord = {
      email: cleanedEmail,
      name: name || cleanedEmail.split("@")[0],
      password_hash: hashedPassword,
      email_verified: false,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await insertIntoTable("users", userRecord);
    if (error) {
      if (error.message && (error.message.includes("duplicate") || error.message.includes("unique"))) {
        return res.status(409).json({ error: "An account with this email already exists" });
      }
      console.error("[Auth] Register insert error:", error);
      return res.status(500).json({ error: "Registration failed" });
    }

    const userId = data?.[0]?.id || cleanedEmail;

    // Generate email verification token
    const verificationToken = jwt.sign(
      { userId, email: cleanedEmail, purpose: "email_verification" },
      JWT_CONFIG.secret,
      { expiresIn: "24h" },
    );

    const token = jwt.sign(
      { userId, email: cleanedEmail, name: name || cleanedEmail.split("@")[0] },
      JWT_CONFIG.secret,
      { expiresIn: JWT_CONFIG.expiresIn },
    );

    console.log(`[Auth] User registered: ${cleanedEmail} (email verification required)`);
    console.log(`[Auth] Verification token (would be emailed): ${verificationToken.substring(0, 20)}...`);

    return res.status(201).json({
      user: { id: userId, email: cleanedEmail, name: name || cleanedEmail.split("@")[0] },
      token,
      emailVerificationRequired: true,
      message: "Registration successful. Please verify your email to access all features.",
    });
  } catch (err) {
    console.error("[Auth] Register error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
