const fs = require('fs');

let types = fs.readFileSync('packages/shared/src/types/index.ts', 'utf8');

if (!types.includes('customInstructions?: string')) {
  types = types.replace(
    'mode?: string;',
    'mode?: string;\n  customInstructions?: string;'
  );
  fs.writeFileSync('packages/shared/src/types/index.ts', types);
}

// Rebuild shared
