-- =============================================================================
-- MUSICPOSTR MOBILE - SUPORTE A SUPERFÃ DE ARTISTAS
-- =============================================================================

-- 1. Adiciona coluna `is_superfan` na tabela `user_followed_artists`
ALTER TABLE public.user_followed_artists
  ADD COLUMN IF NOT EXISTS is_superfan boolean NOT NULL DEFAULT false;

-- Garante unicidade por (user_id, artist_id) se ainda não existir índice único
CREATE INDEX IF NOT EXISTS idx_user_followed_artists_superfan
  ON public.user_followed_artists (user_id, is_superfan)
  WHERE is_superfan = true;

-- 2. Adiciona valor 'superfan' ao enum `feed_activity_type_enum`
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feed_activity_type_enum') THEN
    ALTER TYPE public.feed_activity_type_enum ADD VALUE IF NOT EXISTS 'superfan';
  END IF;
END $$;

-- 3. Garante policy de UPDATE para o usuário atualizar seu próprio registro em user_followed_artists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_followed_artists'
      AND policyname = 'Users can update own followed artists'
  ) THEN
    CREATE POLICY "Users can update own followed artists"
      ON public.user_followed_artists
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
