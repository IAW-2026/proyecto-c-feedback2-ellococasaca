export interface WordEntry {
  pattern: RegExp;
  weight: number;
  label: string;
}

// weight 50 → score ≥ 50 instantly → auto-reject (no AI call)
export const SEVERE: WordEntry[] = [
  { pattern: /hijo\s+de\s+puta/g, weight: 50, label: "hijo_de_puta" },
  { pattern: /hija\s+de\s+puta/g, weight: 50, label: "hija_de_puta" },
  { pattern: /\bhdp\b/g, weight: 50, label: "hdp" },
  { pattern: /concha\s+(de\s+tu|tu)\s+madre/g, weight: 50, label: "ctm" },
  { pattern: /la\s+(re\s*)?concha\b/g, weight: 50, label: "la_concha" },
  { pattern: /puta\s+madre/g, weight: 50, label: "puta_madre" },
  { pattern: /te\s+voy\s+a\s+matar/g, weight: 50, label: "amenaza_muerte" },
  { pattern: /\bte\s+mato\b/g, weight: 50, label: "te_mato" },
  { pattern: /cagarte\s+a\s+palos/g, weight: 50, label: "amenaza_golpes" },
];

// weight 20 → 1 match = score 20 (15–49 range) → AI review
export const MODERATE: WordEntry[] = [
  { pattern: /\bboludo\b/g, weight: 20, label: "boludo" },
  { pattern: /\bboluda\b/g, weight: 20, label: "boluda" },
  { pattern: /\bpelotudo\b/g, weight: 20, label: "pelotudo" },
  { pattern: /\bpelotuda\b/g, weight: 20, label: "pelotuda" },
  { pattern: /\bforro\b/g, weight: 20, label: "forro" },
  { pattern: /\bforra\b/g, weight: 20, label: "forra" },
  { pattern: /\bidiota\b/g, weight: 20, label: "idiota" },
  { pattern: /\bestupido\b/g, weight: 20, label: "estupido" },
  { pattern: /\bestupida\b/g, weight: 20, label: "estupida" },
  { pattern: /\bimbecil\b/g, weight: 20, label: "imbecil" },
  { pattern: /\bconcha\b/g, weight: 20, label: "concha_aislada" },
  { pattern: /\bgarca\b/g, weight: 20, label: "garca" },
  { pattern: /\bladron\b/g, weight: 20, label: "ladron" },
  { pattern: /\bladrones\b/g, weight: 20, label: "ladrones" },
  { pattern: /\bestafador\b/g, weight: 20, label: "estafador" },
  { pattern: /\bestafadora\b/g, weight: 20, label: "estafadora" },
  { pattern: /\bchoreo\b/g, weight: 20, label: "choreo" },
];

// weight 8 → needs 2+ matches (score 16) to reach AI threshold of 15
export const MILD: WordEntry[] = [
  { pattern: /\bmierda\b/g, weight: 8, label: "mierda" },
  { pattern: /\bputa\b/g, weight: 8, label: "puta_aislada" },
  { pattern: /\bculo\b/g, weight: 8, label: "culo" },
  { pattern: /\bpija\b/g, weight: 8, label: "pija" },
  { pattern: /\bporqueria\b/g, weight: 8, label: "porqueria" },
  { pattern: /cara\s+de\s+culo/g, weight: 8, label: "cara_de_culo" },
];
