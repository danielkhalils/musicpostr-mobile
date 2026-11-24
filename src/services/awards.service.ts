import { type ArtistAwardRecord } from './catalog.service';
import { type AlbumAward } from './musicBrainz.service';

const WIKI_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'MusicpostrMobile/1.0 (https://musicpostr.app)',
};

const awardLogoCache = new Map<string, string | null>();
const inflightAwardLogo = new Map<string, Promise<string | null>>();
const artistAwardsCache = new Map<string, ArtistAwardRecord[]>();
const albumAwardsCache = new Map<string, AlbumAward[]>();
const inflightAlbumAwards = new Map<string, Promise<AlbumAward[]>>();

interface CeremonyDefinition {
  key: string;
  name: string;
  enWikiTitle: string;
  keywords: string[];
}

const CEREMONY_DEFINITIONS: CeremonyDefinition[] = [
  {
    key: 'latin_grammy',
    name: 'Grammy Latino',
    enWikiTitle: 'Latin_Grammy_Award',
    keywords: ['latin grammy', 'grammy latino'],
  },
  {
    key: 'grammy',
    name: 'Grammy Awards',
    enWikiTitle: 'Grammy_Award',
    keywords: ['grammy'],
  },
  {
    key: 'vma',
    name: 'MTV Video Music Awards',
    enWikiTitle: 'MTV_Video_Music_Award',
    keywords: ['video music award', 'vma', 'mtv video'],
  },
  {
    key: 'ema',
    name: 'MTV Europe Music Awards',
    enWikiTitle: 'MTV_Europe_Music_Award',
    keywords: ['europe music award', 'ema', 'mtv europe'],
  },
  {
    key: 'brit',
    name: 'BRIT Awards',
    enWikiTitle: 'Brit_Awards',
    keywords: ['brit award', 'brits'],
  },
  {
    key: 'bbma',
    name: 'Billboard Music Awards',
    enWikiTitle: 'Billboard_Music_Award',
    keywords: ['billboard'],
  },
  {
    key: 'ama',
    name: 'American Music Awards',
    enWikiTitle: 'American_Music_Awards',
    keywords: ['american music award'],
  },
  {
    key: 'oscar',
    name: 'Academy Awards (Oscar)',
    enWikiTitle: 'Academy_Awards',
    keywords: ['academy award', 'oscar'],
  },
  {
    key: 'golden_globe',
    name: 'Golden Globe Awards',
    enWikiTitle: 'Golden_Globe_Awards',
    keywords: ['golden globe', 'globo de ouro'],
  },
  {
    key: 'bet',
    name: 'BET Awards',
    enWikiTitle: 'BET_Awards',
    keywords: ['bet award', 'bet hip hop'],
  },
  {
    key: 'iheart',
    name: 'iHeartRadio Music Awards',
    enWikiTitle: 'IHeartRadio_Music_Awards',
    keywords: ['iheartradio', 'iheart'],
  },
  {
    key: 'mercury',
    name: 'Mercury Prize',
    enWikiTitle: 'Mercury_Prize',
    keywords: ['mercury prize', 'mercury music'],
  },
  {
    key: 'juno',
    name: 'Juno Awards',
    enWikiTitle: 'Juno_Award',
    keywords: ['juno award'],
  },
  {
    key: 'aria',
    name: 'ARIA Music Awards',
    enWikiTitle: 'ARIA_Music_Awards',
    keywords: ['aria music', 'aria award'],
  },
  {
    key: 'mama',
    name: 'MAMA Awards',
    enWikiTitle: 'MAMA_Awards',
    keywords: ['mama award', 'mnet asian'],
  },
  {
    key: 'mma',
    name: 'Melon Music Awards',
    enWikiTitle: 'Melon_Music_Awards',
    keywords: ['melon music'],
  },
  {
    key: 'multishow',
    name: 'Prêmio Multishow',
    enWikiTitle: 'Prêmio_Multishow_de_Música_Brasileira',
    keywords: ['multishow'],
  },
  {
    key: 'pmb',
    name: 'Prêmio da Música Brasileira',
    enWikiTitle: 'Prêmio_da_Música_Brasileira',
    keywords: ['música brasileira', 'premio da musica'],
  },
  {
    key: 'nme',
    name: 'NME Awards',
    enWikiTitle: 'NME_Awards',
    keywords: ['nme award'],
  },
  {
    key: 'nrj',
    name: 'NRJ Music Awards',
    enWikiTitle: 'NRJ_Music_Award',
    keywords: ['nrj music'],
  },
  {
    key: 'soul_train',
    name: 'Soul Train Music Awards',
    enWikiTitle: 'Soul_Train_Music_Awards',
    keywords: ['soul train'],
  },
  {
    key: 'peoples_choice',
    name: "People's Choice Awards",
    enWikiTitle: "People's_Choice_Awards",
    keywords: ["people's choice", 'peoples choice'],
  },
  {
    key: 'teen_choice',
    name: 'Teen Choice Awards',
    enWikiTitle: 'Teen_Choice_Awards',
    keywords: ['teen choice'],
  },
  {
    key: 'mtv_miaw',
    name: 'MTV MIAW',
    enWikiTitle: 'MTV_Millennial_Awards',
    keywords: ['miaw', 'millennial award'],
  },
];

