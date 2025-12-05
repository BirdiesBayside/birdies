-- Create a secure view that excludes email addresses
CREATE OR REPLACE VIEW public.sgt_members_safe AS
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

-- Drop the existing permissive policy
DROP POLICY IF EXISTS "Authenticated users can view member names only" ON public.sgt_members;

-- Create a restrictive policy - only allow users to see their own record or admins see all
CREATE POLICY "Users can view their own member record"
ON public.sgt_members
FOR SELECT
USING (
  user_id = get_user_sgt_id(auth.uid()) 
  OR has_role(auth.uid(), 'admin'::app_role)
);