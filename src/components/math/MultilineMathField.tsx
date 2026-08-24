import React, { useRef, useEffect } from 'react';
import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';
import { MathField } from './MathField';

interface MultilineMathFieldProps {
  value: string;
  onChange: (val: string) => void;
  onFocus?: (fieldId: string, index: number) => void;
  fieldId: string;
}

export const splitIntoBlocks = (text: string) => {
  if (!text) return [''];
  const blocks: string[] = [];
  let currentBlock = '';
  let envDepth = 0;
  let braceDepth = 0;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\\' && (text[i+1] === '{' || text[i+1] === '}')) {
      currentBlock += text.substring(i, i + 2);
      i++;
      continue;
    }
    
    if (text.startsWith('\\begin{', i)) {
      envDepth++;
      currentBlock += text.substring(i, i + 7);
      i += 6;
      continue;
    } else if (text.startsWith('\\end{', i)) {
      envDepth = Math.max(0, envDepth - 1);
      currentBlock += text.substring(i, i + 5);
      i += 4;
      continue;
    } else if (text[i] === '{') {
      braceDepth++;
    } else if (text[i] === '}') {
      braceDepth = Math.max(0, braceDepth - 1);
    }
    // Removed $ and $$ grouping as it merges too many lines into a single block, making editing difficult

    if (text[i] === '\n' && envDepth === 0 && braceDepth === 0) {
      blocks.push(currentBlock);
      currentBlock = '';
    } else {
      currentBlock += text[i];
    }
  }
  blocks.push(currentBlock);
  return blocks;
};

export const MultilineMathField = React.forwardRef<any, MultilineMathFieldProps>(
  ({ value, onChange, onFocus, fieldId }, ref) => {
    const lines = splitIntoBlocks(value || '');
    const fieldRefs = useRef<(HTMLElement | null)[]>([]);

    useEffect(() => {
      if (typeof ref === 'function') ref(fieldRefs.current);
      else if (ref) (ref as React.MutableRefObject<any>).current = fieldRefs.current;
    }, [ref]);

    const handleLineChange = (index: number, newStr: string) => {
      const newLines = [...lines];
      newLines[index] = newStr;
      onChange(newLines.join('\n'));
    };

    const handleInsertLine = (index: number) => {
      const newLines = [...lines];
      newLines.splice(index, 0, '');
      onChange(newLines.join('\n'));
    };

    const handleMoveLineUp = (index: number) => {
      if (index <= 0) return;
      const newLines = [...lines];
      const temp = newLines[index];
      newLines[index] = newLines[index - 1];
      newLines[index - 1] = temp;
      onChange(newLines.join('\n'));
    };

    const handleMoveLineDown = (index: number) => {
      if (index >= lines.length - 1) return;
      const newLines = [...lines];
      const temp = newLines[index];
      newLines[index] = newLines[index + 1];
      newLines[index + 1] = temp;
      onChange(newLines.join('\n'));
    };

    const handleDeleteLine = (index: number) => {
      const newLines = lines.filter((_, i) => i !== index);
      if (newLines.length === 0) newLines.push('');
      onChange(newLines.join('\n'));
    };

    return (
      <div className="flex flex-col gap-2">
        {lines.map((line, i) => (
          <div key={i} className="group relative flex-1 bg-white border border-slate-200 rounded-lg focus-within:border-[#003fb1] focus-within:ring-2 focus-within:ring-blue-500/20 transition-all p-3 pr-10">
            <MathField
              ref={(el: any) => fieldRefs.current[i] = el}
              value={line}
              onChange={(val: string) => handleLineChange(i, val)}
              onFocus={() => onFocus && onFocus(fieldId, i)}
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => handleMoveLineUp(i)}
                title="Move block up"
                className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleMoveLineDown(i)}
                title="Move block down"
                className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteLine(i)}
                title="Delete block"
                className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        <div className="flex justify-start">
          <button
            type="button"
            onClick={() => handleInsertLine(lines.length)}
            className="text-xs font-semibold text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 border border-transparent hover:border-blue-200"
          >
            <Plus className="w-3 h-3" /> Add block (for diagrams/text)
          </button>
        </div>
      </div>
    );
  }
);
