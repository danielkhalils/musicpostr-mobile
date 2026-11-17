-- =============================================================================
-- MUSICPOSTR MOBILE - SUPABASE SEED DATA (INSERÇÃO COMPLETA DE DADOS)
-- =============================================================================
-- Execute este script após `01_schema.sql` no SQL Editor do Supabase.
-- Ele insere todos os gêneros, gravadoras, artistas, álbuns/EPs/singles,
-- mais de 185 faixas (incluindo top tracks), premiações, usuários da comunidade,
-- amizades, ídolos seguidos, álbuns favoritos, listas, avaliações e feed!
-- Todos os comandos usam ON CONFLICT DO UPDATE / DO NOTHING (idempotentes).
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. GÊNEROS MUSICAIS (`public.genres`)
-- =============================================================================
INSERT INTO public.genres (id, name, emoji, keywords, display_order) VALUES
  ('pop', 'Pop', '🎤', ARRAY['pop','synth-pop','dance-pop','electropop','indie pop','art pop','teen pop'], 1),
  ('hip-hop', 'Hip-Hop', '🔥', ARRAY['hip hop','hip-hop','rap','trap','conscious hip hop','boom bap'], 2),
  ('rock', 'Rock', '🎸', ARRAY['rock','alternative rock','progressive rock','hard rock','classic rock','post-punk','metal','punk'], 3),
  ('indie', 'Indie', '🎧', ARRAY['indie','indie rock','shoegaze','dream pop','lo-fi','alternative','psychedelic'], 4),
  ('rnb', 'R&B', '🎷', ARRAY['r&b','rnb','soul','neo-soul','contemporary r&b','funk'], 5),
  ('eletronica', 'Eletrônica', '⚡', ARRAY['electronic','house','techno','electro','edm','ambient','hyperpop','dance','drum and bass'], 6),
  ('mpb', 'MPB', '🇧🇷', ARRAY['mpb','bossa nova','tropicalia','brazilian'], 7),
  ('samba-e-pagode', 'Samba e pagode', '🥁', ARRAY['samba','pagode','mpb','bossa nova','choro','brazilian'], 8),
  ('metal', 'Metal', '🤘', ARRAY['metal','heavy metal','nu metal','thrash metal'], 9),
  ('jazz', 'Jazz', '🎺', ARRAY['jazz','bebop','fusion','smooth jazz'], 10),
  ('trap', 'Trap', '💣', ARRAY['trap','latin trap','drill'], 11),
  ('k-pop', 'K-Pop', '✨', ARRAY['k-pop','korean pop','idol'], 12)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order;

-- =============================================================================
-- 2. GRAVADORAS (`public.record_labels`)
-- =============================================================================
INSERT INTO public.record_labels (id, name, description, country) VALUES
  ('sony-music', 'Sony Music', 'Columbia, RCA, Epic', 'US'),
  ('universal-music-group', 'Universal Music Group', 'Interscope, Republic, Def Jam', 'US'),
  ('warner-music-group', 'Warner Music Group', 'Atlantic, Elektra, Parlophone', 'US'),
  ('sub-pop', 'Sub Pop', 'Indie & Alternative', 'US'),
  ('xl-recordings', 'XL Recordings', 'Indie, Eletrônica & Hip-Hop', 'GB'),
  ('som-livre', 'Som Livre', 'Nacional & MPB', 'BR'),
  ('4ad', '4AD', 'Post-Punk & Dream Pop', 'GB'),
  ('def-jam', 'Def Jam Recordings', 'Hip-Hop & R&B Legend', 'US'),
  ('atlantic-records', 'Atlantic Records', 'Pop, Rock & Urban', 'US'),
  ('interscope-records', 'Interscope Records', 'Pop, Hip-Hop & Mainstream', 'US'),
  ('columbia-records', 'Columbia Records', 'Pop, Rock, Eletrônica & Hip-Hop', 'US'),
  ('republic-records', 'Republic Records', 'Pop, R&B & Hip-Hop', 'US'),
  ('top-dawg-entertainment', 'Top Dawg Entertainment', 'Hip-Hop, Rap & R&B', 'US'),
  ('domino-recording', 'Domino Recording Co.', 'Indie Rock & Alternative', 'GB'),
  ('parlophone', 'Parlophone', 'Rock, Alternative & Pop', 'GB')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  country = EXCLUDED.country;

