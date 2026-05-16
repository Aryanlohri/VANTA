// ============================================
// AI Prompts — Go
// ============================================

export const GO_HINTS = `
- Enforce idiomatic Go error handling (if err != null). Do not ignore errors.
- Ensure goroutines are managed safely (e.g., using WaitGroups, channels, or contexts to prevent leaks).
- Check that 'defer' is used correctly for resource cleanup (files, locks, connections).
- Suggest returning pointers for large structs to avoid unnecessary copying, but prefer values for small structs.
- Enforce standard Go formatting and naming conventions (camelCase, descriptive receiver names).
- Look out for slice/map capacity pre-allocation where performance matters.
`;
