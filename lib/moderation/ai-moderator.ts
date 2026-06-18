export type AiVerdict = "APPROVED" | "REJECTED" | "MANUAL_REVIEW";

export interface AiModerationContext {
  productId: string;
  orderId: string;
  score: number;
  matchedLabels: string[];
}

interface OpenAIModerationResult {
  flagged?: boolean;
  categories?: Record<string, boolean>;
  category_scores?: Record<string, number>;
}

interface OpenAIModerationResponse {
  results?: OpenAIModerationResult[];
  error?: { message?: string };
}

const OPENAI_MODERATION_MODEL = "omni-moderation-latest";

function getFlaggedCategories(result: OpenAIModerationResult): string[] {
  return Object.entries(result.categories ?? {})
    .filter(([, flagged]) => flagged)
    .map(([category]) => category);
}

function shouldReject(result: OpenAIModerationResult): boolean {
  const flaggedCategories = getFlaggedCategories(result);
  const scores = result.category_scores ?? {};
  const hasSevereCategory = flaggedCategories.some((category) =>
    [
      "hate/threatening",
      "harassment/threatening",
      "self-harm/instructions",
      "sexual/minors",
      "violence/graphic",
    ].includes(category),
  );

  return hasSevereCategory || Object.values(scores).some((score) => score >= 0.85);
}

export async function consultAI(
  comment: string,
  context: AiModerationContext,
): Promise<AiVerdict> {
  void context;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[moderation] OPENAI_API_KEY no configurada; derivando a MANUAL_REVIEW");
    return "MANUAL_REVIEW";
  }

  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODERATION_MODEL,
        input: comment,
      }),
    });

    const data = (await response.json()) as OpenAIModerationResponse;

    if (!response.ok) {
      throw new Error(data.error?.message ?? `OpenAI moderation failed with ${response.status}`);
    }

    const result = data.results?.[0];
    if (!result) return "MANUAL_REVIEW";

    if (!result.flagged) return "APPROVED";

    return shouldReject(result) ? "REJECTED" : "MANUAL_REVIEW";
  } catch (err) {
    console.error("[moderation] Error al consultar OpenAI:", err);
  }

  return "MANUAL_REVIEW";
}
