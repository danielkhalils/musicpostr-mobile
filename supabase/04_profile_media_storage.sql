-- =============================================================================
-- SUPABASE STORAGE: BUCKET `profile-media` PARA AVATAR E CAPA DE PERFIL
-- =============================================================================
-- Execute este script no SQL Editor do Supabase para habilitar o upload de
-- fotos de avatar e capa de perfil diretamente no Supabase Storage.
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-media',
  'profile-media',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Leitura pública das fotos de perfil e capas
DROP POLICY IF EXISTS "Public read profile media" ON storage.objects;
CREATE POLICY "Public read profile media" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'profile-media');

-- Usuários autenticados podem enviar arquivos na própria pasta ({user_id}/...)
DROP POLICY IF EXISTS "Users can upload own profile media" ON storage.objects;
CREATE POLICY "Users can upload own profile media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Usuários autenticados podem atualizar arquivos na própria pasta
DROP POLICY IF EXISTS "Users can update own profile media" ON storage.objects;
CREATE POLICY "Users can update own profile media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profile-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Usuários autenticados podem excluir arquivos na própria pasta
DROP POLICY IF EXISTS "Users can delete own profile media" ON storage.objects;
CREATE POLICY "Users can delete own profile media" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