-- =============================================================================
-- 3. ARTISTAS OFICIAIS (`public.artists`)
-- =============================================================================
INSERT INTO public.artists (id, name, image_url, banner_url, genre, country, nb_fans, type, label_name, bio) VALUES
  (
    'f4abc0b5-3f7a-4eff-8f78-ac078dbce533',
    'Billie Eilish',
    'https://coverartarchive.org/release-group/02a544b3-0459-42c7-bd9c-047162e7b67a/front-250',
    'https://coverartarchive.org/release-group/02a544b3-0459-42c7-bd9c-047162e7b67a/front-500',
    'Pop / Alt-Pop',
    'US',
    3420,
    'Person',
    'Darkroom / Interscope Records',
    'Billie Eilish é uma das personalidades mais influentes e celebradas da música contemporânea, consolidando sua trajetória artística através de produções aclamadas mundialmente e sonoridades pioneiras no universo Pop / Alt-Pop.'
  ),
  (
    '381086ea-f511-4aba-bdf9-71c753dc5077',
    'Kendrick Lamar',
    'https://coverartarchive.org/release-group/32cb822c-a14e-49ce-a169-f209c5f31e0f/front-250',
    'https://coverartarchive.org/release-group/32cb822c-a14e-49ce-a169-f209c5f31e0f/front-500',
    'Hip-Hop / Rap',
    'US',
    3890,
    'Person',
    'pgLang / Interscope Records / Top Dawg',
    'Kendrick Lamar é uma das personalidades mais influentes e celebradas da música contemporânea, consolidando sua trajetória artística através de produções aclamadas mundialmente e sonoridades pioneiras no universo Hip-Hop / Rap.'
  ),
  (
    'c8b03190-306c-4120-bb0b-6f2ebfc06ea9',
    'The Weeknd',
    'https://coverartarchive.org/release-group/78570bea-2a26-467c-a3db-c52723ceb394/front-250',
    'https://coverartarchive.org/release-group/78570bea-2a26-467c-a3db-c52723ceb394/front-500',
    'R&B / Synthpop',
    'CA',
    3110,
    'Person',
    'XO / Republic Records',
    'The Weeknd é uma das personalidades mais influentes e celebradas da música contemporânea, consolidando sua trajetória artística através de produções aclamadas mundialmente e sonoridades pioneiras no universo R&B / Synthpop.'
  ),
  (
    '056e4f3e-d505-4dad-8ec1-d04f521cbb56',
    'Daft Punk',
    'https://coverartarchive.org/release-group/aa997ea0-2936-40bd-884d-3af8a0e064dc/front-250',
    'https://coverartarchive.org/release-group/aa997ea0-2936-40bd-884d-3af8a0e064dc/front-500',
    'Eletrônica / French House',
    'FR',
    4120,
    'Group',
    'Columbia Records / Daft Life Ltd.',
    'Daft Punk é uma das duplas mais influentes e celebradas da música eletrônica mundial, redefinindo o French House e a música dance com obras-primas atemporais.'
  ),
  (
    '83d91898-7763-47d7-b03b-b92132375c47',
    'Pink Floyd',
    'https://coverartarchive.org/release-group/f5093c06-23e3-404f-aeaa-40f72885ee3a/front-250',
    'https://coverartarchive.org/release-group/f5093c06-23e3-404f-aeaa-40f72885ee3a/front-500',
    'Progressive Rock',
    'GB',
    4390,
    'Group',
    'Harvest / EMI / Columbia Records',
    'Pink Floyd é um dos grupos mais lendários da história da música, pioneiro do rock progressivo e psicodélico com álbuns conceituais que marcaram gerações.'
  ),
  (
    '260b6184-8828-48eb-945c-bc4cb6fc34ca',
    'Charli xcx',
    'https://coverartarchive.org/release-group/e0fdb431-0109-420d-8a37-f99eaeb4d671/front-250',
    'https://coverartarchive.org/release-group/e0fdb431-0109-420d-8a37-f99eaeb4d671/front-500',
    'Hyperpop / Eletrônica',
    'GB',
    3190,
    'Person',
    'Atlantic Records',
    'Charli xcx é uma força visionária do pop vanguardista e hyperpop, unindo música eletrônica de clube e estética cultural icônica.'
  ),
  (
    '859d0860-d480-4efd-970c-c05d5f1776b8',
    'Beyoncé',
    'https://coverartarchive.org/release-group/2c385052-5083-43a2-b1e5-36566d2ae3c0/front-250',
    'https://coverartarchive.org/release-group/2c385052-5083-43a2-b1e5-36566d2ae3c0/front-500',
    'Pop / R&B',
    'US',
    2950,
    'Person',
    'Parkwood Entertainment / Columbia Records',
    'Beyoncé é um ícone global da música, reconhecida por seus vocais poderosos, álbuns visuais revolucionários e reinvenção constante de gêneros.'
  ),
  (
    '272989c8-5535-492d-a25c-9f58803e027f',
    'SZA',
    'https://coverartarchive.org/release-group/1646286a-d0ad-4288-bfab-34b0fb7b22c1/front-250',
    'https://coverartarchive.org/release-group/1646286a-d0ad-4288-bfab-34b0fb7b22c1/front-500',
    'R&B / Neo-Soul',
    'US',
    2890,
    'Person',
    'Top Dawg Entertainment / RCA Records',
    'SZA é uma das maiores vozes do R&B contemporâneo e neo-soul, celebrada por composições vulneráveis e melodias hipnóticas.'
  ),
  (
    'a74b1b7f-71a5-4011-9441-d0b5e4122711',
    'Radiohead',
    'https://coverartarchive.org/release-group/b1392450-e666-3926-a536-22c65f834433/front-250',
    'https://coverartarchive.org/release-group/b1392450-e666-3926-a536-22c65f834433/front-500',
    'Alternative Rock / Art Rock',
    'GB',
    3670,
    'Group',
    'XL Recordings / Parlophone',
    'Radiohead é uma banda britânica fundamental para o rock alternativo e experimental moderno, autora de clássicos como OK Computer e In Rainbows.'
  ),
  (
    'e520459c-dff4-491d-a6e4-c97be35e0044',
    'Frank Ocean',
    'https://coverartarchive.org/release-group/0da340a0-6ad7-4fc2-a272-6f94393a7831/front-250',
    'https://coverartarchive.org/release-group/0da340a0-6ad7-4fc2-a272-6f94393a7831/front-500',
    'R&B / Alternative R&B',
    'US',
    3540,
    'Person',
    'Blondeed / Boys Don’t Cry',
    'Frank Ocean é um dos artistas mais aclamados do século XXI, conhecido por sua escrita poética, arranjos minimalistas e produções vanguardistas no R&B.'
  ),
  (
    '63aa26c3-d59b-4da4-84ac-716b54f1ef4d',
    'Tame Impala',
    'https://coverartarchive.org/release-group/08aa7a6c-3e43-4459-87b2-e47faf3a088a/front-250',
    'https://coverartarchive.org/release-group/08aa7a6c-3e43-4459-87b2-e47faf3a088a/front-500',
    'Indie / Psychedelic Pop',
    'AU',
    3320,
    'Person',
    'Modular / Interscope',
    'Tame Impala é o projeto musical psicodélico liderado por Kevin Parker, combinando sintetizadores analógicos, grooves hipnóticos e produção impecável.'
  ),
  (
    'ada7a83c-e3e1-40f1-93f9-3e73dbc9298a',
    'Arctic Monkeys',
    'https://coverartarchive.org/release-group/a348ba2f-f8b3-4686-b928-e63d8d94d543/front-250',
    'https://coverartarchive.org/release-group/a348ba2f-f8b3-4686-b928-e63d8d94d543/front-500',
    'Indie Rock',
    'GB',
    3280,
    'Group',
    'Domino Recording Co.',
    'Arctic Monkeys é uma das bandas de indie rock mais importantes da música britânica, liderada por Alex Turner.'
  ),
  (
    '6f1a58bf-9b1b-49cf-a44a-6cefad7ae04f',
    'Dua Lipa',
    'https://coverartarchive.org/release-group/37cfca48-dabb-48b9-8a76-0ea08a965eb9/front-250',
    'https://coverartarchive.org/release-group/37cfca48-dabb-48b9-8a76-0ea08a965eb9/front-500',
    'Pop / Dance-Pop',
    'GB',
    2840,
    'Person',
    'Warner Records',
    'Dua Lipa revitalizou o dance-pop e disco-pop contemporâneo com hits globais e produções eletrizantes.'
  ),
  (
    'f6beac20-5dfe-4d1f-ae02-0b0a740aafd6',
    'Tyler, The Creator',
    'https://coverartarchive.org/release-group/0f1b9e07-b38b-4bba-9794-55e0924d7177/front-250',
    'https://coverartarchive.org/release-group/0f1b9e07-b38b-4bba-9794-55e0924d7177/front-500',
    'Hip-Hop / Neo-Soul',
    'US',
    3150,
    'Person',
    'Columbia Records',
    'Tyler, The Creator é um produtor, rapper e diretor criativo conhecido por álbuns conceituais ousados e estética inconfundível.'
  ),
  (
    '20244d07-534f-4eff-b4d4-930878889970',
    'Taylor Swift',
    'https://coverartarchive.org/release-group/0dcc84fb-c592-46e9-ba92-a52bb44dd553/front-250',
    'https://coverartarchive.org/release-group/0dcc84fb-c592-46e9-ba92-a52bb44dd553/front-500',
    'Pop / Synthpop',
    'US',
    3050,
    'Person',
    'Republic Records / Universal Music',
    'Taylor Swift é uma das maiores compositoras e artistas da história da música pop mundial.'
  ),
  (
    '6925db17-f35e-42f3-a4eb-84ee6bf5d4b0',
    'Olivia Rodrigo',
    'https://coverartarchive.org/release-group/2ae2e504-7116-4b4f-b632-9748bb18ccd2/front-250',
    'https://coverartarchive.org/release-group/2ae2e504-7116-4b4f-b632-9748bb18ccd2/front-500',
    'Pop / Pop-Rock',
    'US',
    2760,
    'Person',
    'Geffen Records / Interscope',
    'Olivia Rodrigo conquistou a crítica e o público global combinando pop-rock alternativo e composições confessionais.'
  ),
  (
    '89aa5ecb-59ad-46f5-b3eb-2d424e941f19',
    'Bad Bunny',
    'https://coverartarchive.org/release-group/e992b449-141b-4aea-b07b-9b2a478a8570/front-250',
    'https://coverartarchive.org/release-group/e992b449-141b-4aea-b07b-9b2a478a8570/front-500',
    'Urbano / Reggaeton',
    'PR',
    2910,
    'Person',
    'Rimas Entertainment',
    'Bad Bunny levou a música urbana latina e o reggaeton de Porto Rico ao topo das paradas mundiais.'
  ),
  (
    '1882fe91-cdd9-49c9-9956-8e06a3810bd4',
    'Sabrina Carpenter',
    'https://coverartarchive.org/release-group/c8bea388-c195-4177-bf9b-7469f6e695a1/front-250',
    'https://coverartarchive.org/release-group/c8bea388-c195-4177-bf9b-7469f6e695a1/front-500',
    'Pop',
    'US',
    2540,
    'Person',
    'Island Records',
    'Sabrina Carpenter destaca-se no pop contemporâneo com carisma, refrões magnéticos e produções solares.'
  ),
  (
    '3a5d1cc7-627e-48ea-aba3-fdd20d782c33',
    'Chico Buarque',
    'https://coverartarchive.org/release-group/155bd1f1-0570-41f3-a38c-0dd81373a5b6/front-250',
    'https://coverartarchive.org/release-group/155bd1f1-0570-41f3-a38c-0dd81373a5b6/front-500',
    'MPB / Samba',
    'BR',
    2620,
    'Person',
    'Philips / MPB',
    'Chico Buarque é um dos maiores compositores, poetas e cantores da história da Música Popular Brasileira.'
  ),
  (
    '7b543eba-995a-4c30-a37e-f8cac424f167',
    'Novos Baianos',
    'https://coverartarchive.org/release-group/65790705-6d7b-3596-a427-fe5b8ab6481d/front-250',
    'https://coverartarchive.org/release-group/65790705-6d7b-3596-a427-fe5b8ab6481d/front-500',
    'MPB / Samba e pagode',
    'BR',
    2480,
    'Group',
    'Som Livre',
    'Novos Baianos revolucionou a música brasileira ao fundir samba, choro, bossa nova e guitarras de rock psicodélico.'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_url = EXCLUDED.image_url,
  banner_url = EXCLUDED.banner_url,
  genre = EXCLUDED.genre,
  country = EXCLUDED.country,
  nb_fans = EXCLUDED.nb_fans,
  type = EXCLUDED.type,
  label_name = EXCLUDED.label_name,
  bio = EXCLUDED.bio;

-- =============================================================================
-- 4. ÁLBUNS, EPS E SINGLES DO CATÁLOGO (`public.albums`)
-- =============================================================================
INSERT INTO public.albums (
  id, title, artist_id, artist_name,
  cover_xl, cover_big, cover_medium,
  release_date, record_type, genre_name, label,
  community_rating, total_reviews, listeners_count, is_featured
) VALUES
  (
    '02a544b3-0459-42c7-bd9c-047162e7b67a',
    'HIT ME HARD AND SOFT',
    'f4abc0b5-3f7a-4eff-8f78-ac078dbce533',
    'Billie Eilish',
    'https://coverartarchive.org/release-group/02a544b3-0459-42c7-bd9c-047162e7b67a/front-500',
    'https://coverartarchive.org/release-group/02a544b3-0459-42c7-bd9c-047162e7b67a/front-250',
    'https://coverartarchive.org/release-group/02a544b3-0459-42c7-bd9c-047162e7b67a/front-250',
    '2024-05-17', 'album', 'Pop', 'Darkroom / Interscope',
    9.5, 184, 3420, TRUE
  ),
  (
    'e0fdb431-0109-420d-8a37-f99eaeb4d671',
    'BRAT',
    '260b6184-8828-48eb-945c-bc4cb6fc34ca',
    'Charli xcx',
    'https://coverartarchive.org/release-group/e0fdb431-0109-420d-8a37-f99eaeb4d671/front-500',
    'https://coverartarchive.org/release-group/e0fdb431-0109-420d-8a37-f99eaeb4d671/front-250',
    'https://coverartarchive.org/release-group/e0fdb431-0109-420d-8a37-f99eaeb4d671/front-250',
    '2024-06-07', 'album', 'Eletrônica', 'Atlantic Records',
    9.4, 172, 3190, TRUE
  ),
  (
    '32cb822c-a14e-49ce-a169-f209c5f31e0f',
    'GNX',
    '381086ea-f511-4aba-bdf9-71c753dc5077',
    'Kendrick Lamar',
    'https://coverartarchive.org/release-group/32cb822c-a14e-49ce-a169-f209c5f31e0f/front-500',
    'https://coverartarchive.org/release-group/32cb822c-a14e-49ce-a169-f209c5f31e0f/front-250',
    'https://coverartarchive.org/release-group/32cb822c-a14e-49ce-a169-f209c5f31e0f/front-250',
    '2024-11-22', 'album', 'Hip-Hop', 'pgLang / Interscope',
    9.6, 195, 3580, TRUE
  ),
  (
    '78570bea-2a26-467c-a3db-c52723ceb394',
    'After Hours',
    'c8b03190-306c-4120-bb0b-6f2ebfc06ea9',
    'The Weeknd',
    'https://coverartarchive.org/release-group/78570bea-2a26-467c-a3db-c52723ceb394/front-500',
    'https://coverartarchive.org/release-group/78570bea-2a26-467c-a3db-c52723ceb394/front-250',
    'https://coverartarchive.org/release-group/78570bea-2a26-467c-a3db-c52723ceb394/front-250',
    '2020-03-20', 'album', 'R&B', 'XO / Republic',
    9.3, 168, 3110, TRUE
  ),
  (
    'aa997ea0-2936-40bd-884d-3af8a0e064dc',
    'Random Access Memories',
    '056e4f3e-d505-4dad-8ec1-d04f521cbb56',
    'Daft Punk',
    'https://coverartarchive.org/release-group/aa997ea0-2936-40bd-884d-3af8a0e064dc/front-500',
    'https://coverartarchive.org/release-group/aa997ea0-2936-40bd-884d-3af8a0e064dc/front-250',
    'https://coverartarchive.org/release-group/aa997ea0-2936-40bd-884d-3af8a0e064dc/front-250',
    '2013-05-17', 'album', 'Eletrônica', 'Columbia Records',
    9.8, 240, 4120, TRUE
  ),
  (
    'f5093c06-23e3-404f-aeaa-40f72885ee3a',
    'The Dark Side of the Moon',
    '83d91898-7763-47d7-b03b-b92132375c47',
    'Pink Floyd',
    'https://coverartarchive.org/release-group/f5093c06-23e3-404f-aeaa-40f72885ee3a/front-500',
    'https://coverartarchive.org/release-group/f5093c06-23e3-404f-aeaa-40f72885ee3a/front-250',
    'https://coverartarchive.org/release-group/f5093c06-23e3-404f-aeaa-40f72885ee3a/front-250',
    '1973-03-24', 'album', 'Rock', 'Harvest / EMI',
    9.9, 265, 4390, TRUE
  ),
  (
    'd9103c72-3807-4378-9ce7-b6f3e8fdd547',
    'To Pimp a Butterfly',
    '381086ea-f511-4aba-bdf9-71c753dc5077',
    'Kendrick Lamar',
    'https://coverartarchive.org/release-group/d9103c72-3807-4378-9ce7-b6f3e8fdd547/front-500',
    'https://coverartarchive.org/release-group/d9103c72-3807-4378-9ce7-b6f3e8fdd547/front-250',
    'https://coverartarchive.org/release-group/d9103c72-3807-4378-9ce7-b6f3e8fdd547/front-250',
    '2015-03-15', 'album', 'Hip-Hop', 'Top Dawg / Aftermath',
    9.9, 252, 3890, TRUE
  ),
  (
    'b1392450-e666-3926-a536-22c65f834433',
    'OK Computer',
    'a74b1b7f-71a5-4011-9441-d0b5e4122711',
    'Radiohead',
    'https://coverartarchive.org/release-group/b1392450-e666-3926-a536-22c65f834433/front-500',
    'https://coverartarchive.org/release-group/b1392450-e666-3926-a536-22c65f834433/front-250',
    'https://coverartarchive.org/release-group/b1392450-e666-3926-a536-22c65f834433/front-250',
    '1997-05-21', 'album', 'Rock', 'Parlophone / XL',
    9.8, 230, 3670, TRUE
  ),
  (
    '0da340a0-6ad7-4fc2-a272-6f94393a7831',
    'Blonde',
    'e520459c-dff4-491d-a6e4-c97be35e0044',
    'Frank Ocean',
    'https://coverartarchive.org/release-group/0da340a0-6ad7-4fc2-a272-6f94393a7831/front-500',
    'https://coverartarchive.org/release-group/0da340a0-6ad7-4fc2-a272-6f94393a7831/front-250',
    'https://coverartarchive.org/release-group/0da340a0-6ad7-4fc2-a272-6f94393a7831/front-250',
    '2016-08-20', 'album', 'R&B', 'Boys Don’t Cry',
    9.7, 218, 3540, TRUE
  ),
  (
    '1646286a-d0ad-4288-bfab-34b0fb7b22c1',
    'SOS',
    '272989c8-5535-492d-a25c-9f58803e027f',
    'SZA',
    'https://coverartarchive.org/release-group/1646286a-d0ad-4288-bfab-34b0fb7b22c1/front-500',
    'https://coverartarchive.org/release-group/1646286a-d0ad-4288-bfab-34b0fb7b22c1/front-250',
    'https://coverartarchive.org/release-group/1646286a-d0ad-4288-bfab-34b0fb7b22c1/front-250',
    '2022-12-09', 'album', 'R&B', 'Top Dawg / RCA',
    9.2, 154, 2890, TRUE
  ),
  (
    '2c385052-5083-43a2-b1e5-36566d2ae3c0',
    'RENAISSANCE',
    '859d0860-d480-4efd-970c-c05d5f1776b8',
    'Beyoncé',
    'https://coverartarchive.org/release-group/2c385052-5083-43a2-b1e5-36566d2ae3c0/front-500',
    'https://coverartarchive.org/release-group/2c385052-5083-43a2-b1e5-36566d2ae3c0/front-250',
    'https://coverartarchive.org/release-group/2c385052-5083-43a2-b1e5-36566d2ae3c0/front-250',
    '2022-07-29', 'album', 'Pop', 'Parkwood / Columbia',
    9.4, 162, 2950, TRUE
  ),
  (
    '37cfca48-dabb-48b9-8a76-0ea08a965eb9',
    'Future Nostalgia',
    '6f1a58bf-9b1b-49cf-a44a-6cefad7ae04f',
    'Dua Lipa',
    'https://coverartarchive.org/release-group/37cfca48-dabb-48b9-8a76-0ea08a965eb9/front-500',
    'https://coverartarchive.org/release-group/37cfca48-dabb-48b9-8a76-0ea08a965eb9/front-250',
    'https://coverartarchive.org/release-group/37cfca48-dabb-48b9-8a76-0ea08a965eb9/front-250',
    '2020-03-27', 'album', 'Pop', 'Warner Records',
    9.1, 149, 2840, FALSE
  ),
  (
    '08aa7a6c-3e43-4459-87b2-e47faf3a088a',
    'Currents',
    '63aa26c3-d59b-4da4-84ac-716b54f1ef4d',
    'Tame Impala',
    'https://coverartarchive.org/release-group/08aa7a6c-3e43-4459-87b2-e47faf3a088a/front-500',
    'https://coverartarchive.org/release-group/08aa7a6c-3e43-4459-87b2-e47faf3a088a/front-250',
    'https://coverartarchive.org/release-group/08aa7a6c-3e43-4459-87b2-e47faf3a088a/front-250',
    '2015-07-17', 'album', 'Indie', 'Modular / Interscope',
    9.6, 190, 3320, TRUE
  ),
  (
    'a348ba2f-f8b3-4686-b928-e63d8d94d543',
    'AM',
    'ada7a83c-e3e1-40f1-93f9-3e73dbc9298a',
    'Arctic Monkeys',
    'https://coverartarchive.org/release-group/a348ba2f-f8b3-4686-b928-e63d8d94d543/front-500',
    'https://coverartarchive.org/release-group/a348ba2f-f8b3-4686-b928-e63d8d94d543/front-250',
    'https://coverartarchive.org/release-group/a348ba2f-f8b3-4686-b928-e63d8d94d543/front-250',
    '2013-09-09', 'album', 'Indie', 'Domino Recording Co.',
    9.2, 176, 3280, FALSE
  ),
  (
    '0f1b9e07-b38b-4bba-9794-55e0924d7177',
    'IGOR',
    'f6beac20-5dfe-4d1f-ae02-0b0a740aafd6',
    'Tyler, The Creator',
    'https://coverartarchive.org/release-group/0f1b9e07-b38b-4bba-9794-55e0924d7177/front-500',
    'https://coverartarchive.org/release-group/0f1b9e07-b38b-4bba-9794-55e0924d7177/front-250',
    'https://coverartarchive.org/release-group/0f1b9e07-b38b-4bba-9794-55e0924d7177/front-250',
    '2019-05-17', 'album', 'Hip-Hop', 'Columbia Records',
    9.5, 181, 3150, FALSE
  ),
  (
    '0dcc84fb-c592-46e9-ba92-a52bb44dd553',
    'Midnights',
    '20244d07-534f-4eff-b4d4-930878889970',
    'Taylor Swift',
    'https://coverartarchive.org/release-group/0dcc84fb-c592-46e9-ba92-a52bb44dd553/front-500',
    'https://coverartarchive.org/release-group/0dcc84fb-c592-46e9-ba92-a52bb44dd553/front-250',
    'https://coverartarchive.org/release-group/0dcc84fb-c592-46e9-ba92-a52bb44dd553/front-250',
    '2022-10-21', 'album', 'Pop', 'Republic Records',
    8.9, 160, 3050, FALSE
  ),
  (
    '2ae2e504-7116-4b4f-b632-9748bb18ccd2',
    'SOUR',
    '6925db17-f35e-42f3-a4eb-84ee6bf5d4b0',
    'Olivia Rodrigo',
    'https://coverartarchive.org/release-group/2ae2e504-7116-4b4f-b632-9748bb18ccd2/front-500',
    'https://coverartarchive.org/release-group/2ae2e504-7116-4b4f-b632-9748bb18ccd2/front-250',
    'https://coverartarchive.org/release-group/2ae2e504-7116-4b4f-b632-9748bb18ccd2/front-250',
    '2021-05-21', 'album', 'Pop', 'Geffen Records',
    9.0, 142, 2760, FALSE
  ),
  (
    'e992b449-141b-4aea-b07b-9b2a478a8570',
    'Un verano sin ti',
    '89aa5ecb-59ad-46f5-b3eb-2d424e941f19',
    'Bad Bunny',
    'https://coverartarchive.org/release-group/e992b449-141b-4aea-b07b-9b2a478a8570/front-500',
    'https://coverartarchive.org/release-group/e992b449-141b-4aea-b07b-9b2a478a8570/front-250',
    'https://coverartarchive.org/release-group/e992b449-141b-4aea-b07b-9b2a478a8570/front-250',
    '2022-05-06', 'album', 'Pop', 'Rimas Entertainment',
    9.1, 138, 2910, FALSE
  ),
  (
    'c8bea388-c195-4177-bf9b-7469f6e695a1',
    'Short n’ Sweet',
    '1882fe91-cdd9-49c9-9956-8e06a3810bd4',
    'Sabrina Carpenter',
    'https://coverartarchive.org/release-group/c8bea388-c195-4177-bf9b-7469f6e695a1/front-500',
    'https://coverartarchive.org/release-group/c8bea388-c195-4177-bf9b-7469f6e695a1/front-250',
    'https://coverartarchive.org/release-group/c8bea388-c195-4177-bf9b-7469f6e695a1/front-250',
    '2024-08-23', 'album', 'Pop', 'Island Records',
    8.8, 126, 2540, FALSE
  ),
  (
    'fa566e7b-254a-4fab-8aa5-ebcb7592d7f2',
    'COWBOY CARTER',
    '859d0860-d480-4efd-970c-c05d5f1776b8',
    'Beyoncé',
    'https://coverartarchive.org/release-group/fa566e7b-254a-4fab-8aa5-ebcb7592d7f2/front-500',
    'https://coverartarchive.org/release-group/fa566e7b-254a-4fab-8aa5-ebcb7592d7f2/front-250',
    'https://coverartarchive.org/release-group/fa566e7b-254a-4fab-8aa5-ebcb7592d7f2/front-250',
    '2024-03-29', 'album', 'Pop', 'Parkwood / Columbia',
    9.1, 134, 2690, FALSE
  ),
  (
    '9d4e5829-e0a6-44f2-98c4-fe51234b1ba5',
    'The Tortured Poets Department',
    '20244d07-534f-4eff-b4d4-930878889970',
    'Taylor Swift',
    'https://coverartarchive.org/release-group/9d4e5829-e0a6-44f2-98c4-fe51234b1ba5/front-500',
    'https://coverartarchive.org/release-group/9d4e5829-e0a6-44f2-98c4-fe51234b1ba5/front-250',
    'https://coverartarchive.org/release-group/9d4e5829-e0a6-44f2-98c4-fe51234b1ba5/front-250',
    '2024-04-19', 'album', 'Pop', 'Republic Records',
    8.7, 145, 2810, FALSE
  ),
  (
    '155bd1f1-0570-41f3-a38c-0dd81373a5b6',
    'Construção',
    '3a5d1cc7-627e-48ea-aba3-fdd20d782c33',
    'Chico Buarque',
    'https://coverartarchive.org/release-group/155bd1f1-0570-41f3-a38c-0dd81373a5b6/front-500',
    'https://coverartarchive.org/release-group/155bd1f1-0570-41f3-a38c-0dd81373a5b6/front-250',
    'https://coverartarchive.org/release-group/155bd1f1-0570-41f3-a38c-0dd81373a5b6/front-250',
    '1971-12-01', 'album', 'Samba e pagode', 'Philips / MPB',
    9.8, 164, 2620, TRUE
  ),
  (
    '65790705-6d7b-3596-a427-fe5b8ab6481d',
    'Acabou chorare',
    '7b543eba-995a-4c30-a37e-f8cac424f167',
    'Novos Baianos',
    'https://coverartarchive.org/release-group/65790705-6d7b-3596-a427-fe5b8ab6481d/front-500',
    'https://coverartarchive.org/release-group/65790705-6d7b-3596-a427-fe5b8ab6481d/front-250',
    'https://coverartarchive.org/release-group/65790705-6d7b-3596-a427-fe5b8ab6481d/front-250',
    '1972-01-01', 'album', 'Samba e pagode', 'Som Livre',
    9.7, 150, 2480, TRUE
  ),
  (
    'ep-dont-smile-at-me',
    'dont smile at me',
    'f4abc0b5-3f7a-4eff-8f78-ac078dbce533',
    'Billie Eilish',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=65&w=500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=65&w=250&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=65&w=250&auto=format&fit=crop',
    '2017-08-11', 'ep', 'Pop', 'Darkroom / Interscope',
    9.1, 118, 2450, FALSE
  ),
  (
    'ep-vroom-vroom',
    'Vroom Vroom',
    '260b6184-8828-48eb-945c-bc4cb6fc34ca',
    'Charli xcx',
    'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=65&w=500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=65&w=250&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=65&w=250&auto=format&fit=crop',
    '2016-02-26', 'ep', 'Eletrônica', 'Vroom Vroom Recordings',
    9.3, 96, 1980, FALSE
  ),
  (
    'single-not-like-us',
    'Not Like Us',
    '381086ea-f511-4aba-bdf9-71c753dc5077',
    'Kendrick Lamar',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=65&w=500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=65&w=250&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=65&w=250&auto=format&fit=crop',
    '2024-05-04', 'single', 'Hip-Hop', 'pgLang / Interscope',
    9.7, 210, 3920, FALSE
  ),
  (
    'single-espresso',
    'Espresso',
    '1882fe91-cdd9-49c9-9956-8e06a3810bd4',
    'Sabrina Carpenter',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=65&w=500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=65&w=250&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=65&w=250&auto=format&fit=crop',
    '2024-04-11', 'single', 'Pop', 'Island Records',
    9.0, 144, 2890, FALSE
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  artist_id = EXCLUDED.artist_id,
  artist_name = EXCLUDED.artist_name,
  cover_xl = EXCLUDED.cover_xl,
  cover_big = EXCLUDED.cover_big,
  cover_medium = EXCLUDED.cover_medium,
  release_date = EXCLUDED.release_date,
  record_type = EXCLUDED.record_type,
  genre_name = EXCLUDED.genre_name,
  label = EXCLUDED.label,
  community_rating = EXCLUDED.community_rating,
  total_reviews = EXCLUDED.total_reviews,
  listeners_count = EXCLUDED.listeners_count,
  is_featured = EXCLUDED.is_featured;

-- =============================================================================
-- 5. FAIXAS / MÚSICAS DOS ÁLBUNS (`public.tracks`)
-- =============================================================================
INSERT INTO public.tracks (id, album_id, artist_id, artist_name, title, duration, track_number, is_top_track) VALUES
  -- HIT ME HARD AND SOFT (Billie Eilish)
  ('hmhas-1',  '02a544b3-0459-42c7-bd9c-047162e7b67a', 'f4abc0b5-3f7a-4eff-8f78-ac078dbce533', 'Billie Eilish', 'SKINNY', 219, 1, FALSE),
  ('hmhas-2',  '02a544b3-0459-42c7-bd9c-047162e7b67a', 'f4abc0b5-3f7a-4eff-8f78-ac078dbce533', 'Billie Eilish', 'LUNCH', 179, 2, FALSE),
  ('hmhas-3',  '02a544b3-0459-42c7-bd9c-047162e7b67a', 'f4abc0b5-3f7a-4eff-8f78-ac078dbce533', 'Billie Eilish', 'CHIHIRO', 303, 3, TRUE),
  ('hmhas-4',  '02a544b3-0459-42c7-bd9c-047162e7b67a', 'f4abc0b5-3f7a-4eff-8f78-ac078dbce533', 'Billie Eilish', 'BIRDS OF A FEATHER', 210, 4, TRUE),
  ('hmhas-5',  '02a544b3-0459-42c7-bd9c-047162e7b67a', 'f4abc0b5-3f7a-4eff-8f78-ac078dbce533', 'Billie Eilish', 'WILDFLOWER', 261, 5, FALSE),
  ('hmhas-6',  '02a544b3-0459-42c7-bd9c-047162e7b67a', 'f4abc0b5-3f7a-4eff-8f78-ac078dbce533', 'Billie Eilish', 'THE GREATEST', 293, 6, FALSE),
  ('hmhas-7',  '02a544b3-0459-42c7-bd9c-047162e7b67a', 'f4abc0b5-3f7a-4eff-8f78-ac078dbce533', 'Billie Eilish', 'L’AMOUR DE MA VIE', 333, 7, FALSE),
  ('hmhas-8',  '02a544b3-0459-42c7-bd9c-047162e7b67a', 'f4abc0b5-3f7a-4eff-8f78-ac078dbce533', 'Billie Eilish', 'THE DINER', 186, 8, FALSE),
  ('hmhas-9',  '02a544b3-0459-42c7-bd9c-047162e7b67a', 'f4abc0b5-3f7a-4eff-8f78-ac078dbce533', 'Billie Eilish', 'BITTERSUITE', 298, 9, FALSE),
  ('hmhas-10', '02a544b3-0459-42c7-bd9c-047162e7b67a', 'f4abc0b5-3f7a-4eff-8f78-ac078dbce533', 'Billie Eilish', 'BLUE', 343, 10, FALSE),

  -- BRAT (Charli xcx)
  ('brat-1',  'e0fdb431-0109-420d-8a37-f99eaeb4d671', '260b6184-8828-48eb-945c-bc4cb6fc34ca', 'Charli xcx', '360', 133, 1, TRUE),
  ('brat-2',  'e0fdb431-0109-420d-8a37-f99eaeb4d671', '260b6184-8828-48eb-945c-bc4cb6fc34ca', 'Charli xcx', 'Club classics', 153, 2, FALSE),
  ('brat-3',  'e0fdb431-0109-420d-8a37-f99eaeb4d671', '260b6184-8828-48eb-945c-bc4cb6fc34ca', 'Charli xcx', 'Sympathy is a knife', 151, 3, FALSE),
  ('brat-4',  'e0fdb431-0109-420d-8a37-f99eaeb4d671', '260b6184-8828-48eb-945c-bc4cb6fc34ca', 'Charli xcx', 'I might say something stupid', 109, 4, FALSE),
  ('brat-5',  'e0fdb431-0109-420d-8a37-f99eaeb4d671', '260b6184-8828-48eb-945c-bc4cb6fc34ca', 'Charli xcx', 'Talk talk', 161, 5, FALSE),
  ('brat-6',  'e0fdb431-0109-420d-8a37-f99eaeb4d671', '260b6184-8828-48eb-945c-bc4cb6fc34ca', 'Charli xcx', 'Von dutch', 164, 6, FALSE),
  ('brat-7',  'e0fdb431-0109-420d-8a37-f99eaeb4d671', '260b6184-8828-48eb-945c-bc4cb6fc34ca', 'Charli xcx', 'Everything is romantic', 203, 7, FALSE),
  ('brat-8',  'e0fdb431-0109-420d-8a37-f99eaeb4d671', '260b6184-8828-48eb-945c-bc4cb6fc34ca', 'Charli xcx', 'Rewind', 168, 8, FALSE),
  ('brat-9',  'e0fdb431-0109-420d-8a37-f99eaeb4d671', '260b6184-8828-48eb-945c-bc4cb6fc34ca', 'Charli xcx', 'Apple', 151, 9, FALSE),
  ('brat-10', 'e0fdb431-0109-420d-8a37-f99eaeb4d671', '260b6184-8828-48eb-945c-bc4cb6fc34ca', 'Charli xcx', '365', 203, 10, FALSE),

  -- GNX (Kendrick Lamar)
  ('gnx-1',  '32cb822c-a14e-49ce-a169-f209c5f31e0f', '381086ea-f511-4aba-bdf9-71c753dc5077', 'Kendrick Lamar', 'wacced out murals', 317, 1, FALSE),
  ('gnx-2',  '32cb822c-a14e-49ce-a169-f209c5f31e0f', '381086ea-f511-4aba-bdf9-71c753dc5077', 'Kendrick Lamar', 'squabble up', 157, 2, FALSE),
  ('gnx-3',  '32cb822c-a14e-49ce-a169-f209c5f31e0f', '381086ea-f511-4aba-bdf9-71c753dc5077', 'Kendrick Lamar & SZA', 'luther', 177, 3, TRUE),
  ('gnx-4',  '32cb822c-a14e-49ce-a169-f209c5f31e0f', '381086ea-f511-4aba-bdf9-71c753dc5077', 'Kendrick Lamar', 'man at the garden', 233, 4, FALSE),
  ('gnx-5',  '32cb822c-a14e-49ce-a169-f209c5f31e0f', '381086ea-f511-4aba-bdf9-71c753dc5077', 'Kendrick Lamar', 'hey now', 217, 5, FALSE),
  ('gnx-6',  '32cb822c-a14e-49ce-a169-f209c5f31e0f', '381086ea-f511-4aba-bdf9-71c753dc5077', 'Kendrick Lamar', 'reincarnated', 275, 6, FALSE),
  ('gnx-7',  '32cb822c-a14e-49ce-a169-f209c5f31e0f', '381086ea-f511-4aba-bdf9-71c753dc5077', 'Kendrick Lamar', 'tv off', 220, 7, FALSE),
  ('gnx-8',  '32cb822c-a14e-49ce-a169-f209c5f31e0f', '381086ea-f511-4aba-bdf9-71c753dc5077', 'Kendrick Lamar', 'dodger blue', 131, 8, FALSE),
  ('gnx-9',  '32cb822c-a14e-49ce-a169-f209c5f31e0f', '381086ea-f511-4aba-bdf9-71c753dc5077', 'Kendrick Lamar', 'heart pt. 6', 292, 9, FALSE),
  ('gnx-10', '32cb822c-a14e-49ce-a169-f209c5f31e0f', '381086ea-f511-4aba-bdf9-71c753dc5077', 'Kendrick Lamar', 'gloria', 287, 10, FALSE),

  -- After Hours (The Weeknd)
  ('ah-1', '78570bea-2a26-467c-a3db-c52723ceb394', 'c8b03190-306c-4120-bb0b-6f2ebfc06ea9', 'The Weeknd', 'Alone Again', 250, 1, FALSE),
  ('ah-2', '78570bea-2a26-467c-a3db-c52723ceb394', 'c8b03190-306c-4120-bb0b-6f2ebfc06ea9', 'The Weeknd', 'Too Late', 239, 2, FALSE),
  ('ah-3', '78570bea-2a26-467c-a3db-c52723ceb394', 'c8b03190-306c-4120-bb0b-6f2ebfc06ea9', 'The Weeknd', 'Hardest to Love', 211, 3, FALSE),
  ('ah-4', '78570bea-2a26-467c-a3db-c52723ceb394', 'c8b03190-306c-4120-bb0b-6f2ebfc06ea9', 'The Weeknd', 'Heartless', 198, 4, FALSE),
  ('ah-5', '78570bea-2a26-467c-a3db-c52723ceb394', 'c8b03190-306c-4120-bb0b-6f2ebfc06ea9', 'The Weeknd', 'Faith', 283, 5, FALSE),
  ('ah-6', '78570bea-2a26-467c-a3db-c52723ceb394', 'c8b03190-306c-4120-bb0b-6f2ebfc06ea9', 'The Weeknd', 'Blinding Lights', 200, 6, TRUE),
  ('ah-7', '78570bea-2a26-467c-a3db-c52723ceb394', 'c8b03190-306c-4120-bb0b-6f2ebfc06ea9', 'The Weeknd', 'In Your Eyes', 237, 7, FALSE),
  ('ah-8', '78570bea-2a26-467c-a3db-c52723ceb394', 'c8b03190-306c-4120-bb0b-6f2ebfc06ea9', 'The Weeknd', 'Save Your Tears', 215, 8, FALSE),
  ('ah-9', '78570bea-2a26-467c-a3db-c52723ceb394', 'c8b03190-306c-4120-bb0b-6f2ebfc06ea9', 'The Weeknd', 'After Hours', 361, 9, FALSE),

  -- Random Access Memories (Daft Punk)
  ('ram-1', 'aa997ea0-2936-40bd-884d-3af8a0e064dc', '056e4f3e-d505-4dad-8ec1-d04f521cbb56', 'Daft Punk', 'Give Life Back to Music', 275, 1, FALSE),
  ('ram-2', 'aa997ea0-2936-40bd-884d-3af8a0e064dc', '056e4f3e-d505-4dad-8ec1-d04f521cbb56', 'Daft Punk', 'The Game of Love', 322, 2, FALSE),
  ('ram-3', 'aa997ea0-2936-40bd-884d-3af8a0e064dc', '056e4f3e-d505-4dad-8ec1-d04f521cbb56', 'Daft Punk', 'Giorgio by Moroder', 544, 3, FALSE),
  ('ram-4', 'aa997ea0-2936-40bd-884d-3af8a0e064dc', '056e4f3e-d505-4dad-8ec1-d04f521cbb56', 'Daft Punk', 'Instant Crush', 337, 4, TRUE),
  ('ram-5', 'aa997ea0-2936-40bd-884d-3af8a0e064dc', '056e4f3e-d505-4dad-8ec1-d04f521cbb56', 'Daft Punk', 'Lose Yourself to Dance', 353, 5, FALSE),
  ('ram-6', 'aa997ea0-2936-40bd-884d-3af8a0e064dc', '056e4f3e-d505-4dad-8ec1-d04f521cbb56', 'Daft Punk', 'Touch', 498, 6, FALSE),
  ('ram-7', 'aa997ea0-2936-40bd-884d-3af8a0e064dc', '056e4f3e-d505-4dad-8ec1-d04f521cbb56', 'Daft Punk', 'Get Lucky', 369, 7, FALSE),
  ('ram-8', 'aa997ea0-2936-40bd-884d-3af8a0e064dc', '056e4f3e-d505-4dad-8ec1-d04f521cbb56', 'Daft Punk', 'Contact', 381, 8, FALSE),

  -- The Dark Side of the Moon (Pink Floyd)
  ('dsotm-1', 'f5093c06-23e3-404f-aeaa-40f72885ee3a', '83d91898-7763-47d7-b03b-b92132375c47', 'Pink Floyd', 'Speak to Me / Breathe', 238, 1, FALSE),
  ('dsotm-2', 'f5093c06-23e3-404f-aeaa-40f72885ee3a', '83d91898-7763-47d7-b03b-b92132375c47', 'Pink Floyd', 'On the Run', 216, 2, FALSE),
  ('dsotm-3', 'f5093c06-23e3-404f-aeaa-40f72885ee3a', '83d91898-7763-47d7-b03b-b92132375c47', 'Pink Floyd', 'Time', 413, 3, TRUE),
  ('dsotm-4', 'f5093c06-23e3-404f-aeaa-40f72885ee3a', '83d91898-7763-47d7-b03b-b92132375c47', 'Pink Floyd', 'The Great Gig in the Sky', 283, 4, FALSE),
  ('dsotm-5', 'f5093c06-23e3-404f-aeaa-40f72885ee3a', '83d91898-7763-47d7-b03b-b92132375c47', 'Pink Floyd', 'Money', 382, 5, FALSE),
  ('dsotm-6', 'f5093c06-23e3-404f-aeaa-40f72885ee3a', '83d91898-7763-47d7-b03b-b92132375c47', 'Pink Floyd', 'Us and Them', 469, 6, FALSE),
  ('dsotm-7', 'f5093c06-23e3-404f-aeaa-40f72885ee3a', '83d91898-7763-47d7-b03b-b92132375c47', 'Pink Floyd', 'Any Colour You Like', 206, 7, FALSE),
  ('dsotm-8', 'f5093c06-23e3-404f-aeaa-40f72885ee3a', '83d91898-7763-47d7-b03b-b92132375c47', 'Pink Floyd', 'Brain Damage', 226, 8, FALSE),
  ('dsotm-9', 'f5093c06-23e3-404f-aeaa-40f72885ee3a', '83d91898-7763-47d7-b03b-b92132375c47', 'Pink Floyd', 'Eclipse', 123, 9, FALSE),

  -- To Pimp a Butterfly (Kendrick Lamar)
  ('tpab-1',  'd9103c72-3807-4378-9ce7-b6f3e8fdd547', '381086ea-f511-4aba-bdf9-71c753dc5077', 'Kendrick Lamar', 'Wesley’s Theory', 287, 1, FALSE),
  ('tpab-2',  'd9103c72-3807-4378-9ce7-b6f3e8fdd547', '381086ea-f511-4aba-bdf9-71c753dc5077', 'Kendrick Lamar', 'King Kunta', 234, 2, FALSE),
  ('tpab-3',  'd9103c72-3807-4378-9ce7-b6f3e8fdd547', '381086ea-f511-4aba-bdf9-71c753dc5077', 'Kendrick Lamar', 'Institutionalized', 271, 3, FALSE),
  ('tpab-4',  'd9103c72-3807-4378-9ce7-b6f3e8fdd547', '381086ea-f511-4aba-bdf9-71c753dc5077', 'Kendrick Lamar', 'These Walls', 300, 4, FALSE),
  ('tpab-5',  'd9103c72-3807-4378-9ce7-b6f3e8fdd547', '381086ea-f511-4aba-bdf9-71c753dc5077', 'Kendrick Lamar', 'u', 268, 5, FALSE),
  ('tpab-6',  'd9103c72-3807-4378-9ce7-b6f3e8fdd547', '381086ea-f511-4aba-bdf9-71c753dc5077', 'Kendrick Lamar', 'Alright', 219, 6, FALSE),
  ('tpab-7',  'd9103c72-3807-4378-9ce7-b6f3e8fdd547', '381086ea-f511-4aba-bdf9-71c753dc5077', 'Kendrick Lamar', 'How Much a Dollar Cost', 261, 7, FALSE),
  ('tpab-8',  'd9103c72-3807-4378-9ce7-b6f3e8fdd547', '381086ea-f511-4aba-bdf9-71c753dc5077', 'Kendrick Lamar', 'The Blacker the Berry', 328, 8, FALSE),
  ('tpab-9',  'd9103c72-3807-4378-9ce7-b6f3e8fdd547', '381086ea-f511-4aba-bdf9-71c753dc5077', 'Kendrick Lamar', 'i', 336, 9, FALSE),
  ('tpab-10', 'd9103c72-3807-4378-9ce7-b6f3e8fdd547', '381086ea-f511-4aba-bdf9-71c753dc5077', 'Kendrick Lamar', 'Mortal Man', 727, 10, FALSE),

  -- OK Computer (Radiohead)
  ('okc-1', 'b1392450-e666-3926-a536-22c65f834433', 'a74b1b7f-71a5-4011-9441-d0b5e4122711', 'Radiohead', 'Airbag', 284, 1, FALSE),
  ('okc-2', 'b1392450-e666-3926-a536-22c65f834433', 'a74b1b7f-71a5-4011-9441-d0b5e4122711', 'Radiohead', 'Paranoid Android', 383, 2, TRUE),
  ('okc-3', 'b1392450-e666-3926-a536-22c65f834433', 'a74b1b7f-71a5-4011-9441-d0b5e4122711', 'Radiohead', 'Subterranean Homesick Alien', 267, 3, FALSE),
  ('okc-4', 'b1392450-e666-3926-a536-22c65f834433', 'a74b1b7f-71a5-4011-9441-d0b5e4122711', 'Radiohead', 'Exit Music (For a Film)', 264, 4, FALSE),
  ('okc-5', 'b1392450-e666-3926-a536-22c65f834433', 'a74b1b7f-71a5-4011-9441-d0b5e4122711', 'Radiohead', 'Let Down', 299, 5, FALSE),
  ('okc-6', 'b1392450-e666-3926-a536-22c65f834433', 'a74b1b7f-71a5-4011-9441-d0b5e4122711', 'Radiohead', 'Karma Police', 261, 6, FALSE),
  ('okc-7', 'b1392450-e666-3926-a536-22c65f834433', 'a74b1b7f-71a5-4011-9441-d0b5e4122711', 'Radiohead', 'No Surprises', 228, 7, FALSE),
  ('okc-8', 'b1392450-e666-3926-a536-22c65f834433', 'a74b1b7f-71a5-4011-9441-d0b5e4122711', 'Radiohead', 'Lucky', 259, 8, FALSE),
  ('okc-9', 'b1392450-e666-3926-a536-22c65f834433', 'a74b1b7f-71a5-4011-9441-d0b5e4122711', 'Radiohead', 'The Tourist', 324, 9, FALSE),

  -- Blonde (Frank Ocean)
  ('bl-1', '0da340a0-6ad7-4fc2-a272-6f94393a7831', 'e520459c-dff4-491d-a6e4-c97be35e0044', 'Frank Ocean', 'Nikes', 314, 1, FALSE),
  ('bl-2', '0da340a0-6ad7-4fc2-a272-6f94393a7831', 'e520459c-dff4-491d-a6e4-c97be35e0044', 'Frank Ocean', 'Ivy', 249, 2, FALSE),
  ('bl-3', '0da340a0-6ad7-4fc2-a272-6f94393a7831', 'e520459c-dff4-491d-a6e4-c97be35e0044', 'Frank Ocean', 'Pink + White', 184, 3, FALSE),
  ('bl-4', '0da340a0-6ad7-4fc2-a272-6f94393a7831', 'e520459c-dff4-491d-a6e4-c97be35e0044', 'Frank Ocean', 'Solo', 257, 4, FALSE),
  ('bl-5', '0da340a0-6ad7-4fc2-a272-6f94393a7831', 'e520459c-dff4-491d-a6e4-c97be35e0044', 'Frank Ocean', 'Self Control', 249, 5, FALSE),
  ('bl-6', '0da340a0-6ad7-4fc2-a272-6f94393a7831', 'e520459c-dff4-491d-a6e4-c97be35e0044', 'Frank Ocean', 'Nights', 307, 6, TRUE),
  ('bl-7', '0da340a0-6ad7-4fc2-a272-6f94393a7831', 'e520459c-dff4-491d-a6e4-c97be35e0044', 'Frank Ocean', 'White Ferrari', 248, 7, FALSE),
  ('bl-8', '0da340a0-6ad7-4fc2-a272-6f94393a7831', 'e520459c-dff4-491d-a6e4-c97be35e0044', 'Frank Ocean', 'Seigfried', 334, 8, FALSE),
  ('bl-9', '0da340a0-6ad7-4fc2-a272-6f94393a7831', 'e520459c-dff4-491d-a6e4-c97be35e0044', 'Frank Ocean', 'Godspeed', 177, 9, FALSE),

  -- SOS (SZA)
  ('sos-1', '1646286a-d0ad-4288-bfab-34b0fb7b22c1', '272989c8-5535-492d-a25c-9f58803e027f', 'SZA', 'SOS', 117, 1, FALSE),
  ('sos-2', '1646286a-d0ad-4288-bfab-34b0fb7b22c1', '272989c8-5535-492d-a25c-9f58803e027f', 'SZA', 'Kill Bill', 153, 2, TRUE),
  ('sos-3', '1646286a-d0ad-4288-bfab-34b0fb7b22c1', '272989c8-5535-492d-a25c-9f58803e027f', 'SZA', 'Seek & Destroy', 203, 3, FALSE),
  ('sos-4', '1646286a-d0ad-4288-bfab-34b0fb7b22c1', '272989c8-5535-492d-a25c-9f58803e027f', 'SZA', 'Low', 181, 4, FALSE),
  ('sos-5', '1646286a-d0ad-4288-bfab-34b0fb7b22c1', '272989c8-5535-492d-a25c-9f58803e027f', 'SZA', 'Love Language', 183, 5, FALSE),
  ('sos-6', '1646286a-d0ad-4288-bfab-34b0fb7b22c1', '272989c8-5535-492d-a25c-9f58803e027f', 'SZA', 'Blind', 150, 6, FALSE),
  ('sos-7', '1646286a-d0ad-4288-bfab-34b0fb7b22c1', '272989c8-5535-492d-a25c-9f58803e027f', 'SZA', 'Snooze', 201, 7, FALSE),
  ('sos-8', '1646286a-d0ad-4288-bfab-34b0fb7b22c1', '272989c8-5535-492d-a25c-9f58803e027f', 'SZA', 'Nobody Gets Me', 180, 8, FALSE),
  ('sos-9', '1646286a-d0ad-4288-bfab-34b0fb7b22c1', '272989c8-5535-492d-a25c-9f58803e027f', 'SZA', 'Good Days', 279, 9, FALSE),

  -- RENAISSANCE (Beyoncé)
  ('ren-1', '2c385052-5083-43a2-b1e5-36566d2ae3c0', '859d0860-d480-4efd-970c-c05d5f1776b8', 'Beyoncé', 'I’M THAT GIRL', 208, 1, FALSE),
  ('ren-2', '2c385052-5083-43a2-b1e5-36566d2ae3c0', '859d0860-d480-4efd-970c-c05d5f1776b8', 'Beyoncé', 'COZY', 210, 2, FALSE),
  ('ren-3', '2c385052-5083-43a2-b1e5-36566d2ae3c0', '859d0860-d480-4efd-970c-c05d5f1776b8', 'Beyoncé', 'ALIEN SUPERSTAR', 215, 3, FALSE),
  ('ren-4', '2c385052-5083-43a2-b1e5-36566d2ae3c0', '859d0860-d480-4efd-970c-c05d5f1776b8', 'Beyoncé', 'CUFF IT', 225, 4, TRUE),
  ('ren-5', '2c385052-5083-43a2-b1e5-36566d2ae3c0', '859d0860-d480-4efd-970c-c05d5f1776b8', 'Beyoncé', 'ENERGY', 116, 5, FALSE),
  ('ren-6', '2c385052-5083-43a2-b1e5-36566d2ae3c0', '859d0860-d480-4efd-970c-c05d5f1776b8', 'Beyoncé', 'BREAK MY SOUL', 278, 6, FALSE),
  ('ren-7', '2c385052-5083-43a2-b1e5-36566d2ae3c0', '859d0860-d480-4efd-970c-c05d5f1776b8', 'Beyoncé', 'VIRGO’S GROOVE', 368, 7, FALSE),
  ('ren-8', '2c385052-5083-43a2-b1e5-36566d2ae3c0', '859d0860-d480-4efd-970c-c05d5f1776b8', 'Beyoncé', 'HEATED', 260, 8, FALSE),
  ('ren-9', '2c385052-5083-43a2-b1e5-36566d2ae3c0', '859d0860-d480-4efd-970c-c05d5f1776b8', 'Beyoncé', 'SUMMER RENAISSANCE', 273, 9, FALSE),

  -- Future Nostalgia (Dua Lipa)
  ('fn-1', '37cfca48-dabb-48b9-8a76-0ea08a965eb9', '6f1a58bf-9b1b-49cf-a44a-6cefad7ae04f', 'Dua Lipa', 'Future Nostalgia', 184, 1, FALSE),
  ('fn-2', '37cfca48-dabb-48b9-8a76-0ea08a965eb9', '6f1a58bf-9b1b-49cf-a44a-6cefad7ae04f', 'Dua Lipa', 'Don’t Start Now', 183, 2, FALSE),
  ('fn-3', '37cfca48-dabb-48b9-8a76-0ea08a965eb9', '6f1a58bf-9b1b-49cf-a44a-6cefad7ae04f', 'Dua Lipa', 'Cool', 209, 3, FALSE),
  ('fn-4', '37cfca48-dabb-48b9-8a76-0ea08a965eb9', '6f1a58bf-9b1b-49cf-a44a-6cefad7ae04f', 'Dua Lipa', 'Physical', 193, 4, FALSE),
  ('fn-5', '37cfca48-dabb-48b9-8a76-0ea08a965eb9', '6f1a58bf-9b1b-49cf-a44a-6cefad7ae04f', 'Dua Lipa', 'Levitating', 203, 5, TRUE),
  ('fn-6', '37cfca48-dabb-48b9-8a76-0ea08a965eb9', '6f1a58bf-9b1b-49cf-a44a-6cefad7ae04f', 'Dua Lipa', 'Pretty Please', 194, 6, FALSE),
  ('fn-7', '37cfca48-dabb-48b9-8a76-0ea08a965eb9', '6f1a58bf-9b1b-49cf-a44a-6cefad7ae04f', 'Dua Lipa', 'Hallucinate', 208, 7, FALSE),
  ('fn-8', '37cfca48-dabb-48b9-8a76-0ea08a965eb9', '6f1a58bf-9b1b-49cf-a44a-6cefad7ae04f', 'Dua Lipa', 'Love Again', 258, 8, FALSE),
  ('fn-9', '37cfca48-dabb-48b9-8a76-0ea08a965eb9', '6f1a58bf-9b1b-49cf-a44a-6cefad7ae04f', 'Dua Lipa', 'Break My Heart', 221, 9, FALSE),

  -- Currents (Tame Impala)
  ('cur-1', '08aa7a6c-3e43-4459-87b2-e47faf3a088a', '63aa26c3-d59b-4da4-84ac-716b54f1ef4d', 'Tame Impala', 'Let It Happen', 467, 1, TRUE),
  ('cur-2', '08aa7a6c-3e43-4459-87b2-e47faf3a088a', '63aa26c3-d59b-4da4-84ac-716b54f1ef4d', 'Tame Impala', 'Nangs', 107, 2, FALSE),
  ('cur-3', '08aa7a6c-3e43-4459-87b2-e47faf3a088a', '63aa26c3-d59b-4da4-84ac-716b54f1ef4d', 'Tame Impala', 'The Moment', 255, 3, FALSE),
  ('cur-4', '08aa7a6c-3e43-4459-87b2-e47faf3a088a', '63aa26c3-d59b-4da4-84ac-716b54f1ef4d', 'Tame Impala', 'Yes I’m Changing', 270, 4, FALSE),
  ('cur-5', '08aa7a6c-3e43-4459-87b2-e47faf3a088a', '63aa26c3-d59b-4da4-84ac-716b54f1ef4d', 'Tame Impala', 'Eventually', 318, 5, FALSE),
  ('cur-6', '08aa7a6c-3e43-4459-87b2-e47faf3a088a', '63aa26c3-d59b-4da4-84ac-716b54f1ef4d', 'Tame Impala', 'The Less I Know the Better', 216, 6, FALSE),
  ('cur-7', '08aa7a6c-3e43-4459-87b2-e47faf3a088a', '63aa26c3-d59b-4da4-84ac-716b54f1ef4d', 'Tame Impala', 'Disciples', 108, 7, FALSE),
  ('cur-8', '08aa7a6c-3e43-4459-87b2-e47faf3a088a', '63aa26c3-d59b-4da4-84ac-716b54f1ef4d', 'Tame Impala', 'New Person, Same Old Mistakes', 363, 8, FALSE),

  -- AM (Arctic Monkeys)
  ('am-1', 'a348ba2f-f8b3-4686-b928-e63d8d94d543', 'ada7a83c-e3e1-40f1-93f9-3e73dbc9298a', 'Arctic Monkeys', 'Do I Wanna Know?', 272, 1, TRUE),
  ('am-2', 'a348ba2f-f8b3-4686-b928-e63d8d94d543', 'ada7a83c-e3e1-40f1-93f9-3e73dbc9298a', 'Arctic Monkeys', 'R U Mine?', 201, 2, FALSE),
  ('am-3', 'a348ba2f-f8b3-4686-b928-e63d8d94d543', 'ada7a83c-e3e1-40f1-93f9-3e73dbc9298a', 'Arctic Monkeys', 'One for the Road', 206, 3, FALSE),
  ('am-4', 'a348ba2f-f8b3-4686-b928-e63d8d94d543', 'ada7a83c-e3e1-40f1-93f9-3e73dbc9298a', 'Arctic Monkeys', 'Arabella', 207, 4, FALSE),
  ('am-5', 'a348ba2f-f8b3-4686-b928-e63d8d94d543', 'ada7a83c-e3e1-40f1-93f9-3e73dbc9298a', 'Arctic Monkeys', 'No. 1 Party Anthem', 243, 5, FALSE),
  ('am-6', 'a348ba2f-f8b3-4686-b928-e63d8d94d543', 'ada7a83c-e3e1-40f1-93f9-3e73dbc9298a', 'Arctic Monkeys', 'Why’d You Only Call Me When You’re High?', 161, 6, FALSE),
  ('am-7', 'a348ba2f-f8b3-4686-b928-e63d8d94d543', 'ada7a83c-e3e1-40f1-93f9-3e73dbc9298a', 'Arctic Monkeys', 'Snap Out of It', 193, 7, FALSE),
  ('am-8', 'a348ba2f-f8b3-4686-b928-e63d8d94d543', 'ada7a83c-e3e1-40f1-93f9-3e73dbc9298a', 'Arctic Monkeys', 'Knee Socks', 257, 8, FALSE),
  ('am-9', 'a348ba2f-f8b3-4686-b928-e63d8d94d543', 'ada7a83c-e3e1-40f1-93f9-3e73dbc9298a', 'Arctic Monkeys', 'I Wanna Be Yours', 183, 9, FALSE),

  -- IGOR (Tyler, The Creator)
  ('igor-1', '0f1b9e07-b38b-4bba-9794-55e0924d7177', 'f6beac20-5dfe-4d1f-ae02-0b0a740aafd6', 'Tyler, The Creator', 'IGOR’S THEME', 200, 1, FALSE),
  ('igor-2', '0f1b9e07-b38b-4bba-9794-55e0924d7177', 'f6beac20-5dfe-4d1f-ae02-0b0a740aafd6', 'Tyler, The Creator', 'EARFQUAKE', 190, 2, TRUE),
  ('igor-3', '0f1b9e07-b38b-4bba-9794-55e0924d7177', 'f6beac20-5dfe-4d1f-ae02-0b0a740aafd6', 'Tyler, The Creator', 'I THINK', 212, 3, FALSE),
  ('igor-4', '0f1b9e07-b38b-4bba-9794-55e0924d7177', 'f6beac20-5dfe-4d1f-ae02-0b0a740aafd6', 'Tyler, The Creator', 'RUNNING OUT OF TIME', 177, 4, FALSE),
  ('igor-5', '0f1b9e07-b38b-4bba-9794-55e0924d7177', 'f6beac20-5dfe-4d1f-ae02-0b0a740aafd6', 'Tyler, The Creator', 'NEW MAGIC WAND', 195, 5, FALSE),
  ('igor-6', '0f1b9e07-b38b-4bba-9794-55e0924d7177', 'f6beac20-5dfe-4d1f-ae02-0b0a740aafd6', 'Tyler, The Creator', 'A BOY IS A GUN*', 210, 6, FALSE),
  ('igor-7', '0f1b9e07-b38b-4bba-9794-55e0924d7177', 'f6beac20-5dfe-4d1f-ae02-0b0a740aafd6', 'Tyler, The Creator', 'WHAT’S GOOD', 205, 7, FALSE),
  ('igor-8', '0f1b9e07-b38b-4bba-9794-55e0924d7177', 'f6beac20-5dfe-4d1f-ae02-0b0a740aafd6', 'Tyler, The Creator', 'GONE, GONE / THANK YOU', 375, 8, FALSE),
  ('igor-9', '0f1b9e07-b38b-4bba-9794-55e0924d7177', 'f6beac20-5dfe-4d1f-ae02-0b0a740aafd6', 'Tyler, The Creator', 'ARE WE STILL FRIENDS?', 265, 9, FALSE),

  -- Midnights (Taylor Swift)
  ('mid-1', '0dcc84fb-c592-46e9-ba92-a52bb44dd553', '20244d07-534f-4eff-b4d4-930878889970', 'Taylor Swift', 'Lavender Haze', 202, 1, FALSE),
  ('mid-2', '0dcc84fb-c592-46e9-ba92-a52bb44dd553', '20244d07-534f-4eff-b4d4-930878889970', 'Taylor Swift', 'Maroon', 218, 2, FALSE),
  ('mid-3', '0dcc84fb-c592-46e9-ba92-a52bb44dd553', '20244d07-534f-4eff-b4d4-930878889970', 'Taylor Swift', 'Anti-Hero', 200, 3, FALSE),
  ('mid-4', '0dcc84fb-c592-46e9-ba92-a52bb44dd553', '20244d07-534f-4eff-b4d4-930878889970', 'Taylor Swift', 'Snow on the Beach', 256, 4, FALSE),
  ('mid-5', '0dcc84fb-c592-46e9-ba92-a52bb44dd553', '20244d07-534f-4eff-b4d4-930878889970', 'Taylor Swift', 'You’re on Your Own, Kid', 194, 5, FALSE),
  ('mid-6', '0dcc84fb-c592-46e9-ba92-a52bb44dd553', '20244d07-534f-4eff-b4d4-930878889970', 'Taylor Swift', 'Midnight Rain', 174, 6, FALSE),
  ('mid-7', '0dcc84fb-c592-46e9-ba92-a52bb44dd553', '20244d07-534f-4eff-b4d4-930878889970', 'Taylor Swift', 'Bejeweled', 194, 7, FALSE),
  ('mid-8', '0dcc84fb-c592-46e9-ba92-a52bb44dd553', '20244d07-534f-4eff-b4d4-930878889970', 'Taylor Swift', 'Karma', 204, 8, FALSE),
  ('mid-9', '0dcc84fb-c592-46e9-ba92-a52bb44dd553', '20244d07-534f-4eff-b4d4-930878889970', 'Taylor Swift', 'Mastermind', 191, 9, FALSE),

  -- SOUR (Olivia Rodrigo)
  ('sour-1', '2ae2e504-7116-4b4f-b632-9748bb18ccd2', '6925db17-f35e-42f3-a4eb-84ee6bf5d4b0', 'Olivia Rodrigo', 'brutal', 143, 1, FALSE),
  ('sour-2', '2ae2e504-7116-4b4f-b632-9748bb18ccd2', '6925db17-f35e-42f3-a4eb-84ee6bf5d4b0', 'Olivia Rodrigo', 'traitor', 229, 2, FALSE),
  ('sour-3', '2ae2e504-7116-4b4f-b632-9748bb18ccd2', '6925db17-f35e-42f3-a4eb-84ee6bf5d4b0', 'Olivia Rodrigo', 'drivers license', 242, 3, FALSE),
  ('sour-4', '2ae2e504-7116-4b4f-b632-9748bb18ccd2', '6925db17-f35e-42f3-a4eb-84ee6bf5d4b0', 'Olivia Rodrigo', 'deja vu', 215, 4, FALSE),
  ('sour-5', '2ae2e504-7116-4b4f-b632-9748bb18ccd2', '6925db17-f35e-42f3-a4eb-84ee6bf5d4b0', 'Olivia Rodrigo', 'good 4 u', 178, 5, FALSE),
  ('sour-6', '2ae2e504-7116-4b4f-b632-9748bb18ccd2', '6925db17-f35e-42f3-a4eb-84ee6bf5d4b0', 'Olivia Rodrigo', 'enough for you', 202, 6, FALSE),
  ('sour-7', '2ae2e504-7116-4b4f-b632-9748bb18ccd2', '6925db17-f35e-42f3-a4eb-84ee6bf5d4b0', 'Olivia Rodrigo', 'happier', 175, 7, FALSE),
  ('sour-8', '2ae2e504-7116-4b4f-b632-9748bb18ccd2', '6925db17-f35e-42f3-a4eb-84ee6bf5d4b0', 'Olivia Rodrigo', 'jealousy, jealousy', 173, 8, FALSE),
  ('sour-9', '2ae2e504-7116-4b4f-b632-9748bb18ccd2', '6925db17-f35e-42f3-a4eb-84ee6bf5d4b0', 'Olivia Rodrigo', 'favorite crime', 152, 9, FALSE),

  -- Un verano sin ti (Bad Bunny)
  ('uvst-1', 'e992b449-141b-4aea-b07b-9b2a478a8570', '89aa5ecb-59ad-46f5-b3eb-2d424e941f19', 'Bad Bunny', 'Moscow Mule', 245, 1, FALSE),
  ('uvst-2', 'e992b449-141b-4aea-b07b-9b2a478a8570', '89aa5ecb-59ad-46f5-b3eb-2d424e941f19', 'Bad Bunny', 'Después de la playa', 230, 2, FALSE),
  ('uvst-3', 'e992b449-141b-4aea-b07b-9b2a478a8570', '89aa5ecb-59ad-46f5-b3eb-2d424e941f19', 'Bad Bunny', 'Me porto bonito', 178, 3, FALSE),
  ('uvst-4', 'e992b449-141b-4aea-b07b-9b2a478a8570', '89aa5ecb-59ad-46f5-b3eb-2d424e941f19', 'Bad Bunny', 'Tití me preguntó', 243, 4, FALSE),
  ('uvst-5', 'e992b449-141b-4aea-b07b-9b2a478a8570', '89aa5ecb-59ad-46f5-b3eb-2d424e941f19', 'Bad Bunny', 'Un ratito', 176, 5, FALSE),
  ('uvst-6', 'e992b449-141b-4aea-b07b-9b2a478a8570', '89aa5ecb-59ad-46f5-b3eb-2d424e941f19', 'Bad Bunny', 'Tarot', 237, 6, FALSE),
  ('uvst-7', 'e992b449-141b-4aea-b07b-9b2a478a8570', '89aa5ecb-59ad-46f5-b3eb-2d424e941f19', 'Bad Bunny', 'Neverita', 173, 7, FALSE),
  ('uvst-8', 'e992b449-141b-4aea-b07b-9b2a478a8570', '89aa5ecb-59ad-46f5-b3eb-2d424e941f19', 'Bad Bunny', 'Ojitos lindos', 258, 8, FALSE),
  ('uvst-9', 'e992b449-141b-4aea-b07b-9b2a478a8570', '89aa5ecb-59ad-46f5-b3eb-2d424e941f19', 'Bad Bunny', 'Callaíta', 250, 9, FALSE),

  -- Short n’ Sweet (Sabrina Carpenter)
  ('sns-1', 'c8bea388-c195-4177-bf9b-7469f6e695a1', '1882fe91-cdd9-49c9-9956-8e06a3810bd4', 'Sabrina Carpenter', 'Taste', 157, 1, FALSE),
  ('sns-2', 'c8bea388-c195-4177-bf9b-7469f6e695a1', '1882fe91-cdd9-49c9-9956-8e06a3810bd4', 'Sabrina Carpenter', 'Please Please Please', 186, 2, FALSE),
  ('sns-3', 'c8bea388-c195-4177-bf9b-7469f6e695a1', '1882fe91-cdd9-49c9-9956-8e06a3810bd4', 'Sabrina Carpenter', 'Good Graces', 185, 3, FALSE),
  ('sns-4', 'c8bea388-c195-4177-bf9b-7469f6e695a1', '1882fe91-cdd9-49c9-9956-8e06a3810bd4', 'Sabrina Carpenter', 'Sharpest Tool', 218, 4, FALSE),
  ('sns-5', 'c8bea388-c195-4177-bf9b-7469f6e695a1', '1882fe91-cdd9-49c9-9956-8e06a3810bd4', 'Sabrina Carpenter', 'Coincidence', 164, 5, FALSE),
  ('sns-6', 'c8bea388-c195-4177-bf9b-7469f6e695a1', '1882fe91-cdd9-49c9-9956-8e06a3810bd4', 'Sabrina Carpenter', 'Bed Chem', 171, 6, FALSE),
  ('sns-7', 'c8bea388-c195-4177-bf9b-7469f6e695a1', '1882fe91-cdd9-49c9-9956-8e06a3810bd4', 'Sabrina Carpenter', 'Espresso', 175, 7, TRUE),
  ('sns-8', 'c8bea388-c195-4177-bf9b-7469f6e695a1', '1882fe91-cdd9-49c9-9956-8e06a3810bd4', 'Sabrina Carpenter', 'Juno', 223, 8, FALSE),
  ('sns-9', 'c8bea388-c195-4177-bf9b-7469f6e695a1', '1882fe91-cdd9-49c9-9956-8e06a3810bd4', 'Sabrina Carpenter', 'Don’t Smile', 206, 9, FALSE),

  -- COWBOY CARTER (Beyoncé)
  ('cc-1', 'fa566e7b-254a-4fab-8aa5-ebcb7592d7f2', '859d0860-d480-4efd-970c-c05d5f1776b8', 'Beyoncé', 'AMERIICAN REQUIEM', 325, 1, FALSE),
  ('cc-2', 'fa566e7b-254a-4fab-8aa5-ebcb7592d7f2', '859d0860-d480-4efd-970c-c05d5f1776b8', 'Beyoncé', 'BLACKBIIRD', 131, 2, FALSE),
  ('cc-3', 'fa566e7b-254a-4fab-8aa5-ebcb7592d7f2', '859d0860-d480-4efd-970c-c05d5f1776b8', 'Beyoncé', '16 CARRIAGES', 227, 3, FALSE),
  ('cc-4', 'fa566e7b-254a-4fab-8aa5-ebcb7592d7f2', '859d0860-d480-4efd-970c-c05d5f1776b8', 'Beyoncé', 'TEXAS HOLD ’EM', 233, 4, FALSE),
  ('cc-5', 'fa566e7b-254a-4fab-8aa5-ebcb7592d7f2', '859d0860-d480-4efd-970c-c05d5f1776b8', 'Beyoncé', 'BODYGUARD', 240, 5, FALSE),
  ('cc-6', 'fa566e7b-254a-4fab-8aa5-ebcb7592d7f2', '859d0860-d480-4efd-970c-c05d5f1776b8', 'Beyoncé', 'JOLENE', 189, 6, FALSE),
  ('cc-7', 'fa566e7b-254a-4fab-8aa5-ebcb7592d7f2', '859d0860-d480-4efd-970c-c05d5f1776b8', 'Beyoncé', 'SPAGHETTII', 158, 7, FALSE),
  ('cc-8', 'fa566e7b-254a-4fab-8aa5-ebcb7592d7f2', '859d0860-d480-4efd-970c-c05d5f1776b8', 'Beyoncé', 'YA YA', 274, 8, FALSE),
  ('cc-9', 'fa566e7b-254a-4fab-8aa5-ebcb7592d7f2', '859d0860-d480-4efd-970c-c05d5f1776b8', 'Beyoncé', 'II MOST WANTED', 208, 9, FALSE),

  -- The Tortured Poets Department (Taylor Swift)
  ('ttpd-1', '9d4e5829-e0a6-44f2-98c4-fe51234b1ba5', '20244d07-534f-4eff-b4d4-930878889970', 'Taylor Swift', 'Fortnight', 228, 1, FALSE),
  ('ttpd-2', '9d4e5829-e0a6-44f2-98c4-fe51234b1ba5', '20244d07-534f-4eff-b4d4-930878889970', 'Taylor Swift', 'The Tortured Poets Department', 293, 2, FALSE),
  ('ttpd-3', '9d4e5829-e0a6-44f2-98c4-fe51234b1ba5', '20244d07-534f-4eff-b4d4-930878889970', 'Taylor Swift', 'My Boy Only Breaks His Favorite Toys', 203, 3, FALSE),
  ('ttpd-4', '9d4e5829-e0a6-44f2-98c4-fe51234b1ba5', '20244d07-534f-4eff-b4d4-930878889970', 'Taylor Swift', 'Down Bad', 261, 4, FALSE),
  ('ttpd-5', '9d4e5829-e0a6-44f2-98c4-fe51234b1ba5', '20244d07-534f-4eff-b4d4-930878889970', 'Taylor Swift', 'So Long, London', 262, 5, FALSE),
  ('ttpd-6', '9d4e5829-e0a6-44f2-98c4-fe51234b1ba5', '20244d07-534f-4eff-b4d4-930878889970', 'Taylor Swift', 'But Daddy I Love Him', 340, 6, FALSE),
  ('ttpd-7', '9d4e5829-e0a6-44f2-98c4-fe51234b1ba5', '20244d07-534f-4eff-b4d4-930878889970', 'Taylor Swift', 'Florida!!!', 215, 7, FALSE),
  ('ttpd-8', '9d4e5829-e0a6-44f2-98c4-fe51234b1ba5', '20244d07-534f-4eff-b4d4-930878889970', 'Taylor Swift', 'Who’s Afraid of Little Old Me?', 334, 8, FALSE),
  ('ttpd-9', '9d4e5829-e0a6-44f2-98c4-fe51234b1ba5', '20244d07-534f-4eff-b4d4-930878889970', 'Taylor Swift', 'I Can Do It With a Broken Heart', 218, 9, FALSE),

  -- Construção (Chico Buarque)
  ('con-1', '155bd1f1-0570-41f3-a38c-0dd81373a5b6', '3a5d1cc7-627e-48ea-aba3-fdd20d782c33', 'Chico Buarque', 'Deus lhe pague', 199, 1, FALSE),
  ('con-2', '155bd1f1-0570-41f3-a38c-0dd81373a5b6', '3a5d1cc7-627e-48ea-aba3-fdd20d782c33', 'Chico Buarque', 'Cotidiano', 170, 2, FALSE),
  ('con-3', '155bd1f1-0570-41f3-a38c-0dd81373a5b6', '3a5d1cc7-627e-48ea-aba3-fdd20d782c33', 'Chico Buarque', 'Desalento', 168, 3, FALSE),
  ('con-4', '155bd1f1-0570-41f3-a38c-0dd81373a5b6', '3a5d1cc7-627e-48ea-aba3-fdd20d782c33', 'Chico Buarque', 'Construção', 384, 4, FALSE),
  ('con-5', '155bd1f1-0570-41f3-a38c-0dd81373a5b6', '3a5d1cc7-627e-48ea-aba3-fdd20d782c33', 'Chico Buarque', 'Cordão', 151, 5, FALSE),
  ('con-6', '155bd1f1-0570-41f3-a38c-0dd81373a5b6', '3a5d1cc7-627e-48ea-aba3-fdd20d782c33', 'Chico Buarque', 'Olê, olá', 220, 6, FALSE),
  ('con-7', '155bd1f1-0570-41f3-a38c-0dd81373a5b6', '3a5d1cc7-627e-48ea-aba3-fdd20d782c33', 'Chico Buarque', 'Valsinha', 120, 7, FALSE),
  ('con-8', '155bd1f1-0570-41f3-a38c-0dd81373a5b6', '3a5d1cc7-627e-48ea-aba3-fdd20d782c33', 'Chico Buarque', 'Minha história', 181, 8, FALSE),
  ('con-9', '155bd1f1-0570-41f3-a38c-0dd81373a5b6', '3a5d1cc7-627e-48ea-aba3-fdd20d782c33', 'Chico Buarque', 'Samba de Orly', 160, 9, FALSE),

  -- Acabou chorare (Novos Baianos)
  ('ac-1', '65790705-6d7b-3596-a427-fe5b8ab6481d', '7b543eba-995a-4c30-a37e-f8cac424f167', 'Novos Baianos', 'Brasil Pandeiro', 235, 1, FALSE),
  ('ac-2', '65790705-6d7b-3596-a427-fe5b8ab6481d', '7b543eba-995a-4c30-a37e-f8cac424f167', 'Novos Baianos', 'Preta Pretinha', 396, 2, FALSE),
  ('ac-3', '65790705-6d7b-3596-a427-fe5b8ab6481d', '7b543eba-995a-4c30-a37e-f8cac424f167', 'Novos Baianos', 'Tinindo, Trincando', 193, 3, FALSE),
  ('ac-4', '65790705-6d7b-3596-a427-fe5b8ab6481d', '7b543eba-995a-4c30-a37e-f8cac424f167', 'Novos Baianos', 'Swing de Campo Grande', 188, 4, FALSE),
  ('ac-5', '65790705-6d7b-3596-a427-fe5b8ab6481d', '7b543eba-995a-4c30-a37e-f8cac424f167', 'Novos Baianos', 'Acabou Chorare', 253, 5, FALSE),
  ('ac-6', '65790705-6d7b-3596-a427-fe5b8ab6481d', '7b543eba-995a-4c30-a37e-f8cac424f167', 'Novos Baianos', 'Mistério do Planeta', 216, 6, FALSE),
  ('ac-7', '65790705-6d7b-3596-a427-fe5b8ab6481d', '7b543eba-995a-4c30-a37e-f8cac424f167', 'Novos Baianos', 'A Menina Dança', 231, 7, FALSE),
  ('ac-8', '65790705-6d7b-3596-a427-fe5b8ab6481d', '7b543eba-995a-4c30-a37e-f8cac424f167', 'Novos Baianos', 'Besta É Tu', 265, 8, FALSE),
  ('ac-9', '65790705-6d7b-3596-a427-fe5b8ab6481d', '7b543eba-995a-4c30-a37e-f8cac424f167', 'Novos Baianos', 'Um Bilhete pra Didi', 192, 9, FALSE)
ON CONFLICT (id) DO UPDATE SET
  album_id = EXCLUDED.album_id,
  artist_id = EXCLUDED.artist_id,
  artist_name = EXCLUDED.artist_name,
  title = EXCLUDED.title,
  duration = EXCLUDED.duration,
  track_number = EXCLUDED.track_number,
  is_top_track = EXCLUDED.is_top_track;

-- =============================================================================
-- 6. PRÊMIOS E INDICAÇÕES CURADOS (`public.album_awards`)
-- =============================================================================
INSERT INTO public.album_awards (id, album_id, ceremony, ceremony_name, award_name, category, year, is_winner, notes, description, logo_url) VALUES
  -- Random Access Memories
  ('ram-aw-1', 'aa997ea0-2936-40bd-884d-3af8a0e064dc', 'grammy', 'Grammy Awards', 'Grammy Awards', 'Álbum do Ano (Album of the Year)', '2014', TRUE, NULL, '', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Grammy_Award_icon.svg/240px-Grammy_Award_icon.svg.png'),
  ('ram-aw-2', 'aa997ea0-2936-40bd-884d-3af8a0e064dc', 'grammy', 'Grammy Awards', 'Grammy Awards', 'Melhor Álbum Dance/Eletrônica', '2014', TRUE, NULL, '', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Grammy_Award_icon.svg/240px-Grammy_Award_icon.svg.png'),
  ('ram-aw-3', 'aa997ea0-2936-40bd-884d-3af8a0e064dc', 'vma', 'MTV Video Music Awards (VMA)', 'MTV Video Music Awards (VMA)', 'Melhor Direção Visual de Produção', '2014', TRUE, NULL, '', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/MTV_Video_Music_Awards_Logo.svg/300px-MTV_Video_Music_Awards_Logo.svg.png'),
  ('ram-aw-4', 'aa997ea0-2936-40bd-884d-3af8a0e064dc', 'billboard', 'Billboard Music Awards', 'Billboard Music Awards', 'Top Electronic Album', '2014', TRUE, NULL, '', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Billboard_Music_Awards_Logo.svg/320px-Billboard_Music_Awards_Logo.svg.png'),
  ('ram-aw-5', 'aa997ea0-2936-40bd-884d-3af8a0e064dc', 'brit', 'BRIT Awards', 'BRIT Awards', 'Melhor Grupo Internacional', '2014', TRUE, NULL, '', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Brit_Awards_trophy_symbol.png/240px-Brit_Awards_trophy_symbol.png'),

  -- To Pimp a Butterfly
  ('tpab-aw-1', 'd9103c72-3807-4378-9ce7-b6f3e8fdd547', 'grammy', 'Grammy Awards', 'Grammy Awards', 'Melhor Álbum de Rap', '2016', TRUE, NULL, '', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Grammy_Award_icon.svg/240px-Grammy_Award_icon.svg.png'),
  ('tpab-aw-2', 'd9103c72-3807-4378-9ce7-b6f3e8fdd547', 'grammy', 'Grammy Awards', 'Grammy Awards', 'Álbum do Ano (Album of the Year)', '2016', FALSE, 'Indicação Histórica', 'Indicação Histórica', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Grammy_Award_icon.svg/240px-Grammy_Award_icon.svg.png'),
  ('tpab-aw-3', 'd9103c72-3807-4378-9ce7-b6f3e8fdd547', 'vma', 'MTV Video Music Awards (VMA)', 'MTV Video Music Awards (VMA)', 'Vídeo com Mensagem Social', '2016', TRUE, NULL, '', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/MTV_Video_Music_Awards_Logo.svg/300px-MTV_Video_Music_Awards_Logo.svg.png'),
  ('tpab-aw-4', 'd9103c72-3807-4378-9ce7-b6f3e8fdd547', 'billboard', 'Billboard Music Awards', 'Billboard Music Awards', 'Top Rap Album', '2016', TRUE, NULL, '', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Billboard_Music_Awards_Logo.svg/320px-Billboard_Music_Awards_Logo.svg.png'),

  -- The Dark Side of the Moon
  ('dsotm-aw-1', 'f5093c06-23e3-404f-aeaa-40f72885ee3a', 'grammy', 'Grammy Hall of Fame', 'Grammy Hall of Fame', 'Gravação Histórica Induzida', '1999', TRUE, NULL, '', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Grammy_Award_icon.svg/240px-Grammy_Award_icon.svg.png'),
  ('dsotm-aw-2', 'f5093c06-23e3-404f-aeaa-40f72885ee3a', 'billboard', 'Billboard Music Awards', 'Billboard Music Awards', 'Maior Permanência Histórica no Top 200', '1988', TRUE, 'Mais de 950 semanas', 'Mais de 950 semanas', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Billboard_Music_Awards_Logo.svg/320px-Billboard_Music_Awards_Logo.svg.png'),
  ('dsotm-aw-3', 'f5093c06-23e3-404f-aeaa-40f72885ee3a', 'brit', 'BRIT Awards', 'BRIT Awards', 'Outstanding Contribution to Music', '1977', TRUE, NULL, '', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Brit_Awards_trophy_symbol.png/240px-Brit_Awards_trophy_symbol.png'),

  -- OK Computer
  ('okc-aw-1', 'b1392450-e666-3926-a536-22c65f834433', 'grammy', 'Grammy Awards', 'Grammy Awards', 'Melhor Álbum de Música Alternativa', '1998', TRUE, NULL, '', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Grammy_Award_icon.svg/240px-Grammy_Award_icon.svg.png'),
  ('okc-aw-2', 'b1392450-e666-3926-a536-22c65f834433', 'grammy', 'Grammy Awards', 'Grammy Awards', 'Álbum do Ano (Album of the Year)', '1998', FALSE, NULL, '', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Grammy_Award_icon.svg/240px-Grammy_Award_icon.svg.png'),
  ('okc-aw-3', 'b1392450-e666-3926-a536-22c65f834433', 'vma', 'MTV Video Music Awards (VMA)', 'MTV Video Music Awards (VMA)', 'Melhor Vídeo Inovador (Paranoid Android)', '1998', TRUE, NULL, '', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/MTV_Video_Music_Awards_Logo.svg/300px-MTV_Video_Music_Awards_Logo.svg.png'),
  ('okc-aw-4', 'b1392450-e666-3926-a536-22c65f834433', 'brit', 'BRIT Awards', 'BRIT Awards', 'Melhor Álbum Britânico do Ano', '1998', FALSE, NULL, '', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Brit_Awards_trophy_symbol.png/240px-Brit_Awards_trophy_symbol.png'),

  -- Blonde
  ('bl-aw-1', '0da340a0-6ad7-4fc2-a272-6f94393a7831', 'billboard', 'Billboard Music Awards', 'Billboard Music Awards', 'Top R&B Album do Ano', '2017', TRUE, NULL, '', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Billboard_Music_Awards_Logo.svg/320px-Billboard_Music_Awards_Logo.svg.png'),
  ('bl-aw-2', '0da340a0-6ad7-4fc2-a272-6f94393a7831', 'vma', 'MTV Video Music Awards (VMA)', 'MTV Video Music Awards (VMA)', 'Melhor Direção de Arte Visual', '2017', TRUE, NULL, '', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/MTV_Video_Music_Awards_Logo.svg/300px-MTV_Video_Music_Awards_Logo.svg.png'),
  ('bl-aw-3', '0da340a0-6ad7-4fc2-a272-6f94393a7831', 'grammy', 'Grammy Awards', 'Grammy Awards', 'Aclamação Crítica de Impacto Cultural', '2017', TRUE, NULL, '', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Grammy_Award_icon.svg/240px-Grammy_Award_icon.svg.png'),

  -- SOS
  ('sos-aw-1', '1646286a-d0ad-4288-bfab-34b0fb7b22c1', 'grammy', 'Grammy Awards', 'Grammy Awards', 'Melhor Álbum de R&B Progressivo', '2024', TRUE, NULL, '', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Grammy_Award_icon.svg/240px-Grammy_Award_icon.svg.png'),
  ('sos-aw-2', '1646286a-d0ad-4288-bfab-34b0fb7b22c1', 'grammy', 'Grammy Awards', 'Grammy Awards', 'Álbum do Ano (Album of the Year)', '2024', FALSE, NULL, '', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Grammy_Award_icon.svg/240px-Grammy_Award_icon.svg.png'),
  ('sos-aw-3', '1646286a-d0ad-4288-bfab-34b0fb7b22c1', 'vma', 'MTV Video Music Awards (VMA)', 'MTV Video Music Awards (VMA)', 'Música do Ano (Kill Bill)', '2023', TRUE, NULL, '', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/MTV_Video_Music_Awards_Logo.svg/300px-MTV_Video_Music_Awards_Logo.svg.png'),
  ('sos-aw-4', '1646286a-d0ad-4288-bfab-34b0fb7b22c1', 'billboard', 'Billboard Music Awards', 'Billboard Music Awards', 'Top R&B Album', '2023', TRUE, NULL, '', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Billboard_Music_Awards_Logo.svg/320px-Billboard_Music_Awards_Logo.svg.png'),

  -- HIT ME HARD AND SOFT
  ('hmhas-aw-1', '02a544b3-0459-42c7-bd9c-047162e7b67a', 'grammy', 'Grammy Awards', 'Grammy Awards', 'Álbum do Ano (Album of the Year)', '2025', FALSE, 'Indicado Oficial', 'Indicado Oficial', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Grammy_Award_icon.svg/240px-Grammy_Award_icon.svg.png'),
  ('hmhas-aw-2', '02a544b3-0459-42c7-bd9c-047162e7b67a', 'grammy', 'Grammy Awards', 'Grammy Awards', 'Melhor Álbum Vocal Pop', '2025', FALSE, 'Indicado Oficial', 'Indicado Oficial', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Grammy_Award_icon.svg/240px-Grammy_Award_icon.svg.png'),
  ('hmhas-aw-3', '02a544b3-0459-42c7-bd9c-047162e7b67a', 'vma', 'MTV Video Music Awards (VMA)', 'MTV Video Music Awards (VMA)', 'Melhor Efeito Visual & Clipe do Ano', '2024', TRUE, NULL, '', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/MTV_Video_Music_Awards_Logo.svg/300px-MTV_Video_Music_Awards_Logo.svg.png'),
  ('hmhas-aw-4', '02a544b3-0459-42c7-bd9c-047162e7b67a', 'billboard', 'Billboard Music Awards', 'Billboard Music Awards', 'Top Global Album', '2024', TRUE, NULL, '', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Billboard_Music_Awards_Logo.svg/320px-Billboard_Music_Awards_Logo.svg.png')
ON CONFLICT (id) DO UPDATE SET
  ceremony = EXCLUDED.ceremony,
  ceremony_name = EXCLUDED.ceremony_name,
  award_name = EXCLUDED.award_name,
  category = EXCLUDED.category,
  year = EXCLUDED.year,
  is_winner = EXCLUDED.is_winner,
  notes = EXCLUDED.notes,
  description = EXCLUDED.description,
  logo_url = EXCLUDED.logo_url;

-- =============================================================================
-- 7. USUÁRIOS DEMO EM `auth.users` E PERFIS EM `public.profiles`
-- =============================================================================
-- UUIDs determinísticos para os usuários principais da comunidade Musicpostr:
-- 1) Ana Beatriz (@anabeat)        -> 11111111-1111-4111-8111-111111111111
-- 2) Lucas Sound (@lucas_snd)      -> 22222222-2222-4222-8222-222222222222
-- 3) Beat Critic (@beatcritic)     -> 33333333-3333-4333-8333-333333333333
-- 4) Sofia Melodias (@sofiamel)    -> 44444444-4444-4444-8444-444444444444
-- 5) Rodrigo Indie (@rodrigo_indie)-> 55555555-5555-4555-8555-555555555555
-- (Senha padrão para login de teste em todas as contas demo: "musicpostr123")

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111111',
    'authenticated', 'authenticated',
    'anabeat@musicpostr.com',
    crypt('musicpostr123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email","google"]}'::jsonb,
    '{"username":"anabeat","full_name":"Ana Beatriz"}'::jsonb,
    NOW(), NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated', 'authenticated',
    'lucas_snd@musicpostr.com',
    crypt('musicpostr123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"lucas_snd","full_name":"Lucas Sound"}'::jsonb,
    NOW(), NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-4333-8333-333333333333',
    'authenticated', 'authenticated',
    'beatcritic@musicpostr.com',
    crypt('musicpostr123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"beatcritic","full_name":"Beat Critic"}'::jsonb,
    NOW(), NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-8444-444444444444',
    'authenticated', 'authenticated',
    'sofiamel@musicpostr.com',
    crypt('musicpostr123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"sofiamel","full_name":"Sofia Melodias"}'::jsonb,
    NOW(), NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '55555555-5555-4555-8555-555555555555',
    'authenticated', 'authenticated',
    'rodrigo_indie@musicpostr.com',
    crypt('musicpostr123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"rodrigo_indie","full_name":"Rodrigo Indie"}'::jsonb,
    NOW(), NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Atualiza/insere os perfis detalhados em `public.profiles`
INSERT INTO public.profiles (
  id, username, full_name, email, phone, bio,
  avatar_url, banner_url, profile_visibility,
  email_notif, community_notif, releases_notif,
  is_linked_google, is_linked_apple, auth_provider, socials
) VALUES
  (
    '11111111-1111-4111-8111-111111111111',
    'anabeat',
    'Ana Beatriz',
    'anabeat@musicpostr.com',
    '+55 (48) 99999-9999',
    'Amante de música pop, indie e crítica sonora alucinógena. Colecionadora de notas 10/10.',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=65&w=250&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=65&w=600&auto=format&fit=crop',
    'public',
    TRUE, TRUE, FALSE,
    TRUE, FALSE, 'google',
    '{
      "instagram": "https://instagram.com/anabeat",
      "twitter": "https://twitter.com/anabeat",
      "threads": "https://threads.net/@anabeat",
      "discord": "https://discord.gg/anabeat",
      "lastfm": "https://last.fm/user/anabeat",
      "youtube": "https://youtube.com/@anabeat",
      "website": "https://anabeat.com"
    }'::jsonb
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'lucas_snd',
    'Lucas Sound',
    'lucas_snd@musicpostr.com',
    '',
    'Entusiasta de álbuns conceituais, vinil e descobertas musicais na comunidade Musicpostr.',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=65&w=150',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=65&w=500&auto=format&fit=crop',
    'public',
    TRUE, TRUE, TRUE,
    FALSE, FALSE, 'email',
    '{"instagram": "https://instagram.com/lucas_snd", "lastfm": "https://last.fm/user/lucas_snd"}'::jsonb
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'beatcritic',
    'Beat Critic',
    'beatcritic@musicpostr.com',
    '',
    'Crítico musical dedicado a analisar mixagens, arranjos e clássicos atemporais da música mundial.',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=65&w=150',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=65&w=500&auto=format&fit=crop',
    'public',
    TRUE, TRUE, TRUE,
    FALSE, FALSE, 'email',
    '{"twitter": "https://twitter.com/beatcritic", "youtube": "https://youtube.com/@beatcritic"}'::jsonb
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'sofiamel',
    'Sofia Melodias',
    'sofiamel@musicpostr.com',
    '',
    'Apaixonada por R&B, Neo-Soul e trilhas sonoras noturnas.',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=65&w=150',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=65&w=500&auto=format&fit=crop',
    'public',
    TRUE, TRUE, FALSE,
    FALSE, FALSE, 'email',
    '{}'::jsonb
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    'rodrigo_indie',
    'Rodrigo Indie',
    'rodrigo_indie@musicpostr.com',
    '',
    'Colecionador de discos de indie rock, shoegaze e psicodelia.',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=65&w=150',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=65&w=500&auto=format&fit=crop',
    'public',
    TRUE, TRUE, FALSE,
    FALSE, FALSE, 'email',
    '{}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  bio = EXCLUDED.bio,
  avatar_url = EXCLUDED.avatar_url,
  banner_url = EXCLUDED.banner_url,
  profile_visibility = EXCLUDED.profile_visibility,
  socials = EXCLUDED.socials;

-- =============================================================================
-- 8. REDE DE AMIGOS (`public.friendships`), ÍDOLOS (`user_followed_artists`) E FAVORITOS (`user_favorite_albums`)
-- =============================================================================

-- 8.1. Amizades de Ana Beatriz (@anabeat) conforme `src/app/friends.tsx` e `src/app/album/[id].tsx`
INSERT INTO public.friendships (user_id, friend_id, status) VALUES
  ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'accepted'),
  ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'accepted'),
  ('11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', 'accepted'),
  ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'accepted'),
  ('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444', 'accepted'),
  ('11111111-1111-4111-8111-111111111111', '55555555-5555-4555-8555-555555555555', 'accepted')
ON CONFLICT (user_id, friend_id) DO NOTHING;

-- 8.2. Ídolos seguidos por padrão (`DEFAULT_IDOLS_IDS`: The Weeknd e Pink Floyd + Daft Punk por Lucas Sound)
INSERT INTO public.user_followed_artists (user_id, artist_id) VALUES
  ('11111111-1111-4111-8111-111111111111', 'c8b03190-306c-4120-bb0b-6f2ebfc06ea9'), -- The Weeknd
  ('11111111-1111-4111-8111-111111111111', '83d91898-7763-47d7-b03b-b92132375c47'), -- Pink Floyd
  ('22222222-2222-4222-8222-222222222222', '056e4f3e-d505-4dad-8ec1-d04f521cbb56')  -- Daft Punk
ON CONFLICT (user_id, artist_id) DO NOTHING;

-- 8.3. Álbuns Favoritados (`INITIAL_FAVORITES`: The Dark Side of the Moon, After Hours, Random Access Memories)
INSERT INTO public.user_favorite_albums (user_id, album_id) VALUES
  ('11111111-1111-4111-8111-111111111111', 'f5093c06-23e3-404f-aeaa-40f72885ee3a'),
  ('11111111-1111-4111-8111-111111111111', '78570bea-2a26-467c-a3db-c52723ceb394'),
  ('11111111-1111-4111-8111-111111111111', 'aa997ea0-2936-40bd-884d-3af8a0e064dc'),
  ('33333333-3333-4333-8333-333333333333', 'f5093c06-23e3-404f-aeaa-40f72885ee3a')
ON CONFLICT (user_id, album_id) DO NOTHING;

-- 8.4. Álbuns Ouvidos (`user_listened_albums`)
INSERT INTO public.user_listened_albums (user_id, album_id) VALUES
  ('11111111-1111-4111-8111-111111111111', '02a544b3-0459-42c7-bd9c-047162e7b67a'),
  ('11111111-1111-4111-8111-111111111111', '2ae2e504-7116-4b4f-b632-9748bb18ccd2'),
  ('11111111-1111-4111-8111-111111111111', '32cb822c-a14e-49ce-a169-f209c5f31e0f'),
  ('11111111-1111-4111-8111-111111111111', 'f5093c06-23e3-404f-aeaa-40f72885ee3a')
ON CONFLICT (user_id, album_id) DO NOTHING;

-- =============================================================================
-- 9. LISTAS DE ÁLBUNS DOS USUÁRIOS (`public.user_lists` & `public.user_list_items`)
-- =============================================================================
INSERT INTO public.user_lists (id, user_id, title, description, items_count, is_default, is_public, created_label) VALUES
  (
    'want-to-listen',
    '11111111-1111-4111-8111-111111111111',
    'Quero ouvir',
    'Álbuns salvos para escutar no seu tempo.',
    2,
    TRUE,
    TRUE,
    'Lista padrão'
  ),
  (
    'list-1',
    '11111111-1111-4111-8111-111111111111',
    'Melhores do Pop em 2025',
    'Os lançamentos mais marcantes do ano passado.',
    4,
    FALSE,
    TRUE,
    'Criado recentemente'
  ),
  (
    'list-2',
    '11111111-1111-4111-8111-111111111111',
    'Discos para Ouvir na Madrugada',
    'Atmosferas densas, indie e ambient.',
    4,
    FALSE,
    TRUE,
    'Há 2 semanas'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  is_default = EXCLUDED.is_default,
  created_label = EXCLUDED.created_label;

INSERT INTO public.user_list_items (list_id, album_id, album_title, album_cover, position) VALUES
  -- Quero ouvir
  ('want-to-listen', '0da340a0-6ad7-4fc2-a272-6f94393a7831', 'Blonde', 'https://coverartarchive.org/release-group/0da340a0-6ad7-4fc2-a272-6f94393a7831/front-250', 1),
  ('want-to-listen', 'b1392450-e666-3926-a536-22c65f834433', 'OK Computer', 'https://coverartarchive.org/release-group/b1392450-e666-3926-a536-22c65f834433/front-250', 2),

  -- Melhores do Pop em 2025
  ('list-1', '02a544b3-0459-42c7-bd9c-047162e7b67a', 'HIT ME HARD AND SOFT', 'https://coverartarchive.org/release-group/02a544b3-0459-42c7-bd9c-047162e7b67a/front-250', 1),
  ('list-1', 'e0fdb431-0109-420d-8a37-f99eaeb4d671', 'BRAT', 'https://coverartarchive.org/release-group/e0fdb431-0109-420d-8a37-f99eaeb4d671/front-250', 2),
  ('list-1', 'c8bea388-c195-4177-bf9b-7469f6e695a1', 'Short n’ Sweet', 'https://coverartarchive.org/release-group/c8bea388-c195-4177-bf9b-7469f6e695a1/front-250', 3),
  ('list-1', 'fa566e7b-254a-4fab-8aa5-ebcb7592d7f2', 'COWBOY CARTER', 'https://coverartarchive.org/release-group/fa566e7b-254a-4fab-8aa5-ebcb7592d7f2/front-250', 4),

  -- Discos para Ouvir na Madrugada
  ('list-2', '78570bea-2a26-467c-a3db-c52723ceb394', 'After Hours', 'https://coverartarchive.org/release-group/78570bea-2a26-467c-a3db-c52723ceb394/front-250', 1),
  ('list-2', '08aa7a6c-3e43-4459-87b2-e47faf3a088a', 'Currents', 'https://coverartarchive.org/release-group/08aa7a6c-3e43-4459-87b2-e47faf3a088a/front-250', 2),
  ('list-2', '0da340a0-6ad7-4fc2-a272-6f94393a7831', 'Blonde', 'https://coverartarchive.org/release-group/0da340a0-6ad7-4fc2-a272-6f94393a7831/front-250', 3),
  ('list-2', 'f5093c06-23e3-404f-aeaa-40f72885ee3a', 'The Dark Side of the Moon', 'https://coverartarchive.org/release-group/f5093c06-23e3-404f-aeaa-40f72885ee3a/front-250', 4)
ON CONFLICT (list_id, album_id) DO NOTHING;

-- =============================================================================
-- 10. AVALIAÇÕES / REVIEWS DE ÁLBUNS (`public.album_reviews`)
-- =============================================================================

-- 10.1. Reviews pessoais de Ana Beatriz (`INITIAL_MY_REVIEWS`)
INSERT INTO public.album_reviews (
  id, album_id, user_id, user_display_name, username, user_avatar,
  rating, comment, display_date, likes_count, comments_count
) VALUES
  (
    'my-rev-1',
    '02a544b3-0459-42c7-bd9c-047162e7b67a',
    '11111111-1111-4111-8111-111111111111',
    'Ana Beatriz',
    'anabeat',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=65&w=250&auto=format&fit=crop',
    10.0,
    'Uma obra-prima absoluta de design sonoro e atmosferas.',
    '24 de Mai, 2026',
    18,
    2
  ),
  (
    'my-rev-2',
    '2ae2e504-7116-4b4f-b632-9748bb18ccd2',
    '11111111-1111-4111-8111-111111111111',
    'Ana Beatriz',
    'anabeat',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=65&w=250&auto=format&fit=crop',
    9.0,
    'Letras marcantes e produções impecáveis do início ao fim.',
    '18 de Mai, 2026',
    14,
    1
  )
ON CONFLICT (id) DO UPDATE SET
  rating = EXCLUDED.rating,
  comment = EXCLUDED.comment,
  display_date = EXCLUDED.display_date,
  likes_count = EXCLUDED.likes_count;

-- 10.2. Gera as 3 avaliações comunitárias padrão (`makeAlbumSeed`) para todos os 27 álbuns/EPs/Singles do catálogo
INSERT INTO public.album_reviews (
  id, album_id, user_id, user_display_name, username, user_avatar,
  rating, comment, display_date, likes_count, comments_count
)
SELECT
  a.id || '-rev-1' AS id,
  a.id AS album_id,
  '11111111-1111-4111-8111-111111111111'::uuid AS user_id,
  'AnaBeat' AS user_display_name,
  'anabeat' AS username,
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=65&w=150' AS user_avatar,
  LEAST(10, ROUND(a.community_rating)) AS rating,
  'Produção impecável de ' || a.artist_name || '. Um dos trabalhos mais marcantes de ' || a.genre_name || '.' AS comment,
  'Recente' AS display_date,
  8 AS likes_count,
  0 AS comments_count
FROM public.albums a
UNION ALL
SELECT
  a.id || '-rev-2' AS id,
  a.id AS album_id,
  '22222222-2222-4222-8222-222222222222'::uuid AS user_id,
  'LucasSound' AS user_display_name,
  'lucas_snd' AS username,
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=65&w=150' AS user_avatar,
  GREATEST(7, LEAST(10, ROUND(a.community_rating - 0.3))) AS rating,
  'Arranjos criativos e uma coesão sonora que prende do início ao fim.' AS comment,
  'Há 3 dias' AS display_date,
  5 AS likes_count,
  0 AS comments_count
FROM public.albums a
UNION ALL
SELECT
  a.id || '-rev-3' AS id,
  a.id AS album_id,
  '33333333-3333-4333-8333-333333333333'::uuid AS user_id,
  'BeatCritic' AS user_display_name,
  'beatcritic' AS username,
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=65&w=150' AS user_avatar,
  LEAST(10, ROUND(a.community_rating + 0.2)) AS rating,
  'Referência absoluta dentro do gênero. Vale cada segundo de audição!' AS comment,
  'Há 1 semana' AS display_date,
  12 AS likes_count,
  0 AS comments_count
FROM public.albums a
ON CONFLICT (id) DO UPDATE SET
  rating = EXCLUDED.rating,
  comment = EXCLUDED.comment,
  likes_count = EXCLUDED.likes_count;

-- =============================================================================
-- 11. PUBLICAÇÕES DA TIMELINE / FEED DA COMUNIDADE (`public.feed_posts` & `feed_post_comments`)
-- =============================================================================
INSERT INTO public.feed_posts (
  id, activity_type, user_id, friend_name, friend_username, friend_avatar,
  album_id, album_title, artist_id, artist_name, artist_genre, album_cover,
  rating, comment, time_ago, likes_count, is_edited, created_at
) VALUES
  (
    'feed-1',
    'review',
    '22222222-2222-4222-8222-222222222222',
    'Lucas Sound',
    'lucas_snd',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=65&w=150',
    '02a544b3-0459-42c7-bd9c-047162e7b67a',
    'HIT ME HARD AND SOFT',
    'f4abc0b5-3f7a-4eff-8f78-ac078dbce533',
    'Billie Eilish',
    'Pop',
    'https://coverartarchive.org/release-group/02a544b3-0459-42c7-bd9c-047162e7b67a/front-250',
    9.5,
    'A transição entre as faixas e a produção vocal neste álbum estão em outro patamar. Simplesmente envolvente do início ao fim!',
    'Há 1 hora',
    14,
    FALSE,
    NOW() - INTERVAL '1 hour'
  ),
  (
    'feed-my-1',
    'review',
    '11111111-1111-4111-8111-111111111111',
    'Ana Beatriz',
    'anabeat',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=65&w=250&auto=format&fit=crop',
    '32cb822c-a14e-49ce-a169-f209c5f31e0f',
    'GNX',
    '381086ea-f511-4aba-bdf9-71c753dc5077',
    'Kendrick Lamar',
    'Hip-Hop',
    'https://coverartarchive.org/release-group/32cb822c-a14e-49ce-a169-f209c5f31e0f/front-250',
    10.0,
    'Compartilhando minha nota: rimas afiadas, batidas pesadas e energia pura da Costa Oeste. Nota 10 sem dúvidas!',
    'Há 2 horas',
    22,
    FALSE,
    NOW() - INTERVAL '2 hours'
  ),
  (
    'feed-fav-1',
    'favorite',
    '33333333-3333-4333-8333-333333333333',
    'Beat Critic',
    'beatcritic',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=65&w=150',
    'f5093c06-23e3-404f-aeaa-40f72885ee3a',
    'The Dark Side of the Moon',
    '83d91898-7763-47d7-b03b-b92132375c47',
    'Pink Floyd',
    'Progressive Rock',
    'https://coverartarchive.org/release-group/f5093c06-23e3-404f-aeaa-40f72885ee3a/front-250',
    9.9,
    'Favoritou este álbum clássico na coleção pessoal de discos prediletos.',
    'Há 3 horas',
    19,
    FALSE,
    NOW() - INTERVAL '3 hours'
  ),
  (
    'feed-idol-1',
    'follow_idol',
    '22222222-2222-4222-8222-222222222222',
    'Lucas Sound',
    'lucas_snd',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=65&w=150',
    'aa997ea0-2936-40bd-884d-3af8a0e064dc',
    'Daft Punk',
    '056e4f3e-d505-4dad-8ec1-d04f521cbb56',
    'Eletrônica / French House',
    'Eletrônica / French House',
    'https://coverartarchive.org/release-group/aa997ea0-2936-40bd-884d-3af8a0e064dc/front-250',
    9.8,
    'Passou a seguir Daft Punk como ídolo musical na comunidade!',
    'Há 4 horas',
    11,
    FALSE,
    NOW() - INTERVAL '4 hours'
  ),
  (
    'feed-2',
    'review',
    '33333333-3333-4333-8333-333333333333',
    'Beat Critic',
    'beatcritic',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=65&w=150',
    'aa997ea0-2936-40bd-884d-3af8a0e064dc',
    'Random Access Memories',
    '056e4f3e-d505-4dad-8ec1-d04f521cbb56',
    'Daft Punk',
    'Eletrônica',
    'https://coverartarchive.org/release-group/aa997ea0-2936-40bd-884d-3af8a0e064dc/front-250',
    10.0,
    'O ápice da música eletrônica orgânica. Uma verdadeira obra de arte atemporal.',
    'Há 5 horas',
    29,
    FALSE,
    NOW() - INTERVAL '5 hours'
  )
ON CONFLICT (id) DO UPDATE SET
  rating = EXCLUDED.rating,
  comment = EXCLUDED.comment,
  time_ago = EXCLUDED.time_ago,
  likes_count = EXCLUDED.likes_count;

-- Comentários iniciais nos posts do feed (`INITIAL_FEED_POSTS`)
INSERT INTO public.feed_post_comments (id, post_id, user_id, author, avatar, text, time_label) VALUES
  (
    'c-1',
    'feed-1',
    '11111111-1111-4111-8111-111111111111',
    'Ana Beatriz',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=65&w=150',
    'Concordo totalmente! "LUNCH" e "CHIHIRO" são surreais.',
    'Há 45 min'
  ),
  (
    'c-2',
    'feed-my-1',
    '22222222-2222-4222-8222-222222222222',
    'Lucas Sound',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=65&w=150',
    'Nota merecidíssima! "luther" não sai do meu repeat.',
    'Há 1 hora'
  )
ON CONFLICT (id) DO UPDATE SET
  text = EXCLUDED.text,
  time_label = EXCLUDED.time_label;

-- Curtidas iniciais nos posts do feed (`isLiked: true` para Ana Beatriz)
INSERT INTO public.feed_post_likes (post_id, user_id) VALUES
  ('feed-my-1', '11111111-1111-4111-8111-111111111111'),
  ('feed-idol-1', '11111111-1111-4111-8111-111111111111'),
  ('feed-2', '11111111-1111-4111-8111-111111111111')
ON CONFLICT (post_id, user_id) DO NOTHING;

COMMIT;
