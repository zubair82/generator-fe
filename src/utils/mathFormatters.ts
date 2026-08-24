import katex from 'katex';

export const replaceRootsWithExponents = (str: string) => {
  let result = str;
  let loopCount1 = 0;
  while (result.includes('\\sqrt')) {
    if (loopCount1++ > 50000) { console.error('INFINITE LOOP DETECTED in loop 1'); break; }

    const startIdx = result.indexOf('\\sqrt');
    let n = '2';
    let contentStart = startIdx + 5;
    while (result[contentStart] === ' ') contentStart++;

    if (result[contentStart] === '[') {
      const endBracket = result.indexOf(']', contentStart);
      if (endBracket !== -1) {
        n = result.substring(contentStart + 1, endBracket);
        contentStart = endBracket + 1;
      }
    }

    while (result[contentStart] === ' ') contentStart++;

    if (result[contentStart] === '{') {
      let braceCount = 1;
      let i = contentStart + 1;
      let loopCount2 = 0;
  while (braceCount > 0 && i < result.length) {
    if (loopCount2++ > 50000) { console.error('INFINITE LOOP DETECTED in loop 2'); break; }

        if (result[i] === '{') braceCount++;
        if (result[i] === '}') braceCount--;
        i++;
      }
      const endBrace = i - 1;
      const content = result.substring(contentStart + 1, endBrace);
      const replacement = '\\left(' + content + '\\right)^{1/' + n + '}';
      result = result.substring(0, startIdx) + replacement + result.substring(endBrace + 1);
    } else {
      const content = result[contentStart];
      const replacement = '\\left(' + content + '\\right)^{1/' + n + '}';
      result = result.substring(0, startIdx) + replacement + result.substring(contentStart + 1);
    }
  }
  return result;
};

export const splitLatexLines = (str: string) => {
  let parts = [];
  let currentPart = '';
  let depth = 0; // \begin ... \end depth
  let braceDepth = 0; // { ... } depth
  let bracketDepth = 0; // [ ... ] depth
  let leftRightDepth = 0; // \left ... \right depth
  
  for (let i = 0; i < str.length; i++) {
    // If it's escaped \{ or \}, ignore it
    if (str[i] === '\\' && (str[i+1] === '{' || str[i+1] === '}')) {
      currentPart += str[i] + str[i+1];
      i++;
      continue;
    }
    
    if (str.startsWith('\\begin{', i)) {
      depth++;
    } else if (str.startsWith('\\end{', i)) {
      depth--;
    } else if (str.startsWith('\\left', i)) {
      leftRightDepth++;
    } else if (str.startsWith('\\right', i)) {
      leftRightDepth--;
    }
    
    if (str[i] === '{') braceDepth++;
    if (str[i] === '}') braceDepth--;
    if (str[i] === '[') bracketDepth++;
    if (str[i] === ']') bracketDepth--;

    if (depth === 0 && braceDepth === 0 && bracketDepth === 0 && leftRightDepth === 0) {
      if (str.startsWith('\\\\\\\\', i)) {
        parts.push(currentPart.trim());
        currentPart = '';
        i += 3; // skip the remaining 3 backslashes
        continue;
      } else if (str.startsWith('\\\\', i)) {
        parts.push(currentPart.trim());
        currentPart = '';
        i += 1; // skip the remaining 1 backslash
        continue;
      } else if (str.startsWith('\\newline', i) && (i + 8 >= str.length || !/[a-zA-Z]/.test(str[i + 8]))) {
        parts.push(currentPart.trim());
        currentPart = '';
        i += 7; // skip 'newline'
        continue;
      } else if (str.startsWith('\\n', i) && (i + 2 >= str.length || !/[a-zA-Z]/.test(str[i + 2]))) {
        parts.push(currentPart.trim());
        currentPart = '';
        i += 1; // skip the 'n'
        continue;
      } else if (str[i] === '\n') {
        parts.push(currentPart.trim());
        currentPart = '';
        continue;
      }
    }
    currentPart += str[i];
  }
  parts.push(currentPart.trim());
  return parts.filter(p => p !== ''); // Remove any empty parts
};

