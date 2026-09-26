CREATE TYPE "SupportCategory" AS ENUM ('FEEDBACK', 'COMPLAINT', 'CONTACT');
CREATE TYPE "SupportStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');
CREATE TABLE "SupportTicket" (
 "id" TEXT NOT NULL,
 "userId" TEXT,
 "category" "SupportCategory" NOT NULL,
 "subject" TEXT NOT NULL,
 "message" TEXT NOT NULL,
 "status" "SupportStatus" NOT NULL DEFAULT 'OPEN',
 "adminNote" TEXT NOT NULL DEFAULT '',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SupportTicket_status_createdAt_idx" ON "SupportTicket"("status", "createdAt");
CREATE INDEX "SupportTicket_category_createdAt_idx" ON "SupportTicket"("category", "createdAt");
CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId");
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
