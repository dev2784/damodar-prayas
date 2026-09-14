CREATE TYPE "UserRole" AS ENUM ('MEMBER','ADMIN','SUPER_ADMIN');
CREATE TYPE "Language" AS ENUM ('HI','EN');
CREATE TYPE "DarziCategory" AS ENUM ('JUNA_GUJARATI','PIPA','NAMDEV');
CREATE TYPE "Gender" AS ENUM ('MALE','FEMALE','OTHER');
CREATE TYPE "ProfileFor" AS ENUM ('SELF','SON','DAUGHTER','BROTHER','SISTER','RELATIVE');
CREATE TYPE "MaritalStatus" AS ENUM ('NEVER_MARRIED','DIVORCED','WIDOWED','SEPARATED');
CREATE TYPE "MatrimonyProfileStatus" AS ENUM ('DRAFT','PENDING','APPROVED','REJECTED','SUSPENDED','MARRIED');
CREATE TYPE "MediaStatus" AS ENUM ('PENDING','APPROVED','REJECTED');
CREATE TYPE "InterestStatus" AS ENUM ('PENDING','ACCEPTED','REJECTED','WITHDRAWN');
CREATE TYPE "ContactRequestStatus" AS ENUM ('PENDING','ACCEPTED','REJECTED','WITHDRAWN');
CREATE TYPE "PostCategory" AS ENUM ('NEWS','EVENT','ADVERTISEMENT','REQUEST','GRATITUDE','WISHES');
CREATE TYPE "PostStatus" AS ENUM ('DRAFT','PENDING','PUBLISHED','REJECTED','ARCHIVED');
CREATE TYPE "ReportReason" AS ENUM ('FAKE_PROFILE','WRONG_INFORMATION','INAPPROPRIATE_CONTENT','DUPLICATE_PROFILE','SPAM','OTHER');
CREATE TYPE "ReportStatus" AS ENUM ('OPEN','REVIEWING','RESOLVED','DISMISSED');
CREATE TYPE "NotificationType" AS ENUM ('INTEREST_RECEIVED','INTEREST_ACCEPTED','INTEREST_REJECTED','CONTACT_REQUEST','CONTACT_ACCEPTED','PROFILE_APPROVED','PROFILE_REJECTED','COMMUNITY_POST','GENERAL');

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "phone" TEXT NOT NULL UNIQUE,
  "email" TEXT UNIQUE,
  "firstName" TEXT,
  "lastName" TEXT,
  "preferredLanguage" "Language" NOT NULL DEFAULT 'HI',
  "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
  "isPhoneVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "MatrimonyProfile" (
  "id" TEXT PRIMARY KEY,
  "createdById" TEXT NOT NULL,
  "profileFor" "ProfileFor" NOT NULL,
  "category" "DarziCategory" NOT NULL,
  "gender" "Gender" NOT NULL,
  "firstName" TEXT NOT NULL,
  "middleName" TEXT,
  "lastName" TEXT NOT NULL,
  "dateOfBirth" TIMESTAMP(3) NOT NULL,
  "heightCm" INTEGER,
  "maritalStatus" "MaritalStatus" NOT NULL DEFAULT 'NEVER_MARRIED',
  "contactPhone" TEXT,
  "contactEmail" TEXT,
  "education" TEXT,
  "occupation" TEXT,
  "companyOrBusiness" TEXT,
  "annualIncome" INTEGER,
  "gotra" TEXT,
  "manglik" BOOLEAN,
  "birthTime" TEXT,
  "birthPlace" TEXT,
  "currentCity" TEXT,
  "district" TEXT,
  "state" TEXT,
  "country" TEXT NOT NULL DEFAULT 'India',
  "fullAddress" TEXT,
  "nativePlace" TEXT,
  "fatherName" TEXT,
  "fatherOccupation" TEXT,
  "motherName" TEXT,
  "motherOccupation" TEXT,
  "brothers" INTEGER NOT NULL DEFAULT 0,
  "sisters" INTEGER NOT NULL DEFAULT 0,
  "familyDetails" TEXT,
  "about" TEXT,
  "status" "MatrimonyProfileStatus" NOT NULL DEFAULT 'DRAFT',
  "rejectionReason" TEXT,
  "isFeatured" BOOLEAN NOT NULL DEFAULT FALSE,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "MatrimonyProfile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "PartnerPreference" (
  "id" TEXT PRIMARY KEY,
  "matrimonyProfileId" TEXT NOT NULL UNIQUE,
  "minAge" INTEGER,
  "maxAge" INTEGER,
  "minHeightCm" INTEGER,
  "maxHeightCm" INTEGER,
  "maritalStatuses" "MaritalStatus"[] NOT NULL DEFAULT ARRAY[]::"MaritalStatus"[],
  "preferredEducation" TEXT,
  "preferredOccupation" TEXT,
  "preferredLocation" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PartnerPreference_matrimonyProfileId_fkey" FOREIGN KEY ("matrimonyProfileId") REFERENCES "MatrimonyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ProfilePhoto" (
  "id" TEXT PRIMARY KEY,
  "matrimonyProfileId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "storageKey" TEXT,
  "status" "MediaStatus" NOT NULL DEFAULT 'PENDING',
  "isPrimary" BOOLEAN NOT NULL DEFAULT FALSE,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProfilePhoto_matrimonyProfileId_fkey" FOREIGN KEY ("matrimonyProfileId") REFERENCES "MatrimonyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Kundali" (
  "id" TEXT PRIMARY KEY,
  "matrimonyProfileId" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "storageKey" TEXT,
  "fileName" TEXT,
  "mimeType" TEXT,
  "status" "MediaStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Kundali_matrimonyProfileId_fkey" FOREIGN KEY ("matrimonyProfileId") REFERENCES "MatrimonyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Interest" (
  "id" TEXT PRIMARY KEY,
  "senderProfileId" TEXT NOT NULL,
  "receiverProfileId" TEXT NOT NULL,
  "status" "InterestStatus" NOT NULL DEFAULT 'PENDING',
  "message" TEXT,
  "respondedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Interest_senderProfileId_fkey" FOREIGN KEY ("senderProfileId") REFERENCES "MatrimonyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Interest_receiverProfileId_fkey" FOREIGN KEY ("receiverProfileId") REFERENCES "MatrimonyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Interest_sender_receiver_key" UNIQUE ("senderProfileId","receiverProfileId")
);

