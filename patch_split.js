const fs = require('fs');
let code = fs.readFileSync('src/utils/mathFormatters.ts', 'utf8');
if (!code.includes('export const splitIntoBlocks')) {
  code += `\n
export const splitIntoBlocks = (text: string) => {
  const blocks: string[] = [];
  let currentBlock = '';
  let envDepth = 0;
  let inInlineMath = false;
  let inDisplayMath = false;

  for (let i = 0; i < text.length; i++) {
    if (text.startsWith('\\\\begin{', i)) {
      envDepth++;
      currentBlock += text.substring(i, i + 7);
      i += 6;
      continue;
    } else if (text.startsWith('\\\\end{', i)) {
      envDepth = Math.max(0, envDepth - 1);
      currentBlock += text.substring(i, i + 5);
      i += 4;
      continue;
    } else if (text.startsWith('$$', i)) {
      if (!inInlineMath) inDisplayMath = !inDisplayMath;
      currentBlock += '$$';
      i++;
      continue;
    } else if (text.startsWith('\\\\\\\\[', i)) {
      if (!inInlineMath) inDisplayMath = true;
      currentBlock += '\\\\\\\[';
      i++;
      continue;
    } else if (text.startsWith('\\\\\\\\]', i)) {
      if (!inInlineMath) inDisplayMath = false;
      currentBlock += '\\\\\\\\]';
      i++;
      continue;
    } else if (text[i] === '$' && (i === 0 || text[i-1] !== '\\\\\\\\')) {
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
  fs.writeFileSync('src/utils/mathFormatters.ts', code);
}
