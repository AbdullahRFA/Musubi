-- ==============================================================================
-- Public "Completed Exchanges" count on profiles
-- Run once in Supabase: Dashboard > SQL Editor > paste > Run. Safe to re-run.
--
-- Activities are only readable by their participants (RLS), so other members'
-- profiles always showed 0 completed exchanges. This SECURITY DEFINER function
-- returns just the number — never the activities themselves.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.completed_exchange_count(uid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int FROM public.activities a WHERE uid = ANY (a.participant_ids);
$$;

GRANT EXECUTE ON FUNCTION public.completed_exchange_count(UUID) TO anon, authenticated;
