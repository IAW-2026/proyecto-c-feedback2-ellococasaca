import { SEVERE, MODERATE, MILD, type WordEntry } from "./word-list";

export interface ScorerMatch {
  label: string;
  weight: number;
  count: number;
}

export interface ScorerResult {
  score: number;
  matches: ScorerMatch[];
}

// Strips accents so patterns work without accent variants (e.g. "estúpido" → "estupido")
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function matchEntries(normalized: string, entries: WordEntry[]): ScorerMatch[] {
  const results: ScorerMatch[] = [];
  for (const entry of entries) {
    const re = new RegExp(entry.pattern.source, "gi");
    const found = normalized.match(re);
    if (found) {
      results.push({ label: entry.label, weight: entry.weight, count: found.length });
    }
  }
  return results;
}

export function scoreComment(text: string): ScorerResult {
  const normalized = normalize(text);
  const matches = [
    ...matchEntries(normalized, SEVERE),
    ...matchEntries(normalized, MODERATE),
    ...matchEntries(normalized, MILD),
  ];
  const score = matches.reduce((sum, m) => sum + m.weight * m.count, 0);
  return { score, matches };
}
