CREATE TABLE "mobile_refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "device" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mobile_refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mobile_refresh_tokens_tokenHash_key" ON "mobile_refresh_tokens"("tokenHash");
CREATE INDEX "mobile_refresh_tokens_userId_idx" ON "mobile_refresh_tokens"("userId");
CREATE INDEX "mobile_refresh_tokens_expiresAt_idx" ON "mobile_refresh_tokens"("expiresAt");

ALTER TABLE "mobile_refresh_tokens" ADD CONSTRAINT "mobile_refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
