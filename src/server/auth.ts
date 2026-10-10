import type { Request, Response, NextFunction } from 'express';

/**
 * ADMIN SESSION AUTHENTICATION
 *
 * This module handles secure password-based authentication for admin access.
 * - Uses bcryptjs to verify passwords
 * - Uses Express sessions with HttpOnly cookies
 * - Protects admin API routes
 * - No localStorage or token exposure on frontend
 */

// Simple in-memory session store (in production, use Redis or database)
interface AdminSession {
  userId: string;
  authenticatedAt: number;
  expiresAt: number;
}

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Store: sessionId -> AdminSession
const sessionStore = new Map<string, AdminSession>();

// Store: ipAddress -> { attempts: number, lockedUntil: number }
const loginAttempts = new Map<string, { attempts: number; lockedUntil: number }>();

/**
 * Generate a secure random session ID (256-bit hex)
 */
function generateSessionId(): string {
  return require('crypto').randomBytes(32).toString('hex');
}

/**
 * Get client IP address (handles proxies)
 */
function getClientIP(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * Check if an IP is rate-limited
 */
function isRateLimited(ip: string): boolean {
  const record = loginAttempts.get(ip);
  if (!record) return false;

  if (Date.now() > record.lockedUntil) {
    loginAttempts.delete(ip);
    return false;
  }

  return record.attempts >= MAX_LOGIN_ATTEMPTS;
}

/**
 * Record a failed login attempt
 */
function recordFailedAttempt(ip: string): void {
  const record = loginAttempts.get(ip);
  if (!record) {
    loginAttempts.set(ip, {
      attempts: 1,
      lockedUntil: Date.now() + ATTEMPT_LOCKOUT_DURATION_MS,
    });
  } else {
    record.attempts++;
    record.lockedUntil = Date.now() + ATTEMPT_LOCKOUT_DURATION_MS;
  }
}

/**
 * Clear failed login attempts
 */
function clearFailedAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

/**
 * Create a new admin session
 */
function createSession(userId: string): string {
  const sessionId = generateSessionId();
  const now = Date.now();
  sessionStore.set(sessionId, {
    userId,
    authenticatedAt: now,
    expiresAt: now + SESSION_DURATION_MS,
  });
  return sessionId;
}

/**
 * Retrieve and validate a session
 */
function getSession(sessionId: string): AdminSession | null {
  const session = sessionStore.get(sessionId);
  if (!session) return null;

  // Check if session has expired
  if (Date.now() > session.expiresAt) {
    sessionStore.delete(sessionId);
    return null;
  }

  // Extend session on each valid access
  session.expiresAt = Date.now() + SESSION_DURATION_MS;
  return session;
}

/**
 * Destroy a session
 */
function destroySession(sessionId: string): void {
  sessionStore.delete(sessionId);
}

/**
 * Middleware: Check if request has valid admin session
 * Sets req.adminSession if valid, otherwise continues (caller handles auth check)
 */
export function adminSessionMiddleware(req: Request, res: Response, next: NextFunction): void {
  const sessionId = req.cookies?.admin_session;

  if (!sessionId) {
    (req as any).adminSession = null;
    return next();
  }

  const session = getSession(sessionId);
  if (!session) {
    // Session expired or invalid - clear cookie
    res.clearCookie('admin_session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    (req as any).adminSession = null;
    return next();
  }

  (req as any).adminSession = session;
  next();
}

/**
 * Middleware: Require admin authentication
 * Must be placed AFTER adminSessionMiddleware
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const session = (req as any).adminSession;

  if (!session) {
    return res.status(401).json({
      error: 'Authentification requise. Veuillez vous connecter.',
      code: 'UNAUTHORIZED',
    });
  }

  next();
}

/**
 * Handle admin login request
 * POST /api/admin/login
 * Body: { password: string }
 */
export async function handleAdminLogin(req: Request, res: Response): Promise<void> {
  const { password } = req.body;
  const ip = getClientIP(req);

  // Check rate limiting
  if (isRateLimited(ip)) {
    console.warn(`[AUTH] Login attempt from rate-limited IP: ${ip}`);
    return res.status(429).json({
      error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
      code: 'RATE_LIMITED',
    });
  }

  // Validate input
  if (!password || typeof password !== 'string') {
    recordFailedAttempt(ip);
    console.warn(`[AUTH] Login attempt with missing/invalid password from IP: ${ip}`);
    return res.status(400).json({
      error: 'Mot de passe requis.',
      code: 'INVALID_INPUT',
    });
  }

  try {
    // Import bcryptjs
    const bcrypt = require('bcryptjs');

    // Get admin password hash from environment
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    if (!passwordHash) {
      console.error('[AUTH] ADMIN_PASSWORD_HASH not configured in environment');
      return res.status(500).json({
        error: 'Configuration serveur incorrecte.',
        code: 'SERVER_ERROR',
      });
    }

    // Compare password with hash
    const passwordValid = await bcrypt.compare(password, passwordHash);

    if (!passwordValid) {
      recordFailedAttempt(ip);
      console.warn(`[AUTH] Failed login attempt from IP: ${ip}`);
      return res.status(401).json({
        error: 'Mot de passe incorrect.',
        code: 'INVALID_PASSWORD',
      });
    }

    // Password is correct - clear failed attempts and create session
    clearFailedAttempts(ip);
    const sessionId = createSession('admin');

    // Set secure HttpOnly cookie
    res.cookie('admin_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_DURATION_MS,
      path: '/',
    });

    console.log(`[AUTH] Successful admin login from IP: ${ip}`);
    return res.json({
      success: true,
      message: 'Connexion réussie.',
    });
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    recordFailedAttempt(ip);
    return res.status(500).json({
      error: 'Erreur lors du traitement de votre demande.',
      code: 'SERVER_ERROR',
    });
  }
}

/**
 * Handle admin logout request
 * POST /api/admin/logout
 */
export function handleAdminLogout(req: Request, res: Response): void {
  const sessionId = req.cookies?.admin_session;

  if (sessionId) {
    destroySession(sessionId);
  }

  // Clear cookie
  res.clearCookie('admin_session', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  console.log('[AUTH] Admin logout');
  res.json({
    success: true,
    message: 'Déconnexion réussie.',
  });
}

/**
 * Handle admin password change request
 * POST /api/admin/change-password
 * Body: { currentPassword: string, newPassword: string }
 * NOTE: This endpoint stores the new hash in environment variable persistence layer
 * In a production system, this should update a database or secure config storage
 */
export async function handleChangePassword(req: Request, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body;

  // Require authentication
  const session = (req as any).adminSession;
  if (!session) {
    return res.status(401).json({
      error: 'Authentification requise.',
      code: 'UNAUTHORIZED',
    });
  }

  // Validate input
  if (!currentPassword || !newPassword || typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return res.status(400).json({
      error: 'Les deux mots de passe sont requis.',
      code: 'INVALID_INPUT',
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      error: 'Le nouveau mot de passe doit contenir au minimum 8 caractères.',
      code: 'WEAK_PASSWORD',
    });
  }

  try {
    const bcrypt = require('bcryptjs');

    // Verify current password
    const currentHash = process.env.ADMIN_PASSWORD_HASH;
    if (!currentHash) {
      console.error('[AUTH] ADMIN_PASSWORD_HASH not configured');
      return res.status(500).json({
        error: 'Configuration serveur incorrecte.',
        code: 'SERVER_ERROR',
      });
    }

    const passwordValid = await bcrypt.compare(currentPassword, currentHash);
    if (!passwordValid) {
      console.warn('[AUTH] Password change attempt with incorrect current password');
      return res.status(401).json({
        error: 'Le mot de passe actuel est incorrect.',
        code: 'INVALID_CURRENT_PASSWORD',
      });
    }

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 10);

    console.log('[AUTH] Password change request - new hash:');
    console.log(newHash);
    console.log('\n[AUTH] Update ADMIN_PASSWORD_HASH environment variable on Vercel with this value.');

    // In production, this should persist to a secure storage (database, Vercel env, etc.)
    // For now, we log it and return the instruction
    return res.json({
      success: true,
      message: 'Mot de passe validé. Voir les logs serveur pour la nouvelle valeur de hash à configurer sur Vercel.',
      newHash: newHash,
      instruction: 'Mettez à jour ADMIN_PASSWORD_HASH sur Vercel avec la valeur "newHash" fournie.',
    });
  } catch (error) {
    console.error('[AUTH] Password change error:', error);
    return res.status(500).json({
      error: 'Erreur lors du changement de mot de passe.',
      code: 'SERVER_ERROR',
    });
  }
}

/**
 * Verify admin session (for frontend to check if logged in)
 * GET /api/admin/verify
 */
export function handleVerifySession(req: Request, res: Response): void {
  const session = (req as any).adminSession;

  if (!session) {
    return res.status(401).json({
      authenticated: false,
      message: 'Non authentifié.',
    });
  }

  res.json({
    authenticated: true,
    message: 'Session valide.',
  });
}
