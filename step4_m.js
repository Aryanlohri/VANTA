const fs = require('fs');
const path = require('path');

function replaceMotion(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceMotion(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('framer-motion')) {
        // Find if motion is imported
        if (content.match(/import\s+\{[^}]*motion[^}]*\}\s+from\s+['"]framer-motion['"]/)) {
          // Replace 'motion' with 'm' in import if it's there
          content = content.replace(/(import\s+\{[^}]*)(\bmotion\b)([^}]*\}\s+from\s+['"]framer-motion['"])/g, '$1m$3');
          
          // If it was default import (import { motion }) it was caught above, wait, motion is not a default import, it's a named import.
          // Now replace motion.div, motion.span, etc with m.div, m.span
          content = content.replace(/<motion\./g, '<m.');
          content = content.replace(/<\/motion\./g, '</m.');
          fs.writeFileSync(fullPath, content);
        }
      }
    }
  }
}

replaceMotion('client/src');

// Also update Layout to use domMax because shared layout animations require it
let layout = fs.readFileSync('client/src/app/layout.tsx', 'utf8');
layout = layout.replace("import { LazyMotion, domAnimation } from 'framer-motion';", "import { LazyMotion, domMax } from 'framer-motion';");
layout = layout.replace("<LazyMotion features={domAnimation}>", "<LazyMotion features={domMax}>");
fs.writeFileSync('client/src/app/layout.tsx', layout);
