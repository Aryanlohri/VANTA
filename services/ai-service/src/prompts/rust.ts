// ============================================
// AI Prompts — Rust
// ============================================

export const RUST_HINTS = `
- Enforce idiomatic error handling using Result and Option. Strongly discourage the use of .unwrap() or .expect() unless mathematically proven safe.
- Verify ownership and borrowing rules. Suggest using references (&T, &mut T) over cloning (.clone()) where possible to save memory.
- Check for idiomatic use of iterators and closures instead of manual loops.
- Ensure lifetimes are used appropriately and elided when possible.
- Suggest utilizing the new type pattern for type safety.
- Encourage proper use of pattern matching (match, if let) for exhaustive checking.
`;
