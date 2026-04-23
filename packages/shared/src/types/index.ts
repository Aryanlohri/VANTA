// ============================================
// Shared Type Definitions
// AI Code Review Platform
// ============================================

// ---- Enums ----

export enum ReviewStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum CommentType {
  BUG = 'bug',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  STYLE = 'style',
  BEST_PRACTICE = 'best_practice',
}

export enum Severity {
  CRITICAL = 'critical',
  MAJOR = 'major',
  MINOR = 'minor',
  INFO = 'info',
}

// ---- User ----

export interface User {
  id: string;
  github_id: number;
  username: string;
  email: string | null;
  avatar_url: string;
  access_token_encrypted: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserPublic {
  id: string;
  username: string;
  email: string | null;
  avatar_url: string;
  created_at: Date;
}

// ---- Repository ----

export interface Repository {
  id: string;
  user_id: string;
  github_repo_id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  default_branch: string;
  is_private: boolean;
  is_connected: boolean;
  webhook_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  default_branch: string;
  private: boolean;
  html_url: string;
  stargazers_count: number;
  updated_at: string;
}

export interface FileTreeItem {
  path: string;
  type: 'file' | 'dir';
  size?: number;
  sha: string;
}

export interface FileContent {
  path: string;
  content: string;
  encoding: string;
  size: number;
  sha: string;
  language: string | null;
}

// ---- Review ----

export interface Review {
  id: string;
  repo_id: string;
  user_id: string;
  title: string;
  status: ReviewStatus;
  overall_score: number | null;
  summary: string | null;
  positives: string[];
  overall_suggestions: string[];
  created_at: Date;
  updated_at: Date;
}

export interface ReviewFile {
  id: string;
  review_id: string;
  file_path: string;
  content: string;
  language: string | null;
}

export interface ReviewComment {
  id: string;
  review_file_id: string;
  line_number: number;
  type: CommentType;
  severity: Severity;
  message: string;
  suggestion: string | null;
  improved_code: string | null;
}

export interface ReviewWithFiles extends Review {
  files: (ReviewFile & { comments: ReviewComment[] })[];
  repository?: Repository;
}

// ---- AI Response ----

export interface AIReviewResponse {
  overall_score: number;
  summary: string;
  issues: AIIssue[];
  positives: string[];
  overall_suggestions: string[];
}

export interface AIIssue {
  line: number;
  type: CommentType;
  severity: Severity;
  message: string;
  suggestion: string;
  improved_code?: string;
}

// ---- API ----

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ---- Auth ----

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface JwtPayload {
  userId: string;
  username: string;
  iat?: number;
  exp?: number;
}

// ---- Queue Jobs ----

export interface ReviewJobData {
  reviewId: string;
  fileId: string;
  filePath: string;
  content: string;
  language: string | null;
}

export interface ReviewJobResult {
  reviewId: string;
  fileId: string;
  result: AIReviewResponse;
}
