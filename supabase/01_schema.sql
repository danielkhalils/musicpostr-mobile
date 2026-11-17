-- =============================================================================
-- MUSICPOSTR MOBILE - SUPABASE DATABASE SCHEMA (DDL + RLS + TRIGGERS)
-- =============================================================================
-- Execute este script primeiro no SQL Editor do Supabase (ou via CLI).
-- Ele cria todas as extensões, tipos ENUM, tabelas, chaves estrangeiras,
-- índices de performance, triggers automáticas e políticas de Row Level Security (RLS).
-- =============================================================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. TIPOS ENUMERADOS (ENUMS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'record_type_enum') THEN
    CREATE TYPE public.record_type_enum AS ENUM ('album', 'ep', 'single');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_visibility_enum') THEN
    CREATE TYPE public.profile_visibility_enum AS ENUM ('public', 'private');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feed_activity_type_enum') THEN
    CREATE TYPE public.feed_activity_type_enum AS ENUM ('review', 'favorite', 'follow_idol', 'list');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'award_ceremony_enum') THEN
    CREATE TYPE public.award_ceremony_enum AS ENUM ('grammy', 'vma', 'billboard', 'oscar', 'brit', 'ama', 'latin_grammy');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'friendship_status_enum') THEN
    CREATE TYPE public.friendship_status_enum AS ENUM ('pending', 'accepted', 'blocked');
  END IF;
END $$;

-- =============================================================================
-- 3. TABELAS DE CATÁLOGO E REFERÊNCIA
-- =============================================================================

