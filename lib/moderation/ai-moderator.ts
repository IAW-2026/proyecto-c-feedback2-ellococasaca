import Anthropic from "@anthropic-ai/sdk";

export type AiVerdict = "APPROVED" | "REJECTED" | "MANUAL_REVIEW";

export interface AiModerationContext {
  productId: string;
  orderId: string;
  score: number;
  matchedLabels: string[];
}

const SYSTEM_PROMPT = `Sos un moderador de contenido estricto para una tienda online de remeras deportivas de fútbol, orientada a público latinoamericano (Argentina, México, Colombia, Chile, Uruguay y más).

Los usuarios dejan reseñas sobre productos (remeras, indumentaria deportiva). Tu tarea es evaluar si el comentario es apto para publicarse en la plataforma.

CONTEXTO IMPORTANTE:
- El público es latino y usa vocabulario coloquial futbolero. Eso no justifica insultos.
- Palabras como "boludo", "pelotudo", "sorete", "gil", "tarado", "cagón", "pendejo", "culero" SON insultos y deben considerarse inapropiadas aunque estén en tono de broma.
- Quejas legítimas sobre el producto (talle, calidad, entrega, demora) siempre son aceptables aunque el usuario esté enojado.
- Insultos dirigidos a la tienda, al vendedor o a terceros NO son aceptables, incluso si el producto fue malo.
- Términos racistas, homofóbicos o xenófobos propios del ambiente futbolero (ej: slurs raciales, "puto" como insulto) deben rechazarse sin excepción.
- El sistema local ya detectó indicadores sospechosos — usá ese contexto para tu decisión.

Responde ÚNICAMENTE con una de estas tres palabras exactas:
- APPROVED: la reseña expresa una opinión (positiva o negativa) sobre el producto sin insultar a nadie
- REJECTED: contiene insultos, odio, amenazas, acoso, spam o contenido claramente inapropiado
- MANUAL_REVIEW: el caso es ambiguo — podría ser lenguaje coloquial inofensivo o podría ser un insulto dependiendo del tono

Responde solo con la palabra, sin explicación.`;

function parseVerdict(text: string): AiVerdict {
  const normalized = text.trim().toUpperCase();
  if (normalized === "APPROVED") return "APPROVED";
  if (normalized === "REJECTED") return "REJECTED";
  return "MANUAL_REVIEW";
}

export async function consultAI(
  comment: string,
  context: AiModerationContext,
): Promise<AiVerdict> {
  if (!process.env.CLAUDE_API_KEY) {
    console.error("[moderation] CLAUDE_API_KEY no configurada; derivando a MANUAL_REVIEW");
    return "MANUAL_REVIEW";
  }

  try {
    const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 10,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Comentario a moderar:\n"${comment}"\n\n[Sistema local detectó: score=${context.score}, indicadores=[${context.matchedLabels.join(", ")}]]`,
        },
      ],
    });

    const block = message.content[0];
    if (!block || block.type !== "text") return "MANUAL_REVIEW";

    return parseVerdict(block.text);
  } catch (err) {
    console.error("[moderation] Error al consultar Claude:", err);
    return "MANUAL_REVIEW";
  }
}
