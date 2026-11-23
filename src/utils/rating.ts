/**
 * Formata uma nota musical sem casa decimal quando for número inteiro (ex: 8 em vez de 8.0, 10 em vez de 10.0)
 * e com 1 casa decimal quando tiver fração (ex: 8.5).
 */
export function formatRating(value: number | string | null | undefined): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  const rounded = Math.round(num * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
