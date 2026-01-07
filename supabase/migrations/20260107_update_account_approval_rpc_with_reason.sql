-- Update create_account_approval_request function to include affiliation_reason parameter

CREATE OR REPLACE FUNCTION create_account_approval_request(
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_affiliation_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO account_approval_requests (email, first_name, last_name, affiliation_reason, approval_status)
  VALUES (p_email, p_first_name, p_last_name, p_affiliation_reason, 'pending')
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;
