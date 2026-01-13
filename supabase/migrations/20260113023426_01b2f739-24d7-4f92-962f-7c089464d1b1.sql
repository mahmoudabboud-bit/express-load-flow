-- Drop the problematic index that can't handle large signature data URLs
DROP INDEX IF EXISTS idx_loads_status_signature;