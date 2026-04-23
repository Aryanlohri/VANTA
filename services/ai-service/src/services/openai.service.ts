import OpenAI from 'openai';
import { createLogger } from '@aicr/shared';
import type { AIReviewResponse } from '@aicr/shared';
import { buildReviewPrompt } from '../prompts/base';
import { JAVASCRIPT_HINTS } from '../prompts/javascript';
import { PYTHON_HINTS } from '../prompts/python';
import { JAVA_HINTS } from '../prompts/java';
import { GENERAL_HINTS } from '../prompts/general';

const logger = createLogger('ai-service:openai');

const LANGUAGE_HINTS: Record<string, string> = {
  javascript: JAVASCRIPT_HINTS,
  typescript: JAVASCRIPT_HINTS,
  python: PYTHON_HINTS,
  java: JAVA_HINTS,
};

function getLanguageHints(language: string | null): string {
  if (!language) return GENERAL_HINTS;
  return LANGUAGE_HINTS[language.toLowerCase()] || GENERAL_HINTS;
}

/** Mock AI response for development without API key */
function generateMockResponse(code: string, language: string | null): AIReviewResponse {
  const lines = code.split('\n');
  const lineCount = lines.length;

  return {
    overall_score: Math.floor(Math.random() * 30) + 65,
    summary: `Code review completed for ${language || 'unknown'} file with ${lineCount} lines. Several areas for improvement identified.`,
    issues: [
      {
        line: Math.min(3, lineCount),
        type: 'style' as any,
        severity: 'minor' as any,
        message: 'Consider adding more descriptive variable names for better readability',
        suggestion: 'Use meaningful names that describe the purpose of the variable',
        improved_code: '// Use descriptive names like `userCount` instead of `n`',
      },
      {
        line: Math.min(8, lineCount),
        type: 'best_practice' as any,
        severity: 'minor' as any,
        message: 'Missing error handling for potential edge cases',
        suggestion: 'Add proper error handling with try-catch or input validation',
        improved_code: 'try {\n  // existing code\n} catch (error) {\n  console.error("Operation failed:", error);\n}',
      },
      {
        line: Math.min(15, lineCount),
        type: 'performance' as any,
        severity: 'info' as any,
        message: 'This operation could be optimized for better performance',
        suggestion: 'Consider caching the result or using a more efficient algorithm',
      },
    ],
    positives: [
      'Good overall code structure and organization',
      'Consistent formatting and indentation',
    ],
    overall_suggestions: [
      'Add comprehensive error handling throughout',
      'Consider adding JSDoc/docstring comments for public functions',
    ],
  };
}

export const OpenAIService = {
  async reviewCode(code: string, language: string | null): Promise<AIReviewResponse> {
    const isMockMode = process.env.AI_MOCK_MODE === 'true';

    if (isMockMode) {
      logger.info('Using mock AI response (AI_MOCK_MODE=true)');
      // Simulate processing time
      await new Promise((r) => setTimeout(r, 1500 + Math.random() * 2000));
      return generateMockResponse(code, language);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

    const client = new OpenAI({ apiKey });
    const hints = getLanguageHints(language);
    const prompt = buildReviewPrompt(language, code, hints);

    logger.info({ language, codeLength: code.length }, 'Sending code to GPT-4o');

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a code review assistant. Always respond with valid JSON only. No markdown, no explanation.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from OpenAI');

    logger.info({
      tokensUsed: response.usage?.total_tokens,
      promptTokens: response.usage?.prompt_tokens,
      completionTokens: response.usage?.completion_tokens,
    }, 'OpenAI response received');

    const parsed: AIReviewResponse = JSON.parse(content);

    // Validate required fields
    if (typeof parsed.overall_score !== 'number' || !Array.isArray(parsed.issues)) {
      throw new Error('Invalid AI response structure');
    }

    // Clamp score
    parsed.overall_score = Math.max(0, Math.min(100, parsed.overall_score));

    return parsed;
  },
};
