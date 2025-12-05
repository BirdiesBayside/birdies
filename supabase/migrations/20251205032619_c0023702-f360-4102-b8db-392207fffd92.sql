-- Recreate the view with SECURITY INVOKER (default, explicit for clarity)
DROP VIEW IF EXISTS public.sgt_members_safe;

CREATE VIEW public.sgt_members_safe 
WITH (security_invoker = true)
AS
SELECT 
  user_id,
  user_name,
  user_country_code,
  user_has_avatar,
  user_active,
  updated_at
FROM public.sgt_members;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.sgt_members_safe TO authenticated;