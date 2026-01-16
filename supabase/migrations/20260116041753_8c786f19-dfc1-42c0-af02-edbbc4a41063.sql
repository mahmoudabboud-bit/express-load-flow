-- Drop the incorrectly placed trigger on profiles table
DROP TRIGGER IF EXISTS on_profile_created_link_driver ON profiles;