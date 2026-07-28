-- Resenärsschema (dagsprogram) per resa, AI-tolkat från uppladdad PDF.
-- OBS: livedatan ligger i Neon — data-api kör samma ALTER idempotent vid kallstart,
-- så denna fil är dokumentation + för ev. lokal Supabase-databas.
ALTER TABLE trips ADD COLUMN IF NOT EXISTS itinerary jsonb;
