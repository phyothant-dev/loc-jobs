ALTER TABLE users ADD COLUMN bio text;

-- Update RLS to allow update of bio
-- The existing update policy for users already allows updating own row,
-- so no policy change is needed as long as the update policy is permissive
-- enough. Verify with: SELECT * FROM pg_policies WHERE tablename = 'users';
