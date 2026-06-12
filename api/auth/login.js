// api/auth/login.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";

const JWT_SECRET = process.env.JWT_SECRET || "arthos-dev-secret-change-in-production";
const DATABASE_URL = process.env.DATABASE_URL;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const cleanedEmail = email.toLowerCase().trim();

    // Demo mode — no real DB, create a token for dev/test
    if (!DATABASE_URL) {
      // In demo mode any email/password combo works (for development)
      const token = jwt.sign(
        { userId: cleanedEmail, email: cleanedEmail, name: cleanedEmail.split("@")[0] },
        JWT_SECRET,
        { expiresIn: "30d" },
      );

      return res.status(200).json({
        user: { id: cleanedEmail, email: cleanedEmail, name: cleanedEmail.split("@")[0] },
        token,
        demo: true,
      });
    }

    // Query user from database
    const pool = new pg.Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : false,
    });

    const { rows } = await pool.query(
      `SELECT id, email, name, password_hash FROM users WHERE email = $1`,
      [cleanedEmail],
    );

    if (rows.length === 0) {
      await pool.end();
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      await pool.end();
      return res.status(401).json({ error: "Invalid email or password" });
    }

    await pool.end();

    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "30d" },
    );

    return res.status(200).json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (err) {
    console.error("[Auth] Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
