declare module 'react-syntax-highlighter' {
  import type { ComponentType } from 'react';
  export const Prism: ComponentType<{
    language: string;
    style?: Record<string, React.CSSProperties>;
    customStyle?: React.CSSProperties;
    PreTag?: keyof JSX.IntrinsicElements;
    codeTagProps?: { style?: React.CSSProperties };
    children?: string;
  }>;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism/one-dark' {
  const style: Record<string, React.CSSProperties>;
  export default style;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism/one-light' {
  const style: Record<string, React.CSSProperties>;
  export default style;
}
