export interface WordEntry {
  pattern: RegExp;
  weight: number;
  label: string;
}

// weight 50 -> score >= 50 instantly -> auto-reject locally.
export const SEVERE: WordEntry[] = [
  { pattern: /hijo\s+de\s+puta/g, weight: 50, label: "hijo_de_puta" },
  { pattern: /hija\s+de\s+puta/g, weight: 50, label: "hija_de_puta" },
  { pattern: /\bh\s*d\s*p\b/g, weight: 50, label: "hdp_obfuscado" },
  { pattern: /\bhdp\b/g, weight: 50, label: "hdp" },
  { pattern: /concha\s+(de\s+tu|tu)\s+madre/g, weight: 50, label: "ctm" },
  { pattern: /la\s+(re\s*)?concha\b/g, weight: 50, label: "la_concha" },
  { pattern: /puta\s+madre/g, weight: 50, label: "puta_madre" },
  { pattern: /ojala\s+(te\s+)?mueras/g, weight: 50, label: "deseo_muerte" },
  { pattern: /te\s+voy\s+a\s+matar/g, weight: 50, label: "amenaza_muerte" },
  { pattern: /\bte\s+mato\b/g, weight: 50, label: "te_mato" },
  { pattern: /cagar(te|lo|la)?\s+a\s+trompadas/g, weight: 50, label: "amenaza_trompadas" },
  { pattern: /cagarte\s+a\s+palos/g, weight: 50, label: "amenaza_golpes" },
  { pattern: /\bnegro\s+de\s+mierda\b/g, weight: 50, label: "odio_identidad" },
];

// weight 20 -> 1 match = score 20 (15-49 range) -> OpenAI review.
export const MODERATE: WordEntry[] = [
  { pattern: /\bboludo\b/g, weight: 20, label: "boludo" },
  { pattern: /\bboluda\b/g, weight: 20, label: "boluda" },
  { pattern: /\bbolud[oa]s\b/g, weight: 20, label: "boludos" },
  { pattern: /\bpelotudo\b/g, weight: 20, label: "pelotudo" },
  { pattern: /\bpelotuda\b/g, weight: 20, label: "pelotuda" },
  { pattern: /\bpelotud[oa]s\b/g, weight: 20, label: "pelotudos" },
  { pattern: /\bforro\b/g, weight: 20, label: "forro" },
  { pattern: /\bforra\b/g, weight: 20, label: "forra" },
  { pattern: /\bforr[oa]s\b/g, weight: 20, label: "forros" },
  { pattern: /\bidiota\b/g, weight: 20, label: "idiota" },
  { pattern: /\bestupido\b/g, weight: 20, label: "estupido" },
  { pattern: /\bestupida\b/g, weight: 20, label: "estupida" },
  { pattern: /\bimbecil\b/g, weight: 20, label: "imbecil" },
  { pattern: /\bconcha\b/g, weight: 20, label: "concha_aislada" },
  { pattern: /\bgarca\b/g, weight: 20, label: "garca" },
  { pattern: /\bgarcas\b/g, weight: 20, label: "garcas" },
  { pattern: /\bladron\b/g, weight: 20, label: "ladron" },
  { pattern: /\bladrones\b/g, weight: 20, label: "ladrones" },
  { pattern: /\bchorro\b/g, weight: 20, label: "chorro" },
  { pattern: /\bchorros\b/g, weight: 20, label: "chorros" },
  { pattern: /\bestafador\b/g, weight: 20, label: "estafador" },
  { pattern: /\bestafadora\b/g, weight: 20, label: "estafadora" },
  { pattern: /\bestafadores\b/g, weight: 20, label: "estafadores" },
  { pattern: /\bchoreo\b/g, weight: 20, label: "choreo" },
  { pattern: /\binutil\b/g, weight: 20, label: "inutil" },
  { pattern: /\bbasura\b/g, weight: 20, label: "basura" },
  { pattern: /https?\s*:?\s*\/?\s*\/?/g, weight: 20, label: "link_externo" },
  { pattern: /\b[\w.%+-]+\s*@\s*[\w.-]+\s*\.\s*[a-z]{2,}\b/g, weight: 20, label: "email" },
  { pattern: /\b(?:\+?54\s*)?(?:9\s*)?(?:11|15)?\s*\d{4}\s*\d{4}\b/g, weight: 20, label: "telefono" },
];

// weight 8 -> needs 2+ matches (score 16) to reach OpenAI threshold of 15.
export const MILD: WordEntry[] = [
  { pattern: /\bmierda\b/g, weight: 8, label: "mierda" },
  { pattern: /\bputa\b/g, weight: 8, label: "puta_aislada" },
  { pattern: /\bculo\b/g, weight: 8, label: "culo" },
  { pattern: /\bpija\b/g, weight: 8, label: "pija" },
  { pattern: /\bporqueria\b/g, weight: 8, label: "porqueria" },
  { pattern: /\bmalisimo\b/g, weight: 8, label: "malisimo" },
  { pattern: /\bdesastre\b/g, weight: 8, label: "desastre" },
  { pattern: /\basco\b/g, weight: 8, label: "asco" },
  { pattern: /cara\s+de\s+culo/g, weight: 8, label: "cara_de_culo" },
];
