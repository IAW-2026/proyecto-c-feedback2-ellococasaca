export interface WordEntry {
  pattern: RegExp;
  weight: number;
  label: string;
}

// Escala de pesos: 1 | 2 | 3
//   weight 1 -> score 1 (AI). Necesita 3 ocurrencias para llegar a auto-ban.
//   weight 2 -> score 2 (AI). Con 2 ocurrencias llega a auto-ban.
//   weight 3 -> score 3 (auto-ban inmediato). Links, amenazas, insultos graves.

// weight 3 — ban inmediato
export const SEVERE: WordEntry[] = [
  // insultos graves / groserías compuestas
  { pattern: /hijo\s+de\s+puta/g, weight: 3, label: "hijo_de_puta" },
  { pattern: /hija\s+de\s+puta/g, weight: 3, label: "hija_de_puta" },
  { pattern: /\bh\s*d\s*p\b/g, weight: 3, label: "hdp_obfuscado" },
  { pattern: /\bhdp\b/g, weight: 3, label: "hdp" },
  { pattern: /concha\s+(de\s+tu|tu)\s+madre/g, weight: 3, label: "ctm" },
  { pattern: /la\s+(re\s*)?concha\b/g, weight: 3, label: "la_concha" },
  { pattern: /puta\s+madre/g, weight: 3, label: "puta_madre" },
  { pattern: /\bnegro\s+de\s+mierda\b/g, weight: 3, label: "odio_identidad" },
  // amenazas de muerte / violencia
  { pattern: /ojala\s+(te\s+)?mueras/g, weight: 3, label: "deseo_muerte" },
  { pattern: /te\s+voy\s+a\s+matar/g, weight: 3, label: "amenaza_muerte" },
  { pattern: /\bte\s+mato\b/g, weight: 3, label: "te_mato" },
  { pattern: /cagar(te|lo|la)?\s+a\s+trompadas/g, weight: 3, label: "amenaza_trompadas" },
  { pattern: /cagarte\s+a\s+palos/g, weight: 3, label: "amenaza_golpes" },
  // spam / phishing
  { pattern: /https?\s*:?\s*\/?\s*\/?/g, weight: 3, label: "link_externo" },
  { pattern: /\b[\w.%+-]+\s*@\s*[\w.-]+\s*\.\s*[a-z]{2,}\b/g, weight: 3, label: "email" },
  // Argentina — insultos graves
  { pattern: /\bsorete\b/g, weight: 3, label: "sorete" },
  { pattern: /\bsoretes\b/g, weight: 3, label: "soretes" },
  { pattern: /la\s+puta\s+que\s+te\s+pario/g, weight: 3, label: "puta_que_te_pario" },
  { pattern: /la\s+puta\s+que\s+lo\s+pario/g, weight: 3, label: "puta_que_lo_pario" },
  { pattern: /\bmogolico\b/g, weight: 3, label: "mogolico" },
  { pattern: /\bmogolica\b/g, weight: 3, label: "mogolica" },
];

