-- ==============================================================================
-- Connections (friend requests) + Direct Messages
-- Run once in Supabase: Dashboard > SQL Editor > paste > Run.
-- Safe to re-run (idempotent).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER so RLS policies can check blocks in both directions
-- without exposing who blocked whom)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_blocked_between(a UUID, b UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocks
    WHERE (blocker_id = a AND blocked_id = b) OR (blocker_id = b AND blocked_id = a)
  );
$$;

-- ------------------------------------------------------------------------------
-- 1. Connections
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT connections_not_self CHECK (requester_id <> addressee_id)
);

-- One connection per pair, whichever direction it was requested in
CREATE UNIQUE INDEX IF NOT EXISTS connections_unique_pair
  ON public.connections (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));

CREATE OR REPLACE FUNCTION public.is_connection_member(conn UUID, uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connections c
    WHERE c.id = conn AND c.status = 'accepted' AND uid IN (c.requester_id, c.addressee_id)
      AND NOT public.is_blocked_between(c.requester_id, c.addressee_id)
  );
$$;

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view their connections" ON public.connections;
CREATE POLICY "Members can view their connections" ON public.connections
  FOR SELECT USING (auth.uid() IN (requester_id, addressee_id));

DROP POLICY IF EXISTS "Users can send connection requests" ON public.connections;
CREATE POLICY "Users can send connection requests" ON public.connections
  FOR INSERT WITH CHECK (
    auth.uid() = requester_id
    AND status = 'pending'
    AND NOT public.is_blocked_between(requester_id, addressee_id)
  );

-- Addressee accepts / rejects; requester may re-send after a rejection
DROP POLICY IF EXISTS "Members can update their connection" ON public.connections;
CREATE POLICY "Members can update their connection" ON public.connections
  FOR UPDATE USING (auth.uid() IN (requester_id, addressee_id))
  WITH CHECK (NOT public.is_blocked_between(requester_id, addressee_id));

-- Either side can cancel a request or remove a connection
DROP POLICY IF EXISTS "Members can delete their connection" ON public.connections;
CREATE POLICY "Members can delete their connection" ON public.connections
  FOR DELETE USING (auth.uid() IN (requester_id, addressee_id));

-- ------------------------------------------------------------------------------
-- 2. Direct messages
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dm_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT,
  image_path TEXT,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT dm_has_content CHECK (deleted_at IS NOT NULL OR coalesce(length(trim(body)), 0) > 0 OR image_path IS NOT NULL),
  CONSTRAINT dm_body_length CHECK (body IS NULL OR length(body) <= 2000)
);

CREATE INDEX IF NOT EXISTS dm_messages_connection_created ON public.dm_messages (connection_id, created_at);

ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_messages REPLICA IDENTITY FULL;

DROP POLICY IF EXISTS "Members can read direct messages" ON public.dm_messages;
CREATE POLICY "Members can read direct messages" ON public.dm_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE c.id = connection_id AND auth.uid() IN (c.requester_id, c.addressee_id)
    )
  );

DROP POLICY IF EXISTS "Members can send direct messages" ON public.dm_messages;
CREATE POLICY "Members can send direct messages" ON public.dm_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id AND public.is_connection_member(connection_id, auth.uid()));

-- Only the sender can edit or (soft) delete their own message
DROP POLICY IF EXISTS "Senders can edit their messages" ON public.dm_messages;
CREATE POLICY "Senders can edit their messages" ON public.dm_messages
  FOR UPDATE USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);

-- ------------------------------------------------------------------------------
-- 3. Reactions (one per member per message, like Messenger)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dm_reactions (
  message_id UUID NOT NULL REFERENCES public.dm_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (emoji IN ('👍', '❤️', '😂', '😮', '😢', '🙏')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (message_id, user_id)
);

ALTER TABLE public.dm_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_reactions REPLICA IDENTITY FULL;

DROP POLICY IF EXISTS "Members can read reactions" ON public.dm_reactions;
CREATE POLICY "Members can read reactions" ON public.dm_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.dm_messages m JOIN public.connections c ON c.id = m.connection_id
      WHERE m.id = message_id AND auth.uid() IN (c.requester_id, c.addressee_id)
    )
  );

DROP POLICY IF EXISTS "Members can react" ON public.dm_reactions;
CREATE POLICY "Members can react" ON public.dm_reactions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.dm_messages m
      WHERE m.id = message_id AND m.deleted_at IS NULL AND public.is_connection_member(m.connection_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "Members can change their reaction" ON public.dm_reactions;
CREATE POLICY "Members can change their reaction" ON public.dm_reactions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Members can remove their reaction" ON public.dm_reactions;
CREATE POLICY "Members can remove their reaction" ON public.dm_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 4. Notifications: allow the new types
-- ------------------------------------------------------------------------------
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN ('request_new', 'request_accepted', 'request_rejected', 'message', 'activity', 'completed', 'review', 'payment',
           'connection_request', 'connection_accepted', 'direct_message')
);

-- ------------------------------------------------------------------------------
-- 5. Realtime
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.connections; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_reactions; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- ------------------------------------------------------------------------------
-- 6. Private storage for chat photos: dm-images/<connection_id>/<file>.jpg
--    Only the two members of an accepted connection can upload or view.
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('dm-images', 'dm-images', false, 2097152, ARRAY['image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "DM members can upload images" ON storage.objects;
CREATE POLICY "DM members can upload images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'dm-images'
    AND public.is_connection_member((storage.foldername(name))[1]::uuid, auth.uid())
  );

DROP POLICY IF EXISTS "DM members can view images" ON storage.objects;
CREATE POLICY "DM members can view images" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'dm-images'
    AND EXISTS (
      SELECT 1 FROM public.connections c
      WHERE c.id::text = (storage.foldername(name))[1] AND auth.uid() IN (c.requester_id, c.addressee_id)
    )
  );

-- The uploader can delete their own chat photo (when deleting the message)
DROP POLICY IF EXISTS "DM uploaders can delete their images" ON storage.objects;
CREATE POLICY "DM uploaders can delete their images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'dm-images' AND owner = auth.uid());
