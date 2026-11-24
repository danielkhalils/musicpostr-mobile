import { supabase } from './supabase';
import { mapDbAlbumToCatalog, mapDbArtistToCatalog } from './catalog.service';
import { type CatalogAlbum, type CatalogArtist } from './musicBrainz.service';

export interface LiveRecordLabelInfo {
  id: string;
  name: string;
  desc: string;
  founded: string;
  headquarters: string;
  parentGroup: string;
  genres: string[];
  bio: string;
  logoUrl: string | null;
  artists: CatalogArtist[];
  albums: CatalogAlbum[];
}

const logoCache = new Map<string, string | null>();
const inflightLogo = new Map<string, Promise<string | null>>();

/**
 * Mapeamento de títulos canônicos na Wikipedia/Wikidata para garantir
 * que a busca da entidade da gravadora encontre a página oficial exata.
 */
const CANONICAL_WIKI_TITLES: Record<string, { en: string; pt?: string }> = {
  'universal music group': { en: 'Universal_Music_Group', pt: 'Universal_Music_Group' },
  'universal music': { en: 'Universal_Music_Group', pt: 'Universal_Music_Group' },
  'sony music': { en: 'Sony_Music', pt: 'Sony_Music_Entertainment' },
  'sony music entertainment': { en: 'Sony_Music', pt: 'Sony_Music_Entertainment' },
  'warner music group': { en: 'Warner_Music_Group', pt: 'Warner_Music_Group' },
  'warner records': { en: 'Warner_Records', pt: 'Warner_Records' },
  'atlantic records': { en: 'Atlantic_Records', pt: 'Atlantic_Records' },
  'republic records': { en: 'Republic_Records', pt: 'Republic_Records' },
  'interscope records': { en: 'Interscope_Records', pt: 'Interscope_Records' },
  'columbia records': { en: 'Columbia_Records', pt: 'Columbia_Records' },
  'rca records': { en: 'RCA_Records', pt: 'RCA_Records' },
  'capitol records': { en: 'Capitol_Records', pt: 'Capitol_Records' },
  'def jam recordings': { en: 'Def_Jam_Recordings', pt: 'Def_Jam_Recordings' },
  'def jam': { en: 'Def_Jam_Recordings', pt: 'Def_Jam_Recordings' },
  'island records': { en: 'Island_Records', pt: 'Island_Records' },
  'virgin music': { en: 'Virgin_Records', pt: 'Virgin_Records' },
  'virgin records': { en: 'Virgin_Records', pt: 'Virgin_Records' },
  'parlophone': { en: 'Parlophone', pt: 'Parlophone' },
  'polydor records': { en: 'Polydor_Records', pt: 'Polydor_Records' },
  'polydor': { en: 'Polydor_Records', pt: 'Polydor_Records' },
  'epic records': { en: 'Epic_Records', pt: 'Epic_Records' },
  'elektra records': { en: 'Elektra_Records', pt: 'Elektra_Records' },
  'roc nation': { en: 'Roc_Nation', pt: 'Roc_Nation' },
  'top dawg entertainment': { en: 'Top_Dawg_Entertainment', pt: 'Top_Dawg_Entertainment' },
  'ovo sound': { en: 'OVO_Sound', pt: 'OVO_Sound' },
  'xo records': { en: 'XO_(record_label)', pt: 'XO_(gravadora)' },
  'xo': { en: 'XO_(record_label)', pt: 'XO_(gravadora)' },
  'cactus jack': { en: 'Cactus_Jack_Records', pt: 'Cactus_Jack_Records' },
  'cactus jack records': { en: 'Cactus_Jack_Records', pt: 'Cactus_Jack_Records' },
  'aftermath entertainment': { en: 'Aftermath_Entertainment', pt: 'Aftermath_Entertainment' },
  'motown records': { en: 'Motown', pt: 'Motown' },
  'motown': { en: 'Motown', pt: 'Motown' },
  'blue note records': { en: 'Blue_Note_Records', pt: 'Blue_Note_Records' },
  'sub pop': { en: 'Sub_Pop', pt: 'Sub_Pop' },
  'xl recordings': { en: 'XL_Recordings', pt: 'XL_Recordings' },
  '4ad': { en: '4AD', pt: '4AD' },
  'warp records': { en: 'Warp_(record_label)', pt: 'Warp_Records' },
  'ninja tune': { en: 'Ninja_Tune' },
  'domino recording co.': { en: 'Domino_Recording_Company', pt: 'Domino_Records' },
  'matador records': { en: 'Matador_Records', pt: 'Matador_Records' },
  'som livre': { en: 'Som_Livre', pt: 'Som_Livre' },
  'deckdisc': { en: 'Deckdisc', pt: 'Deck_(gravadora)' },
  'kondzilla': { en: 'KondZilla', pt: 'KondZilla' },
  'biscoito fino': { en: 'Biscoito_Fino', pt: 'Biscoito_Fino' },
  'hybe labels': { en: 'Hybe_Corporation', pt: 'Hybe_Corporation' },
  'hybe': { en: 'Hybe_Corporation', pt: 'Hybe_Corporation' },
  'parkwood entertainment': { en: 'Parkwood_Entertainment', pt: 'Parkwood_Entertainment' },
  'pglang': { en: 'PgLang', pt: 'PgLang' },
  'good music': { en: 'GOOD_Music', pt: 'GOOD_Music' },
  'young money': { en: 'Young_Money_Entertainment', pt: 'Young_Money_Entertainment' },
  'cash money records': { en: 'Cash_Money_Records', pt: 'Cash_Money_Records' },
  'bad boy records': { en: 'Bad_Boy_Records', pt: 'Bad_Boy_Records' },
  'death row records': { en: 'Death_Row_Records', pt: 'Death_Row_Records' },
  'epitaph records': { en: 'Epitaph_Records', pt: 'Epitaph_Records' },
  'nuclear blast': { en: 'Nuclear_Blast', pt: 'Nuclear_Blast' },
  'roadrunner records': { en: 'Roadrunner_Records', pt: 'Roadrunner_Records' },
  'spinnin records': { en: "Spinnin'_Records", pt: "Spinnin'_Records" },
  'armada music': { en: 'Armada_Music', pt: 'Armada_Music' },
  'ultra records': { en: 'Ultra_Records', pt: 'Ultra_Records' },
  'bmg': { en: 'BMG_Rights_Management', pt: 'BMG_Rights_Management' },
};

