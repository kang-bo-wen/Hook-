ALTER TABLE "UserProfile"
ADD COLUMN "faculty" TEXT,
ADD COLUMN "major" TEXT,
ADD COLUMN "campus" TEXT,
ADD COLUMN "birthYear" INTEGER,
ADD COLUMN "heightCm" INTEGER,
ADD COLUMN "bodyType" TEXT,
ADD COLUMN "mbti" TEXT,
ADD COLUMN "futurePlan" TEXT,
ADD COLUMN "relationshipPace" TEXT,
ADD COLUMN "conflictStyle" TEXT;

ALTER TABLE "Hook"
ADD COLUMN "moodTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "allowPrivateChatRequest" BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN "revealNickname" BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN "revealProfileTags" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "ReceiverPreference"
ADD COLUMN "expectedGrades" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "minHeightCm" INTEGER,
ADD COLUMN "maxHeightCm" INTEGER,
ADD COLUMN "expectedFuturePlans" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "campusPreference" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "departmentAvoidance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "personalitySimilarity" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "relationshipPace" TEXT,
ADD COLUMN "conflictStyle" TEXT,
ADD COLUMN "currentMood" TEXT,
ADD COLUMN "writingStyle" TEXT,
ADD COLUMN "dailyReceiveLimit" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "strictness" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_birthYear_check" CHECK ("birthYear" IS NULL OR ("birthYear" BETWEEN 1980 AND 2020));
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_heightCm_check" CHECK ("heightCm" IS NULL OR ("heightCm" BETWEEN 120 AND 230));
ALTER TABLE "ReceiverPreference" ADD CONSTRAINT "ReceiverPreference_height_range_check" CHECK (("minHeightCm" IS NULL OR "minHeightCm" BETWEEN 120 AND 230) AND ("maxHeightCm" IS NULL OR "maxHeightCm" BETWEEN 120 AND 230) AND ("minHeightCm" IS NULL OR "maxHeightCm" IS NULL OR "minHeightCm" <= "maxHeightCm"));
ALTER TABLE "ReceiverPreference" ADD CONSTRAINT "ReceiverPreference_sliders_check" CHECK ("campusPreference" BETWEEN -1 AND 1 AND "departmentAvoidance" BETWEEN -1 AND 1 AND "personalitySimilarity" BETWEEN -1 AND 1 AND "strictness" BETWEEN -1 AND 1);
ALTER TABLE "ReceiverPreference" ADD CONSTRAINT "ReceiverPreference_daily_limit_check" CHECK ("dailyReceiveLimit" BETWEEN 1 AND 2);
