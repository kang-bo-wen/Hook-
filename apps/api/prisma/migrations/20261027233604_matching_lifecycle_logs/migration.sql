ALTER TABLE "HookAssignment"
ADD COLUMN "expiresAt" TIMESTAMP(3);

UPDATE "HookAssignment"
SET "expiresAt" = "assignedAt" + INTERVAL '48 hours'
WHERE "expiresAt" IS NULL;

ALTER TABLE "HookAssignment"
ALTER COLUMN "expiresAt" SET NOT NULL;

CREATE TABLE "MatchLog" (
  "id" TEXT NOT NULL,
  "hookId" TEXT NOT NULL,
  "recipientId" TEXT,
  "event" TEXT NOT NULL,
  "score" DOUBLE PRECISION,
  "reason" TEXT,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MatchLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MatchLog_hookId_createdAt_idx" ON "MatchLog"("hookId", "createdAt");
CREATE INDEX "MatchLog_recipientId_createdAt_idx" ON "MatchLog"("recipientId", "createdAt");
CREATE INDEX "MatchLog_event_createdAt_idx" ON "MatchLog"("event", "createdAt");

ALTER TABLE "MatchLog" ADD CONSTRAINT "MatchLog_hookId_fkey" FOREIGN KEY ("hookId") REFERENCES "Hook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchLog" ADD CONSTRAINT "MatchLog_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;