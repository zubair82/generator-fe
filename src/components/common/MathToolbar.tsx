import React, { useState } from 'react';
import { Calculator, Atom, FlaskConical, ChevronUp, ChevronDown } from 'lucide-react';

interface MathToolbarProps {
  activeField: string | null;
  onInsertSymbol: (symbol: string) => void;
}

const MATH_SYMBOLS = {
  OPERATORS: [
    { label: '±', value: '\\pm ' },
    { label: '×', value: '\\times ' },
    { label: '÷', value: '\\div ' },
    { label: '≠', value: '\\neq ' },
    { label: '≤', value: '\\leq ' },
    { label: '≥', value: '\\geq ' },
    { label: '≈', value: '\\approx ' },
    { label: '∝', value: '\\propto ' },
    { label: '∞', value: '\\infty ' },
    { label: '∴', value: '\\therefore ' },
    { label: '∵', value: '\\because ' },
    { label: '∓', value: '\\mp ' }
  ],
  ALGEBRA: [
    { label: '√', value: '\\sqrt{}' },
    { label: '∛', value: '\\sqrt[3]{}' },
    { label: '∜', value: '\\sqrt[4]{}' },
    { label: '^2', value: '^{2}' },
    { label: '^3', value: '^{3}' },
    { label: '^4', value: '^{4}' },
    { label: '^n', value: '^{n}' },
    { label: '^-1', value: '^{-1}' },
    { label: '½', value: '\\frac{1}{2}' },
    { label: '⅓', value: '\\frac{1}{3}' },
    { label: '¼', value: '\\frac{1}{4}' },
    { label: '⅔', value: '\\frac{2}{3}' }
  ],
  CALCULUS: [
    { label: '∫', value: '\\int ' },
    { label: '∬', value: '\\iint ' },
    { label: '∮', value: '\\oint ' },
    { label: '∂', value: '\\partial ' },
    { label: '∑', value: '\\sum_{}^{}' },
    { label: '∏', value: '\\prod_{}^{}' },
    { label: 'Δ', value: '\\Delta ' },
    { label: '∇', value: '\\nabla ' },
    { label: 'δ', value: '\\delta ' },
    { label: 'ε', value: '\\epsilon ' },
    { label: '→0', value: '\\to 0' },
    { label: '∞', value: '\\infty ' }
  ],
  GREEK: [
    { label: 'α', value: '\\alpha ' },
    { label: 'β', value: '\\beta ' },
    { label: 'γ', value: '\\gamma ' },
    { label: 'δ', value: '\\delta ' },
    { label: 'ε', value: '\\varepsilon ' },
    { label: 'ζ', value: '\\zeta ' },
    { label: 'η', value: '\\eta ' },
    { label: 'θ', value: '\\theta ' },
    { label: 'λ', value: '\\lambda ' },
    { label: 'μ', value: '\\mu ' },
    { label: 'π', value: '\\pi ' },
    { label: 'σ', value: '\\sigma ' },
    { label: 'τ', value: '\\tau ' },
    { label: 'φ', value: '\\varphi ' },
    { label: 'ω', value: '\\omega ' },
    { label: 'Γ', value: '\\Gamma ' },
    { label: 'Δ', value: '\\Delta ' },
    { label: 'Σ', value: '\\Sigma ' },
    { label: 'Φ', value: '\\Phi ' },
    { label: 'Ω', value: '\\Omega ' }
  ]
};

const PHYSICS_SYMBOLS = {
  VECTORS: [
    { label: 'v⃗', value: '\\vec{v}' },
    { label: 'î', value: '\\hat{i}' },
    { label: 'ĵ', value: '\\hat{j}' },
    { label: 'k̂', value: '\\hat{k}' },
    { label: '·', value: '\\cdot ' },
    { label: '×', value: '\\times ' },
    { label: '|x|', value: '|x|' },
    { label: '∇', value: '\\nabla ' }
  ],
  CONSTANTS: [
    { label: 'c', value: 'c' },
    { label: 'G', value: 'G' },
    { label: 'h', value: 'h' },
    { label: 'ℏ', value: '\\hbar ' },
    { label: 'μ₀', value: '\\mu_0' },
    { label: 'ε₀', value: '\\varepsilon_0' },
    { label: 'k_B', value: 'k_B' },
    { label: 'R', value: 'R' },
    { label: 'N_A', value: 'N_A' }
  ],
  UNITS: [
    { label: 'm/s', value: '\\text{m/s}' },
    { label: 'm/s²', value: '\\text{m/s}^2' },
    { label: 'kg', value: '\\text{kg}' },
    { label: 'J', value: '\\text{J}' },
    { label: 'N', value: '\\text{N}' },
    { label: 'W', value: '\\text{W}' },
    { label: 'V', value: '\\text{V}' },
    { label: 'A', value: '\\text{A}' },
    { label: 'Hz', value: '\\text{Hz}' },
    { label: 'T', value: '\\text{T}' },
    { label: 'Ω', value: '\\Omega ' },
    { label: '°C', value: '^\\circ\\text{C}' }
  ]
};

