const fs = require('fs');

let content = fs.readFileSync('src/utils/mathFormatters.ts', 'utf8');

const splitCode = `
export const splitIntoBlocks = (text: string) => {
  const blocks: string[] = [];
  let currentBlock = '';
  let envDepth = 0;
  let inInlineMath = false;
  let inDisplayMath = false;

  for (let i = 0; i < text.length; i++) {
    if (text.startsWith('\\\\begin{', i)) {
      envDepth++;
    } else if (text.startsWith('\\\\end{', i)) {
      envDepth = Math.max(0, envDepth - 1);
    } else if (text.startsWith('$$', i)) {
      if (!inInlineMath) inDisplayMath = !inDisplayMath;
      currentBlock += '$$';
      i++;
      continue;
    } else if (text[i] === '$' && (i === 0 || text[i-1] !== '\\\\')) {
      if (!inDisplayMath) inInlineMath = !inInlineMath;
    }

    if (text[i] === '\\n' && envDepth === 0 && !inDisplayMath && !inInlineMath) {
      blocks.push(currentBlock);
      currentBlock = '';
    } else {
      currentBlock += text[i];
    }
  }
  blocks.push(currentBlock);
  return blocks;
};
`;

content += '\n' + splitCode;
fs.writeFileSync('src/utils/mathFormatters.ts', content);

let multilineContent = fs.readFileSync('src/components/math/MultilineMathField.tsx', 'utf8');
multilineContent = multilineContent.replace(
  "import { MathField } from './MathField';",
  "import { MathField } from './MathField';\nimport { splitIntoBlocks } from '../../utils/mathFormatters';"
);
multilineContent = multilineContent.replace(
  "const lines = (value || '').split('\\n');",
  "const lines = splitIntoBlocks(value || '');"
);

fs.writeFileSync('src/components/math/MultilineMathField.tsx', multilineContent);

