import { scoreComment } from "./scorer";
import { consultAI } from "./ai-moderator";

export type ModerationOutcome = "APPROVED" | "REJECTED" | "MANUAL_REVIEW";
export type ModerationMethod = "local" | "ai";

export interface ModerationResult {
  outcome: ModerationOutcome;
  method: ModerationMethod;
  score: number;
  matchedLabels: string[];
}

const THRESHOLD_REJECT = 50; // score ≥ 50 → auto-reject locally
const THRESHOLD_AI = 15;     // score 15–49 → consult AI; score < 15 → auto-approve locally

export async function moderateComment(
  comment: string,
  context: { productId: string; orderId: string },
): Promise<ModerationResult> {
  const { score, matches } = scoreComment(comment);
  const matchedLabels = matches.map((m) => m.label);

  if (score >= THRESHOLD_REJECT) {
    return { outcome: "REJECTED", method: "local", score, matchedLabels };
  }

  if (score < THRESHOLD_AI) {
    return { outcome: "APPROVED", method: "local", score, matchedLabels };
  }

  // Dudoso (15 ≤ score < 50): consult AI for final decision
  const aiVerdict = await consultAI(comment, {
    productId: context.productId,
    orderId: context.orderId,
    score,
    matchedLabels,
  });

  return {
    outcome: aiVerdict,
    method: "ai",
    score,
    matchedLabels,
  };
}
