const fs = require('fs');
let content = fs.readFileSync('src/utils/mathFormatters.ts', 'utf8');

// Replace while loops with a safe version
let loopCounter = 0;
content = content.replace(/while\s*\((.*?)\)\s*\{/g, (match, condition) => {
  loopCounter++;
  const counterName = `loopCount${loopCounter}`;
  return `let ${counterName} = 0; while (${condition}) { if (${counterName}++ > 1000) { console.error('INFINITE LOOP DETECTED in loop ${loopCounter}', ${condition}); break; }`;
});

fs.writeFileSync('src/utils/mathFormatters.ts', content);
console.log('Patched', loopCounter, 'loops');
