const SHORT_MONTHS_PT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

/**
 * Formata uma data ISO no padrão compacto utilizado em redes sociais (PT-BR):
 * - < 1 min: "agora"
 * - < 60 min: "5 min"
 * - < 24 h: "2 h"
 * - < 7 dias: "3 d"
 * - < 4 semanas: "2 sem"
 * - Mesmo ano: "14 de nov"
 * - Ano anterior: "14 de nov de 2025"
 */
export function formatSocialDate(
  isoDate?: string | null,
  options?: { fallback?: string | null; isEdited?: boolean }
): string {
  const suffix = options?.isEdited ? ' · editado' : '';

  if (isoDate) {
    const parsed = new Date(isoDate);
    if (!Number.isNaN(parsed.getTime())) {
      const now = new Date();
      const diffMs = Math.max(0, now.getTime() - parsed.getTime());
      const diffMin = Math.floor(diffMs / 60000);

      if (diffMin < 1) return `agora${suffix}`;
      if (diffMin < 60) return `${diffMin} min${suffix}`;

      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours} h${suffix}`;

      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays} d${suffix}`;

      if (diffDays < 28) {
        const diffWeeks = Math.floor(diffDays / 7);
        return `${diffWeeks} sem${suffix}`;
      }

      const day = parsed.getDate();
      const month = SHORT_MONTHS_PT[parsed.getMonth()];
      const year = parsed.getFullYear();

      if (year === now.getFullYear()) {
        return `${day} de ${month}${suffix}`;
      }
      return `${day} de ${month} de ${year}${suffix}`;
    }
  }

  const fallback = options?.fallback?.trim();
  if (fallback) return fallback;
  return `agora${suffix}`;
}
