// ============================================
// AI Prompts — Base Template
// ============================================

import type { SupportedLanguage } from '@aicr/shared';

/**
 * Build the complete review prompt for a given language and code.
 */
export function buildReviewPrompt(language: string | null, code: string, languageHints?: string): string {
  const lang = language || 'general';

  return `You are an expert senior software engineer and code reviewer with 20+ years of experience.
You specialize in writing clean, maintainable, secure, and performant code.

Review the following ${lang} code thoroughly and return a JSON response with EXACTLY this structure:

{
  "overall_score": <number 0-100>,
  "summary": "<Brief 1-2 sentence overview of code quality>",
  "issues": [
    {
      "line": <line_number>,
      "type": "<bug|security|performance|style|best_practice>",
      "severity": "<critical|major|minor|info>",
      "message": "<Clear description of the issue>",
      "suggestion": "<How to fix it>",
      "improved_code": "<The corrected code snippet for that specific section>"
    }
  ],
  "positives": ["<What was done well — list 1-3 items>"],
  "overall_suggestions": ["<High level improvements — list 1-3 items>"]
}

IMPORTANT RULES:
1. Return ONLY valid JSON, no markdown, no code fences, no explanation
2. Line numbers must correspond to actual lines in the provided code
3. Be specific — reference variable names, function names, actual code
4. Every issue MUST have a concrete suggestion for improvement
5. Score reflects: correctness (30%), security (25%), performance (20%), maintainability (15%), style (10%)
6. If the code is excellent, still provide at least 1-2 minor suggestions
7. "improved_code" should be a minimal snippet showing the fix, not the entire file
${languageHints ? `\nLanguage-specific guidelines:\n${languageHints}` : ''}

CODE TO REVIEW:
\`\`\`${lang}
${code}
\`\`\``;
}
