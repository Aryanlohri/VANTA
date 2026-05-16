// ============================================
// AI Prompts — TypeScript
// ============================================

export const TYPESCRIPT_HINTS = `
- Prefer strict typing over 'any' or 'unknown'.
- Suggest interfaces over type aliases for object shapes where appropriate.
- Check for proper null/undefined handling (e.g., optional chaining, nullish coalescing).
- Ensure async functions are properly typed with Promise<T>.
- Suggest using utility types (Pick, Omit, Partial) where they simplify the code.
- Enforce strict adherence to generic constraints if applicable.
`;
