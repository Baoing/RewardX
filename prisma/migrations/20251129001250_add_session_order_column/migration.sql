-- AddColumn: Add order column to Session table if it doesn't exist
-- This migration safely adds the order column without dropping existing data

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Session' 
        AND column_name = 'order'
    ) THEN
        ALTER TABLE "Session" ADD COLUMN "order" TEXT;
    END IF;
END $$;

