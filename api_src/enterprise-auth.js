/**
 * Enterprise Authentication Handler
 * Handles refresh token flow for enterprise users
 * POST /api/enterprise/auth/refresh - Refresh access token using httpOnly cookie
 * POST /api/enterprise/auth/logout - Clear refresh token
 */

import jwt from "jsonwebtoken";

const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || "dev-secret-key",
  expiresIn: "1h",
  refreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-key",
  refreshExpiresIn: "7d"
};

export default async function enterpriseAuthHandler(req, res) {
  const pathname = req.url || req.path || "";

  if (pathname.includes("/enterprise/auth/refresh")) {
    return handleRefresh(req, res);
  }

  if (pathname.includes("/enterprise/auth/logout")) {
    return handleLogout(req, res);
  }

  if (pathname.includes("/enterprise/auth/me")) {
    return handleMe(req, res);
  }

  res.status(404).json({ error: "Enterprise auth endpoint not found" });
}

async function handleRefresh(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // In production, get refresh token from httpOnly cookie
    // For now, support both cookie and body for dev/test
    const refreshToken =
      req.cookies?.refreshToken ||
      req.body?.refreshToken ||
      extractCookie(req.headers.cookie || "", "refreshToken");

    if (!refreshToken) {
      return res.status(401).json({ error: "No refresh token provided" });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_CONFIG.refreshSecret);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      {
        userId: decoded.userId,
        email: decoded.email,
        name: decoded.name,
        roles: decoded.roles || ["user"],
        permissions: decoded.permissions || []
      },
      JWT_CONFIG.secret,
      { expiresIn: JWT_CONFIG.expiresIn }
    );

    // Optionally generate new refresh token
    const newRefreshToken = jwt.sign(
      {
        userId: decoded.userId,
        email: decoded.email,
        name: decoded.name,
        roles: decoded.roles || ["user"],
        permissions: decoded.permissions || []
      },
      JWT_CONFIG.refreshSecret,
      { expiresIn: JWT_CONFIG.refreshExpiresIn }
    );

    // Set httpOnly cookie in production
    if (process.env.NODE_ENV === "production") {
      res.setHeader(
        "Set-Cookie",
        `refreshToken=${newRefreshToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/`
      );
    }

    return res.status(200).json({
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name,
        roles: decoded.roles || ["user"],
        permissions: decoded.permissions || []
      }
    });
  } catch (error) {
    console.error("[Enterprise Auth] Refresh error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function handleLogout(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Clear httpOnly cookie
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Set-Cookie",
      "refreshToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/"
    );
  }

  res.status(200).json({ message: "Logged out successfully" });
}

async function handleMe(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_CONFIG.secret);

    res.status(200).json({
      user: {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name,
        roles: decoded.roles || ["user"],
        permissions: decoded.permissions || []
      }
    });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}

function extractCookie(cookieHeader, name) {
  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split("=");
    if (key === name) {
      return value;
    }
  }
  return null;
}
