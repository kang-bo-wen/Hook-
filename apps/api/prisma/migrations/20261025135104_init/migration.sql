-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "HookStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'WAITING_MATCH', 'ASSIGNED', 'ANSWERED', 'CLOSED', 'EXPIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ASSIGNED', 'VIEWED', 'ANSWERED', 'DECLINED', 'REPORTED', 'EXPIRED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PreferenceScope" AS ENUM ('LONG_TERM', 'RECENT', 'NEXT_HOOK');

-- CreateEnum
CREATE TYPE "MatchActionType" AS ENUM ('THANK', 'INTERESTED', 'REJECT', 'REPORT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nickname" TEXT,
    "school" TEXT,
    "grade" TEXT,
    "city" TEXT,
    "bio" TEXT,
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relationshipGoal" TEXT,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiverPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" "PreferenceScope" NOT NULL,
    "topicTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "responseModes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "depthLevel" TEXT,
    "excludedTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "naturalLanguage" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReceiverPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hook" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "preferredResponses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "depthLevel" TEXT,
    "excludedResponses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "HookStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HookAssignment" (
    "id" TEXT NOT NULL,
    "hookId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "matchReason" TEXT,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "HookAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HookReply" (
    "id" TEXT NOT NULL,
    "hookId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HookReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchAction" (
    "id" TEXT NOT NULL,
    "hookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "MatchActionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "ReceiverPreference_userId_scope_effectiveUntil_idx" ON "ReceiverPreference"("userId", "scope", "effectiveUntil");

-- CreateIndex
CREATE INDEX "Hook_authorId_status_idx" ON "Hook"("authorId", "status");

-- CreateIndex
CREATE INDEX "Hook_status_createdAt_idx" ON "Hook"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HookAssignment_hookId_key" ON "HookAssignment"("hookId");

-- CreateIndex
CREATE INDEX "HookAssignment_recipientId_assignedAt_idx" ON "HookAssignment"("recipientId", "assignedAt");

-- CreateIndex
CREATE UNIQUE INDEX "HookReply_assignmentId_key" ON "HookReply"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchAction_hookId_userId_key" ON "MatchAction"("hookId", "userId");

-- CreateIndex
CREATE INDEX "Report_targetType_targetId_idx" ON "Report"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiverPreference" ADD CONSTRAINT "ReceiverPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hook" ADD CONSTRAINT "Hook_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HookAssignment" ADD CONSTRAINT "HookAssignment_hookId_fkey" FOREIGN KEY ("hookId") REFERENCES "Hook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HookAssignment" ADD CONSTRAINT "HookAssignment_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HookReply" ADD CONSTRAINT "HookReply_hookId_fkey" FOREIGN KEY ("hookId") REFERENCES "Hook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HookReply" ADD CONSTRAINT "HookReply_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "HookAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HookReply" ADD CONSTRAINT "HookReply_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchAction" ADD CONSTRAINT "MatchAction_hookId_fkey" FOREIGN KEY ("hookId") REFERENCES "Hook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchAction" ADD CONSTRAINT "MatchAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
