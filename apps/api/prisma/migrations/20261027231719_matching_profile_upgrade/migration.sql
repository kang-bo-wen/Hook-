ALTER TABLE "UserProfile"
ADD COLUMN "personalityTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "availableTimes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "communicationStyle" TEXT,
ADD COLUMN "profileCompletedAt" TIMESTAMP(3);

CREATE INDEX "HookAssignment_recipientId_status_assignedAt_idx"
ON "HookAssignment"("recipientId", "status", "assignedAt");
