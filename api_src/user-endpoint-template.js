// api_src/user-endpoint-template.js
/**
 * TEMPLATE: User-Scoped Endpoint Pattern
 * 
 * This file serves as a reference template for creating new user-scoped endpoints.
 * Copy this pattern when adding user_id support to other data types.
 * 
 * Usage: Replace {DataType} with your actual data type (decisions, reminders, etc.)
 */

import jwt from "jsonwebtoken";
import { insertIntoTable, queryTable } from "./dbClient.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

/**
 * Extract authenticated user from JWT token in Authorization header
 * Pattern: Authorization: Bearer {token}
 * 
 * @param {object} req - HTTP request object
 * @returns {object|null} - { id, email } if valid, null if invalid
 */
function extractUserFromToken(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    return {
      id: decoded.userId || decoded.id || decoded.email || null,
      email: decoded.email || null,
    };
  } catch (error) {
    console.warn("[Endpoint] Invalid token:", error.message);
    return null;
  }
}

/**
 * GET /api/user/{dataType}
 * Retrieve all {dataType} entries for authenticated user
 * 
 * @param {object} req - HTTP request
 * @param {object} res - HTTP response
 * 
 * Query Parameters:
 *   - limit (optional, max 100): Results per page, default 50
 *   - offset (optional): Pagination offset, default 0
 * 
 * Response: 200 OK
 *   {
 *     "status": "ok",
 *     "data": [...],
 *     "pagination": { limit, offset, total, hasMore }
 *   }
 * 
 * Errors:
 *   - 401: No valid JWT token
 *   - 400: Invalid pagination parameters
 *   - 500: Database error
 */
