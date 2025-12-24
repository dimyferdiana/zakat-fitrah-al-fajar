-- ============================================================================
-- CREATE HELPER FUNCTION FOR RLS
-- Run this FIRST before running QUICK_FIX_MUSTAHIK.sql
-- ============================================================================

-- Create function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- Verify it works
SELECT public.get_user_role() as my_role;
