-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "shopId" TEXT,
    "email" TEXT,
    "shopName" TEXT,
    "domain" TEXT,
    "myshopifyDomain" TEXT,
    "primaryDomain" TEXT,
    "primaryLocale" TEXT,
    "ownerName" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "country" TEXT,
    "countryCode" TEXT,
    "city" TEXT,
    "province" TEXT,
    "address" TEXT,
    "zip" TEXT,
    "phone" TEXT,
    "currency" TEXT,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "language" TEXT NOT NULL DEFAULT 'en',
    "appLanguage" TEXT,
    "timezone" TEXT,
    "ianaTimezone" TEXT,
    "planName" TEXT,
    "planDisplayName" TEXT,
    "isShopifyPlus" BOOLEAN NOT NULL DEFAULT false,
    "isPartnerDev" BOOLEAN NOT NULL DEFAULT false,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "notifications" BOOLEAN NOT NULL DEFAULT true,
    "installedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTrial" BOOLEAN NOT NULL DEFAULT true,
    "trialEndsAt" DATETIME,
    "settings" TEXT DEFAULT '{}',
    "metadata" TEXT DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("address", "appLanguage", "city", "country", "countryCode", "createdAt", "currency", "currencyCode", "domain", "email", "firstName", "ianaTimezone", "id", "installedAt", "isActive", "isPartnerDev", "isShopifyPlus", "isTrial", "language", "lastLoginAt", "lastName", "metadata", "myshopifyDomain", "notifications", "ownerName", "phone", "planDisplayName", "planName", "province", "settings", "shop", "shopName", "theme", "timezone", "trialEndsAt", "updatedAt", "zip") SELECT "address", "appLanguage", "city", "country", "countryCode", "createdAt", "currency", "currencyCode", "domain", "email", "firstName", "ianaTimezone", "id", "installedAt", "isActive", "isPartnerDev", "isShopifyPlus", "isTrial", "language", "lastLoginAt", "lastName", "metadata", "myshopifyDomain", "notifications", "ownerName", "phone", "planDisplayName", "planName", "province", "settings", "shop", "shopName", "theme", "timezone", "trialEndsAt", "updatedAt", "zip" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_shop_key" ON "User"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
