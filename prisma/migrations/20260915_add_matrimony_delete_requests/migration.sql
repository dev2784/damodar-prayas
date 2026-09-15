CREATE TYPE "MatrimonyDeleteRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "MatrimonyDeleteRequest" (
  "id" TEXT NOT NULL,
  "matrimonyProfileId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" "MatrimonyDeleteRequestStatus" NOT NULL DEFAULT 'PENDING',
  "adminNote" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MatrimonyDeleteRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MatrimonyDeleteRequest_matrimonyProfileId_status_createdAt_idx"
  ON "MatrimonyDeleteRequest"("matrimonyProfileId", "status", "createdAt");
CREATE INDEX "MatrimonyDeleteRequest_requestedById_status_createdAt_idx"
  ON "MatrimonyDeleteRequest"("requestedById", "status", "createdAt");

ALTER TABLE "MatrimonyDeleteRequest"
  ADD CONSTRAINT "MatrimonyDeleteRequest_matrimonyProfileId_fkey"
  FOREIGN KEY ("matrimonyProfileId") REFERENCES "MatrimonyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatrimonyDeleteRequest"
  ADD CONSTRAINT "MatrimonyDeleteRequest_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
