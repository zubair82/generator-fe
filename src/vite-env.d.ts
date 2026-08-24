/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PDF_FILE_PATH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        onInput?: (e: Event) => void;
        'default-mode'?: string;
        value?: string;
        ref?: any;
      };
    }
  }
}