export function detectAwardCeremony(rawText: string): {
  ceremonyKey: string;
  ceremonyName: string;
  enWikiTitle?: string;
} {
  const lower = (rawText || '').toLowerCase().trim();
  for (const def of CEREMONY_DEFINITIONS) {
    if (def.keywords.some((kw) => lower.includes(kw))) {
      return {
        ceremonyKey: def.key,
        ceremonyName: def.name,
        enWikiTitle: def.enWikiTitle,
      };
    }
  }
  return {
    ceremonyKey: lower || 'award',
    ceremonyName: rawText.trim() || 'Premiação Musical',
  };
}

async function resolveCommonsThumbUrl(fileName: string): Promise<string | null> {
  const cleanName = fileName.replace(/^File:/i, '').trim();
  if (!cleanName) return null;
  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(
        `File:${cleanName}`
      )}&prop=imageinfo&iiprop=url&iiurlwidth=300&format=json&origin=*`
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

async function fetchAwardLogoFromWikiTitle(enWikiTitle: string): Promise<string | null> {
  try {
    // 1. Tenta propriedade oficial P154 (logo image) ou P18 (image) no Wikidata
    const wdRes = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&sites=enwiki&titles=${encodeURIComponent(
        enWikiTitle
      )}&props=claims&format=json&origin=*`
    );
    if (wdRes.ok) {
      const wdJson = await wdRes.json();
      const entity: any = Object.values(wdJson?.entities || {})[0];
      const p154 = entity?.claims?.P154?.[0]?.mainsnak?.datavalue?.value;
      if (typeof p154 === 'string' && p154.trim()) {
        const logoUrl = await resolveCommonsThumbUrl(p154);
        if (logoUrl) return logoUrl;
      }
      const p18 = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
      if (typeof p18 === 'string' && p18.trim()) {
        const imgUrl = await resolveCommonsThumbUrl(p18);
        if (imgUrl) return imgUrl;
      }
    }

    // 2. Fallback para a imagem oficial do resumo da Wikipedia
    const sumRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(enWikiTitle)}`
    );
    if (sumRes.ok) {
      const sumJson = await sumRes.json();
      if (sumJson?.thumbnail?.source) {
        return String(sumJson.thumbnail.source);
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function getCachedAwardLogo(ceremonyOrName: string): string | null | undefined {
  const detected = detectAwardCeremony(ceremonyOrName);
  if (!awardLogoCache.has(detected.ceremonyKey)) return undefined;
  return awardLogoCache.get(detected.ceremonyKey) ?? null;
}

export async function resolveOfficialAwardLogo(ceremonyOrName: string): Promise<string | null> {
  const detected = detectAwardCeremony(ceremonyOrName);
  const key = detected.ceremonyKey;
  if (!key) return null;

  if (awardLogoCache.has(key)) {
    return awardLogoCache.get(key) ?? null;
  }

  const existing = inflightAwardLogo.get(key);
  if (existing) return existing;

  const promise = (async (): Promise<string | null> => {
    try {
      if (detected.enWikiTitle) {
        const url = await fetchAwardLogoFromWikiTitle(detected.enWikiTitle);
        if (url) {
          awardLogoCache.set(key, url);
          return url;
        }
      }

      // Busca dinâmica no Wikidata pelo nome da premiação
      const searchRes = await fetch(
        `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
          detected.ceremonyName
        )}&language=en&limit=2&format=json&origin=*`
      );
      if (searchRes.ok) {
        const searchJson = await searchRes.json();
        const items: any[] = Array.isArray(searchJson?.search) ? searchJson.search : [];
        for (const item of items) {
          if (!item?.id) continue;
          const entRes = await fetch(
            `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(
              item.id
            )}&props=claims&format=json&origin=*`
          );
          if (!entRes.ok) continue;
          const entJson = await entRes.json();
          const entity = entJson?.entities?.[item.id];
          const p154 = entity?.claims?.P154?.[0]?.mainsnak?.datavalue?.value;
          const p18 = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
          const file = p154 || p18;
          if (typeof file === 'string' && file.trim()) {
            const url = await resolveCommonsThumbUrl(file);
            if (url) {
              awardLogoCache.set(key, url);
              return url;
            }
          }
        }
      }

      awardLogoCache.set(key, null);
      return null;
    } catch {
      awardLogoCache.set(key, null);
      return null;
    } finally {
      inflightAwardLogo.delete(key);
    }
  })();

  inflightAwardLogo.set(key, promise);
  return promise;
}

async function resolveArtistWikidataQid(artistName: string): Promise<string | null> {
  const clean = artistName.trim();
  if (!clean) return null;

  try {
    const res = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
        clean
      )}&language=en&limit=5&format=json&origin=*`
    );
    if (!res.ok) return null;
    const json = await res.json();
    const candidates: any[] = Array.isArray(json?.search) ? json.search : [];
    if (candidates.length === 0) return null;

    const musicCandidate =
      candidates.find((c) =>
        /singer|musician|rapper|band|group|artist|songwriter|vocalist|producer|duo|cantor|banda/i.test(
          String(c?.description || '')
        )
      ) || candidates[0];

    return musicCandidate?.id ? String(musicCandidate.id) : null;
  } catch {
    return null;
  }
}