export const renderPreviewHtml = (text: any, diagramsText?: any) => {
  if (text === null || text === undefined || text === '') return '';

  let processedText = String(text);

  // Normalize MathLive escaped variations of [DIAGRAM_X] back to the standard format
  processedText = processedText.replace(/(?:\\lbrack|\\\[|\\left\[)\s*DIAGRAM(?:\\_|_)(\d+)\s*(?:\\rbrack|\\\]|\\right\])/g, '[DIAGRAM_$1]');

  const diagramMap = new Map<string, string>();
  if (diagramsText) {
    const diagRegex = /\[DIAGRAM_\d+\]:\s*(!\[.*?\]\([^)]+\))/g;
    let match;
    let loopCount3 = 0;
  while ((match = diagRegex.exec(String(diagramsText))) !== null) {
    if (loopCount3++ > 50000) { console.error('INFINITE LOOP DETECTED in loop 3'); break; }

      const tag = match[0].split(':')[0].trim();
      diagramMap.set(tag, match[1]);
    }
  }

  const escapeHtml = (s: string) => s.replace(/\\([%$_&#{}])/g, "$1").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const renderDiagram = (tag: string) => {
    const markdown = diagramMap.get(tag);
    if (!markdown) return escapeHtml(tag);
    const imgMatch = markdown.match(/!\[(.*?)\]\(([^)]+)\)/);
    if (imgMatch) {
      return `<img src="${imgMatch[2]}" alt="${imgMatch[1]}" class="max-w-full rounded-md shadow-sm my-2 border border-slate-200" />`;
    }
    return escapeHtml(tag);
  };

  let html = '';
  let lastIndex = 0;
  const regex = /\$\$(.*?)\$\$|\$(.*?)\$/gs;
  let match;
  let mathIndex = 0;

  let loopCount4 = 0;
  while ((match = regex.exec(processedText)) !== null) {
    if (loopCount4++ > 50000) { console.error('INFINITE LOOP DETECTED in loop 4'); break; }

    // Plain text before math
    let plainText = processedText.substring(lastIndex, match.index);
    const plainParts = plainText.split(/(\[DIAGRAM_\d+\])/);
    for (let i = 0; i < plainParts.length; i++) {
      if (i % 2 === 0) {
        let escaped = escapeHtml(plainParts[i]);
        // Handle markdown bold
        escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Handle markdown images
        escaped = escaped.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-md shadow-sm my-2 border border-slate-200" />');
        html += escaped;
      } else {
        html += renderDiagram(plainParts[i]);
      }
    }

    const isDisplay = match[0].startsWith('$$');
    let mathContent = match[1] !== undefined ? match[1] : match[2];
    
    // Balance any unmatched braces { } to prevent KaTeX parse errors from unclosed LLM \text blocks
    let openBraces = 0;
    for (let i = 0; i < mathContent.length; i++) {
      if (mathContent[i] === '{' && (i === 0 || mathContent[i - 1] !== '\\')) openBraces++;
      else if (mathContent[i] === '}' && (i === 0 || mathContent[i - 1] !== '\\')) openBraces--;
    }
    if (openBraces > 0) {
      mathContent += '}'.repeat(openBraces);
    }

    mathContent = replaceRootsWithExponents(mathContent);
    // Remove nested unescaped $ signs which cause KaTeX parse errors
    mathContent = mathContent.replace(/([^\\])\$/g, '$1').replace(/^\$/, '');
    // Replace \csc with \operatorname{cosec} as requested
    mathContent = mathContent.replace(/\\csc\b/g, '\\operatorname{cosec}');

    // Fix stray escaped closing braces inside \text blocks
    mathContent = mathContent.replace(/\\text\{([^}]*?)\\\}/g, '\\text{$1}');

    // Fix unescaped underscores inside \text blocks which crash KaTeX
    mathContent = mathContent.replace(/\\text\{([^}]*?)\}/g, (match, p1) => {
      return '\\text{' + p1.replace(/(?<!\\)_/g, '\\_') + '}';
    });

    // Temporarily hide \text{...} blocks so we don't accidentally modify English words inside them
    const textBlocks: string[] = [];
    mathContent = mathContent.replace(/\\text\{([^}]*?)\}/g, (match) => {
      textBlocks.push(match);
      return `__TEXT_BLOCK_${textBlocks.length - 1}__`;
    });

    // Fix control character artifacts from JSON parsing of unescaped LaTeX commands
    mathContent = mathContent.replace(/\x0Crac/g, '\\frac');
    mathContent = mathContent.replace(/\x0Dight/g, '\\right');
    mathContent = mathContent.replace(/\x09ext/g, '\\text');
    // Catch any remaining bare control chars
    mathContent = mathContent.replace(/[\x0B-\x0F]/g, '');

    // Fix OCR formatting that breaks KaTeX rendering in preview mode
    mathContent = mathContent.replace(/(?<![a-zA-Z])ight\)/g, 'right)');
    mathContent = mathContent.replace(/(?<!\\)right\)/g, '\\right)');

    // Fix LLM dropped backslashes for common commands 
    const cmds = ['sum', 'cdot', 'eta', 'pi', 'mu', 'alpha', 'beta', 'gamma', 'theta', 'phi', 'infty', 'int', 'times', 'div', 'Omega', 'omega'];
    cmds.forEach(cmd => {
      mathContent = mathContent.replace(new RegExp(`(^|[^a-zA-Z\\\\])(${cmd})(?![a-zA-Z])`, 'g'), `$1\\${cmd}`);
    });
    // Special case for rac -> \frac
    mathContent = mathContent.replace(/(^|[^a-zA-Z\\])rac(?![a-zA-Z])/g, '$1\\frac');
    // Special case for left( which can be preceded by variables like yleft(
    mathContent = mathContent.replace(/(?<!\\)left\(/g, '\\left(');
    // Special case for text{...} which the LLM often drops the backslash for
    mathContent = mathContent.replace(/(?<![a-zA-Z\\])text(?=\{)/g, '\\text');
    // Special cases for dropped text block braces and backslashes (e.g. textm^2 or text m^2 -> \text{ m}^2)
    mathContent = mathContent.replace(/(?<![a-zA-Z\\])text\s*(m|T|V|A|C|J|W|Hz|rad|s|kg|g|N|Pa|K)(\^\d+)?/g, '\\text{ $1}$2');

    // Fix markdown bold formatting generated by LLM inside math blocks
    mathContent = mathContent.replace(/\*\*(.*?)\*\*/g, '\\textbf{$1}');

    // Restore \text{...} blocks
    mathContent = mathContent.replace(/__TEXT_BLOCK_(\d+)__/g, (match, p1) => {
      return textBlocks[parseInt(p1, 10)];
    });

    const mathParts = mathContent.split(/(\[DIAGRAM_\d+\])/);
    for (let i = 0; i < mathParts.length; i++) {
      if (i % 2 === 0) {
        if (mathParts[i].trim()) {
          const lines = splitLatexLines(mathParts[i]);
          const renderedLines = lines.map(line => {
            try {
              return katex.renderToString(line, {
                displayMode: isDisplay,
                throwOnError: false
              });
            } catch (e) {
              return `<span class="text-red-500">${escapeHtml(line)}</span>`;
            }
          });
          const safeLatex = escapeHtml(match[0]).replace(/"/g, '&quot;').replace(/'/g, '&#039;');
          const rendered = renderedLines.join('<br/>');
          html += `<span class="math-clickable cursor-pointer hover:bg-purple-50 hover:ring-2 hover:ring-purple-200 transition-all rounded px-1" data-index="${mathIndex}" data-latex="${safeLatex}" title="Click to edit">${rendered}</span>`;
        }
      } else {
        html += renderDiagram(mathParts[i]);
      }
    }
    
    mathIndex++;
    lastIndex = regex.lastIndex;
  }

  // Plain text after all math
  let finalPlainText = processedText.substring(lastIndex);
  const finalParts = finalPlainText.split(/(\[DIAGRAM_\d+\])/);
  for (let i = 0; i < finalParts.length; i++) {
    if (i % 2 === 0) {
      let escaped = escapeHtml(finalParts[i]);
      // Handle markdown bold
      escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Handle markdown images
      escaped = escaped.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-md shadow-sm my-2 border border-slate-200" />');
      html += escaped;
    } else {
      html += renderDiagram(finalParts[i]);
    }
  }

  // Parse markdown images ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-md shadow-sm my-2 border border-slate-200" />');

  return html.replace(/\n/g, '<br/>');
};

export const replaceMathAtIndex = (text: string, indexToReplace: number, newLatex: string) => {
  if (text === null || text === undefined) return text;
  let processedText = String(text);
  const regex = /\$\$(.*?)\$\$|\$(.*?)\$/gs;
  let match;
  let mathIndex = 0;

  let loopCount5 = 0;
  while ((match = regex.exec(processedText)) !== null) {
    if (loopCount5++ > 50000) { console.error('INFINITE LOOP DETECTED in loop 5'); break; }

    if (mathIndex === indexToReplace) {
      return processedText.substring(0, match.index) + newLatex + processedText.substring(regex.lastIndex);
    }
    mathIndex++;
  }
  return text;
};


export const processPlainText = (text: string) => {
  let depth = 0;
  let blockStart = -1;
  const blockRegex = /\\(left|right)(?:[ \t]*(?:\\[a-zA-Z]+|\\[^a-zA-Z0-9\s]|[^a-zA-Z0-9\s\\]))|\\(begin|end)\{[^}]*\}/g;

  let lastIndex = 0;
  let match;
  let protectedStr = '';

  let loopCount6 = 0;
  while ((match = blockRegex.exec(text)) !== null) {
    if (loopCount6++ > 50000) { console.error('INFINITE LOOP DETECTED in loop 6'); break; }

    const isLeftOrBegin = match[1] === 'left' || match[2] === 'begin';
    const isRightOrEnd = match[1] === 'right' || match[2] === 'end';

    if (isLeftOrBegin) {
      if (depth === 0) {
        protectedStr += text.substring(lastIndex, match.index);
        blockStart = match.index;
      }
      depth++;
    } else if (isRightOrEnd) {
      if (depth > 0) {
        depth--;
        if (depth === 0) {
          protectedStr += '\uE002' + text.substring(blockStart, match.index + match[0].length) + '\uE003';
          lastIndex = match.index + match[0].length;
        }
      }
    }
  }
  protectedStr += text.substring(lastIndex);

  // Replace \uE002 and \uE003 with \uE000 and \uE001 directly so we can process the whole string at once
  let part = protectedStr.replace(/\uE002/g, '\uE000').replace(/\uE003/g, '\uE001');

  // Fix OCR replacing comma with \, in plain text, and clean up stray spacing commands
  part = part.replace(/\\,/g, ', ').replace(/\\([;:\! ])/g, ' ');
  part = part.replace(/,\s*,/g, ','); // clean up double commas if they occur

  // Fix OCR adding stray backslashes before spaces (e.g. "5\\ \\Omega")
  part = part.replace(/\\\s+/g, ' ');

  // Fix OCR escaping underscores in plain text blanks (e.g. \_\_\_)
  part = part.replace(/\\_/g, '_');

  // Pre-wrap \bigl, \bigr, \left, \right and their following delimiter
  part = part.replace(/(?<!\\)(\\(?:bigl|bigr|left|right)[|()[\]{}.])/g, '\uE000$1\uE001');

  // Pre-wrap commands that take optional brackets before required braces (e.g. \xrightarrow[sub]{sup}, \sqrt[3]{8})
  // This prevents the next general regex from splitting them incorrectly which crashes KaTeX
  part = part.replace(/(?<!\\)(\\[a-zA-Z]+(?:_[a-zA-Z0-9]+|\^[a-zA-Z0-9]+)?(?:\[[^\]]*\])?(?:\{(?:[^}{]+|\{(?:[^}{]+|\{(?:[^}{]+|\{(?:[^}{]+|\{[^}{]*\})*\})*\})*\})*\})+)/g, '\uE000$1\uE001');

  // Wrap ALL standalone latex commands and their immediate arguments (\lambda, \frac, \implies, \therefore, etc.)
  part = part.replace(/(?<!\\)([-+]?[ \t]*\\[a-zA-Z]+(?:\s+[a-zA-Z0-9](?![a-zA-Z0-9]))?(?:_[a-zA-Z0-9]+|\^[a-zA-Z0-9]+)?(?:\s*\{(?:[^}{]+|\{(?:[^}{]+|\{(?:[^}{]+|\{(?:[^}{]+|\{[^}{]*\})*\})*\})*\})*\})*(?:\[[^\]]*\])*(?:\([^)]+\))?(?:[ \t]*=[ \t]*[-+]?[0-9a-zA-Z]+)?)/g, '\uE000$1\uE001');

  // Wrap expressions with exponents or subscripts (allow negative signs, combinations, and {})
  part = part.replace(/(\uE000[\s\S]*?\uE001)|((?:\{\s*\})?(?:[a-zA-Z0-9]*[\^_]+(?:\{(?:[^}{]+|\{[^}{]*\})*\}|[a-zA-Z0-9]+))+(?:[ \t]*[\+\-\=\/\*][ \t]*[-+]?(?:[a-zA-Z0-9]+|\{(?:[^}{]+|\{[^}{]*\})*\})(?:[\^_]+(?:\{(?:[^}{]+|\{[^}{]*\})*\}|[a-zA-Z0-9]+))*)*)/g,
    (m, w, n) => w ? w : '\uE000' + n + '\uE001');

  // Wrap equations
  part = part.replace(/(?<!\\)\b([a-zA-Z]+[ \t]*=[ \t]*[-+]?[0-9a-zA-Z]+(?:[ \t]*[\+\-\*\/][ \t]*[-+]?[a-zA-Z0-9]+)*)\b/g, '\uE000$1\uE001');
  part = part.replace(/(?<!\\)\b([a-zA-Z]+\([^)]+\)[ \t]*=[ \t]*[-+]?[0-9a-zA-Z]+)\b/g, '\uE000$1\uE001');

  // Wrap parenthesized expressions like (N1A1B1 / N2A2B2)(R2/R1) = 
  part = part.replace(/(?<!\\)(\((?:[a-zA-Z0-9]+[ \t]*\/[ \t]*[a-zA-Z0-9]+|[^)]+)\)(?:\([^)]+\))*[ \t]*=[ \t]*[-+]?[0-9a-zA-Z]*(?:(?:\.[0-9]+)?(?:[ \t]*[\+\-\*\/][ \t]*[-+]?[a-zA-Z0-9]+(?:\.[0-9]+)?)*))/g, '\uE000$1\uE001');

  // Wrap standalone coordinate/function calls like P(1, -4)
  part = part.replace(/(?<!\\)\b([A-Z]\([0-9\s,\.\-]+\))/g, '\uE000$1\uE001');

  let joined = part;

  // Strip nested \uE000 and \uE001 markers
  let finalStr = '';
  let activeDepth = 0;
  for (let i = 0; i < joined.length; i++) {
    if (joined[i] === '\uE000') {
      if (activeDepth === 0) finalStr += '\uE000';
      activeDepth++;
    } else if (joined[i] === '\uE001') {
      activeDepth--;
      if (activeDepth === 0) finalStr += '\uE001';
    } else {
      finalStr += joined[i];
    }
  }

  return finalStr;
};