const CHEMISTRY_SYMBOLS = {
  REACTIONS: [
    { label: '→', value: '\\rightarrow ' },
    { label: '⇌', value: '\\rightleftharpoons ' },
    { label: '↑', value: '\\uparrow ' },
    { label: '↓', value: '\\downarrow ' },
    { label: 'Δ→', value: '\\xrightarrow{\\Delta}' },
    { label: '+', value: '+' },
    { label: '−', value: '-' },
    { label: 'e⁻', value: 'e^-' }
  ],
  STATES: [
    { label: '(s)', value: '(s)' },
    { label: '(l)', value: '(l)' },
    { label: '(g)', value: '(g)' },
    { label: '(aq)', value: '(aq)' }
  ],
  IONS_ISOTOPES: [
    { label: 'A_Z X', value: '^{A}_{Z}\\text{X}' },
    { label: '^+', value: '^+' },
    { label: '^-', value: '^-' },
    { label: '^{2+}', value: '^{2+}' },
    { label: '^{2-}', value: '^{2-}' },
    { label: '^{3+}', value: '^{3+}' }
  ],
  UNITS_CONSTANTS: [
    { label: 'mol', value: '\\text{mol}' },
    { label: 'M', value: '\\text{M}' },
    { label: 'atm', value: '\\text{atm}' },
    { label: 'pH', value: '\\text{pH}' },
    { label: 'K_a', value: 'K_a' },
    { label: 'K_w', value: 'K_w' },
    { label: 'kJ/mol', value: '\\text{kJ/mol}' },
    { label: 'g/mol', value: '\\text{g/mol}' }
  ]
};

export function MathToolbar({ activeField, onInsertSymbol }: MathToolbarProps) {
  const [activeTab, setActiveTab] = useState<'math' | 'physics' | 'chemistry'>('math');
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-[#f8f9fa] dark:bg-[#1e2330] border-b border-[#e5e7eb] dark:border-slate-700/70 rounded-xl overflow-hidden w-full shrink-0 flex flex-col z-10 shadow-sm sticky top-0 transition-colors">
      {/* Top Header Row with Tabs */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#e5e7eb] dark:border-slate-700/70 bg-[#f8f9fa] dark:bg-[#1e2330]">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('math')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'math' 
                ? 'bg-white dark:bg-[#252b3b] text-[#003fb1] dark:text-blue-400 shadow-sm border border-[#e5e7eb] dark:border-slate-700' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Calculator className="w-4 h-4" /> Mathematics
          </button>
          <button 
            onClick={() => setActiveTab('physics')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'physics' 
                ? 'bg-white dark:bg-[#252b3b] text-[#8b5cf6] dark:text-purple-400 shadow-sm border border-[#e5e7eb] dark:border-slate-700' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Atom className="w-4 h-4" /> Physics
          </button>
          <button 
            onClick={() => setActiveTab('chemistry')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'chemistry' 
                ? 'bg-white dark:bg-[#252b3b] text-[#10b981] dark:text-emerald-400 shadow-sm border border-[#e5e7eb] dark:border-slate-700' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <FlaskConical className="w-4 h-4" /> Chemistry
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#e2e4e9] dark:bg-[#1a1e29] rounded-md text-slate-600 dark:text-slate-300 font-mono text-xs border border-[#d1d5db] dark:border-slate-700">
            <span>Editing: {activeField || 'None'}</span>
          </div>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            title={isOpen ? "Collapse Toolbar" : "Expand Toolbar"}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Symbol Palette */}
      {isOpen && (
        <div className="p-4 bg-white dark:bg-[#222736] flex-1 overflow-y-auto max-h-[200px] transition-colors">
        {activeTab === 'math' && (
          <div className="flex flex-col gap-4">
            {Object.entries(MATH_SYMBOLS).map(([category, symbols]) => (
              <div key={category} className="flex items-center gap-4">
                <div className="w-24 shrink-0 text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider">
                  {category}
                </div>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {symbols.map((sym, idx) => (
                    <button
                      key={idx}
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent focus loss!
                        onInsertSymbol(sym.value);
                      }}
                      className="min-w-[32px] h-8 px-2 flex items-center justify-center bg-white dark:bg-[#1a1e29] border border-[#e5e7eb] dark:border-slate-700 rounded hover:border-[#003fb1] dark:hover:border-blue-500 hover:text-[#003fb1] dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors text-sm font-serif text-slate-700 dark:text-slate-200 shadow-sm"
                      title={sym.value}
                    >
                      {sym.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'physics' && (
          <div className="flex flex-col gap-4">
            {Object.entries(PHYSICS_SYMBOLS).map(([category, symbols]) => (
              <div key={category} className="flex items-center gap-4">
                <div className="w-32 shrink-0 text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider">
                  {category.replace('_', ' ')}
                </div>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {symbols.map((sym, idx) => (
                    <button
                      key={idx}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onInsertSymbol(sym.value);
                      }}
                      className="min-w-[32px] h-8 px-2 flex items-center justify-center bg-white dark:bg-[#1a1e29] border border-[#e5e7eb] dark:border-slate-700 rounded hover:border-[#003fb1] dark:hover:border-blue-500 hover:text-[#003fb1] dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors text-sm font-serif text-slate-700 dark:text-slate-200 shadow-sm"
                      title={sym.value}
                    >
                      {sym.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'chemistry' && (
          <div className="flex flex-col gap-4">
            {Object.entries(CHEMISTRY_SYMBOLS).map(([category, symbols]) => (
              <div key={category} className="flex items-center gap-4">
                <div className="w-32 shrink-0 text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider">
                  {category.replace('_', ' ')}
                </div>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {symbols.map((sym, idx) => (
                    <button
                      key={idx}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onInsertSymbol(sym.value);
                      }}
                      className="min-w-[32px] h-8 px-2 flex items-center justify-center bg-white dark:bg-[#1a1e29] border border-[#e5e7eb] dark:border-slate-700 rounded hover:border-[#003fb1] dark:hover:border-blue-500 hover:text-[#003fb1] dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors text-sm font-serif text-slate-700 dark:text-slate-200 shadow-sm"
                      title={sym.value}
                    >
                      {sym.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
