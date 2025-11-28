-- Fix Session table: Add missing columns if they don't exist
-- This migration ensures all Session columns from schema.prisma exist in the database
-- Safe to run multiple times (idempotent)

DO $$
BEGIN
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
END $$;