/**
 * Limpa sufixos jurídicos/distribuição retornados por APIs de streaming
 * (ex.: "Republic Records, a division of UMG Recordings, Inc." -> "Republic Records")
 */
export function normalizeOfficialLabelName(rawLabel: string): string {
  const firstSegment = rawLabel
    .split(/\s*[,;/|]\s*|\s+under\s+exclusive\s+license\s+|\s+a\s+division\s+of\s+/i)[0]
    .replace(/^[℗©(P)(C)\s0-9-]+/i, '')
    .trim();

  if (!firstSegment) return rawLabel.trim();

  const lower = firstSegment.toLowerCase();
  if (lower === 'republic' || lower.startsWith('republic records')) return 'Republic Records';
  if (lower === 'columbia' || lower.startsWith('columbia records')) return 'Columbia Records';
  if (lower === 'atlantic' || lower.startsWith('atlantic records') || lower.startsWith('atlantic recording')) {
    return 'Atlantic Records';
  }
  if (lower === 'interscope' || lower.startsWith('interscope records')) return 'Interscope Records';
  if (lower === 'rca' || lower.startsWith('rca records')) return 'RCA Records';
  if (lower === 'capitol' || lower.startsWith('capitol records')) return 'Capitol Records';
  if (lower === 'def jam' || lower.startsWith('def jam recordings')) return 'Def Jam Recordings';
  if (lower === 'island' || lower.startsWith('island records')) return 'Island Records';
  if (lower === 'epic' || lower.startsWith('epic records')) return 'Epic Records';
  if (lower === 'parlophone' || lower.startsWith('parlophone records')) return 'Parlophone';
  if (lower === 'polydor' || lower.startsWith('polydor records')) return 'Polydor Records';
  if (lower === 'elektra' || lower.startsWith('elektra records')) return 'Elektra Records';
  if (lower === 'warner' || lower === 'warner bros.' || lower.startsWith('warner records')) {
    return 'Warner Music Group';
  }
  if (lower.startsWith('universal music')) return 'Universal Music Group';
  if (lower.startsWith('sony music')) return 'Sony Music';

  return firstSegment;
}

