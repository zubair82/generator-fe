import React, { useRef, useImperativeHandle } from 'react';
import { LivePreview } from './LivePreview';

interface MathFieldProps {
  value: string;
  onChange: (val: string) => void;
  onFocus?: (e?: any) => void;
}

export const MathField = React.forwardRef<any, MathFieldProps>(
  ({ value, onChange, onFocus }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      insert: (symbol: string) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        
        const before = (value || '').substring(0, start);
        const selected = (value || '').substring(start, end);
        const after = (value || '').substring(end);
        
        // Check if we are inside a math block by counting unescaped $ signs before cursor
        const isInsideMath = (before.match(/(?<!\\)\$/g) || []).length % 2 === 1;
        
        let textToInsert = symbol;
        let offset = symbol.length;

        const emptyBraceIdx = symbol.indexOf('{}');
        if (selected && emptyBraceIdx !== -1) {
            textToInsert = symbol.replace('{}', `{${selected}}`);
            offset = textToInsert.length; 
        } else if (emptyBraceIdx !== -1) {
            offset = emptyBraceIdx + 1;
        } else {
            offset = textToInsert.length;
        }

        if (!isInsideMath) {
            textToInsert = `$${textToInsert}$`;
            if (selected && emptyBraceIdx !== -1) {
                offset = textToInsert.length - 1; // place cursor right before closing $
            } else if (emptyBraceIdx !== -1) {
                offset += 1; // shift for leading $
            } else {
                offset = textToInsert.length - 1; // place cursor right before closing $
            }
        }

        const newValue = before + textToInsert + after;
        onChange(newValue);
        
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + offset;
            textareaRef.current.focus();
          }
        }, 0);
      },
      focus: () => {
        textareaRef.current?.focus();
      }
    }));

    return (
      <div className="flex flex-col gap-3 w-full">
        <textarea
          ref={textareaRef}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          className="w-full min-h-[60px] p-3 text-sm font-mono text-slate-800 bg-transparent border-none focus:outline-none resize-y"
          placeholder="Type raw LaTeX here... (use $...$ for math mode)"
          rows={2}
        />
        <div className="pt-2 mt-2 border-t border-slate-100">
          <LivePreview content={value} onMathEdit={onChange} />
        </div>
      </div>
    );
  }
);
