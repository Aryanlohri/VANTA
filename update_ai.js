const fs = require('fs');

let base = fs.readFileSync('services/ai-service/src/prompts/base.ts', 'utf8');

if (!base.includes('customInstructions')) {
  base = base.replace(
    'export function buildReviewPrompt(language: string | null, code: string, languageHints?: string, mode?: string): string {',
    'export function buildReviewPrompt(language: string | null, code: string, languageHints?: string, mode?: string, customInstructions?: string): string {'
  );
  
  base = base.replace(
    "${languageHints ? `HINTS:\\n${languageHints}` : ''}",
    "${languageHints ? `HINTS:\\n${languageHints}` : ''}\n${customInstructions ? `CUSTOM INSTRUCTIONS:\\n${customInstructions}` : ''}"
  );
  
  fs.writeFileSync('services/ai-service/src/prompts/base.ts', base);
}

// Modify GeminiService to pass it
let gemini = fs.readFileSync('services/ai-service/src/services/gemini.service.ts', 'utf8');
if (!gemini.includes('customInstructions?: string')) {
  gemini = gemini.replace(
    'async reviewCode(code: string, language: string | null, mode?: string, reviewId?: string): Promise<AIReviewResponse> {',
    'async reviewCode(code: string, language: string | null, mode?: string, reviewId?: string, customInstructions?: string): Promise<AIReviewResponse> {'
  );
  
  gemini = gemini.replace(
    'const prompt = buildReviewPrompt(language, code, hints, mode);',
    'const prompt = buildReviewPrompt(language, code, hints, mode, customInstructions);'
  );
  
  fs.writeFileSync('services/ai-service/src/services/gemini.service.ts', gemini);
}

// Modify ai.worker.ts to pass it from job data
let worker = fs.readFileSync('services/ai-service/src/queue/ai.worker.ts', 'utf8');
if (!worker.includes('data.customInstructions')) {
  worker = worker.replace(
    'const result = await GeminiService.reviewCode(data.content, data.language, data.mode, data.reviewId);',
    'const result = await GeminiService.reviewCode(data.content, data.language, data.mode, data.reviewId, data.customInstructions);'
  );
  
  // Make sure cache key includes custom instructions too!
  worker = worker.replace(
    "${data.content}|${data.language || ''}|${data.mode || 'standard'}",
    "${data.content}|${data.language || ''}|${data.mode || 'standard'}|${data.customInstructions || ''}"
  );
  
  fs.writeFileSync('services/ai-service/src/queue/ai.worker.ts', worker);
}
