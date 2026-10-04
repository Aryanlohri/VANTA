const fs = require('fs');

let css = fs.readFileSync('client/src/app/globals.css', 'utf8');

// I will just replace the entire broken block. 
// The broken block looks like:
/*
@keyframes metallic-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
  45% { background-position: 100% 0; }
  100% { background-position: 100% 0; }
}
*/

const brokenRegex = /@keyframes metallic-shimmer \{[\s\S]*?100% \{ background-position: 100% 0; \}\n  \}/;

const newKeyframes = `@keyframes metallic-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}`;

css = css.replace(brokenRegex, newKeyframes);

fs.writeFileSync('client/src/app/globals.css', css);
