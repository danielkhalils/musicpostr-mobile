-- =============================================================================
-- MUSICPOSTR MOBILE - UNICIDADE DE ATIVIDADES EM feed_posts
-- Garante que nenhuma atividade do usuário (review, favorite, follow_idol,
-- superfan) seja duplicada na base de dados e que o usuário possa removê-las
-- silenciosamente ao desfazer a ação.
-- =============================================================================

-- 1. Remove duplicatas existentes mantendo apenas o registro mais recente por atividade lógica
WITH ranked_album_activities AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, activity_type, album_id
      ORDER BY created_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM public.feed_posts
  WHERE user_id IS NOT NULL
    AND album_id IS NOT NULL
    AND activity_type IN ('review', 'favorite')
)
DELETE FROM public.feed_posts
WHERE id IN (SELECT id FROM ranked_album_activities WHERE rn > 1);

WITH ranked_superfan_activities AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, artist_id
      ORDER BY created_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM public.feed_posts
  WHERE user_id IS NOT NULL
    AND artist_id IS NOT NULL
    AND (
      activity_type::text = 'superfan'
      OR (activity_type::text = 'follow_idol' AND COALESCE(comment, '') = '__MUSICPOSTR_SUPERFAN__')
    )
)
DELETE FROM public.feed_posts
WHERE id IN (SELECT id FROM ranked_superfan_activities WHERE rn > 1);

WITH ranked_follow_activities AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, artist_id
      ORDER BY created_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM public.feed_posts
  WHERE user_id IS NOT NULL
    AND artist_id IS NOT NULL
    AND activity_type::text = 'follow_idol'
    AND COALESCE(comment, '') <> '__MUSICPOSTR_SUPERFAN__'
)
DELETE FROM public.feed_posts
WHERE id IN (SELECT id FROM ranked_follow_activities WHERE rn > 1);

-- 2. Índices únicos parciais impedindo duplicidade na base de dados
CREATE UNIQUE INDEX IF NOT EXISTS uidx_feed_posts_unique_review
  ON public.feed_posts (user_id, album_id)
  WHERE activity_type = 'review' AND user_id IS NOT NULL AND album_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uidx_feed_posts_unique_favorite
  ON public.feed_posts (user_id, album_id)
  WHERE activity_type = 'favorite' AND user_id IS NOT NULL AND album_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uidx_feed_posts_unique_follow_idol
  ON public.feed_posts (user_id, artist_id)
  WHERE activity_type = 'follow_idol'
    AND COALESCE(comment, '') <> '__MUSICPOSTR_SUPERFAN__'
    AND user_id IS NOT NULL
    AND artist_id IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'feed_activity_type_enum'
      AND e.enumlabel = 'superfan'
  ) THEN
    EXECUTE '
      CREATE UNIQUE INDEX IF NOT EXISTS uidx_feed_posts_unique_superfan
      ON public.feed_posts (user_id, artist_id)
      WHERE activity_type = ''superfan'' AND user_id IS NOT NULL AND artist_id IS NOT NULL
    ';
  END IF;
END $$;

-- 3. Garante policy de DELETE para que o usuário possa remover suas próprias atividades ao desfazê-las
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'feed_posts'
      AND cmd = 'DELETE'
  ) THEN
    CREATE POLICY "Users can delete own feed posts"
      ON public.feed_posts
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;
