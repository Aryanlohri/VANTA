const fs = require('fs');

// 1. Create client/src/lib/useDebounce.ts
const debounceHook = `
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}
`;
fs.writeFileSync('client/src/lib/useDebounce.ts', debounceHook);

// 2. Fix search in reviews/page.tsx
let rev = fs.readFileSync('client/src/app/dashboard/reviews/page.tsx', 'utf8');

if (!rev.includes('useDebounce')) {
  rev = rev.replace("import { useEffect, useState, useRef } from 'react';", "import { useEffect, useState, useRef, useMemo } from 'react';\nimport { useDebounce } from '@/lib/useDebounce';");
  
  // Replace the search state management
  const searchStart = "const search = searchParams.get('q') || '';";
  const newSearch = `const initialSearch = searchParams.get('q') || '';
  const [localSearch, setLocalSearch] = useState(initialSearch);
  const debouncedSearch = useDebounce(localSearch, 200);

  useEffect(() => {
    setFilterAndSearch(filter, debouncedSearch);
  }, [debouncedSearch]);`;
  
  rev = rev.replace(searchStart, newSearch);
  
  // Update the input to use localSearch
  rev = rev.replace(/value=\{search\}/, 'value={localSearch}');
  rev = rev.replace(/onChange=\{\(e\) => setFilterAndSearch\(filter, e\.target\.value\)\}/, 'onChange={(e) => setLocalSearch(e.target.value)}');
  
  // Also memoize filtered
  rev = rev.replace(/const filtered = reviews\.filter/, 'const filtered = useMemo(() => reviews.filter');
  rev = rev.replace(/return matchesStatus && matchesSearch;\n  \}\);/, 'return matchesStatus && matchesSearch;\n  }), [reviews, filter, search]);');
  
  fs.writeFileSync('client/src/app/dashboard/reviews/page.tsx', rev);
}
