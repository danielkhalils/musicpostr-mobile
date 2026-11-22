-- =============================================================================
-- MUSICPOSTR MOBILE - SNAPSHOT ATUAL DA BASE DE DADOS (SUPABASE)
-- =============================================================================
-- WARNING: This schema is for context/reference only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
--
-- Observação sobre tabelas ativas no app mobile (`src/services/`):
--   Catálogo:   genres, record_labels, artists, albums, tracks, album_awards
--   Usuários:   profiles, friendships, user_followed_artists,
--               user_favorite_albums, user_listened_albums
--   Comunidade: album_reviews, album_review_likes, user_lists, user_list_items,
--               feed_posts, feed_post_comments, feed_post_likes
--   Cache:      external_media_cache
--
-- Tabelas legadas presentes no banco (não utilizadas pelos serviços atuais):
--   reviews, user_favorites, lists, list_items
-- =============================================================================

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  email text,
  phone text DEFAULT ''::text,
  bio text DEFAULT 'Entusiasta de álbuns conceituais, vinil e descobertas musicais na comunidade Musicpostr.'::text,
  banner_url text DEFAULT 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=65&w=600&auto=format&fit=crop'::text,
  profile_visibility USER-DEFINED NOT NULL DEFAULT 'public'::profile_visibility_enum,
  email_notif boolean NOT NULL DEFAULT true,
  community_notif boolean NOT NULL DEFAULT true,
  releases_notif boolean NOT NULL DEFAULT false,
  is_linked_google boolean NOT NULL DEFAULT false,
  is_linked_apple boolean NOT NULL DEFAULT false,
  auth_provider text DEFAULT 'email'::text,
  theme_preference text DEFAULT 'dark'::text,
  socials jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  album_id text NOT NULL,
  album_title text NOT NULL,
  artist_name text NOT NULL,
  album_cover text,
  rating numeric NOT NULL CHECK (rating >= 0::numeric AND rating <= 10::numeric),
  comment text,
  is_edited boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.user_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id text NOT NULL,
  item_type text NOT NULL CHECK (item_type = ANY (ARRAY['album'::text, 'artist'::text])),
  item_title text NOT NULL,
  item_artist text,
  item_cover text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_favorites_pkey PRIMARY KEY (id),
  CONSTRAINT user_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.lists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  is_public boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT lists_pkey PRIMARY KEY (id),
  CONSTRAINT lists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.list_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL,
  album_id text NOT NULL,
  album_title text NOT NULL,
  artist_name text NOT NULL,
  album_cover text,
  position integer DEFAULT 0,
  added_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT list_items_pkey PRIMARY KEY (id),
  CONSTRAINT list_items_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.lists(id)
);

CREATE TABLE public.genres (
  id text NOT NULL,
  name text NOT NULL UNIQUE,
  emoji text DEFAULT '🎵'::text,
  keywords ARRAY DEFAULT '{}'::text[],
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT genres_pkey PRIMARY KEY (id)
);

CREATE TABLE public.record_labels (
  id text NOT NULL,
  name text NOT NULL UNIQUE,
  description text,
  country text,
  website text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT record_labels_pkey PRIMARY KEY (id)
);

CREATE TABLE public.artists (
  id text NOT NULL,
  name text NOT NULL,
  image_url text,
  banner_url text,
  genre text DEFAULT 'Artista Oficial'::text,
  country text DEFAULT ''::text,
  nb_fans integer NOT NULL DEFAULT 0,
  type text DEFAULT 'Person'::text,
  bio text,
  label_name text,
  active_years text DEFAULT 'Ativo desde os primeiros anos de formação musical até os dias de hoje'::text,
  is_verified boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT artists_pkey PRIMARY KEY (id)
);

CREATE TABLE public.albums (
  id text NOT NULL,
  release_id text,
  title text NOT NULL,
  artist_id text NOT NULL,
  artist_name text NOT NULL,
  cover_xl text NOT NULL,
  cover_big text NOT NULL,
  cover_medium text NOT NULL,
  cover_small text,
  back_cover_url text,
  release_date text NOT NULL DEFAULT '2025'::text,
  record_type USER-DEFINED NOT NULL DEFAULT 'album'::record_type_enum,
  genre_name text NOT NULL DEFAULT 'Pop'::text,
  label text NOT NULL DEFAULT 'Independente'::text,
  community_rating numeric NOT NULL DEFAULT 0.0 CHECK (community_rating >= 0::numeric AND community_rating <= 10::numeric),
  total_reviews integer NOT NULL DEFAULT 0 CHECK (total_reviews >= 0),
  listeners_count integer NOT NULL DEFAULT 0 CHECK (listeners_count >= 0),
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT albums_pkey PRIMARY KEY (id),
  CONSTRAINT albums_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.artists(id)
);

CREATE TABLE public.tracks (
  id text NOT NULL,
  album_id text NOT NULL,
  artist_id text,
  artist_name text NOT NULL,
  title text NOT NULL,
  duration integer NOT NULL DEFAULT 0,
  track_number integer NOT NULL DEFAULT 1,
  is_top_track boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tracks_pkey PRIMARY KEY (id),
  CONSTRAINT tracks_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.albums(id),
  CONSTRAINT tracks_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.artists(id)
);