-- 3.1. Gêneros Musicais (`genres`)
CREATE TABLE IF NOT EXISTS public.genres (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  emoji TEXT DEFAULT '🎵',
  keywords TEXT[] DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2. Gravadoras (`record_labels`)
CREATE TABLE IF NOT EXISTS public.record_labels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  country TEXT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3. Artistas (`artists`)
CREATE TABLE IF NOT EXISTS public.artists (
  id TEXT PRIMARY KEY, -- MusicBrainz Artist UUID ou slug interno
  name TEXT NOT NULL,
  image_url TEXT,
  banner_url TEXT,
  genre TEXT DEFAULT 'Artista Oficial',
  country TEXT DEFAULT '',
  nb_fans INTEGER NOT NULL DEFAULT 0,
  type TEXT DEFAULT 'Person', -- 'Person' | 'Group'
  bio TEXT,
  label_name TEXT,
  active_years TEXT DEFAULT 'Ativo desde os primeiros anos de formação musical até os dias de hoje',
  is_verified BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artists_name_trgm ON public.artists USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_artists_genre ON public.artists (genre);

-- 3.4. Álbuns, EPs e Singles (`albums`)
CREATE TABLE IF NOT EXISTS public.albums (
  id TEXT PRIMARY KEY, -- MusicBrainz Release-Group UUID ou slug interno (ex: 'ep-dont-smile-at-me')
  release_id TEXT,     -- MusicBrainz Release UUID específico (quando aplicável)
  title TEXT NOT NULL,
  artist_id TEXT NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  artist_name TEXT NOT NULL,
  cover_xl TEXT NOT NULL,
  cover_big TEXT NOT NULL,
  cover_medium TEXT NOT NULL,
  cover_small TEXT,
  back_cover_url TEXT,
  release_date TEXT NOT NULL DEFAULT '2025',
  record_type public.record_type_enum NOT NULL DEFAULT 'album',
  genre_name TEXT NOT NULL DEFAULT 'Pop',
  label TEXT NOT NULL DEFAULT 'Independente',
  community_rating NUMERIC(3,1) NOT NULL DEFAULT 0.0 CHECK (community_rating >= 0 AND community_rating <= 10),
  total_reviews INTEGER NOT NULL DEFAULT 0 CHECK (total_reviews >= 0),
  listeners_count INTEGER NOT NULL DEFAULT 0 CHECK (listeners_count >= 0),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_albums_artist_id ON public.albums (artist_id);
CREATE INDEX IF NOT EXISTS idx_albums_record_type ON public.albums (record_type);
CREATE INDEX IF NOT EXISTS idx_albums_genre_name ON public.albums (genre_name);
CREATE INDEX IF NOT EXISTS idx_albums_release_date ON public.albums (release_date DESC);
CREATE INDEX IF NOT EXISTS idx_albums_community_rating ON public.albums (community_rating DESC, total_reviews DESC);
CREATE INDEX IF NOT EXISTS idx_albums_title_trgm ON public.albums USING gin (title gin_trgm_ops);

-- 3.5. Faixas / Músicas (`tracks`)
CREATE TABLE IF NOT EXISTS public.tracks (
  id TEXT PRIMARY KEY,
  album_id TEXT NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  artist_id TEXT REFERENCES public.artists(id) ON DELETE SET NULL,
  artist_name TEXT NOT NULL,
  title TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 0, -- Duração em segundos
  track_number INTEGER NOT NULL DEFAULT 1,
  is_top_track BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracks_album_id ON public.tracks (album_id, track_number);
CREATE INDEX IF NOT EXISTS idx_tracks_artist_id ON public.tracks (artist_id);
CREATE INDEX IF NOT EXISTS idx_tracks_is_top_track ON public.tracks (is_top_track) WHERE is_top_track = TRUE;
CREATE INDEX IF NOT EXISTS idx_tracks_title_trgm ON public.tracks USING gin (title gin_trgm_ops);

-- 3.6. Prêmios e Indicações de Álbuns (`album_awards`)
CREATE TABLE IF NOT EXISTS public.album_awards (
  id TEXT PRIMARY KEY,
  album_id TEXT NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  ceremony public.award_ceremony_enum NOT NULL DEFAULT 'grammy',
  ceremony_name TEXT NOT NULL,
  award_name TEXT,
  category TEXT NOT NULL,
  year TEXT NOT NULL,
  is_winner BOOLEAN NOT NULL DEFAULT FALSE,
  result TEXT GENERATED ALWAYS AS (CASE WHEN is_winner THEN 'winner' ELSE 'nominee' END) STORED,
  notes TEXT,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_album_awards_album_id ON public.album_awards (album_id);

-- =============================================================================
-- 4. TABELAS DE USUÁRIOS, PERFIS E REDE SOCIAL
-- =============================================================================

-- 4.1. Perfis de Usuários (`profiles`)
-- Compatível com `src/services/auth.service.ts`, `src/context/AuthContext.tsx` e `src/app/settings.tsx`
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT DEFAULT 'Melômano',
  email TEXT,
  phone TEXT DEFAULT '',
  bio TEXT DEFAULT 'Entusiasta de álbuns conceituais, vinil e descobertas musicais na comunidade Musicpostr.',
  avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
  banner_url TEXT DEFAULT 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=65&w=600&auto=format&fit=crop',
  profile_visibility public.profile_visibility_enum NOT NULL DEFAULT 'public',
  email_notif BOOLEAN NOT NULL DEFAULT TRUE,
  community_notif BOOLEAN NOT NULL DEFAULT TRUE,
  releases_notif BOOLEAN NOT NULL DEFAULT FALSE,
  is_linked_google BOOLEAN NOT NULL DEFAULT FALSE,
  is_linked_apple BOOLEAN NOT NULL DEFAULT FALSE,
  auth_provider TEXT DEFAULT 'email',
  theme_preference TEXT DEFAULT 'dark',
  socials JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (LOWER(username));

-- 4.2. Amizades e Conexões (`friendships`)
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.friendship_status_enum NOT NULL DEFAULT 'accepted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_friendship UNIQUE (user_id, friend_id),
  CONSTRAINT chk_not_self_friend CHECK (user_id <> friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships (user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships (friend_id);

-- 4.3. Ídolos / Artistas Seguidos (`user_followed_artists`)
CREATE TABLE IF NOT EXISTS public.user_followed_artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  artist_id TEXT NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_followed_artist UNIQUE (user_id, artist_id)
);

CREATE INDEX IF NOT EXISTS idx_user_followed_artists_user ON public.user_followed_artists (user_id);
CREATE INDEX IF NOT EXISTS idx_user_followed_artists_artist ON public.user_followed_artists (artist_id);

-- 4.4. Álbuns Favoritados (`user_favorite_albums`)
CREATE TABLE IF NOT EXISTS public.user_favorite_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  album_id TEXT NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_favorite_album UNIQUE (user_id, album_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorite_albums_user ON public.user_favorite_albums (user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_albums_album ON public.user_favorite_albums (album_id);

-- 4.5. Álbuns Marcados como Ouvidos (`user_listened_albums`)
CREATE TABLE IF NOT EXISTS public.user_listened_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  album_id TEXT NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  listened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_listened_album UNIQUE (user_id, album_id)
);

CREATE INDEX IF NOT EXISTS idx_user_listened_albums_user ON public.user_listened_albums (user_id);
CREATE INDEX IF NOT EXISTS idx_user_listened_albums_album ON public.user_listened_albums (album_id);

-- =============================================================================
-- 5. AVALIAÇÕES (REVIEWS), LISTAS E TIMELINE (FEED DA COMUNIDADE)
-- =============================================================================

-- 5.1. Avaliações / Reviews de Álbuns (`album_reviews`)
CREATE TABLE IF NOT EXISTS public.album_reviews (
  id TEXT PRIMARY KEY DEFAULT ('rev-' || gen_random_uuid()::text),
  album_id TEXT NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_display_name TEXT NOT NULL,
  username TEXT NOT NULL,
  user_avatar TEXT,
  rating NUMERIC(3,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 10.0),
  comment TEXT NOT NULL,
  display_date TEXT DEFAULT 'Recente',
  likes_count INTEGER NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  comments_count INTEGER NOT NULL DEFAULT 0 CHECK (comments_count >= 0),
  is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_album_reviews_album_id ON public.album_reviews (album_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_album_reviews_user_id ON public.album_reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_album_reviews_username ON public.album_reviews (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_album_reviews_rating ON public.album_reviews (rating DESC);

-- 5.2. Curtidas em Reviews (`album_review_likes`)
CREATE TABLE IF NOT EXISTS public.album_review_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id TEXT NOT NULL REFERENCES public.album_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_album_review_like UNIQUE (review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_album_review_likes_review ON public.album_review_likes (review_id);
CREATE INDEX IF NOT EXISTS idx_album_review_likes_user ON public.album_review_likes (user_id);

-- 5.3. Listas de Álbuns dos Usuários (`user_lists`)
CREATE TABLE IF NOT EXISTS public.user_lists (
  id TEXT PRIMARY KEY DEFAULT ('list-' || gen_random_uuid()::text),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT 'Coletânea personalizada de álbuns favoritos.',
  items_count INTEGER NOT NULL DEFAULT 0 CHECK (items_count >= 0),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_label TEXT DEFAULT 'Criado recentemente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_lists_user_id ON public.user_lists (user_id);

-- 5.4. Itens dentro das Listas (`user_list_items`)
CREATE TABLE IF NOT EXISTS public.user_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id TEXT NOT NULL REFERENCES public.user_lists(id) ON DELETE CASCADE,
  album_id TEXT NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  album_title TEXT NOT NULL,
  album_cover TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_list_album UNIQUE (list_id, album_id)
);

CREATE INDEX IF NOT EXISTS idx_user_list_items_list_id ON public.user_list_items (list_id, position);

-- 5.5. Publicações na Timeline / Feed da Comunidade (`feed_posts`)
CREATE TABLE IF NOT EXISTS public.feed_posts (
  id TEXT PRIMARY KEY DEFAULT ('feed-' || gen_random_uuid()::text),
  activity_type public.feed_activity_type_enum NOT NULL DEFAULT 'review',
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_name TEXT NOT NULL,
  friend_username TEXT NOT NULL,
  friend_avatar TEXT NOT NULL,
  album_id TEXT REFERENCES public.albums(id) ON DELETE SET NULL,
  album_title TEXT NOT NULL,
  artist_id TEXT REFERENCES public.artists(id) ON DELETE SET NULL,
  artist_name TEXT NOT NULL,
  artist_genre TEXT,
  album_cover TEXT NOT NULL,
  rating NUMERIC(3,1) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 10),
  comment TEXT NOT NULL,
  time_ago TEXT NOT NULL DEFAULT 'Agora mesmo',
  likes_count INTEGER NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  review_id TEXT REFERENCES public.album_reviews(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feed_posts_created_at ON public.feed_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_user_id ON public.feed_posts (user_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_album_id ON public.feed_posts (album_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_activity_type ON public.feed_posts (activity_type);

-- 5.6. Comentários nas Publicações do Feed (`feed_post_comments`)
CREATE TABLE IF NOT EXISTS public.feed_post_comments (
  id TEXT PRIMARY KEY DEFAULT ('c-' || gen_random_uuid()::text),
  post_id TEXT NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author TEXT NOT NULL,
  avatar TEXT NOT NULL,
  text TEXT NOT NULL,
  time_label TEXT NOT NULL DEFAULT 'Agora mesmo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feed_post_comments_post_id ON public.feed_post_comments (post_id, created_at ASC);

-- 5.7. Curtidas nas Publicações do Feed (`feed_post_likes`)
CREATE TABLE IF NOT EXISTS public.feed_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id TEXT NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_feed_post_like UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_post_likes_post_id ON public.feed_post_likes (post_id);
CREATE INDEX IF NOT EXISTS idx_feed_post_likes_user_id ON public.feed_post_likes (user_id);

-- 5.8. Cache de Fotos Oficiais de Artistas e Capas (`external_media_cache`)
CREATE TABLE IF NOT EXISTS public.external_media_cache (
  cache_key TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'artist_image' | 'cover_art' | 'missing_cover'
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 6. FUNÇÕES E TRIGGERS AUTOMÁTICAS
-- =============================================================================

-- 6.1. Atualizar coluna `updated_at` automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_artists_updated_at ON public.artists;
CREATE TRIGGER trg_artists_updated_at
  BEFORE UPDATE ON public.artists
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_albums_updated_at ON public.albums;
CREATE TRIGGER trg_albums_updated_at
  BEFORE UPDATE ON public.albums
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_album_reviews_updated_at ON public.album_reviews;
CREATE TRIGGER trg_album_reviews_updated_at
  BEFORE UPDATE ON public.album_reviews
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_user_lists_updated_at ON public.user_lists;
CREATE TRIGGER trg_user_lists_updated_at
  BEFORE UPDATE ON public.user_lists
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_feed_posts_updated_at ON public.feed_posts;
CREATE TRIGGER trg_feed_posts_updated_at
  BEFORE UPDATE ON public.feed_posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6.2. Criar perfil (`profiles`) e lista padrão ("Quero ouvir") ao cadastrar no `auth.users`
-- Usa ON CONFLICT DO NOTHING / DO UPDATE para conviver pacificamente com o insert explícito em `auth.service.ts`
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT;
  v_full_name TEXT;
  v_avatar TEXT;
BEGIN
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1),
    'user_' || SUBSTRING(NEW.id::text FROM 1 FOR 8)
  );
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Melômano');
  v_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500'
  );

  INSERT INTO public.profiles (id, username, full_name, email, avatar_url)
  VALUES (NEW.id, v_username, v_full_name, NEW.email, v_avatar)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;

  -- Garante a criação da lista padrão "Quero ouvir" para o novo usuário
  INSERT INTO public.user_lists (id, user_id, title, description, items_count, is_default, created_label)
  VALUES (
    'want-to-listen-' || NEW.id::text,
    NEW.id,
    'Quero ouvir',
    'Álbuns salvos para escutar no seu tempo.',
    0,
    TRUE,
    'Lista padrão'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 6.3. Sincronizar contador de itens na lista (`user_lists.items_count`)
CREATE OR REPLACE FUNCTION public.sync_user_list_items_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.user_lists
    SET items_count = (SELECT COUNT(*) FROM public.user_list_items WHERE list_id = NEW.list_id)
    WHERE id = NEW.list_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.user_lists
    SET items_count = (SELECT COUNT(*) FROM public.user_list_items WHERE list_id = OLD.list_id)
    WHERE id = OLD.list_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_user_list_items_count ON public.user_list_items;
CREATE TRIGGER trg_sync_user_list_items_count
  AFTER INSERT OR DELETE ON public.user_list_items
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_list_items_count();

-- =============================================================================
-- 7. VIEWS AUXILIARES DE RANKINGS E COMUNIDADE
-- =============================================================================

-- View: Ranking de Álbuns Mais Populares (mesma fórmula do `getPopularAlbumsByInternalActivity`)
CREATE OR REPLACE VIEW public.v_popular_albums AS
SELECT
  a.*,
  ROUND((a.listeners_count * 1.0 + a.total_reviews * 6.0 + a.community_rating * 25.0)::numeric, 2) AS popularity_score,
  ROW_NUMBER() OVER (
    ORDER BY (a.listeners_count * 1.0 + a.total_reviews * 6.0 + a.community_rating * 25.0) DESC
  ) AS rank
FROM public.albums a;

-- View: Ranking de Álbuns Mais Bem Avaliados (mesma fórmula do `getTopRatedAlbumsByInternalReviews`)
CREATE OR REPLACE VIEW public.v_top_rated_albums AS
SELECT
  a.*,
  ROW_NUMBER() OVER (
    ORDER BY a.community_rating DESC, a.total_reviews DESC, a.listeners_count DESC
  ) AS rank
FROM public.albums a;

-- View: Estatísticas Consolidadas de Perfil (`ProfileView`)
CREATE OR REPLACE VIEW public.v_profile_stats AS
SELECT
  p.id AS user_id,
  p.username,
  p.full_name,
  p.avatar_url,
  p.banner_url,
  p.bio,
  COALESCE(rev.reviews_count, 0) AS reviews_count,
  COALESCE(rev.avg_rating, 0.0) AS avg_rating,
  COALESCE(fav.favorites_count, 0) AS favorites_count,
  COALESCE(idl.idols_count, 0) AS idols_count,
  COALESCE(lst.lists_count, 0) AS lists_count,
  COALESCE(frd.friends_count, 0) AS friends_count
FROM public.profiles p
LEFT JOIN (
  SELECT user_id, COUNT(*)::int AS reviews_count, ROUND(AVG(rating)::numeric, 1) AS avg_rating
  FROM public.album_reviews
  WHERE user_id IS NOT NULL
  GROUP BY user_id
) rev ON rev.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*)::int AS favorites_count
  FROM public.user_favorite_albums
  GROUP BY user_id
) fav ON fav.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*)::int AS idols_count
  FROM public.user_followed_artists
  GROUP BY user_id
) idl ON idl.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*)::int AS lists_count
  FROM public.user_lists
  GROUP BY user_id
) lst ON lst.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*)::int AS friends_count
  FROM public.friendships
  WHERE status = 'accepted'
  GROUP BY user_id
) frd ON frd.user_id = p.id;

-- =============================================================================
-- 8. ROW LEVEL SECURITY (RLS) E POLÍTICAS DE ACESSO
-- =============================================================================

ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_followed_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorite_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_listened_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_review_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_media_cache ENABLE ROW LEVEL SECURITY;

-- Leitura pública para todas as tabelas de catálogo e comunidade
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'genres', 'record_labels', 'artists', 'albums', 'tracks', 'album_awards',
    'profiles', 'friendships', 'user_followed_artists', 'user_favorite_albums',
    'user_listened_albums', 'album_reviews', 'album_review_likes', 'user_lists',
    'user_list_items', 'feed_posts', 'feed_post_comments', 'feed_post_likes',
    'external_media_cache'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public read access on %I" ON public.%I;', t, t);
    EXECUTE format('CREATE POLICY "Public read access on %I" ON public.%I FOR SELECT USING (true);', t, t);
  END LOOP;
END $$;

-- Políticas de escrita para usuários autenticados
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Authenticated users can upsert catalog artists" ON public.artists;
CREATE POLICY "Authenticated users can upsert catalog artists" ON public.artists
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can upsert catalog albums" ON public.albums;
CREATE POLICY "Authenticated users can upsert catalog albums" ON public.albums
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can upsert catalog tracks" ON public.tracks;
CREATE POLICY "Authenticated users can upsert catalog tracks" ON public.tracks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can manage own friendships" ON public.friendships;
CREATE POLICY "Users can manage own friendships" ON public.friendships
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own followed artists" ON public.user_followed_artists;
CREATE POLICY "Users can manage own followed artists" ON public.user_followed_artists
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own favorite albums" ON public.user_favorite_albums;
CREATE POLICY "Users can manage own favorite albums" ON public.user_favorite_albums
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own listened albums" ON public.user_listened_albums;
CREATE POLICY "Users can manage own listened albums" ON public.user_listened_albums
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own reviews" ON public.album_reviews;
CREATE POLICY "Users can manage own reviews" ON public.album_reviews
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own review likes" ON public.album_review_likes;
CREATE POLICY "Users can manage own review likes" ON public.album_review_likes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own lists" ON public.user_lists;
CREATE POLICY "Users can manage own lists" ON public.user_lists
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own list items" ON public.user_list_items;
CREATE POLICY "Users can manage own list items" ON public.user_list_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_lists l
      WHERE l.id = user_list_items.list_id AND l.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage own feed posts" ON public.feed_posts;
CREATE POLICY "Users can manage own feed posts" ON public.feed_posts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can comment on feed" ON public.feed_post_comments;
CREATE POLICY "Authenticated users can comment on feed" ON public.feed_post_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can manage own feed likes" ON public.feed_post_likes;
CREATE POLICY "Users can manage own feed likes" ON public.feed_post_likes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read/write media cache" ON public.external_media_cache;
CREATE POLICY "Anyone can read/write media cache" ON public.external_media_cache
  FOR ALL USING (true) WITH CHECK (true);
