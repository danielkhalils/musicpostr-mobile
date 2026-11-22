-- =============================================================================
-- FIX: RLS POLICIES PARA REGISTRO DE ARTISTAS, ÁLBUNS E FAIXAS DO CATÁLOGO
-- =============================================================================
-- Execute este script no SQL Editor do Supabase para corrigir o erro:
-- "new row violates row-level security policy for table 'artists'"
-- ao avaliar, favoritar, marcar como ouvido, seguir artista ou adicionar em listas
-- itens vindos do MusicBrainz que ainda não existem no banco local.
-- =============================================================================

-- 1. Garante permissões de tabela para o role authenticated
GRANT SELECT, INSERT, UPDATE ON public.artists TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.albums TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.tracks TO authenticated;

-- 2. Garante RLS habilitado
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de INSERT / UPDATE para usuários autenticados no catálogo
DROP POLICY IF EXISTS "Authenticated users can upsert catalog artists" ON public.artists;
DROP POLICY IF EXISTS "Authenticated users can insert catalog artists" ON public.artists;
DROP POLICY IF EXISTS "Authenticated users can update catalog artists" ON public.artists;
CREATE POLICY "Authenticated users can insert catalog artists" ON public.artists
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update catalog artists" ON public.artists
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can upsert catalog albums" ON public.albums;
DROP POLICY IF EXISTS "Authenticated users can insert catalog albums" ON public.albums;
DROP POLICY IF EXISTS "Authenticated users can update catalog albums" ON public.albums;
CREATE POLICY "Authenticated users can insert catalog albums" ON public.albums
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update catalog albums" ON public.albums
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can upsert catalog tracks" ON public.tracks;
DROP POLICY IF EXISTS "Authenticated users can insert catalog tracks" ON public.tracks;
DROP POLICY IF EXISTS "Authenticated users can update catalog tracks" ON public.tracks;
CREATE POLICY "Authenticated users can insert catalog tracks" ON public.tracks
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update catalog tracks" ON public.tracks
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
