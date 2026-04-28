import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { createLogger } from '@aicr/shared';
import type { AIReviewResponse } from '@aicr/shared';
import { buildReviewPrompt } from '../prompts/base';
import { JAVASCRIPT_HINTS } from '../prompts/javascript';
import { PYTHON_HINTS } from '../prompts/python';
import { JAVA_HINTS } from '../prompts/java';
import { GENERAL_HINTS } from '../prompts/general';

const logger = createLogger('ai-service:gemini');

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
    summary: `[MOCK] Code review completed for ${language || 'unknown'} file using Gemini.`,
    issues: [
      {
        line: Math.min(3, lineCount),
        type: 'style' as any,
        severity: 'minor' as any,
        message: 'Consider adding more descriptive variable names for better readability',
        suggestion: 'Use meaningful names that describe the purpose of the variable',
        improved_code: '// Use descriptive names like `userCount` instead of `n`',
      },
    ],
    positives: [
      'Good overall code structure and organization',
      'Consistent formatting and indentation',
    ],
    overall_suggestions: [
      'Add comprehensive error handling throughout',
    ],
  };
}

// Define the schema for structured output
const responseSchema: any = {
  type: SchemaType.OBJECT,
  properties: {
    overall_score: { type: SchemaType.NUMBER },
    summary: { type: SchemaType.STRING },
    issues: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          line: { type: SchemaType.NUMBER },
          type: { type: SchemaType.STRING },
          severity: { type: SchemaType.STRING },
          message: { type: SchemaType.STRING },
          suggestion: { type: SchemaType.STRING },
          improved_code: { type: SchemaType.STRING },
        },
        required: ["line", "type", "severity", "message", "suggestion"]
      },
    },
    positives: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    overall_suggestions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
  },
  required: ["overall_score", "summary", "issues", "positives", "overall_suggestions"]
};

export const GeminiService = {
  async reviewCode(code: string, language: string | null): Promise<AIReviewResponse> {
    const isMockMode = process.env.AI_MOCK_MODE === 'true';

    if (isMockMode) {
      logger.info('Using mock AI response (AI_MOCK_MODE=true)');
      await new Promise((r) => setTimeout(r, 1000));
      return generateMockResponse(code, language);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured in environment');

    // Responsible validation: AI Studio keys should start with AIza
    if (!apiKey.startsWith('AIza')) {
      logger.warn('GEMINI_API_KEY does not appear to be a valid Google AI Studio key (should start with AIza)');
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
    
    try {
      const hints = getLanguageHints(language);
      const prompt = buildReviewPrompt(language, code, hints);

      logger.info({ modelName }, 'Calling Google AI Studio Gemini API');
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      });

      const result = await model.generateContent(prompt);
      const resultText = result.response.text();

      const parsed: AIReviewResponse = JSON.parse(resultText);
      
      // Data integrity: ensure score is an integer between 0-100
      parsed.overall_score = Math.max(0, Math.min(100, Math.floor(parsed.overall_score || 0)));

      logger.info({
        score: parsed.overall_score,
        issues: parsed.issues?.length
      }, 'Gemini review completed successfully');

      return parsed;
    } catch (error: any) {
      logger.error({ err: error.message }, 'Gemini AI Studio Error');
      throw new Error(`AI Review failed: ${error.message}`);
    }
  },
};