export const convertLineBreaks = (text: string) => {
  let depth = 0; // \begin ... \end
  let braceDepth = 0; // { ... }
  let bracketDepth = 0; // [ ... ]
  let leftRightDepth = 0; // \left ... \right

  let result = '';
  for (let i = 0; i < text.length; i++) {
    // Escaped braces/brackets
    if (text[i] === '\\' && (text[i + 1] === '{' || text[i + 1] === '}' || text[i + 1] === '[' || text[i + 1] === ']')) {
      result += text[i] + text[i + 1];
      i++;
      continue;
    }

    if (text.startsWith('\\begin{', i)) depth++;
    else if (text.startsWith('\\end{', i)) depth--;
    else if (text.startsWith('\\left', i)) leftRightDepth++;
    else if (text.startsWith('\\right', i)) leftRightDepth--;
    else if (text[i] === '{') braceDepth++;
    else if (text[i] === '}') braceDepth--;
    else if (text[i] === '[') bracketDepth++;
    else if (text[i] === ']') bracketDepth--;

    if (depth === 0 && braceDepth === 0 && bracketDepth === 0 && leftRightDepth === 0) {
      if (text.startsWith('\\\\', i)) {
        // Find if there's trailing whitespace and \n
        let j = i + 2;
        while (text[j] === ' ' || text[j] === '\t') j++;
        if (text[j] === '\n') j++;
        result += '\n';
        i = j - 1; // loop will increment i
        continue;
      }
    }

    result += text[i];
  }
  return result;
};

