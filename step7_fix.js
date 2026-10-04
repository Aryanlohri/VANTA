const fs = require('fs');

let load = fs.readFileSync('client/src/app/dashboard/loading.tsx', 'utf8');
load = load.replace(/delay=\{0\}/g, 'delay={false}');
fs.writeFileSync('client/src/app/dashboard/loading.tsx', load);

let rev = fs.readFileSync('client/src/app/dashboard/reviews/page.tsx', 'utf8');

if (!rev.includes('useDebounce')) {
  rev = rev.replace("import { useEffect, useState, useRef } from 'react';", "import { useEffect, useState, useRef, useMemo } from 'react';\nimport { useDebounce } from '@/lib/useDebounce';");
  
  // Replace the search state management carefully
  const target = `const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || 'all';
  const search = searchParams.get('q') || '';
  const searchInputRef = useRef<HTMLInputElement>(null);`;
  
  const replacement = `const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || 'all';
  const initialSearch = searchParams.get('q') || '';
  const [localSearch, setLocalSearch] = useState(initialSearch);
  const search = useDebounce(localSearch, 200); // we call the debounced one 'search'
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setFilterAndSearch(filter, search);
  }, [search]);`;
  
  rev = rev.replace(target, replacement);
  
  // Update the input value and onChange
  rev = rev.replace(
    'value={search}\n            onChange={(e) => setFilterAndSearch(filter, e.target.value)}',
    'value={localSearch}\n            onChange={(e) => setLocalSearch(e.target.value)}'
  );
  
  // Memoize filtered
  rev = rev.replace(
    'const filtered = reviews.filter((r: any) => {',
    'const filtered = useMemo(() => reviews.filter((r: any) => {'
  );
  rev = rev.replace(
    'return matchesStatus && matchesSearch;\n  });',
    'return matchesStatus && matchesSearch;\n  }), [reviews, filter, search]);'
  );
  
  fs.writeFileSync('client/src/app/dashboard/reviews/page.tsx', rev);
}