interface RawWikidataAwardClaim {
  awardQid: string;
  isWinner: boolean;
  year: string;
  workQid?: string;
}

function extractAwardClaimsFromEntity(
  entity: any,
  defaultWorkQid?: string
): RawWikidataAwardClaim[] {
  if (!entity?.claims) return [];
  const results: RawWikidataAwardClaim[] = [];

  const processProp = (propList: any[] | undefined, isWinner: boolean) => {
    if (!Array.isArray(propList)) return;
    for (const statement of propList) {
      const awardQid = statement?.mainsnak?.datavalue?.value?.id;
      if (!awardQid) continue;

      const timeRaw =
        statement?.qualifiers?.P585?.[0]?.datavalue?.value?.time ||
        statement?.qualifiers?.P580?.[0]?.datavalue?.value?.time ||
        '';
      const yearMatch = String(timeRaw).match(/([12]\d{3})/);
      const year = yearMatch ? yearMatch[1] : '';

      const workQid =
        statement?.qualifiers?.P1686?.[0]?.datavalue?.value?.id || defaultWorkQid;

      results.push({
        awardQid: String(awardQid),
        isWinner,
        year,
        workQid: workQid ? String(workQid) : undefined,
      });
    }
  };

  // P166 = award received (Vencedor)
  processProp(entity.claims.P166, true);
  // P1411 = nominated for (Indicado)
  processProp(entity.claims.P1411, false);

  return results;
}

/**
 * Busca todas as premiações e indicações oficiais do artista diretamente na API do Wikidata
 * (propriedades P166 = prêmio recebido e P1411 = indicado a, incluindo obras notáveis P800).
 */