CREATE TABLE "ContactRequest" (
  "id" TEXT PRIMARY KEY,
  "senderProfileId" TEXT NOT NULL,
  "receiverProfileId" TEXT NOT NULL,
  "status" "ContactRequestStatus" NOT NULL DEFAULT 'PENDING',
  "respondedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContactRequest_senderProfileId_fkey" FOREIGN KEY ("senderProfileId") REFERENCES "MatrimonyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ContactRequest_receiverProfileId_fkey" FOREIGN KEY ("receiverProfileId") REFERENCES "MatrimonyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ContactRequest_sender_receiver_key" UNIQUE ("senderProfileId","receiverProfileId")
);

CREATE TABLE "Shortlist" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "matrimonyProfileId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Shortlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Shortlist_matrimonyProfileId_fkey" FOREIGN KEY ("matrimonyProfileId") REFERENCES "MatrimonyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Shortlist_user_profile_key" UNIQUE ("userId","matrimonyProfileId")
);

CREATE TABLE "ProfileReport" (
  "id" TEXT PRIMARY KEY,
  "reporterId" TEXT NOT NULL,
  "matrimonyProfileId" TEXT NOT NULL,
  "reason" "ReportReason" NOT NULL,
  "details" TEXT,
  "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
  "adminNote" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProfileReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ProfileReport_matrimonyProfileId_fkey" FOREIGN KEY ("matrimonyProfileId") REFERENCES "MatrimonyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CommunityPost" (
  "id" TEXT PRIMARY KEY,
  "createdById" TEXT,
  "category" "PostCategory" NOT NULL,
  "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
  "bannerUrl" TEXT,
  "bannerStorageKey" TEXT,
  "contactName" TEXT,
  "contactPhone" TEXT,
  "location" TEXT,
  "eventDate" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "isFeatured" BOOLEAN NOT NULL DEFAULT FALSE,
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "CommunityPost_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "CommunityPostTranslation" (
  "id" TEXT PRIMARY KEY,
  "postId" TEXT NOT NULL,
  "language" "Language" NOT NULL,
  "title" TEXT NOT NULL,
  "details" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommunityPostTranslation_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CommunityPostTranslation_post_language_key" UNIQUE ("postId","language")
);

