-- Add resolution workflow columns to civic_issues table
ALTER TABLE civic_issues
  ADD COLUMN IF NOT EXISTS assigned_coordinator_id uuid REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS resolution_proof_urls text[],
  ADD COLUMN IF NOT EXISTS resolution_notes text,
  ADD COLUMN IF NOT EXISTS admin_approved boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS user_rating integer CHECK (user_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS user_feedback text;

-- Update status constraint to include 'completed' (awaiting admin approval)
ALTER TABLE civic_issues DROP CONSTRAINT IF EXISTS civic_issues_status_check;
ALTER TABLE civic_issues ADD CONSTRAINT civic_issues_status_check
  CHECK (status IN ('pending', 'in_progress', 'completed', 'resolved'));
