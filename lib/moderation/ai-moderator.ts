import Anthropic from "@anthropic-ai/sdk";

export type AiVerdict = "APPROVED" | "REJECTED" | "MANUAL_REVIEW";

export interface AiModerationContext {
  productId: string;
  orderId: string;
  score: number;
  matchedLabels: string[];
}

const SYSTEM_PROMPT = `Sos un moderador de contenido para una plataforma de reseñas de productos.
Tu tarea es clasificar el comentario del usuario y responder ÚNICAMENTE con una de estas tres palabras exactas:
- APPROVED: el comentario es apropiado y puede publicarse
- REJECTED: el comentario contiene contenido claramente inapropiado (odio, acoso, amenazas, contenido sexual, spam agresivo)
- MANUAL_REVIEW: el comentario es ambiguo o moderadamente cuestionable y requiere revisión humana

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
  void context;

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
      messages: [{ role: "user", content: comment }],
    });

    const block = message.content[0];
    if (!block || block.type !== "text") return "MANUAL_REVIEW";

    return parseVerdict(block.text);
  } catch (err) {
    console.error("[moderation] Error al consultar Claude:", err);
    return "MANUAL_REVIEW";
  }
}
