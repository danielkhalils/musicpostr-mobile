-- Adiciona suporte à música favorita escolhida pelo usuário ao avaliar um álbum
ALTER TABLE public.album_reviews
  ADD COLUMN IF NOT EXISTS favorite_track text;

ALTER TABLE public.feed_posts
  ADD COLUMN IF NOT EXISTS favorite_track text;
