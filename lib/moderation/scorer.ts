import { SEVERE, MODERATE, FLAG, type WordEntry } from "./word-list";

export interface ScorerMatch {
  label: string;
  weight: number;
  count: number;
}

export interface ScorerResult {
  score: number;
  matches: ScorerMatch[];
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[@4]/g, "a")
    .replace(/3/g, "e")
    .replace(/[1!]/g, "i")
    .replace(/0/g, "o")
    .replace(/[$5]/g, "s")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
    ...matchEntries(normalized, FLAG),
  ];
  const score = matches.reduce((sum, match) => sum + match.weight * match.count, 0);
  return { score, matches };
}