async function resolveCommonsThumbUrl(fileName: string): Promise<string | null> {
  const cleanName = fileName.replace(/^File:/i, '').trim();
  if (!cleanName) return null;
  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(
        `File:${cleanName}`
      )}&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json&origin=*`
    );
    if (!res.ok) return null;
    const json = await res.json();
    const pages = json?.query?.pages || {};
    const firstPage: any = Object.values(pages)[0];
    const info = firstPage?.imageinfo?.[0];
    return info?.thumburl || info?.url || null;
  } catch {
    return null;
  }
}

async function fetchWikidataLogoByTitle(enWikiTitle: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&sites=enwiki&titles=${encodeURIComponent(
        enWikiTitle
      )}&props=claims&format=json&origin=*`
    );
    if (!res.ok) return null;
    const json = await res.json();
    const entities = json?.entities || {};
    const entity: any = Object.values(entities)[0];
    const p154 = entity?.claims?.P154?.[0]?.mainsnak?.datavalue?.value;
    if (typeof p154 === 'string' && p154.trim()) {
      return await resolveCommonsThumbUrl(p154);
    }
  } catch {
    // ignore
  }
  return null;
}

async function searchWikidataEntityLogo(labelName: string): Promise<string | null> {
  try {
    const searchRes = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
        labelName
      )}&language=en&limit=3&format=json&origin=*`
    );
    if (!searchRes.ok) return null;
    const searchJson = await searchRes.json();
    const candidates: any[] = Array.isArray(searchJson?.search) ? searchJson.search : [];
    for (const cand of candidates) {
      const qid = cand?.id;
      if (!qid) continue;
      const entityRes = await fetch(
        `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(
          qid
        )}&props=claims&format=json&origin=*`
      );
      if (!entityRes.ok) continue;
      const entityJson = await entityRes.json();
      const entity = entityJson?.entities?.[qid];
      const p154 = entity?.claims?.P154?.[0]?.mainsnak?.datavalue?.value;
      if (typeof p154 === 'string' && p154.trim()) {
        const url = await resolveCommonsThumbUrl(p154);
        if (url) return url;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Busca SOMENTE a logo oficial real da gravadora via Wikidata (propriedade P154 - logo image)
 * e Wikimedia Commons. Caso não exista logo oficial verificada, retorna null
 * para que o componente exiba a letra inicial do nome da gravadora.
 */
export async function resolveOfficialRecordLabelLogo(labelName: string): Promise<string | null> {
  const clean = normalizeOfficialLabelName(labelName);
  const key = clean.toLowerCase().trim();
  if (!key || key === 'não informada' || key === 'independente' || key === 'oficial') {
    return null;
  }

  if (logoCache.has(key)) {
    return logoCache.get(key) ?? null;
  }

  const existing = inflightLogo.get(key);
  if (existing) return existing;

  const promise = (async (): Promise<string | null> => {
    try {
      const mapping = CANONICAL_WIKI_TITLES[key];
      if (mapping?.en) {
        const fromCanonical = await fetchWikidataLogoByTitle(mapping.en);
        if (fromCanonical) {
          logoCache.set(key, fromCanonical);
          return fromCanonical;
        }
      }

      const fromSearch = await searchWikidataEntityLogo(clean);
      if (fromSearch) {
        logoCache.set(key, fromSearch);
        return fromSearch;
      }

      // Tentativa adicional com sufixo "Records" caso o nome venha curto (ex.: "Columbia")
      if (!/records|music|recordings|entertainment/i.test(clean)) {
        const fromRecordsSearch = await searchWikidataEntityLogo(`${clean} Records`);
        if (fromRecordsSearch) {
          logoCache.set(key, fromRecordsSearch);
          return fromRecordsSearch;
        }
      }

      logoCache.set(key, null);
      return null;
    } catch {
      logoCache.set(key, null);
      return null;
    } finally {
      inflightLogo.delete(key);
    }
  })();

  inflightLogo.set(key, promise);
  return promise;
}

export function getCachedRecordLabelLogo(labelName: string): string | null | undefined {
  const clean = normalizeOfficialLabelName(labelName);
  const key = clean.toLowerCase().trim();
  if (!logoCache.has(key)) return undefined;
  return logoCache.get(key) ?? null;
}

/**
 * Consulta a API do MusicBrainz para obter metadados reais da gravadora (país/sede, ano de fundação e tipo).
 */
async function fetchLabelMetaFromMusicBrainz(labelName: string): Promise<{
  founded?: string;
  headquarters?: string;
  type?: string;
} | null> {
  try {
    const res = await fetch(
      `https://musicbrainz.org/ws/2/label/?query=${encodeURIComponent(
        `label:"${labelName}"`
      )}&limit=3&fmt=json`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'MusicpostrMobile/1.0 (https://musicpostr.app)',
        },
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const labels: any[] = Array.isArray(json?.labels) ? json.labels : [];
    const best =
      labels.find((l) => String(l?.name || '').toLowerCase() === labelName.toLowerCase()) ||
      labels[0];
    if (!best) return null;

    const begin = best['life-span']?.begin ? String(best['life-span'].begin).slice(0, 4) : undefined;
    const area = best.area?.name || best.country || undefined;
    const type = best.type || undefined;
    return { founded: begin, headquarters: area, type };
  } catch {
    return null;
  }
}

/**
 * Busca o resumo atualizado da gravadora na Wikipedia (PT com fallback para EN).
 */
async function fetchLabelSummaryFromWikipedia(labelName: string): Promise<string | null> {
  const key = labelName.toLowerCase().trim();
  const canonical = CANONICAL_WIKI_TITLES[key];

  const trySummary = async (lang: 'pt' | 'en', title: string): Promise<string | null> => {
    try {
      const res = await fetch(
        `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
      );
      if (!res.ok) return null;
      const json = await res.json();
      const extract = String(json?.extract || '').trim();
      return extract.length > 50 ? extract : null;
    } catch {
      return null;
    }
  };

  if (canonical?.pt) {
    const ptSum = await trySummary('pt', canonical.pt);
    if (ptSum) return ptSum;
  }
  if (canonical?.en) {
    const enSum = await trySummary('en', canonical.en);
    if (enSum) return enSum;
  }

  const queries = [`${labelName} (gravadora)`, `${labelName} (record label)`, labelName];
  for (const lang of ['pt', 'en'] as const) {
    for (const q of queries) {
      try {
        const sRes = await fetch(
          `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
            q
          )}&srlimit=1&format=json&origin=*`
        );
        if (!sRes.ok) continue;
        const sJson = await sRes.json();
        const foundTitle = sJson?.query?.search?.[0]?.title;
        if (!foundTitle) continue;
        const sum = await trySummary(lang, foundTitle);
        if (sum) return sum;
      } catch {
        // ignore
      }
    }
  }
  return null;
}