export const smartFormatMath = (md: any) => {
  if (!md) return '';

  let p = String(md);

  // Unescape double backslashes for LaTeX commands (e.g. \\begin -> \begin, \\textbf -> \textbf)
  // LLMs often double-escape backslashes when outputting JSON.
  p = p.replace(/\\\\(begin|end|text|textbf|textit|frac|sqrt|left|right|hat|vec|sum|int|infty|alpha|beta|gamma|theta|mu|pi|pm|times|div|sin|cos|tan|log|ln|Rightarrow|rightarrow|Leftrightarrow|leftrightarrow|hline|vdots|ddots|bmatrix|pmatrix|vmatrix|Bmatrix|Vmatrix|cases|aligned|array|xrightarrow|xleftarrow|displaystyle)\b/g, '\\$1');

  // Fix literal OCR newline markers (e.g. \\\n or \\n or \n) BEFORE doing anything else!
  p = p.replace(/\\+n(?![a-zA-Z])/g, '\n');

  // Convert \\ line breaks to actual \n so they split into separate blocks, EXCEPT inside environments
  p = convertLineBreaks(p);

  // Protect DIAGRAM tags from being processed as math by temporarily replacing them with a safe marker
  p = p.replace(/(?:\\lbrack|\\\[|\\left\[|\[).*?DIAGRAM.*?(\d+).*?(?:\\rbrack|\\\]|\\right\]|\])/gi, '\uE006$1\uE007');

  // Protect display math ($$ ... $$) by converting to \[ ... \] so envRegex shields it from plain text processing
  p = p.replace(/\$\$([\s\S]*?)\$\$/g, '\\[$1\\]');

  // 0. Fix OCR unit vectors
  p = p.replace(/(?<!_)([ijk])\^(?![a-zA-Z0-9])/g, '\\hat{$1}'); // i^ j^ k^ -> \hat{i} \hat{j} \hat{k}

  // Remove any $ signs that are improperly nested inside \begin{...} ... \end{...} environments
  // LLMs often mistakenly put $...$ inside aligned/array blocks which breaks our splitting logic.
  p = p.replace(/\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}/g, (match, env, inner) => {
    return `\\begin{${env}}` + inner.replace(/\$/g, '') + `\\end{${env}}`;
  });

  // Process only text that is NOT already inside math blocks ($...$)
  
  // Merge fraction arguments split across newlines (e.g. \frac{num}\n{den} -> \frac{num}{den})
  // This prevents MultilineMathField and KaTeX from improperly splitting the fraction block in half!
  p = p.replace(/\}\s*\n\s*\{/g, '}{');

  const parts = p.split('$');
  let newParts = [];

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      // Plain text part. Protect \begin...\end environments, \[, and \( by treating them as math blocks!
      let text = parts[i];
      let envRegex = /(\\begin\{([^}]+)\}[\s\S]*?\\end\{\2\}|(?<!\\)\\\[[\s\S]*?(?<!\\)\\\]|(?<!\\)\\\([\s\S]*?(?<!\\)\\\))/g;
      let subParts = text.split(envRegex);
      
      let processedText = '';
      let j = 0;
      let loopCount8 = 0;
  while (j < subParts.length) {
    if (loopCount8++ > 50000) { console.error('INFINITE LOOP DETECTED in loop 8'); break; }

        if (subParts[j] !== undefined) {
          processedText += processPlainText(subParts[j]);
        }
        j++;
        if (j < subParts.length) {
          let block = subParts[j] || '';
          if (block.startsWith('\\begin')) {
             processedText += '\uE004' + block + '\uE005';
          } else {
             processedText += block;
          }
          j += 2;
        }
      }
      newParts.push(processedText);
    } else {
      newParts.push(parts[i]);
    }
  }

  p = newParts.join('$');
  p = p.replace(/\uE000/g, '$').replace(/\uE001/g, '$');

  // Cleanup any double dollars this might have created
  p = p.replace(/\$\$/g, '');

  // Merge adjacent math blocks separated by spaces for better rendering
  p = p.replace(/\$[ \t]*\$/g, ' ');

  // Restore diagram tags safely
  let finalResult = '';
  let idx = 0;
  let loopCount9 = 0;
  while (idx < p.length) {
    if (loopCount9++ > 50000) { console.error('INFINITE LOOP DETECTED in loop 9'); break; }

    if (p.startsWith('\uE006', idx)) {
       const match = p.substring(idx).match(/^\uE006(\d+)\uE007/);
       if (match) {
          finalResult += '[DIAGRAM_' + match[1] + ']';
          idx += match[0].length;
       } else {
          finalResult += p[idx];
          idx++;
       }
    } else {
       finalResult += p[idx];
       idx++;
    }
  }
  p = finalResult;

  // Clean up any empty math blocks and extra newlines created by this
  p = p.replace(/\$[ \t]*\n+[ \t]*\$/g, '\n');
  p = p.replace(/\n{3,}/g, '\n\n');

  // Finally, convert latex math delimiters to $ and $$ so renderPreviewHtml can render them natively
  // We use negative lookbehind (?<!\\) to ensure we don't accidentally match \\[ which is a line break!
  p = p.replace(/(?<!\\)\\\(/g, '$').replace(/(?<!\\)\\\)/g, '$');
  p = p.replace(/(?<!\\)\\\[/g, '$$$$').replace(/(?<!\\)\\\]/g, '$$$$');
  p = p.replace(/\uE004/g, '$$$$').replace(/\uE005/g, '$$$$');

  p = p.trim();

  return p;
};

