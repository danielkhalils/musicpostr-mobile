-- =============================================================================
-- Policy RLS de DELETE para `public.feed_post_comments`
-- Permite que apenas o autor do comentário OU o dono da publicação (`feed_posts`)
-- possam excluir um comentário.
-- =============================================================================

DROP POLICY IF EXISTS "Comment author or post owner can delete feed comments" ON public.feed_post_comments;
CREATE POLICY "Comment author or post owner can delete feed comments" ON public.feed_post_comments
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.feed_posts fp
      WHERE fp.id = feed_post_comments.post_id
        AND fp.user_id = auth.uid()
    )
  );