export async function fetchArtistAwardsFromWikidata(
  artistName: string,
  knownWikidataId?: string
): Promise<ArtistAwardRecord[]> {
  const cacheKey = (knownWikidataId || artistName).toLowerCase().trim();
  if (!cacheKey) return [];
  if (artistAwardsCache.has(cacheKey)) {
    return artistAwardsCache.get(cacheKey)!;
  }

  try {
    const qid = knownWikidataId || (await resolveArtistWikidataQid(artistName));
    if (!qid) return [];

    const entityRes = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(
        qid
      )}&props=claims&format=json&origin=*`
    );
    if (!entityRes.ok) return [];
    const entityJson = await entityRes.json();
    const artistEntity = entityJson?.entities?.[qid];
    if (!artistEntity) return [];

    const rawClaims = extractAwardClaimsFromEntity(artistEntity);

    // Também inspeciona obras notáveis (P800 - álbuns e singles principais do artista) para capturar Grammys/VMAs de álbuns
    const notableWorkQids: string[] = Array.isArray(artistEntity?.claims?.P800)
      ? artistEntity.claims.P800
          .map((s: any) => s?.mainsnak?.datavalue?.value?.id)
          .filter(Boolean)
          .slice(0, 12)
      : [];

    if (notableWorkQids.length > 0) {
      const worksRes = await fetch(
        `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(
          notableWorkQids.join('|')
        )}&props=claims|labels&languages=pt|en&format=json&origin=*`
      );
      if (worksRes.ok) {
        const worksJson = await worksRes.json();
        const workEntities = worksJson?.entities || {};
        for (const wQid of notableWorkQids) {
          const wEnt = workEntities[wQid];
          if (wEnt) {
            rawClaims.push(...extractAwardClaimsFromEntity(wEnt, wQid));
          }
        }
      }
    }

    if (rawClaims.length === 0) {
      artistAwardsCache.set(cacheKey, []);
      return [];
    }

    // Resolve os nomes (labels em PT/EN) de todos os prêmios e obras em lote (máximo 50 IDs por chamada)
    const uniqueQidsToLabel = Array.from(
      new Set(
        rawClaims
          .flatMap((c) => [c.awardQid, c.workQid])
          .filter((x): x is string => Boolean(x))
      )
    ).slice(0, 48);

    const labelMap = new Map<string, string>();
    if (uniqueQidsToLabel.length > 0) {
      const lblRes = await fetch(
        `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(
          uniqueQidsToLabel.join('|')
        )}&props=labels&languages=pt|pt-br|en&format=json&origin=*`
      );
      if (lblRes.ok) {
        const lblJson = await lblRes.json();
        const entities = lblJson?.entities || {};
        for (const id of uniqueQidsToLabel) {
          const labels = entities?.[id]?.labels;
          const label =
            labels?.pt?.value ||
            labels?.['pt-br']?.value ||
            labels?.en?.value ||
            '';
          if (label) {
            labelMap.set(id, String(label));
          }
        }
      }
    }

    // Filtra honrarias não musicais genéricas se houver e monta os registros padronizados
    const seenKeys = new Set<string>();
    const awards: ArtistAwardRecord[] = [];

    for (const claim of rawClaims) {
      const fullAwardLabel = labelMap.get(claim.awardQid);
      if (!fullAwardLabel) continue;

      const detected = detectAwardCeremony(fullAwardLabel);
      const workTitle = claim.workQid ? labelMap.get(claim.workQid) : undefined;
      const dedupeKey = `${fullAwardLabel.toLowerCase()}::${claim.year}::${claim.isWinner ? 'W' : 'N'}::${
        workTitle || ''
      }`;
      if (seenKeys.has(dedupeKey)) continue;
      seenKeys.add(dedupeKey);

      awards.push({
        id: `wd-${claim.awardQid}-${claim.year || '0'}-${claim.isWinner ? 'w' : 'n'}-${awards.length}`,
        ceremony: (
          ['grammy', 'vma', 'billboard', 'oscar', 'brit'].includes(detected.ceremonyKey)
            ? detected.ceremonyKey
            : 'grammy'
        ) as ArtistAwardRecord['ceremony'],
        ceremonyName: detected.ceremonyName,
        awardName: detected.ceremonyName,
        category: fullAwardLabel,
        year: claim.year,
        isWinner: claim.isWinner,
        result: claim.isWinner ? 'winner' : 'nominee',
        albumTitle: workTitle,
      });
    }

    // Ordena: mais recentes primeiro, vencedores antes de indicados no mesmo ano
    awards.sort((a, b) => {
      const yearDiff = Number(b.year || 0) - Number(a.year || 0);
      if (yearDiff !== 0) return yearDiff;
      if (a.isWinner !== b.isWinner) return a.isWinner ? -1 : 1;
      return a.category.localeCompare(b.category);
    });

    artistAwardsCache.set(cacheKey, awards);
    return awards;
  } catch {
    return [];
  }
}

function splitTopLevel(str: string, sep: string): string[] {
  const parts: string[] = [];
  let sq = 0;
  let cu = 0;
  let last = 0;
  for (let i = 0; i < str.length; i++) {
    const two = str.slice(i, i + 2);
    if (two === '[[') {
      sq += 1;
      i += 1;
      continue;
    }
    if (two === ']]') {
      sq = Math.max(0, sq - 1);
      i += 1;
      continue;
    }
    if (two === '{{') {
      cu += 1;
      i += 1;
      continue;
    }
    if (two === '}}') {
      cu = Math.max(0, cu - 1);
      i += 1;
      continue;
    }
    if (sq === 0 && cu === 0 && str.startsWith(sep, i)) {
      parts.push(str.slice(last, i));
      i += sep.length - 1;
      last = i + 1;
    }
  }
  parts.push(str.slice(last));
  return parts;
}

function splitWikiCellAttr(cell: string): { attrs: string; content: string } {
  const parts = splitTopLevel(cell, '|');
  if (parts.length >= 2 && /[a-z-]+\s*=/i.test(parts[0]) && !/\[\[|\{\{/.test(parts[0])) {
    return { attrs: parts[0], content: parts.slice(1).join('|') };
  }
  return { attrs: '', content: cell };
}

function getWikiAttrSpan(attrs: string, name: 'rowspan' | 'colspan'): number {
  const m = attrs.match(new RegExp(`${name}\\s*=\\s*["']?(\\d+)`, 'i'));
  return m ? Math.max(1, Number(m[1])) : 1;
}

