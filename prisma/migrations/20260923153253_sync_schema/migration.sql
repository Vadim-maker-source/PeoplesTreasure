ALTER TABLE "public"."favorites" DROP CONSTRAINT "favorites_ethnicGroupId_fkey";

ALTER TABLE "public"."favorites" DROP CONSTRAINT "favorites_userId_fkey";

ALTER TABLE "public"."posts" DROP CONSTRAINT "posts_ethnicGroupId_fkey";

ALTER TABLE "posts" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE "users" DROP COLUMN "ethnicities",
ADD COLUMN     "unreadSupportCount" INTEGER DEFAULT 0,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;

DROP TABLE "public"."ethnic_groups";

DROP TABLE "public"."favorites";

CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ethnicGroupId" TEXT NOT NULL,
    "ethnicGroupName" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL DEFAULT 0,
    "answers" JSONB,
    "certificateUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Support" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "answer" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "isReadByUser" BOOLEAN NOT NULL DEFAULT false,
    "isReadByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Support_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "courses_userId_ethnicGroupId_key" ON "courses"("userId", "ethnicGroupId");

CREATE INDEX "Support_userId_idx" ON "Support"("userId");

CREATE INDEX "Support_status_idx" ON "Support"("status");

CREATE INDEX "Support_createdAt_idx" ON "Support"("createdAt");

CREATE INDEX "Support_isReadByUser_idx" ON "Support"("isReadByUser");

ALTER TABLE "courses" ADD CONSTRAINT "courses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Support" ADD CONSTRAINT "Support_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
