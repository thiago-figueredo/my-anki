import { deepseek } from "@ai-sdk/deepseek";
import { generateObject } from "ai";
import { z } from "zod";
import { Rating } from "../types";

const evaluationSchema = z.object({
  score: z.object({
    value: z.union([
      z.literal(Rating.Again),
      z.literal(Rating.Hard),
      z.literal(Rating.Good),
      z.literal(Rating.Easy),
    ]),
    label: z.enum(["Again", "Hard", "Good", "Easy"]),
  }),
  correctness: z.enum([
    "incorrect",
    "partially_correct",
    "mostly_correct",
    "correct",
  ]),
  feedback: z.object({
    summary: z.string(),
    what_was_correct: z.array(z.string()),
    issues: z.array(z.string()),
    missing_key_points: z.array(z.string()),
    suggested_improvement: z.string(),
  }),
  confidence_assessment: z.object({
    perceived_confidence: z.enum(["low", "medium", "high"]),
    reasoning: z.string(),
  }),
});

export type EvaluationResult = z.infer<typeof evaluationSchema>;

type EvaluateResponseProps = {
  question: string,
  expectedAnswer: string,
  learnerResponse: string,
  model: string
  abortSignal?: AbortSignal
}

export class AiTutorService {
  static async evaluateResponse({
    question,
    expectedAnswer,
    learnerResponse,
    model,
    abortSignal
  }: EvaluateResponseProps): Promise<EvaluationResult> {
    const { object } = await generateObject({
      model: deepseek(model),
      abortSignal,
      schema: evaluationSchema,
      prompt: `
You are an expert flashcard evaluator. Your task is to evaluate a learner’s answer to a flashcard question using Anki-style grading (Again, Hard, Good, Easy).

# Inputs:
- Question: ${question}
- Expected Answer: ${expectedAnswer}
- Learner's Response: ${learnerResponse}

# Grading Scale:
1. Again (1): Completely wrong, major misconception, or failed recall.
2. Hard (2): Partially correct, significant omissions, or hesitant recall.
3. Good (3): Correct overall, minor omissions or wording issues allowed.
4. Easy (4): Fully correct, clear, precise, and complete.

# Evaluation Rules:
- Prioritize conceptual correctness over exact wording.
- Accept synonyms and paraphrases.
- Ignore grammar/spelling unless it changes meaning.
- Penalize hallucinations or contradictions.
- For lists, evaluate completeness.
- Be strict on technical/scientific precision where appropriate.
- Reward concise accurate answers.
      `,
    });

    return object;
  }
}
