import "server-only";

import { createHash, randomBytes } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";

const accessLifetimeSeconds = 15 * 60;
const refreshLifetimeMs = 30 * 24 * 60 * 60 * 1000;
const issuer = "peoples-treasure-mobile";
const audience = "peoples-treasure-api";
const sourceSecret = process.env.NEXTAUTH_SECRET;

if (!sourceSecret || sourceSecret.length < 32) {
  throw new Error("NEXTAUTH_SECRET должен содержать не менее 32 символов");
}

const signingKey = createHash("sha256").update(`${sourceSecret}:mobile-api`).digest();

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function createAccessToken(userId: string, role: string) {
  return new SignJWT({ role, type: "access" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(`${accessLifetimeSeconds}s`)
    .sign(signingKey);
}

function newRefreshToken() {
  return randomBytes(48).toString("base64url");
}

export async function issueMobileSession(userId: string, role: string, device?: string) {
  const refreshToken = newRefreshToken();
  await prisma.mobileRefreshToken.create({
    data: {
      userId,
      tokenHash: tokenHash(refreshToken),
      device: device?.trim().slice(0, 120) || null,
      expiresAt: new Date(Date.now() + refreshLifetimeMs),
    },
  });

  return {
    accessToken: await createAccessToken(userId, role),
    refreshToken,
    expiresIn: accessLifetimeSeconds,
  };
}

export async function rotateMobileSession(rawToken: string, device?: string) {
  const stored = await prisma.mobileRefreshToken.findUnique({
    where: { tokenHash: tokenHash(rawToken) },
    include: { user: { select: { id: true, role: true } } },
  });
  if (!stored || stored.revokedAt || stored.expiresAt <= new Date()) return null;

  const refreshToken = newRefreshToken();
  await prisma.$transaction([
    prisma.mobileRefreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    }),
    prisma.mobileRefreshToken.create({
      data: {
        userId: stored.userId,
        tokenHash: tokenHash(refreshToken),
        device: device?.trim().slice(0, 120) || stored.device,
        expiresAt: new Date(Date.now() + refreshLifetimeMs),
      },
    }),
  ]);

  return {
    accessToken: await createAccessToken(stored.user.id, stored.user.role),
    refreshToken,
    expiresIn: accessLifetimeSeconds,
  };
}

export async function revokeMobileSession(rawToken: string) {
  await prisma.mobileRefreshToken.updateMany({
    where: { tokenHash: tokenHash(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function requireMobileUser(request: NextRequest, requireAdmin = false) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  try {
    const token = authorization.slice(7).trim();
    const verified = await jwtVerify(token, signingKey, { issuer, audience });
    if (verified.payload.type !== "access" || !verified.payload.sub) return null;
    const user = await prisma.user.findUnique({ where: { id: verified.payload.sub } });
    if (!user || (requireAdmin && user.role !== "ADMIN")) return null;
    return user;
  } catch {
    return null;
  }
}