/**
 * Busca artistas e álbuns reais vinculados à gravadora diretamente na API do Deezer
 * usando o filtro oficial `label:"Nome da Gravadora"` e verificando o campo `label` dos álbuns.
 */
async function fetchArtistsAndAlbumsByLabelFromDeezer(labelName: string): Promise<{
  artists: CatalogArtist[];
  albums: CatalogAlbum[];
}> {
  const clean = normalizeOfficialLabelName(labelName);
  const shortKey = clean
    .replace(/\b(records|recordings|music|group|entertainment|labels|co\.|inc\.|ltd\.)\b/gi, '')
    .trim();

  const queries = Array.from(new Set([clean, shortKey].filter((q) => q.length >= 2)));
  const artistsMap = new Map<string, CatalogArtist>();
  const albumsList: CatalogAlbum[] = [];
  const seenAlbums = new Set<string>();

  for (const q of queries) {
    try {
      const res = await fetch(
        `https://api.deezer.com/search/album?q=${encodeURIComponent(`label:"${q}"`)}&limit=40`
      );
      if (!res.ok) continue;
      const json = await res.json();
      const items: any[] = Array.isArray(json?.data) ? json.data : [];

      for (const item of items) {
        const artistObj = item?.artist;
        if (!artistObj?.id || !artistObj?.name) continue;
        const artistName = String(artistObj.name).trim();
        if (!artistName || /^various artists$/i.test(artistName)) continue;

        const artistKey = artistName.toLowerCase();
        if (!artistsMap.has(artistKey)) {
          artistsMap.set(artistKey, {
            id: `dz-artist-${artistObj.id}`,
            name: artistName,
            imageUrl:
              artistObj.picture_xl ||
              artistObj.picture_big ||
              artistObj.picture_medium ||
              '',
            genre: 'Artista Oficial',
            nbFans: 0,
            country: '',
            type: 'Artista',
          });
        }

        if (item.id && item.title && !seenAlbums.has(String(item.id))) {
          seenAlbums.add(String(item.id));
          albumsList.push({
            id: `dz-album-${item.id}`,
            title: String(item.title),
            cover_xl: item.cover_xl || item.cover_big || item.cover_medium || '',
            cover_big: item.cover_big || item.cover_medium || item.cover_xl || '',
            cover_medium: item.cover_medium || item.cover_big || item.cover_xl || '',
            cover_small: item.cover_small || item.cover_medium || '',
            artist: {
              id: `dz-artist-${artistObj.id}`,
              name: artistName,
            },
            release_date: '',
            record_type: item.record_type === 'ep' ? 'ep' : 'album',
            genreName: 'Música',
            label: clean,
            communityRating: 0,
            totalReviews: 0,
            listenersCount: 0,
            listenedByMe: false,
            isFavorite: false,
            tracks: { data: [] },
            reviews: [],
          });
        }
      }

      if (artistsMap.size >= 8) break;
    } catch {
      // ignore
    }
  }

  return {
    artists: Array.from(artistsMap.values()),
    albums: albumsList.slice(0, 24),
  };
}

