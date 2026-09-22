CREATE TYPE "AccountDeleteRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "AccountDeleteRequest" (
  "id" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "reason" TEXT,
  "status" "AccountDeleteRequestStatus" NOT NULL DEFAULT 'PENDING',
  "adminNote" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AccountDeleteRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AccountDeleteRequest_requestedById_status_createdAt_idx"
ON "AccountDeleteRequest"("requestedById", "status", "createdAt");

CREATE INDEX "AccountDeleteRequest_status_createdAt_idx"
ON "AccountDeleteRequest"("status", "createdAt");

ALTER TABLE "AccountDeleteRequest"
ADD CONSTRAINT "AccountDeleteRequest_requestedById_fkey"
FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
