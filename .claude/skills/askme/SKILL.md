---
name: askme
description: "Extract implicit questions from Claude's last response as AskUserQuestion prompts. Use when Claude lists options or trade-offs but doesn't ask."
disable-model-invocation: true
allowed-tools: AskUserQuestion
---

# Ask Me

Turn implicit decision points from your most recent response into explicit questions using `AskUserQuestion`.

## Instructions

1. Re-read your **last assistant message** in this conversation (the one immediately before the user said `/askme`).

2. Extract every implicit question, decision point, trade-off, or ambiguity. Look for:
   - Alternatives presented side-by-side ("we could do X or Y")
   - Trade-offs mentioned ("this is simpler but less flexible")
   - Assumptions stated without confirmation ("I'll assume we want…")
   - Open items or TODOs ("we'd need to decide…")
   - Conditional plans ("if you want X, then… otherwise…")
   - Anything where the user's preference isn't yet known

3. Group related points into **1–4 questions** (the `AskUserQuestion` limit). If there are more than 4 decision points, prioritize the ones that block progress — the ones you need answered before you can continue.

4. For each question:
   - Write a clear, specific question ending with `?`
   - Provide 2–4 concrete options derived from what you said. Each option should have a short `label` and a `description` that captures the trade-off or implication.
   - Set `multiSelect: true` only when choices are genuinely non-exclusive.
   - Use a short `header` (max 12 chars) as a category tag.

5. Call `AskUserQuestion` with all questions in a single invocation.

## Rules

- Do NOT invent questions unrelated to your last response. Every question must trace back to something you actually said.
- Do NOT repeat information the user already confirmed earlier in the conversation.
- If your last response contained no implicit questions or decision points, say so plainly — do not fabricate questions.
- Prefer actionable phrasing: "Which approach should I use?" over "What do you think about…?"