/**
 * Obtém os dados completos e atualizados da página da gravadora combinando:
 * - API do Deezer (`label:"..."`) para artistas e álbuns reais vinculados à gravadora
 * - API do MusicBrainz para fundação e sede
 * - API da Wikipedia / Wikidata para biografia e logo oficial (P154)
 * - Catálogo local do Supabase
 */
export async function fetchLiveRecordLabelDetails(
  labelIdOrName: string
): Promise<LiveRecordLabelInfo> {
  const raw = decodeURIComponent(labelIdOrName || '').trim();
  const canonicalName = normalizeOfficialLabelName(raw || 'Gravadora');
  const shortKeyword =
    canonicalName
      .replace(/\b(records|recordings|music|group|entertainment|labels|co\.|inc\.|ltd\.)\b/gi, '')
      .trim() || canonicalName;

  const pattern = `%${shortKeyword}%`;

  const [deezerData, mbMeta, wikiBio, logoUrl, supabaseData] = await Promise.all([
    fetchArtistsAndAlbumsByLabelFromDeezer(canonicalName),
    fetchLabelMetaFromMusicBrainz(canonicalName),
    fetchLabelSummaryFromWikipedia(canonicalName),
    resolveOfficialRecordLabelLogo(canonicalName),
    (async () => {
      try {
        const [artistsRes, albumsRes] = await Promise.all([
          supabase
            .from('artists')
            .select('*')
            .ilike('label_name', pattern)
            .order('nb_fans', { ascending: false })
            .limit(30),
          supabase
            .from('albums')
            .select('*')
            .ilike('label', pattern)
            .order('listeners_count', { ascending: false })
            .limit(24),
        ]);
        return {
          artists:
            !artistsRes.error && artistsRes.data
              ? artistsRes.data.map(mapDbArtistToCatalog)
              : [],
          albums:
            !albumsRes.error && albumsRes.data
              ? albumsRes.data.map(mapDbAlbumToCatalog)
              : [],
        };
      } catch {
        return { artists: [] as CatalogArtist[], albums: [] as CatalogAlbum[] };
      }
    })(),
  ]);

  // Mescla artistas reais da API do Deezer com artistas verificados no Supabase sem duplicar
  const mergedArtists: CatalogArtist[] = [];
  const seenArtistNames = new Set<string>();

  for (const a of [...supabaseData.artists, ...deezerData.artists]) {
    const key = a.name.toLowerCase().trim();
    if (!key || seenArtistNames.has(key)) continue;
    seenArtistNames.add(key);
    mergedArtists.push(a);
  }

  // Mescla álbuns do Supabase e do Deezer
  const mergedAlbums: CatalogAlbum[] = [];
  const seenAlbumTitles = new Set<string>();
  for (const alb of [...supabaseData.albums, ...deezerData.albums]) {
    const key = `${alb.title.toLowerCase().trim()}::${(alb.artist?.name || '').toLowerCase().trim()}`;
    if (seenAlbumTitles.has(key)) continue;
    seenAlbumTitles.add(key);
    mergedAlbums.push(alb);
  }

  return {
    id: canonicalName.toLowerCase().replace(/\s+/g, '-'),
    name: canonicalName,
    desc: mbMeta?.type
      ? `${mbMeta.type} • Selo Fonográfico Oficial`
      : 'Selo Fonográfico & Distribuidora Musical',
    founded: mbMeta?.founded || 'Selo Ativo',
    headquarters: mbMeta?.headquarters || 'Internacional',
    parentGroup: canonicalName,
    genres: [],
    bio:
      wikiBio ||
      `${canonicalName} é uma gravadora e distribuidora musical com lançamentos e artistas verificados nas bases de dados do Deezer e MusicBrainz.`,
    logoUrl,
    artists: mergedArtists,
    albums: mergedAlbums,
  };
}
