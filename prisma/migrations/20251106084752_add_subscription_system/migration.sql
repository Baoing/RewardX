-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "shopifyChargeId" TEXT,
    "shopifyConfirmUrl" TEXT,
    "planType" TEXT NOT NULL,
    "billingCycle" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "originalPrice" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "quotaLimit" INTEGER NOT NULL,
    "quotaUsed" INTEGER NOT NULL DEFAULT 0,
    "quotaResetAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "isTrial" BOOLEAN NOT NULL DEFAULT false,
    "trialDays" INTEGER NOT NULL DEFAULT 0,
    "trialStartAt" DATETIME,
    "trialEndAt" DATETIME,
    "currentPeriodStart" DATETIME NOT NULL,
    "currentPeriodEnd" DATETIME NOT NULL,
    "cancelAt" DATETIME,
    "cancelledAt" DATETIME,
    "discountId" TEXT,
    "discountAmount" REAL NOT NULL DEFAULT 0,
    "discountType" TEXT,
    "isManualGrant" BOOLEAN NOT NULL DEFAULT false,
    "grantedBy" TEXT,
    "grantReason" TEXT,
    "grantExpiresAt" DATETIME,
    "metadata" TEXT DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Subscription_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UsageRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "quotaUsed" INTEGER NOT NULL DEFAULT 1,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "metadata" TEXT DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UsageRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UsageRecord_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "shopifyChargeId" TEXT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "billingPeriodStart" DATETIME,
    "billingPeriodEnd" DATETIME,
    "invoiceUrl" TEXT,
    "metadata" TEXT DEFAULT '{}',
    "paidAt" DATETIME,
    "refundedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Discount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "applicablePlans" TEXT,
    "billingCycles" TEXT,
    "maxUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "maxUsesPerUser" INTEGER DEFAULT 1,
    "startsAt" DATETIME,
    "expiresAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "internalNotes" TEXT,
    "metadata" TEXT DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserDiscount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "discountId" TEXT NOT NULL,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserDiscount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserDiscount_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "shop" TEXT,
    "eventType" TEXT NOT NULL,
    "eventData" TEXT DEFAULT '{}',
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_shopifyChargeId_key" ON "Subscription"("shopifyChargeId");

-- CreateIndex
CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");

-- CreateIndex
CREATE INDEX "Subscription_shopifyChargeId_idx" ON "Subscription"("shopifyChargeId");

-- CreateIndex
CREATE INDEX "UsageRecord_userId_createdAt_idx" ON "UsageRecord"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UsageRecord_subscriptionId_createdAt_idx" ON "UsageRecord"("subscriptionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_shopifyChargeId_key" ON "Payment"("shopifyChargeId");

-- CreateIndex
CREATE INDEX "Payment_userId_createdAt_idx" ON "Payment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_shopifyChargeId_idx" ON "Payment"("shopifyChargeId");

-- CreateIndex
CREATE UNIQUE INDEX "Discount_code_key" ON "Discount"("code");

-- CreateIndex
CREATE INDEX "Discount_code_isActive_idx" ON "Discount"("code", "isActive");

-- CreateIndex
CREATE INDEX "UserDiscount_userId_idx" ON "UserDiscount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDiscount_userId_discountId_key" ON "UserDiscount"("userId", "discountId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_timestamp_idx" ON "AnalyticsEvent"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_timestamp_idx" ON "AnalyticsEvent"("eventType", "timestamp");
