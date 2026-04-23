// ============================================
// Shared Constants
// AI Code Review Platform
// ============================================

/** Service port mappings */
export const SERVICE_PORTS = {
  API_GATEWAY: 3000,
  AUTH_SERVICE: 3001,
  REPO_SERVICE: 3002,
  REVIEW_SERVICE: 3003,
  AI_SERVICE: 3004,
} as const;

/** BullMQ queue names */
export const QUEUE_NAMES = {
  REVIEW_PROCESSING: 'review-processing',
  REVIEW_RESULTS: 'review-results',
  NOTIFICATIONS: 'notifications',
} as const;

/** WebSocket event names */
export const WS_EVENTS = {
  // Client → Server
  JOIN_REVIEW: 'review:join',
  LEAVE_REVIEW: 'review:leave',

  // Server → Client
  REVIEW_STATUS: 'review:status',
  REVIEW_PROGRESS: 'review:progress',
  REVIEW_COMPLETED: 'review:completed',
  REVIEW_FAILED: 'review:failed',
  FILE_REVIEWED: 'review:file-complete',
} as const;

/** API error codes */
export const ERROR_CODES = {
  // Auth
  UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  OAUTH_FAILED: 'AUTH_OAUTH_FAILED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_FIELD: 'MISSING_FIELD',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // Rate limiting
  RATE_LIMITED: 'RATE_LIMITED',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // AI
  AI_PROCESSING_FAILED: 'AI_PROCESSING_FAILED',
  AI_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',
} as const;

/** Supported languages for AI review */
export const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'go',
  'rust',
  'c',
  'cpp',
  'csharp',
  'ruby',
  'php',
  'swift',
  'kotlin',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** File extension to language mapping */
export const EXTENSION_TO_LANGUAGE: Record<string, SupportedLanguage | 'unknown'> = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.java': 'java',
  '.go': 'go',
  '.rs': 'rust',
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.hpp': 'cpp',
  '.cs': 'csharp',
  '.rb': 'ruby',
  '.php': 'php',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.kts': 'kotlin',
};

/** Max file size for review (in bytes) — 500KB */
export const MAX_FILE_SIZE = 500 * 1024;

/** Max files per review */
export const MAX_FILES_PER_REVIEW = 20;

/** Max code lines per file for review */
export const MAX_LINES_PER_FILE = 5000;
