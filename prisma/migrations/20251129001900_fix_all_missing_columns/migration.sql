-- Fix all missing columns: Add missing columns from schema.prisma if they don't exist
-- This migration ensures all columns from schema.prisma exist in the database
-- Safe to run multiple times (idempotent)

DO $$
BEGIN
    -- ============================================
    -- Fix Session table
    -- ============================================
    
    -- Add order column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Session' 
        AND column_name = 'order'
    ) THEN
        ALTER TABLE "Session" ADD COLUMN "order" TEXT;
    END IF;

    -- Add orderVerified column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Session' 
        AND column_name = 'orderVerified'
    ) THEN
        ALTER TABLE "Session" ADD COLUMN "orderVerified" BOOLEAN DEFAULT false;
    END IF;

    -- Add collaborator column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Session' 
        AND column_name = 'collaborator'
    ) THEN
        ALTER TABLE "Session" ADD COLUMN "collaborator" BOOLEAN DEFAULT false;
    END IF;

    -- ============================================
    -- Fix User table
    -- ============================================
    
    -- Add order column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'order'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "order" TEXT;
    END IF;

    -- Add shopId column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'shopId'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "shopId" TEXT;
    END IF;

    -- Add shopName column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'shopName'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "shopName" TEXT;
    END IF;

    -- Add domain column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'domain'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "domain" TEXT;
    END IF;

    -- Add myshopifyDomain column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'myshopifyDomain'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "myshopifyDomain" TEXT;
    END IF;

    -- Add primaryDomain column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'primaryDomain'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "primaryDomain" TEXT;
    END IF;

    -- Add primaryLocale column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'primaryLocale'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "primaryLocale" TEXT;
    END IF;

    -- Add ownerName column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'ownerName'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "ownerName" TEXT;
    END IF;

    -- Add firstName column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'firstName'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "firstName" TEXT;
    END IF;

    -- Add lastName column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'lastName'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "lastName" TEXT;
    END IF;

    -- Add country column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'country'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "country" TEXT;
    END IF;

    -- Add countryCode column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'countryCode'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "countryCode" TEXT;
    END IF;

    -- Add city column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'city'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "city" TEXT;
    END IF;

    -- Add province column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'province'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "province" TEXT;
    END IF;

    -- Add address column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'address'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "address" TEXT;
    END IF;

    -- Add zip column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'zip'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "zip" TEXT;
    END IF;

    -- Add phone column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "phone" TEXT;
    END IF;

    -- Add currency column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'currency'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "currency" TEXT;
    END IF;

    -- Add currencyCode column if it doesn't exist (with default)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'currencyCode'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "currencyCode" TEXT NOT NULL DEFAULT 'USD';
    END IF;

    -- Add language column if it doesn't exist (with default)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'language'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en';
    END IF;

    -- Add appLanguage column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'appLanguage'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "appLanguage" TEXT;
    END IF;

    -- Add timezone column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'timezone'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "timezone" TEXT;
    END IF;

    -- Add ianaTimezone column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'ianaTimezone'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "ianaTimezone" TEXT;
    END IF;

    -- Add planName column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'planName'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "planName" TEXT;
    END IF;

    -- Add planDisplayName column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'planDisplayName'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "planDisplayName" TEXT;
    END IF;

    -- Add isShopifyPlus column if it doesn't exist (with default)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'isShopifyPlus'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "isShopifyPlus" BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- Add isPartnerDev column if it doesn't exist (with default)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'isPartnerDev'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "isPartnerDev" BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- Add theme column if it doesn't exist (with default)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'theme'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'light';
    END IF;

    -- Add notifications column if it doesn't exist (with default)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'notifications'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "notifications" BOOLEAN NOT NULL DEFAULT true;
    END IF;

    -- Add appRating column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'appRating'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "appRating" INTEGER;
    END IF;

    -- Add appReview column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'appReview'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "appReview" TEXT;
    END IF;

    -- Add reviewedAt column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'reviewedAt'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "reviewedAt" TIMESTAMP(3);
    END IF;

    -- Add installedAt column if it doesn't exist (with default)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'installedAt'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Add lastLoginAt column if it doesn't exist (with default)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'lastLoginAt'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Add lastSyncAt column if it doesn't exist (with default)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'lastSyncAt'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Add isActive column if it doesn't exist (with default)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'isActive'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
    END IF;

    -- Add isTrial column if it doesn't exist (with default)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'isTrial'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "isTrial" BOOLEAN NOT NULL DEFAULT true;
    END IF;

    -- Add trialEndsAt column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'trialEndsAt'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "trialEndsAt" TIMESTAMP(3);
    END IF;

    -- Add settings column if it doesn't exist (with default)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'settings'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "settings" TEXT DEFAULT '{}';
    END IF;

    -- Add metadata column if it doesn't exist (with default)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "metadata" TEXT DEFAULT '{}';
    END IF;

    -- Add createdAt column if it doesn't exist (with default)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Add updatedAt column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL;
    END IF;

END $$;

