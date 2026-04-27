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
    summary: `[MOCK] Code review completed for ${language || 'unknown'} file using Gemini 2.1 Pro.`,
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
const responseSchema = {
  description: "Code review response",
  type: SchemaType.OBJECT,
  properties: {
    overall_score: {
      type: SchemaType.NUMBER,
      description: "Overall quality score from 0-100",
    },
    summary: {
      type: SchemaType.STRING,
      description: "Brief summary of the review",
    },
    issues: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          line: { type: SchemaType.NUMBER },
          type: { 
            type: SchemaType.STRING,
            enum: ["bug", "security", "performance", "style", "best_practice"]
          },
          severity: { 
            type: SchemaType.STRING,
            enum: ["critical", "major", "minor", "info"]
          },
          message: { type: SchemaType.STRING },
          suggestion: { type: SchemaType.STRING },
          improved_code: { type: SchemaType.STRING },
        },
        required: ["line", "type", "severity", "message", "suggestion"]
      },
    },
    positives: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    },
    overall_suggestions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    }
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
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    const projectId = process.env.VERTEX_PROJECT_ID;
    const location = process.env.VERTEX_LOCATION || 'us-central1';

    // Initialize the Generative AI client
    // If Project ID is provided, we log that we are using Vertex-specific routing
    if (projectId) {
      logger.info({ projectId, location }, 'Initializing Vertex AI Gemini Client');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.1-pro',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const hints = getLanguageHints(language);
    const prompt = buildReviewPrompt(language, code, hints);

    logger.info({ 
      language, 
      codeLength: code.length,
      usingVertex: !!projectId
    }, 'Sending code to Gemini 2.1 Pro');

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const parsed: AIReviewResponse = JSON.parse(text);

      // Validate and clamp score
      parsed.overall_score = Math.max(0, Math.min(100, Math.floor(parsed.overall_score)));

      logger.info({
        reviewId: parsed.overall_score,
        issueCount: parsed.issues.length
      }, 'Gemini response received and parsed');

      return parsed;
    } catch (error: any) {
      logger.error({ err: error }, 'Gemini API Error');
      throw error;
    }
  },
};
