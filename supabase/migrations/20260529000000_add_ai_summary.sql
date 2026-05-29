-- AI-genererad sammanfattning per anmäld deltagare, byggd från lära känna-svaren.
-- Sparas så Wille slipper regenerera varje gång han öppnar presentationssidan.
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS ai_summary text;