// weight 2 — 1 ocurrencia -> AI, 2 ocurrencias -> auto-ban
export const MODERATE: WordEntry[] = [
  { pattern: /\bboludo\b/g, weight: 2, label: "boludo" },
  { pattern: /\bboluda\b/g, weight: 2, label: "boluda" },
  { pattern: /\bbolud[oa]s\b/g, weight: 2, label: "boludos" },
  { pattern: /\bpelotudo\b/g, weight: 2, label: "pelotudo" },
  { pattern: /\bpelotuda\b/g, weight: 2, label: "pelotuda" },
  { pattern: /\bpelotud[oa]s\b/g, weight: 2, label: "pelotudos" },
  { pattern: /\bforro\b/g, weight: 2, label: "forro" },
  { pattern: /\bforra\b/g, weight: 2, label: "forra" },
  { pattern: /\bforr[oa]s\b/g, weight: 2, label: "forros" },
  { pattern: /\bidiota\b/g, weight: 2, label: "idiota" },
  { pattern: /\bestupido\b/g, weight: 2, label: "estupido" },
  { pattern: /\bestupida\b/g, weight: 2, label: "estupida" },
  { pattern: /\bimbecil\b/g, weight: 2, label: "imbecil" },
  { pattern: /\bconcha\b/g, weight: 2, label: "concha_aislada" },
  { pattern: /\bgarca\b/g, weight: 2, label: "garca" },
  { pattern: /\bgarcas\b/g, weight: 2, label: "garcas" },
  { pattern: /\bladron\b/g, weight: 2, label: "ladron" },
  { pattern: /\bladrones\b/g, weight: 2, label: "ladrones" },
  { pattern: /\bchorro\b/g, weight: 2, label: "chorro" },
  { pattern: /\bchorros\b/g, weight: 2, label: "chorros" },
  { pattern: /\bestafador\b/g, weight: 2, label: "estafador" },
  { pattern: /\bestafadora\b/g, weight: 2, label: "estafadora" },
  { pattern: /\bestafadores\b/g, weight: 2, label: "estafadores" },
  { pattern: /\bchoreo\b/g, weight: 2, label: "choreo" },
  { pattern: /\binutil\b/g, weight: 2, label: "inutil" },
  { pattern: /\bbasura\b/g, weight: 2, label: "basura" },
  // Argentina — insultos moderados
  { pattern: /\bgil\b/g, weight: 2, label: "gil" },
  { pattern: /\bgiles\b/g, weight: 2, label: "giles" },
  { pattern: /\btarado\b/g, weight: 2, label: "tarado" },
  { pattern: /\btarada\b/g, weight: 2, label: "tarada" },
  { pattern: /\btarados\b/g, weight: 2, label: "tarados" },
  { pattern: /\bsalame\b/g, weight: 2, label: "salame" },
  { pattern: /\bpajero\b/g, weight: 2, label: "pajero" },
  { pattern: /\bpajera\b/g, weight: 2, label: "pajera" },
  { pattern: /\bpajeros\b/g, weight: 2, label: "pajeros" },
  { pattern: /\bchanta\b/g, weight: 2, label: "chanta" },
  { pattern: /\bchantas\b/g, weight: 2, label: "chantas" },
  { pattern: /\bcagon\b/g, weight: 2, label: "cagon" },
  { pattern: /\bcagones\b/g, weight: 2, label: "cagones" },
  { pattern: /\bvendido\b/g, weight: 2, label: "vendido" },
  { pattern: /\bvendidos\b/g, weight: 2, label: "vendidos" },
  { pattern: /\botario\b/g, weight: 2, label: "otario" },
  { pattern: /\botarios\b/g, weight: 2, label: "otarios" },
  { pattern: /\bcaradura\b/g, weight: 2, label: "caradura" },
  { pattern: /\bcaraduras\b/g, weight: 2, label: "caraduras" },
];

// weight 1 — siempre va a AI. Necesita 3 ocurrencias para auto-ban.
export const FLAG: WordEntry[] = [
  { pattern: /\bmierda\b/g, weight: 1, label: "mierda" },
  { pattern: /\bputa\b/g, weight: 1, label: "puta_aislada" },
  { pattern: /\bculo\b/g, weight: 1, label: "culo" },
  { pattern: /\bpija\b/g, weight: 1, label: "pija" },
  { pattern: /\bporqueria\b/g, weight: 1, label: "porqueria" },
  { pattern: /\bmalisimo\b/g, weight: 1, label: "malisimo" },
  { pattern: /\bdesastre\b/g, weight: 1, label: "desastre" },
  { pattern: /\basco\b/g, weight: 1, label: "asco" },
  { pattern: /cara\s+de\s+culo/g, weight: 1, label: "cara_de_culo" },
  { pattern: /\b(?:\+?54\s*)?(?:9\s*)?(?:11|15)?\s*\d{4}\s*\d{4}\b/g, weight: 1, label: "telefono" },
  // Argentina — lenguaje coloquial leve
  { pattern: /pecho\s+frio/g, weight: 1, label: "pecho_frio" },
  { pattern: /muerto\s+de\s+hambre/g, weight: 1, label: "muerto_de_hambre" },
  { pattern: /\bcagada\b/g, weight: 1, label: "cagada" },
];
