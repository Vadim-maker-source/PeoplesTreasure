import "server-only";

import { createHash } from "crypto";
import { prisma } from "./prisma";

function rateLimitKey(scope: string, identifier: string) {
  return createHash("sha256")
    .update(`${scope}:${identifier.trim().toLowerCase()}`)
    .digest("hex");
}

export async function consumeRateLimit(
  scope: string,
  identifier: string,
  limit: number,
  windowMs: number,
) {
  const key = rateLimitKey(scope, identifier);
  const now = new Date();
  const nextResetAt = new Date(now.getTime() + windowMs);
  const [current] = await prisma.$queryRaw<Array<{ count: number; resetAt: Date }>>`
    INSERT INTO "rate_limits" ("key", "count", "resetAt", "updatedAt")
    VALUES (${key}, 1, ${nextResetAt}, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "rate_limits"."resetAt" <= ${now} THEN 1
        ELSE "rate_limits"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "rate_limits"."resetAt" <= ${now} THEN ${nextResetAt}
        ELSE "rate_limits"."resetAt"
      END,
      "updatedAt" = ${now}
    RETURNING "count", "resetAt"
  `;

  const allowed = current.count <= limit;
  const retryAfterSeconds = allowed
    ? 0
    : Math.max(1, Math.ceil((current.resetAt.getTime() - now.getTime()) / 1000));

  return {
    allowed,
    remaining: Math.max(0, limit - current.count),
    retryAfterSeconds,
  };
}

export async function resetRateLimit(scope: string, identifier: string) {
  await prisma.rateLimit.deleteMany({ where: { key: rateLimitKey(scope, identifier) } });
}
