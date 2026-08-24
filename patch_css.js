const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');
if (!css.includes('::-webkit-scrollbar')) {
  css += `\n
/* Always show scrollbars for math preview on macOS */
.math-preview-container::-webkit-scrollbar,
.math-preview-content::-webkit-scrollbar,
.overflow-x-auto::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}
.math-preview-container::-webkit-scrollbar-track,
.math-preview-content::-webkit-scrollbar-track,
.overflow-x-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}
.math-preview-container::-webkit-scrollbar-thumb,
.math-preview-content::-webkit-scrollbar-thumb,
.overflow-x-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.math-preview-container::-webkit-scrollbar-thumb:hover,
.math-preview-content::-webkit-scrollbar-thumb:hover,
.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
`;
  fs.writeFileSync('src/index.css', css);
}