CREATE TABLE "Committee" (
  "id" TEXT PRIMARY KEY,
  "createdById" TEXT,
  "bannerUrl" TEXT,
  "bannerStorageKey" TEXT,
  "logoUrl" TEXT,
  "city" TEXT,
  "district" TEXT,
  "state" TEXT,
  "address" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Committee_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "CommitteeTranslation" (
  "id" TEXT PRIMARY KEY,
  "committeeId" TEXT NOT NULL,
  "language" "Language" NOT NULL,
  "name" TEXT NOT NULL,
  "details" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommitteeTranslation_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CommitteeTranslation_committee_language_key" UNIQUE ("committeeId","language")
);

CREATE TABLE "CommitteeMember" (
  "id" TEXT PRIMARY KEY,
  "committeeId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "designationHi" TEXT,
  "designationEn" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "photoUrl" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommitteeMember_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Notification" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "titleHi" TEXT NOT NULL,
  "titleEn" TEXT,
  "bodyHi" TEXT,
  "bodyEn" TEXT,
  "data" JSONB,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "actorUserId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "User_isActive_createdAt_idx" ON "User"("isActive","createdAt");
CREATE INDEX "MatrimonyProfile_status_gender_createdAt_idx" ON "MatrimonyProfile"("status","gender","createdAt");
CREATE INDEX "MatrimonyProfile_category_status_idx" ON "MatrimonyProfile"("category","status");
CREATE INDEX "MatrimonyProfile_state_district_currentCity_idx" ON "MatrimonyProfile"("state","district","currentCity");
CREATE INDEX "MatrimonyProfile_dateOfBirth_idx" ON "MatrimonyProfile"("dateOfBirth");
CREATE INDEX "MatrimonyProfile_isFeatured_status_idx" ON "MatrimonyProfile"("isFeatured","status");
CREATE INDEX "ProfilePhoto_profile_status_sort_idx" ON "ProfilePhoto"("matrimonyProfileId","status","sortOrder");
CREATE INDEX "Kundali_profile_status_idx" ON "Kundali"("matrimonyProfileId","status");
CREATE INDEX "Interest_receiver_status_created_idx" ON "Interest"("receiverProfileId","status","createdAt");
CREATE INDEX "Interest_sender_status_created_idx" ON "Interest"("senderProfileId","status","createdAt");
CREATE INDEX "ContactRequest_receiver_status_created_idx" ON "ContactRequest"("receiverProfileId","status","createdAt");
CREATE INDEX "Shortlist_user_created_idx" ON "Shortlist"("userId","createdAt");
CREATE INDEX "ProfileReport_status_created_idx" ON "ProfileReport"("status","createdAt");
CREATE INDEX "ProfileReport_profile_status_idx" ON "ProfileReport"("matrimonyProfileId","status");
CREATE INDEX "CommunityPost_status_category_published_idx" ON "CommunityPost"("status","category","publishedAt");
CREATE INDEX "CommunityPost_featured_status_published_idx" ON "CommunityPost"("isFeatured","status","publishedAt");
CREATE INDEX "CommunityPost_expiresAt_idx" ON "CommunityPost"("expiresAt");
CREATE INDEX "Committee_active_sort_idx" ON "Committee"("isActive","sortOrder");
CREATE INDEX "Committee_state_district_city_idx" ON "Committee"("state","district","city");
CREATE INDEX "CommitteeMember_committee_active_sort_idx" ON "CommitteeMember"("committeeId","isActive","sortOrder");
CREATE INDEX "Notification_user_read_created_idx" ON "Notification"("userId","readAt","createdAt");
CREATE INDEX "AuditLog_actor_created_idx" ON "AuditLog"("actorUserId","createdAt");
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entityType","entityId");
