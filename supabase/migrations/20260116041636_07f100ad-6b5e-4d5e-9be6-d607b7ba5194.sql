-- Ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_driver_signup ON auth.users;
CREATE TRIGGER on_driver_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_driver_on_signup();