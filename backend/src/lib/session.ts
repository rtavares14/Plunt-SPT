import crypto from 'crypto';
import type { Request, Response } from 'express';
import type { UserModel } from '../generated/prisma/models';
import { getPrisma } from './prisma';
import { generateToken } from '../middleware/auth';

const REFRESH_TOKEN_BYTES = 48;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
// Mirrors Auth0's "reuse interval": if a just-rotated refresh token is
// presented again within this window, assume the client never received the
// new cookie (page reload, network blip) and re-issue without tripping the
// theft cascade.
const REUSE_GRACE_MS = 30 * 1000;
const IS_PROD = process.env.NODE_ENV === 'production';

export const REFRESH_COOKIE_NAME = 'plunt_refresh';

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function requestMeta(req: Request) {
  return {
    userAgent: req.get('user-agent') ?? null,
    ip: req.ip ?? null,
  };
}

async function createSession(
  req: Request,
  userId: string,
): Promise<{ token: string; sessionId: string }> {
  const token = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
  const { userAgent, ip } = requestMeta(req);
  const row = await getPrisma().session.create({
    data: {
      userId,
      refreshTokenHash: hashRefreshToken(token),
      userAgent,
      ip,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });
  return { token, sessionId: row.id };
}

// In prod the frontend (app.plunt.com) and backend (api.plunt.com) live on
// separate origins, so the refresh cookie travels on cross-site fetches and
// must be SameSite=None. SameSite=None requires Secure=true, which is fine
// because prod is always HTTPS. In dev we stay on lax + insecure for localhost.
const COOKIE_SAMESITE: 'lax' | 'none' = IS_PROD ? 'none' : 'lax';

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: COOKIE_SAMESITE,
    path: '/api/auth',
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    path: '/api/auth',
    httpOnly: true,
    secure: IS_PROD,
    sameSite: COOKIE_SAMESITE,
  });
}

export async function issueTokens(
  req: Request,
  res: Response,
  user: { id: string; email: string },
): Promise<string> {
  const { token: refreshToken, sessionId } = await createSession(req, user.id);
  setRefreshCookie(res, refreshToken);
  return generateToken({ userId: user.id, email: user.email, sessionId });
}

/**
 * Rotate the current refresh token: revoke the old session row, create a successor,
 * and chain old→new via Session.replacedById. Returns { accessToken, user } on success,
 * or null if the refresh token is unknown, revoked-and-out-of-grace, or expired (caller
 * should clear the cookie and 401).
 *
 * Reuse handling: if the presented token's session is already revoked but its
 * revokedAt falls inside REUSE_GRACE_MS, we treat it as a legitimate race (browser
 * never received the rotated cookie) — revoke the orphaned successor and issue a
 * fresh one without triggering the theft cascade. Outside the grace window, the
 * cascade fires and every live session for that user is revoked.
 */
export async function rotateSession(
  req: Request,
  res: Response,
  presentedToken: string,
): Promise<{ accessToken: string; user: UserModel } | null> {
  const prisma = getPrisma();
  const tokenHash = hashRefreshToken(presentedToken);
  const { userAgent, ip } = requestMeta(req);

  type Issued = {
    kind: 'ok';
    user: UserModel;
    sessionId: string;
    rawToken: string;
  };

  async function issueSuccessor(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    prev: { id: string; userId: string; user: UserModel },
  ): Promise<Issued> {
    const rawToken = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
    const created = await tx.session.create({
      data: {
        userId: prev.userId,
        refreshTokenHash: hashRefreshToken(rawToken),
        userAgent,
        ip,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });
    await tx.session.update({
      where: { id: prev.id },
      data: { replacedById: created.id },
    });
    return { kind: 'ok', user: prev.user, sessionId: created.id, rawToken };
  }

  const result = await prisma.$transaction(async (tx) => {
    const initial = await tx.session.findUnique({
      where: { refreshTokenHash: tokenHash },
      include: { user: true },
    });

    if (!initial) return { kind: 'unknown' as const };

    // Try to claim the rotation atomically. If `initial` is still alive, only
    // one concurrent /refresh wins the updateMany; the rest fall through and
    // are handled as revoked (same path as a legitimate replay).
    let claimed = initial;
    if (!initial.revokedAt) {
      if (initial.expiresAt < new Date()) return { kind: 'expired' as const };

      const revoke = await tx.session.updateMany({
        where: { id: initial.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      if (revoke.count === 1) {
        return issueSuccessor(tx, initial);
      }

      // Lost the race — another tx just revoked this session. Re-read so we
      // can read the winner's replacedById and apply grace recovery.
      const fresh = await tx.session.findUnique({
        where: { id: initial.id },
        include: { user: true },
      });
      if (!fresh?.revokedAt) return { kind: 'unknown' as const };
      claimed = fresh;
    }

    const inGrace =
      Date.now() - claimed.revokedAt!.getTime() <= REUSE_GRACE_MS;

    if (inGrace) {
      // Race recovery: either the prior rotation's cookie never reached the
      // client (page reload mid-flight) or two concurrent refreshes shared the
      // same cookie (React StrictMode double-fire). Revoke the orphaned
      // successor and rotate fresh from this point.
      if (claimed.replacedById) {
        await tx.session.updateMany({
          where: { id: claimed.replacedById, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      return issueSuccessor(tx, claimed);
    }

    // Outside grace → genuine reuse signal → nuke the whole family.
    await tx.session.updateMany({
      where: { userId: claimed.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { kind: 'reuse' as const };
  });

  if (result.kind !== 'ok') return null;

  setRefreshCookie(res, result.rawToken);
  const accessToken = generateToken({
    userId: result.user.id,
    email: result.user.email,
    sessionId: result.sessionId,
  });
  return { accessToken, user: result.user };
}

export async function revokeSessionByToken(presentedToken: string): Promise<void> {
  await getPrisma().session.updateMany({
    where: { refreshTokenHash: hashRefreshToken(presentedToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
