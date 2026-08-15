-- Create RPC function to get all vendors (bypasses RLS for super admin)
CREATE OR REPLACE FUNCTION get_all_vendors_admin()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  company_name text,
  commission_pct numeric,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vendors.id,
    vendors.user_id,
    vendors.company_name,
    vendors.commission_pct,
    vendors.created_at,
    vendors.updated_at
  FROM vendors
  ORDER BY vendors.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_all_vendors_admin() TO authenticated;