export const markdownToMathLive = (md: string) => {
  if (!md) return '';
  let ml = md.replace(/\\dots\b/g, '\\ldots');
  ml = ml.replace(/\$\$/g, '$');
  const parts = ml.split('$');
  let result = '';
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      if (parts[i]) {
        result += `\\text{${parts[i]}}`;
      }
    } else {
      result += parts[i];
    }
  }
  return result;
};

export const mathLiveToMarkdown = (ml: string) => {
  if (!ml) return '';
  let result = '';
  let lastIndex = 0;
  
  let depth = 0;
  // Match \text{...} or any bracket/brace
  const regex = /\\text\{([^}]*)\}|[{}[\]]/g;
  let match;
  
  let loopCount10 = 0;
  while ((match = regex.exec(ml)) !== null) {
    if (loopCount10++ > 50000) { console.error('INFINITE LOOP DETECTED in loop 10'); break; }

    if (match[0] === '{' || match[0] === '[') {
      depth++;
    } else if (match[0] === '}' || match[0] === ']') {
      if (depth > 0) depth--;
    } else if (match[1] !== undefined) {
      // It's \text{...}, only extract if we are at top-level
      if (depth === 0) {
        const mathPart = ml.substring(lastIndex, match.index).trim();
        if (mathPart) {
          result += `$${mathPart}$`;
        }
        result += match[1];
        lastIndex = regex.lastIndex;
      }
    }
  }
  
  const remainingMath = ml.substring(lastIndex).trim();
  if (remainingMath) {
    result += `$${remainingMath}$`;
  }
  return result;
};

