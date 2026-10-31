ALTER TABLE "HookReply"
ADD COLUMN "wantsPrivateChat" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "authorResponse" TEXT,
ADD COLUMN "authorRespondedAt" TIMESTAMP(3);
