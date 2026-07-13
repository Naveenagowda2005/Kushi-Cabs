-- ============================================================
-- FIX: Create active_sessions table in NEW account
-- ============================================================
-- Run this in NEW Supabase Account
-- ============================================================

-- Create active_sessions table
CREATE TABLE IF NOT EXISTS public.active_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,
  login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, device_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON public.active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_device_id ON public.active_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_is_active ON public.active_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_device ON public.active_sessions(user_id, is_active);

-- Disable RLS for now (will re-enable if needed)
ALTER TABLE public.active_sessions DISABLE ROW LEVEL SECURITY;

-- Create functions
CREATE OR REPLACE FUNCTION invalidate_other_sessions(
  p_user_id UUID,
  p_device_id TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE public.active_sessions
  SET is_active = FALSE, updated_at = NOW()
  WHERE user_id = p_user_id
    AND device_id != p_device_id
    AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_or_update_session(
  p_user_id UUID,
  p_device_id TEXT,
  p_device_name TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL
)
RETURNS TABLE(session_id BIGINT, was_previous_session_invalidated BOOLEAN) AS $$
DECLARE
  v_session_id BIGINT;
  v_had_previous_session BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.active_sessions
    WHERE user_id = p_user_id
      AND device_id != p_device_id
      AND is_active = TRUE
  ) INTO v_had_previous_session;
  
  PERFORM invalidate_other_sessions(p_user_id, p_device_id);
  
  INSERT INTO public.active_sessions (user_id, device_id, device_name, device_type, login_at, last_activity_at)
  VALUES (p_user_id, p_device_id, p_device_name, p_device_type, NOW(), NOW())
  ON CONFLICT (user_id, device_id) DO UPDATE SET
    login_at = NOW(),
    last_activity_at = NOW(),
    is_active = TRUE,
    updated_at = NOW(),
    device_name = COALESCE(p_device_name, active_sessions.device_name),
    device_type = COALESCE(p_device_type, active_sessions.device_type)
  RETURNING id INTO v_session_id;
  
  RETURN QUERY SELECT v_session_id, v_had_previous_session;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_session_active(
  p_user_id UUID,
  p_device_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_active BOOLEAN;
BEGIN
  SELECT is_active INTO v_is_active
  FROM public.active_sessions
  WHERE user_id = p_user_id
    AND device_id = p_device_id
    AND is_active = TRUE
  LIMIT 1;
  
  RETURN COALESCE(v_is_active, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_session_activity(
  p_user_id UUID,
  p_device_id TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE public.active_sessions
  SET last_activity_at = NOW()
  WHERE user_id = p_user_id
    AND device_id = p_device_id
    AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_or_update_session TO authenticated;
GRANT EXECUTE ON FUNCTION is_session_active TO authenticated;
GRANT EXECUTE ON FUNCTION update_session_activity TO authenticated;
GRANT EXECUTE ON FUNCTION invalidate_other_sessions TO authenticated;

-- Verify table created
SELECT 'active_sessions table created successfully' as status;
SELECT tablename FROM pg_tables WHERE tablename = 'active_sessions' AND schemaname = 'public';