export const normalizeQuestion = (q: any) => {
  if (!q) return q;
  
  // Format standard math fields
  q.question_latex = smartFormatMath(q.question_latex || '');
  q.answer = smartFormatMath(q.answer || '');
  q.explanation = smartFormatMath(q.explanation || '');

  // Handle options formatting
  if (!q.options && q.question_type !== 'numerical') {
    q.options = { A: '', B: '', C: '', D: '' };
  } else if (q.question_type === 'numerical') {
    q.options = null;
  }
  
  if (q.options) {
    if (typeof q.options === 'string') {
      try { q.options = JSON.parse(q.options); } catch (e) { q.options = {}; }
    }
    const newOpts: any = {};
    if (Array.isArray(q.options)) {
      q.options.forEach((opt: any, i: number) => {
        newOpts[opt.option_id || i] = smartFormatMath(opt.latex || opt.text || opt);
      });
      q.options = newOpts;
    } else {
      Object.keys(q.options).forEach(k => {
        newOpts[k] = smartFormatMath(q.options[k]);
      });
      q.options = newOpts;
    }
  }

  // Handle diagrams parsing
  if (q.diagrams) {
    if (typeof q.diagrams === 'string') {
      try { 
        if (q.diagrams.trim().startsWith('[')) {
          const parsed = JSON.parse(q.diagrams); 
          if (Array.isArray(parsed)) {
            q.diagrams = parsed;
          }
        }
      } catch (e) {
        // Leave q.diagrams as the original string
      }
    }
    if (Array.isArray(q.diagrams)) {
      q.diagrams = q.diagrams.join('\n');
    }
  }

  return q;
};
