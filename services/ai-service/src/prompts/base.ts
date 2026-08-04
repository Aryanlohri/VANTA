// ============================================
// AI Prompts — Base Template
// ============================================

import type { SupportedLanguage } from '@aicr/shared';

/**
 * Build the complete review prompt for a given language and code.
 */
export function buildReviewPrompt(language: string | null, code: string, languageHints?: string, mode?: string): string {
  const lang = language || 'general';
  
  let modeRules = '';
  let scoring = 'correctness (30%), security (25%), performance (20%), maintainability (15%), style (10%)';

  switch (mode) {
    case 'security':
      modeRules = 'MODE: STRICT SECURITY AUDIT. Hunt for vulnerabilities (SQLi, XSS, IDOR, hardcoded secrets). Ignore style/formatting.';
      scoring = 'security (80%), correctness (20%)';
      break;
    case 'performance':
      modeRules = 'MODE: PERFORMANCE OPTIMIZATION. Find algorithmic bottlenecks, memory leaks, unindexed queries. Ignore style.';
      scoring = 'performance (70%), correctness (30%)';
      break;
    case 'style':
      modeRules = 'MODE: STYLE ENFORCER. Strictly enforce naming conventions, SOLID principles, and clean architecture.';
      scoring = 'style (70%), maintainability (30%)';
      break;
    default:
      modeRules = 'MODE: STANDARD REVIEW.';
  }

  return `Review this ${lang} code. Output valid JSON exactly matching this structure:
{"overall_score":<0-100>,"summary":"<1 sentence>","issues":[{"line":<num>,"type":"<bug|security|performance|style|best_practice>","severity":"<critical|major|minor|info>","message":"<desc>","suggestion":"<fix>","improved_code":"<snippet>"}],"positives":["<item>"],"overall_suggestions":["<item>"]}

RULES:
1. ONLY JSON. No markdown fences.
2. Real line numbers.
3. Specific suggestions.
4. Score based on: ${scoring}.
5. 'improved_code' must be minimal snippet.
6. 'type' field MUST be one of exactly these 5 values: bug, security, performance, style, best_practice. No other values are permitted.
7. 'severity' field MUST be one of exactly these 4 values: critical, major, minor, info. No other values are permitted.
${modeRules}
${languageHints ? `HINTS:\n${languageHints}` : ''}

CODE:
\`\`\`${lang}
${code}
\`\`\``;
}