function cleanWikiText(input: string): string {
  let s = input
    .replace(/<ref[^>]*\/>/gi, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, '');
  for (let k = 0; k < 6; k++) {
    const next = s.replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1');
    if (next === s) break;
    s = next;
  }
  for (let k = 0; k < 8; k++) {
    const next = s.replace(/\{\{([^{}]*)\}\}/g, (_m, inner) => {
      const parts = String(inner).split('|').map((p) => p.trim());
      const name = (parts[0] || '').toLowerCase();
      const positional = parts.slice(1).filter((p) => !/^[a-z0-9_-]+\s*=/i.test(p));
      if (/^(efn|refn|ref|citation needed|cn|sfn|r)\b/.test(name)) return '';
      if (name === 'sortname') return [positional[0], positional[1]].filter(Boolean).join(' ');
      if (name === 'sort') return positional[1] || positional[0] || '';
      if (name === 'lang') return positional[1] || '';
      if (name === 'abbr') return positional[0] || '';
      return positional.length > 0 ? positional[positional.length - 1] : '';
    });
    if (next === s) break;
    s = next;
  }
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/'{2,}/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;|&mdash;/g, '–')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .replace(/^["“”]+|["“”]+$/g, '')
    .trim();
}

function detectWikiAwardResult(raw: string): 'winner' | 'nominee' | null {
  if (/\{\{\s*(won|win|winner|award|honoree|venceu|vencedor|ganhou)\b/i.test(raw)) {
    return 'winner';
  }
  if (/\{\{\s*(nom|nominated|nominee|pending|shortlisted|runner-up|lost|indicad[oa]|indica[çc][ãa]o)\b/i.test(raw)) {
    return 'nominee';
  }
  const t = cleanWikiText(raw).toLowerCase();
  if (/^(won|winner|venceu|vencedor|ganhou)$/.test(t)) return 'winner';
  if (/^(nominated|nominee|indicad[oa]|shortlisted)$/.test(t)) return 'nominee';
  return null;
}

function normAwardTitle(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const GENERIC_AWARD_HEADING =
  /^(awards?( and nominations)?|accolades|other awards|miscellaneous( awards)?|music awards|industry awards|notes|references|see also|external links|honou?rs|pr[eê]mios( e indica[cç][oõ]es)?|outros pr[eê]mios)$/i;

interface MappedAwardColumns {
  year: number;
  ceremony: number;
  work: number;
  category: number;
  result: number;
  award: number;
}

function mapWikiAwardColumns(headers: string[]): MappedAwardColumns {
  const idx: MappedAwardColumns = {
    year: -1,
    ceremony: -1,
    work: -1,
    category: -1,
    result: -1,
    award: -1,
  };
  headers.forEach((h, i) => {
    const t = h.toLowerCase();
    if (idx.result < 0 && /result|outcome|resultado/.test(t)) idx.result = i;
    else if (idx.category < 0 && /categor/.test(t)) idx.category = i;
    else if (idx.year < 0 && /\byear\b|\bano\b|^date|^data/.test(t)) idx.year = i;
    else if (idx.work < 0 && /nominee|recipient|work|nominated|title|obra|indicad|trabalho|for$/.test(t)) {
      idx.work = i;
    } else if (idx.ceremony < 0 && /organi[sz]ation|ceremony|association|event|cerim|organiza|institui/.test(t)) {
      idx.ceremony = i;
    } else if (idx.award < 0 && /award|prize|pr[eê]mio|premia[cç]/.test(t)) {
      idx.award = i;
    }
  });
  if (idx.category < 0 && idx.award >= 0) {
    idx.category = idx.award;
  } else if (idx.ceremony < 0 && idx.award >= 0) {
    idx.ceremony = idx.award;
  }
  return idx;
}

function parseWikiAwardTables(
  wikitext: string,
  options: { albumTitle: string; requireWorkMatch: boolean; fallbackYear?: string }
): AlbumAward[] {
  const target = normAwardTitle(options.albumTitle);
  const results: AlbumAward[] = [];
  const lines = wikitext.split('\n');

  let heading = '';
  let depth = 0;
  let headers: string[] | null = null;
  let cols: MappedAwardColumns | null = null;
  let pending: ({ raw: string; left: number } | null)[] = [];
  let rowCells: { text: string; header: boolean }[] = [];
  let rowAllHeader = true;
  let tableHeading = '';

  const flushRow = () => {
    if (rowCells.length === 0) return;
    const cells = rowCells;
    const allHeader = rowAllHeader;
    rowCells = [];
    rowAllHeader = true;

    if (!headers && allHeader) {
      headers = cells.map((c) => cleanWikiText(splitWikiCellAttr(c.text).content));
      cols = mapWikiAwardColumns(headers);
      pending = new Array(headers.length).fill(null);
      return;
    }
    if (!headers || !cols) return;

    const n = headers.length;
    const values: (string | null)[] = new Array(n).fill(null);
    let ci = 0;
    for (let col = 0; col < n; col++) {
      const p = pending[col];
      if (p && p.left > 0) {
        values[col] = p.raw;
        p.left -= 1;
        continue;
      }
      const cell = cells[ci++];
      if (!cell) break;
      const { attrs, content } = splitWikiCellAttr(cell.text);
      const rs = getWikiAttrSpan(attrs, 'rowspan');
      const cs = getWikiAttrSpan(attrs, 'colspan');
      for (let k = 0; k < cs && col + k < n; k++) {
        values[col + k] = content;
        pending[col + k] = rs > 1 ? { raw: content, left: rs - 1 } : null;
      }
      col += cs - 1;
    }

    let result: 'winner' | 'nominee' | null =
      cols.result >= 0 && values[cols.result] ? detectWikiAwardResult(values[cols.result]!) : null;
    if (!result) {
      for (const v of values) {
        if (v) {
          result = detectWikiAwardResult(v);
          if (result) break;
        }
      }
    }
    if (!result) return;

    const work = cols.work >= 0 && values[cols.work] ? cleanWikiText(values[cols.work]!) : '';
    if (options.requireWorkMatch || (cols.work >= 0 && work)) {
      const nw = normAwardTitle(work);
      if (!nw || (nw !== target && !options.requireWorkMatch ? false : nw !== target)) {
        if (options.requireWorkMatch) return;
      }
    }

    const category =
      cols.category >= 0 && values[cols.category] ? cleanWikiText(values[cols.category]!) : '';
    const yearText = cols.year >= 0 && values[cols.year] ? cleanWikiText(values[cols.year]!) : '';
    const yearMatch = yearText.match(/(19\d{2}|20\d{2})/);
    let ceremony =
      cols.ceremony >= 0 && values[cols.ceremony] ? cleanWikiText(values[cols.ceremony]!) : '';
    if (!ceremony) {
      ceremony = GENERIC_AWARD_HEADING.test(tableHeading) ? '' : tableHeading;
    }
    ceremony = ceremony
      .replace(/^\d{4}\s+/, '')
      .replace(/\s*\(\d{4}\)$/, '')
      .replace(/\s+[A-Z]$/, '')
      .trim();

    if (!category && !ceremony) return;

    const detected = detectAwardCeremony(ceremony || category);
    const displayCeremony = ceremony || detected.ceremonyName;
    const cKey = (
      ['grammy', 'vma', 'billboard', 'oscar', 'brit'].includes(detected.ceremonyKey)
        ? detected.ceremonyKey
        : 'grammy'
    ) as AlbumAward['ceremony'];

    results.push({
      id: `wiki-tbl-${detected.ceremonyKey}-${results.length}-${yearMatch?.[1] || '0'}`,
      ceremony: cKey,
      ceremonyName: displayCeremony,
      awardName: displayCeremony,
      category: category || displayCeremony,
      year: yearMatch ? yearMatch[1] : options.fallbackYear || '',
      isWinner: result === 'winner',
      result,
    });
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.replace(/\r$/, '').trim();
    const h = depth === 0 ? trimmed.match(/^(={2,6})\s*(.*?)\s*\1\s*$/) : null;
    if (h) {
      heading = cleanWikiText(h[2]);
      continue;
    }
    if (trimmed.startsWith('{|')) {
      depth += 1;
      if (depth === 1) {
        headers = null;
        cols = null;
        pending = [];
        rowCells = [];
        rowAllHeader = true;
        tableHeading = heading;
      }
      continue;
    }
    if (depth === 0) continue;
    if (trimmed.startsWith('|}')) {
      if (depth === 1) flushRow();
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth > 1) continue;
    if (trimmed.startsWith('|+')) continue;
    if (trimmed.startsWith('|-')) {
      flushRow();
      continue;
    }
    if (trimmed.startsWith('!')) {
      const parts = splitTopLevel(trimmed.slice(1), '!!').flatMap((p) => splitTopLevel(p, '||'));
      for (const p of parts) rowCells.push({ text: p.trim(), header: true });
      continue;
    }
    if (trimmed.startsWith('|')) {
      rowAllHeader = false;
      const parts = splitTopLevel(trimmed.slice(1), '||');
      for (const p of parts) rowCells.push({ text: p.trim(), header: false });
      continue;
    }
    if (rowCells.length > 0 && trimmed) {
      rowCells[rowCells.length - 1].text += ` ${trimmed}`;
    }
  }
  flushRow();

  return results;
}

async function searchWikipediaPageTitle(
  lang: 'en' | 'pt',
  query: string,
  predicate: (title: string) => boolean
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        query
      )}&srlimit=6&format=json&origin=*`,
      { headers: WIKI_HEADERS }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const hits: string[] = (json?.query?.search || []).map((h: any) => String(h.title || ''));
    return hits.find(predicate) || null;
  } catch {
    return null;
  }
}

async function fetchWikipediaWikitext(lang: 'en' | 'pt', title: string): Promise<string> {
  try {
    const res = await fetch(
      `https://${lang}.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(
        title
      )}&prop=wikitext&format=json&formatversion=2&redirects=1&origin=*`,
      { headers: WIKI_HEADERS }
    );
    if (!res.ok) return '';
    const json = await res.json();
    return String(json?.parse?.wikitext || '');
  } catch {
    return '';
  }
}

async function fetchAlbumAwardsFromWikipediaTables(
  albumTitle: string,
  artistName?: string,
  releaseYear?: string
): Promise<AlbumAward[]> {
  const cleanBase = albumTitle.replace(/\s*\([^)]*\)\s*/g, '').trim();
  const normAlbum = normAwardTitle(cleanBase);
  const normArtist = artistName ? normAwardTitle(artistName) : '';

  const tasks: Promise<AlbumAward[]>[] = [];

  // 1. Página dedicada de prêmios do artista na Wikipedia EN (fonte mais completa para álbuns)
  if (artistName && normArtist) {
    tasks.push(
      (async () => {
        const listTitle = await searchWikipediaPageTitle(
          'en',
          `List of awards and nominations received by ${artistName}`,
          (t) => /awards and nominations/i.test(t) && normAwardTitle(t).includes(normArtist)
        );
        if (!listTitle) return [];
        const wt = await fetchWikipediaWikitext('en', listTitle);
        return wt
          ? parseWikiAwardTables(wt, {
              albumTitle: cleanBase,
              requireWorkMatch: true,
              fallbackYear: releaseYear,
            })
          : [];
      })()
    );
  }

  // 2. Artigo oficial do álbum na Wikipedia EN
  tasks.push(
    (async () => {
      const query = artistName ? `${cleanBase} ${artistName} album` : `${cleanBase} album`;
      const albTitle = await searchWikipediaPageTitle('en', query, (t) =>
        normAwardTitle(t).startsWith(normAlbum)
      );
      if (!albTitle) return [];
      const wt = await fetchWikipediaWikitext('en', albTitle);
      return wt
        ? parseWikiAwardTables(wt, {
            albumTitle: cleanBase,
            requireWorkMatch: false,
            fallbackYear: releaseYear,
          })
        : [];
    })()
  );

  // 3. Artigo oficial do álbum na Wikipedia PT (útil para álbuns brasileiros/lusófonos)
  tasks.push(
    (async () => {
      const query = artistName ? `${cleanBase} ${artistName} álbum` : `${cleanBase} álbum`;
      const albTitle = await searchWikipediaPageTitle('pt', query, (t) =>
        normAwardTitle(t).startsWith(normAlbum)
      );
      if (!albTitle) return [];
      const wt = await fetchWikipediaWikitext('pt', albTitle);
      return wt
        ? parseWikiAwardTables(wt, {
            albumTitle: cleanBase,
            requireWorkMatch: false,
            fallbackYear: releaseYear,
          })
        : [];
    })()
  );

  const settled = await Promise.all(tasks);
  return settled.flat();
}

/**
 * Busca todas as premiações e indicações oficiais de um álbum específico combinando:
 * 1. Tabelas oficiais de prêmios na Wikipedia (página de prêmios do artista + artigo do álbum EN/PT)
 * 2. Entidade do álbum no Wikidata (propriedades P166 = vencedor e P1411 = indicado)
 * 3. Premiações do artista no Wikidata vinculadas ao álbum (P1686 / P800)
 */
export async function fetchAlbumAwardsFromApi(
  albumTitle: string,
  artistName?: string,
  releaseDate?: string
): Promise<AlbumAward[]> {
  const cleanTitle = (albumTitle || '').trim();
  if (!cleanTitle) return [];

  const cacheKey = `${cleanTitle.toLowerCase()}::${(artistName || '').toLowerCase().trim()}`;
  if (albumAwardsCache.has(cacheKey)) {
    return albumAwardsCache.get(cacheKey)!;
  }

  const existing = inflightAlbumAwards.get(cacheKey);
  if (existing) return existing;

  const promise = (async (): Promise<AlbumAward[]> => {
    const releaseYear = releaseDate ? String(releaseDate).slice(0, 4) : '';
    const collected: AlbumAward[] = [];
    const seen = new Set<string>();

    const pushUnique = (aw: AlbumAward) => {
      const key = `${(aw.awardName || aw.ceremonyName).toLowerCase()}::${aw.category.toLowerCase()}::${aw.year || ''}`;
      if (seen.has(key)) return;
      seen.add(key);
      collected.push(aw);
    };

    try {
      const cleanBaseTitle = cleanTitle.replace(/\s*\([^)]*\)\s*/g, '').trim();

      const [wikiTableAwards, artistAwards, wikidataAlbumClaims] = await Promise.all([
        fetchAlbumAwardsFromWikipediaTables(cleanBaseTitle, artistName, releaseYear),
        artistName ? fetchArtistAwardsFromWikidata(artistName) : Promise.resolve([]),
        (async (): Promise<AlbumAward[]> => {
          const out: AlbumAward[] = [];
          try {
            // Pesquisa apenas pelo título base no Wikidata (título+artista costuma retornar vazio)
            const wdSearchRes = await fetch(
              `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
                cleanBaseTitle
              )}&language=en&limit=8&format=json&origin=*`,
              { headers: WIKI_HEADERS }
            );
            if (!wdSearchRes.ok) return out;
            const wdSearchJson = await wdSearchRes.json();
            const candidates: any[] = Array.isArray(wdSearchJson?.search) ? wdSearchJson.search : [];
            const normArtist = (artistName || '').toLowerCase().trim();
            const albumCand =
              candidates.find((c) => {
                const desc = String(c?.description || '').toLowerCase();
                const isAlbumDesc = /album|extended play|ep|mixtape|soundtrack|disco|álbum/.test(desc);
                return isAlbumDesc && (!normArtist || desc.includes(normArtist));
              }) ||
              candidates.find((c) =>
                /album|extended play|ep|mixtape|soundtrack|disco|álbum/i.test(
                  String(c?.description || '')
                )
              );

            if (!albumCand?.id) return out;

            const entRes = await fetch(
              `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(
                String(albumCand.id)
              )}&props=claims&format=json&origin=*`,
              { headers: WIKI_HEADERS }
            );
            if (!entRes.ok) return out;
            const entJson = await entRes.json();
            const albumEntity = entJson?.entities?.[String(albumCand.id)];
            const rawClaims = extractAwardClaimsFromEntity(albumEntity);
            if (rawClaims.length === 0) return out;

            const qids = Array.from(new Set(rawClaims.map((c) => c.awardQid))).slice(0, 40);
            const lblRes = await fetch(
              `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(
                qids.join('|')
              )}&props=labels&languages=pt|pt-br|en&format=json&origin=*`,
              { headers: WIKI_HEADERS }
            );
            if (!lblRes.ok) return out;
            const lblJson = await lblRes.json();
            const entities = lblJson?.entities || {};

            for (const claim of rawClaims) {
              const labels = entities?.[claim.awardQid]?.labels;
              const fullLabel =
                labels?.pt?.value ||
                labels?.['pt-br']?.value ||
                labels?.en?.value ||
                '';
              if (!fullLabel) continue;
              const detected = detectAwardCeremony(fullLabel);
              const cKey = (
                ['grammy', 'vma', 'billboard', 'oscar', 'brit'].includes(detected.ceremonyKey)
                  ? detected.ceremonyKey
                  : 'grammy'
              ) as AlbumAward['ceremony'];

              out.push({
                id: `wd-alb-${claim.awardQid}-${claim.year || releaseYear || '0'}`,
                ceremony: cKey,
                ceremonyName: detected.ceremonyName,
                awardName: detected.ceremonyName,
                category: String(fullLabel),
                year: claim.year || releaseYear,
                isWinner: claim.isWinner,
                result: claim.isWinner ? 'winner' : 'nominee',
              });
            }
          } catch {
            // ignore
          }
          return out;
        })(),
      ]);

      for (const aw of wikiTableAwards) pushUnique(aw);
      for (const aw of wikidataAlbumClaims) pushUnique(aw);

      const normTitle = cleanBaseTitle.toLowerCase();
      const minYear = releaseYear ? Number(releaseYear) : 0;
      for (const aa of artistAwards) {
        const workMatch =
          aa.albumTitle &&
          (aa.albumTitle.toLowerCase().includes(normTitle) ||
            normTitle.includes(aa.albumTitle.toLowerCase()));
        const yearNum = Number(aa.year || 0);
        const isAlbumCategoryInWindow =
          minYear > 0 &&
          yearNum >= minYear &&
          yearNum <= minYear + 2 &&
          /album|álbum|disco|record of the year|gravação do ano/i.test(aa.category);

        if (workMatch || isAlbumCategoryInWindow) {
          pushUnique({
            id: `art-alb-${aa.id}`,
            ceremony: aa.ceremony,
            ceremonyName: aa.ceremonyName,
            awardName: aa.awardName,
            category: aa.category,
            year: aa.year || releaseYear,
            isWinner: aa.isWinner,
            result: aa.result,
          });
        }
      }

      collected.sort((a, b) => {
        if (a.isWinner !== b.isWinner) return a.isWinner ? -1 : 1;
        return Number(b.year || 0) - Number(a.year || 0);
      });

      albumAwardsCache.set(cacheKey, collected);
      return collected;
    } catch {
      return collected;
    } finally {
      inflightAlbumAwards.delete(cacheKey);
    }
  })();

  inflightAlbumAwards.set(cacheKey, promise);
  return promise;
}