CREATE TABLE public.album_awards (
  id text NOT NULL,
  album_id text NOT NULL,
  ceremony USER-DEFINED NOT NULL DEFAULT 'grammy'::award_ceremony_enum,
  ceremony_name text NOT NULL,
  award_name text,
  category text NOT NULL,
  year text NOT NULL,
  is_winner boolean NOT NULL DEFAULT false,
  result text DEFAULT
CASE
    WHEN is_winner THEN 'winner'::text
    ELSE 'nominee'::text
END,
  notes text,
  description text,
  logo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT album_awards_pkey PRIMARY KEY (id),
  CONSTRAINT album_awards_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.albums(id)
);

CREATE TABLE public.friendships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  friend_id uuid NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'accepted'::friendship_status_enum,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT friendships_pkey PRIMARY KEY (id),
  CONSTRAINT friendships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT friendships_friend_id_fkey FOREIGN KEY (friend_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.user_followed_artists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  artist_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_followed_artists_pkey PRIMARY KEY (id),
  CONSTRAINT user_followed_artists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_followed_artists_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.artists(id)
);

CREATE TABLE public.user_favorite_albums (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  album_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_favorite_albums_pkey PRIMARY KEY (id),
  CONSTRAINT user_favorite_albums_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_favorite_albums_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.albums(id)
);

CREATE TABLE public.user_listened_albums (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  album_id text NOT NULL,
  listened_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_listened_albums_pkey PRIMARY KEY (id),
  CONSTRAINT user_listened_albums_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_listened_albums_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.albums(id)
);

CREATE TABLE public.album_reviews (
  id text NOT NULL DEFAULT ('rev-'::text || (gen_random_uuid())::text),
  album_id text NOT NULL,
  user_id uuid,
  user_display_name text NOT NULL,
  username text NOT NULL,
  user_avatar text,
  rating numeric NOT NULL CHECK (rating >= 1.0 AND rating <= 10.0),
  comment text NOT NULL,
  display_date text DEFAULT 'Recente'::text,
  likes_count integer NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  comments_count integer NOT NULL DEFAULT 0 CHECK (comments_count >= 0),
  is_edited boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT album_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT album_reviews_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.albums(id),
  CONSTRAINT album_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.album_review_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  review_id text NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT album_review_likes_pkey PRIMARY KEY (id),
  CONSTRAINT album_review_likes_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.album_reviews(id),
  CONSTRAINT album_review_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.user_lists (
  id text NOT NULL DEFAULT ('list-'::text || (gen_random_uuid())::text),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT 'Coletânea personalizada de álbuns favoritos.'::text,
  items_count integer NOT NULL DEFAULT 0 CHECK (items_count >= 0),
  is_default boolean NOT NULL DEFAULT false,
  is_public boolean NOT NULL DEFAULT true,
  created_label text DEFAULT 'Criado recentemente'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_lists_pkey PRIMARY KEY (id),
  CONSTRAINT user_lists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.user_list_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  list_id text NOT NULL,
  album_id text NOT NULL,
  album_title text NOT NULL,
  album_cover text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  added_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_list_items_pkey PRIMARY KEY (id),
  CONSTRAINT user_list_items_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.user_lists(id),
  CONSTRAINT user_list_items_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.albums(id)
);

CREATE TABLE public.feed_posts (
  id text NOT NULL DEFAULT ('feed-'::text || (gen_random_uuid())::text),
  activity_type USER-DEFINED NOT NULL DEFAULT 'review'::feed_activity_type_enum,
  user_id uuid,
  friend_name text NOT NULL,
  friend_username text NOT NULL,
  friend_avatar text NOT NULL,
  album_id text,
  album_title text NOT NULL,
  artist_id text,
  artist_name text NOT NULL,
  artist_genre text,
  album_cover text NOT NULL,
  rating numeric NOT NULL DEFAULT 0 CHECK (rating >= 0::numeric AND rating <= 10::numeric),
  comment text NOT NULL,
  time_ago text NOT NULL DEFAULT 'Agora mesmo'::text,
  likes_count integer NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  is_edited boolean NOT NULL DEFAULT false,
  review_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT feed_posts_pkey PRIMARY KEY (id),
  CONSTRAINT feed_posts_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.artists(id),
  CONSTRAINT feed_posts_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.album_reviews(id),
  CONSTRAINT feed_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT feed_posts_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.albums(id)
);

CREATE TABLE public.feed_post_comments (
  id text NOT NULL DEFAULT ('c-'::text || (gen_random_uuid())::text),
  post_id text NOT NULL,
  user_id uuid,
  author text NOT NULL,
  avatar text NOT NULL,
  text text NOT NULL,
  time_label text NOT NULL DEFAULT 'Agora mesmo'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT feed_post_comments_pkey PRIMARY KEY (id),
  CONSTRAINT feed_post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.feed_posts(id),
  CONSTRAINT feed_post_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.feed_post_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id text NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT feed_post_likes_pkey PRIMARY KEY (id),
  CONSTRAINT feed_post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.feed_posts(id),
  CONSTRAINT feed_post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.external_media_cache (
  cache_key text NOT NULL,
  entity_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT external_media_cache_pkey PRIMARY KEY (cache_key)
);
