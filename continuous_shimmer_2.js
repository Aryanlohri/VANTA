const fs = require('fs');

let css = fs.readFileSync('client/src/app/globals.css', 'utf8');

const regex = /@keyframes metallic-shimmer \{[\s\S]*?\}/;
const newKeyframes = `@keyframes metallic-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}`;

css = css.replace(regex, newKeyframes);

fs.writeFileSync('client/src/app/globals.css', css);
