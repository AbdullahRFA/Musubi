-- ==============================================================================
-- Profile connection counts (LinkedIn-style "123 connections · 4 mutual")
-- Run once in Supabase: Dashboard > SQL Editor > paste > Run. Safe to re-run.
-- Requires 20261124_connections_and_direct_messages.sql to have been run first.
--
-- RLS only lets members read their own connections, so these SECURITY DEFINER
-- functions expose just a count (and mutual connections, which the viewer is
-- already connected to) — never anyone's full connection list.
-- ==============================================================================

-- Number of accepted connections a member has (blocked pairs excluded)
CREATE OR REPLACE FUNCTION public.connection_count(uid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int
  FROM public.connections c
  WHERE c.status = 'accepted'
    AND uid IN (c.requester_id, c.addressee_id)
    AND NOT public.is_blocked_between(c.requester_id, c.addressee_id);
$$;

-- Members connected to both the signed-in viewer and `other`
CREATE OR REPLACE FUNCTION public.mutual_connections(other UUID)
RETURNS TABLE (user_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH mine AS (
    SELECT CASE WHEN c.requester_id = auth.uid() THEN c.addressee_id ELSE c.requester_id END AS id
    FROM public.connections c
    WHERE c.status = 'accepted' AND auth.uid() IN (c.requester_id, c.addressee_id)
      AND NOT public.is_blocked_between(c.requester_id, c.addressee_id)
  ),
  theirs AS (
    SELECT CASE WHEN c.requester_id = other THEN c.addressee_id ELSE c.requester_id END AS id
    FROM public.connections c
    WHERE c.status = 'accepted' AND other IN (c.requester_id, c.addressee_id)
      AND NOT public.is_blocked_between(c.requester_id, c.addressee_id)
  )
  SELECT id FROM mine
  INTERSECT
  SELECT id FROM theirs
  WHERE auth.uid() IS NOT NULL AND other <> auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.connection_count(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mutual_connections(UUID) TO authenticated;
