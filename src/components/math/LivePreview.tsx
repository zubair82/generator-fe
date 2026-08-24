import React, { useState, useEffect, useRef } from 'react';
import { renderPreviewHtml, replaceMathAtIndex } from '../../utils/mathFormatters';
import 'mathlive';

interface LivePreviewProps {
  content: any;
  diagramsText?: any;
  onMathEdit?: (newContent: string) => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ content, diagramsText, onMathEdit }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mathFieldRef = useRef<any>(null);
  const [editingMath, setEditingMath] = useState<{ index: number; latex: string; top: number; left: number } | null>(null);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Close popover if clicking outside
      if (editingMath && containerRef.current && !containerRef.current.contains(e.target as Node)) {
         setEditingMath(null);
      }
    };
    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, [editingMath]);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!onMathEdit) return; // Only enable if onMathEdit is provided
    
    const targetElement = (e.target as Element).nodeType === Node.TEXT_NODE 
      ? (e.target as Element).parentElement 
      : (e.target as Element);
      
    if (!targetElement) return;

    // Check if clicked inside the math field popover itself
    if (targetElement.closest('.mathlive-popover')) return;

    const mathClickable = targetElement.closest('.math-clickable');
    if (mathClickable && containerRef.current?.contains(mathClickable)) {
      const index = parseInt(mathClickable.getAttribute('data-index') || '-1');
      const latex = mathClickable.getAttribute('data-latex') || '';
      
      if (index !== -1) {
        const rect = mathClickable.getBoundingClientRect();
        const containerRect = containerRef.current!.getBoundingClientRect();
        
        setEditingMath({
          index,
          latex,
          top: rect.bottom - containerRect.top + 5,
          left: Math.max(0, rect.left - containerRect.left)
        });
        
        // Wait for render to set value
        setTimeout(() => {
          if (mathFieldRef.current) {
            const unescaped = latex.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
            mathFieldRef.current.value = unescaped.replace(/^\$\$(.*?)\$\$$|^\$(.*?)\$$/s, '$1$2').trim();
            mathFieldRef.current.focus();
          }
        }, 50);
      }
    } else {
      // If clicked elsewhere in container, close it
      setEditingMath(null);
    }
  };

  const handleSave = () => {
    if (!editingMath || !onMathEdit || !mathFieldRef.current) return;
    
    const newInnerLatex = mathFieldRef.current.value;
    if (!newInnerLatex || newInnerLatex.trim() === '') {
      setEditingMath(null);
      return;
    }
    
    if (editingMath.index === -1) {
      // Append new math to the end
      const newFullLatex = `$${newInnerLatex}$`;
      const newContent = content ? `${content} ${newFullLatex}` : newFullLatex;
      onMathEdit(newContent);
    } else {
      // Replace existing math
      const isDisplay = editingMath.latex.startsWith('$$');
      const newFullLatex = isDisplay ? `$$${newInnerLatex}$$` : `$${newInnerLatex}$`;
      const newContent = replaceMathAtIndex(content, editingMath.index, newFullLatex);
      onMathEdit(newContent);
    }
    
    setEditingMath(null);
  };

  const isContentEmpty = (content === null || content === undefined || content === '');

  return (
    <div className="relative group/preview" ref={containerRef}>
      {isContentEmpty ? (
        <div className="text-slate-400 italic bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm min-h-[42px] flex items-center justify-between">
          <span>Empty</span>
          {onMathEdit && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setEditingMath({ index: -1, latex: '', top: 35, left: 10 });
              }}
              className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 font-semibold shadow-sm transition-colors"
            >
              + Insert Math
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={handleContainerClick}
          className={`relative bg-slate-50 border border-slate-200 rounded-lg p-3 min-h-[42px] font-serif text-slate-800 text-lg leading-relaxed shadow-inner overflow-x-auto overflow-y-hidden ${onMathEdit ? 'hover:border-purple-300 transition-colors' : ''}`}
        >
          <div dangerouslySetInnerHTML={{ __html: renderPreviewHtml(content, diagramsText) }} />
          
          {onMathEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingMath({ index: -1, latex: '', top: 35, left: 10 });
              }}
              className="absolute top-2 right-2 opacity-0 group-hover/preview:opacity-100 transition-opacity text-xs bg-purple-100 text-purple-700 px-2 py-1.5 rounded-md hover:bg-purple-200 shadow-sm font-semibold border border-purple-200"
              title="Insert new Math Equation"
            >
              + Insert Math
            </button>
          )}
        </div>
      )}
      
      {editingMath && (
        <div 
          className="mathlive-popover absolute z-50 bg-white border-2 border-purple-400 rounded-xl shadow-2xl p-4 w-[500px] max-w-[90vw] animate-in fade-in zoom-in duration-200"
          style={{ top: `${editingMath.top}px`, left: `${editingMath.left}px` }}
        >
          <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider">
              {editingMath.index === -1 ? 'Insert Math' : 'Visual Math Editor'}
            </h4>
            <span className="text-[10px] text-slate-400">
              {editingMath.index === -1 ? 'Type equation and hit enter' : 'Click elements to edit'}
            </span>
          </div>
          
          <div className="mb-4 bg-slate-50 rounded-lg p-1 border border-slate-200">
            {React.createElement('math-field', {
              ref: mathFieldRef,
              style: { width: '100%', fontSize: '1.2em', padding: '12px', background: 'transparent', border: 'none', outline: 'none' },
              'virtual-keyboard-mode': 'manual',
              onKeyDown: (e: KeyboardEvent) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                }
                if (e.key === 'Escape') {
                  setEditingMath(null);
                }
              }
            })}
          </div>
          
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setEditingMath(null)}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 shadow-sm rounded-lg transition-colors"
            >
              {editingMath.index === -1 ? 'Insert' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