export default async function handler(req, res) {
  try {
    // STEP 1: Authenticate user from JWT token
    const user = extractUserFromToken(req);
    if (!user) {
      return res.status(401).json({
        status: "error",
        error: "Unauthorized",
      });
    }

    // STEP 2: Parse and validate pagination parameters
    let limit = Math.min(parseInt(req.query.limit) || 50, 100);
    let offset = parseInt(req.query.offset) || 0;

    if (limit < 1 || offset < 0) {
      return res.status(400).json({
        status: "error",
        error: "Invalid pagination parameters",
      });
    }

    // STEP 3: Query user's data from database
    // ⚠️ IMPORTANT: Always include "WHERE user_id = ?" to ensure user isolation
    const results = await queryTable(
      `SELECT * FROM {data_type}_table 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [user.id, limit, offset]
    );

    // STEP 4: Get total count for pagination info
    const countResult = await queryTable(
      `SELECT COUNT(*) as total FROM {data_type}_table WHERE user_id = $1`,
      [user.id]
    );

    const total = countResult[0]?.total || 0;
    const hasMore = offset + limit < total;

    // STEP 5: Return paginated results
    return res.status(200).json({
      status: "ok",
      data: results || [],
      pagination: {
        limit,
        offset,
        total,
        hasMore,
      },
    });
  } catch (error) {
    console.error("[{DataType}Endpoint] Error:", error);
    return res.status(500).json({
      status: "error",
      error: "Failed to fetch {data_type} entries",
    });
  }
}

/**
 * GET /api/user/{dataType}/:id
 * Retrieve single {dataType} entry if user is owner
 * 
 * @param {object} req - HTTP request
 * @param {object} res - HTTP response
 * 
 * Query Parameters:
 *   - id (required): Entry UUID
 * 
 * Response: 200 OK
 *   {
 *     "status": "ok",
 *     "data": {...}
 *   }
 * 
 * Errors:
 *   - 401: No valid JWT token
 *   - 400: Missing id parameter
 *   - 404: Entry not found or user doesn't own it
 *   - 500: Database error
 */
export async function getDetail(req, res) {
  try {
    // STEP 1: Authenticate
    const user = extractUserFromToken(req);
    if (!user) {
      return res.status(401).json({
        status: "error",
        error: "Unauthorized",
      });
    }

    // STEP 2: Validate id parameter
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({
        status: "error",
        error: "Missing id parameter",
      });
    }

    // STEP 3: Query with ownership check
    // ⚠️ CRITICAL: Include "AND user_id = $2" to prevent cross-user access
    const result = await queryTable(
      `SELECT * FROM {data_type}_table 
       WHERE id = $1 AND user_id = $2`,
      [id, user.id]
    );

    if (!result || result.length === 0) {
      return res.status(404).json({
        status: "error",
        error: "{dataType} not found",
      });
    }

    // STEP 4: Return single entry
    return res.status(200).json({
      status: "ok",
      data: result[0],
    });
  } catch (error) {
    console.error("[{DataType}DetailEndpoint] Error:", error);
    return res.status(500).json({
      status: "error",
      error: "Failed to fetch {data_type} entry",
    });
  }
}

/**
 * POST /api/user/{dataType}
 * Create new {dataType} entry for authenticated user
 * 
 * @param {object} req - HTTP request
 * @param {object} res - HTTP response
 * 
 * Body: {...entryData}
 * 
 * Response: 201 Created
 *   {
 *     "status": "ok",
 *     "data": {...createdEntry}
 *   }
 * 
 * Errors:
 *   - 401: No valid JWT token
 *   - 400: Invalid or missing data
 *   - 500: Database error
 */
export async function createEntry(req, res) {
  try {
    // STEP 1: Authenticate
    const user = extractUserFromToken(req);
    if (!user) {
      return res.status(401).json({
        status: "error",
        error: "Unauthorized",
      });
    }

    // STEP 2: Validate request body
    if (!req.body) {
      return res.status(400).json({
        status: "error",
        error: "Request body is required",
      });
    }

    // STEP 3: Prepare entry with user_id
    // ⚠️ CRITICAL: Always include user_id from JWT, never from request body
    const entry = {
      ...req.body,
      user_id: user.id, // NEVER trust client-provided user_id
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // STEP 4: Insert into database
    const result = await insertIntoTable("{data_type}_table", entry);

    // STEP 5: Return created entry
    return res.status(201).json({
      status: "ok",
      data: result,
    });
  } catch (error) {
    console.error("[{DataType}CreateEndpoint] Error:", error);
    return res.status(500).json({
      status: "error",
      error: "Failed to create {data_type} entry",
    });
  }
}

/**
 * PUT /api/user/{dataType}/:id
 * Update {dataType} entry (user must be owner)
 * 
 * @param {object} req - HTTP request
 * @param {object} res - HTTP response
 * 
 * Query Parameters:
 *   - id (required): Entry UUID
 * 
 * Body: {...updatedFields}
 * 
 * Response: 200 OK
 *   {
 *     "status": "ok",
 *     "data": {...updatedEntry}
 *   }
 * 
 * Errors:
 *   - 401: Not authenticated
 *   - 404: Entry not found or user doesn't own it
 *   - 500: Database error
 */
export async function updateEntry(req, res) {
  try {
    // STEP 1: Authenticate
    const user = extractUserFromToken(req);
    if (!user) {
      return res.status(401).json({
        status: "error",
        error: "Unauthorized",
      });
    }

    // STEP 2: Verify ownership before updating
    const { id } = req.query;
    const existing = await queryTable(
      `SELECT * FROM {data_type}_table 
       WHERE id = $1 AND user_id = $2`,
      [id, user.id]
    );

    if (!existing || existing.length === 0) {
      return res.status(404).json({
        status: "error",
        error: "{dataType} not found",
      });
    }

    // STEP 3: Prepare update with user_id unchanged
    const updates = {
      ...req.body,
      user_id: user.id, // Prevent privilege escalation
      updated_at: new Date().toISOString(),
    };

    // STEP 4: Update database
    // Example using direct query - adapt to your dbClient pattern
    const result = await queryTable(
      `UPDATE {data_type}_table 
       SET ${Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(", ")}
       WHERE id = $${Object.keys(updates).length + 1} AND user_id = $${Object.keys(updates).length + 2}
       RETURNING *`,
      [...Object.values(updates), id, user.id]
    );

    if (!result || result.length === 0) {
      return res.status(500).json({
        status: "error",
        error: "Failed to update {data_type}",
      });
    }

    // STEP 5: Return updated entry
    return res.status(200).json({
      status: "ok",
      data: result[0],
    });
  } catch (error) {
    console.error("[{DataType}UpdateEndpoint] Error:", error);
    return res.status(500).json({
      status: "error",
      error: "Failed to update {data_type} entry",
    });
  }
}

/**
 * DELETE /api/user/{dataType}/:id
 * Delete {dataType} entry (user must be owner)
 * 
 * @param {object} req - HTTP request
 * @param {object} res - HTTP response
 * 
 * Query Parameters:
 *   - id (required): Entry UUID
 * 
 * Response: 200 OK
 *   {
 *     "status": "ok",
 *     "message": "Entry deleted"
 *   }
 * 
 * Errors:
 *   - 401: Not authenticated
 *   - 404: Entry not found or user doesn't own it
 *   - 500: Database error
 */
export async function deleteEntry(req, res) {
  try {
    // STEP 1: Authenticate
    const user = extractUserFromToken(req);
    if (!user) {
      return res.status(401).json({
        status: "error",
        error: "Unauthorized",
      });
    }

    // STEP 2: Delete with ownership check
    const { id } = req.query;
    const result = await queryTable(
      `DELETE FROM {data_type}_table 
       WHERE id = $1 AND user_id = $2`,
      [id, user.id]
    );

    if (result?.rowCount === 0) {
      return res.status(404).json({
        status: "error",
        error: "{dataType} not found",
      });
    }

    // STEP 3: Return success
    return res.status(200).json({
      status: "ok",
      message: "Entry deleted",
    });
  } catch (error) {
    console.error("[{DataType}DeleteEndpoint] Error:", error);
    return res.status(500).json({
      status: "error",
      error: "Failed to delete {data_type} entry",
    });
  }
}

/**
 * CRITICAL SECURITY NOTES:
 * 
 * 1. ✅ ALWAYS extract user.id from JWT token, NEVER from request body
 *    - Client could spoof user_id parameter
 *    - JWT is cryptographically verified by server
 * 
 * 2. ✅ ALWAYS include "WHERE user_id = ?" in SELECT/UPDATE/DELETE queries
 *    - Prevents accidental cross-user data access
 *    - Works with database-level RLS as defense-in-depth
 * 
 * 3. ✅ ALWAYS check 401 for missing/invalid JWT before querying database
 *    - Reduces unnecessary database load
 *    - Consistent error handling
 * 
 * 4. ✅ ALWAYS validate required query parameters (id, etc.)
 *    - Return 400 Bad Request if missing
 *    - Prevents database errors from invalid input
 * 
 * 5. ✅ ALWAYS return 404 when entry not found OR user doesn't own it
 *    - Don't reveal whether entry exists to unauthorized users
 *    - Prevents information leakage about other users' data
 * 
 * 6. ✅ ALWAYS set user_id server-side before insert/update
 *    - Never allow client to change user_id field
 *    - Prevents privilege escalation attacks
 * 
 * 7. ✅ ALWAYS use parameterized queries ($1, $2, etc.)
 *    - Prevents SQL injection vulnerabilities
 */
