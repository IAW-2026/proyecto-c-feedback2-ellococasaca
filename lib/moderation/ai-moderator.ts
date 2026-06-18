import Anthropic from "@anthropic-ai/sdk";

export type AiVerdict = "APPROVED" | "REJECTED" | "MANUAL_REVIEW";

export interface AiModerationContext {
  productId: string;
  orderId: string;
  score: number;
  matchedLabels: string[];
}

export async function consultAI(
  comment: string,
  context: AiModerationContext,
): Promise<AiVerdict> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[moderation] ANTHROPIC_API_KEY no configurada — derivando a MANUAL_REVIEW");
    return "MANUAL_REVIEW";
  }

  const client = new Anthropic({ apiKey });

  const prompt = `Sos un moderador de reseñas de un marketplace argentino. Analizá el comentario y decidí si debe publicarse, rechazarse o ir a revisión manual.

El detector local encontró indicadores: ${context.matchedLabels.join(", ")} (puntaje: ${context.score}).

Comentario:
"""
${comment}
"""

Criterios:
- APPROVED: crítica legítima del producto/servicio, aunque use lenguaje coloquial o sea muy directa.
- REJECTED: insultos personales contra el vendedor, amenazas, acoso o contenido explícito.
- MANUAL_REVIEW: contexto genuinamente ambiguo que requiere revisión humana.

Respondé únicamente con JSON: {"verdict": "APPROVED" | "REJECTED" | "MANUAL_REVIEW"}`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 50,
      messages: [{ role: "user", content: prompt }],
    });

    const block = response.content[0];
    if (block.type !== "text") return "MANUAL_REVIEW";

    const parsed = JSON.parse(block.text.trim()) as { verdict: string };
    if (
      parsed.verdict === "APPROVED" ||
      parsed.verdict === "REJECTED" ||
      parsed.verdict === "MANUAL_REVIEW"
    ) {
      return parsed.verdict;
    }
  } catch (err) {
    console.error("[moderation] Error al consultar IA:", err);
  }

  return "MANUAL_REVIEW";
}
