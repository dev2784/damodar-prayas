CREATE TABLE "PushToken" (
"id" TEXT NOT NULL,
"userId" TEXT NOT NULL,
"token" TEXT NOT NULL,
"platform" TEXT,
"isActive" BOOLEAN NOT NULL DEFAULT true,
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" TIMESTAMP(3) NOT NULL,
CONSTRAINT "PushToken_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "PushToken_token_key" ON "PushToken"("token");
CREATE INDEX "PushToken_userId_isActive_idx" ON "PushToken"("userId","isActive");
ALTER TABLE "PushToken" ADD CONSTRAINT "PushToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
