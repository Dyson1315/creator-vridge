-- CreateTable
CREATE TABLE "artworks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "artistUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "tags" TEXT,
    "aiFeatureVector" TEXT,
    "style" TEXT,
    "category" TEXT NOT NULL DEFAULT 'ILLUSTRATION',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isPortfolio" BOOLEAN NOT NULL DEFAULT false,
    "width" INTEGER,
    "height" INTEGER,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "artworks_artistUserId_fkey" FOREIGN KEY ("artistUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_likes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "artworkId" TEXT NOT NULL,
    "isLike" BOOLEAN NOT NULL,
    "context" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_likes_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "artworks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "recommendation_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "artworkId" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "algorithmVersion" TEXT NOT NULL,
    "score" DECIMAL NOT NULL,
    "position" INTEGER NOT NULL,
    "wasClicked" BOOLEAN NOT NULL DEFAULT false,
    "wasViewed" BOOLEAN NOT NULL DEFAULT false,
    "viewDuration" INTEGER,
    "clickedAt" DATETIME,
    "viewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recommendation_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "recommendation_history_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "artworks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contract_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vtuberUserId" TEXT NOT NULL,
    "artistUserId" TEXT NOT NULL,
    "artworkId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "budgetMin" DECIMAL,
    "budgetMax" DECIMAL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "deadline" DATETIME,
    "deliverables" TEXT,
    "requirements" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedAt" DATETIME,
    "respondedAt" DATETIME,
    "acceptedAt" DATETIME,
    "rejectedAt" DATETIME,
    "completedAt" DATETIME,
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "contract_requests_vtuberUserId_fkey" FOREIGN KEY ("vtuberUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "contract_requests_artistUserId_fkey" FOREIGN KEY ("artistUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "contract_requests_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "artworks" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "artworks_artistUserId_idx" ON "artworks"("artistUserId");

-- CreateIndex
CREATE INDEX "artworks_style_idx" ON "artworks"("style");

-- CreateIndex
CREATE INDEX "artworks_category_idx" ON "artworks"("category");

-- CreateIndex
CREATE INDEX "artworks_isPublic_idx" ON "artworks"("isPublic");

-- CreateIndex
CREATE INDEX "artworks_createdAt_idx" ON "artworks"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_likes_userId_artworkId_key" ON "user_likes"("userId", "artworkId");

-- CreateIndex
CREATE INDEX "user_likes_userId_idx" ON "user_likes"("userId");

-- CreateIndex
CREATE INDEX "user_likes_artworkId_idx" ON "user_likes"("artworkId");

-- CreateIndex
CREATE INDEX "user_likes_isLike_idx" ON "user_likes"("isLike");

-- CreateIndex
CREATE INDEX "user_likes_createdAt_idx" ON "user_likes"("createdAt");

-- CreateIndex
CREATE INDEX "recommendation_history_userId_idx" ON "recommendation_history"("userId");

-- CreateIndex
CREATE INDEX "recommendation_history_artworkId_idx" ON "recommendation_history"("artworkId");

-- CreateIndex
CREATE INDEX "recommendation_history_recommendationId_idx" ON "recommendation_history"("recommendationId");

-- CreateIndex
CREATE INDEX "recommendation_history_algorithmVersion_idx" ON "recommendation_history"("algorithmVersion");

-- CreateIndex
CREATE INDEX "recommendation_history_wasClicked_idx" ON "recommendation_history"("wasClicked");

-- CreateIndex
CREATE INDEX "recommendation_history_createdAt_idx" ON "recommendation_history"("createdAt");

-- CreateIndex
CREATE INDEX "contract_requests_vtuberUserId_idx" ON "contract_requests"("vtuberUserId");

-- CreateIndex
CREATE INDEX "contract_requests_artistUserId_idx" ON "contract_requests"("artistUserId");

-- CreateIndex
CREATE INDEX "contract_requests_artworkId_idx" ON "contract_requests"("artworkId");

-- CreateIndex
CREATE INDEX "contract_requests_status_idx" ON "contract_requests"("status");

-- CreateIndex
CREATE INDEX "contract_requests_priority_idx" ON "contract_requests"("priority");

-- CreateIndex
CREATE INDEX "contract_requests_deadline_idx" ON "contract_requests"("deadline");

-- CreateIndex
CREATE INDEX "contract_requests_createdAt_idx" ON "contract_requests"("createdAt");