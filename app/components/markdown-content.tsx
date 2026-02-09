'use client';

import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark';
import oneLight from 'react-syntax-highlighter/dist/esm/styles/prism/one-light';
import { useTheme } from 'next-themes';

function useSyntaxTheme() {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'light' ? oneLight : oneDark;
}

function createMarkdownComponents(syntaxStyle: Record<string, React.CSSProperties>): Components {
  return {
  p: ({ children }: { children?: ReactNode }) => <p className="mb-3 last:mb-0">{children}</p>,
  h1: ({ children }: { children?: ReactNode }) => <h1 className="mb-2 mt-4 text-lg font-semibold first:mt-0">{children}</h1>,
  h2: ({ children }: { children?: ReactNode }) => <h2 className="mb-2 mt-4 text-base font-semibold first:mt-0">{children}</h2>,
  h3: ({ children }: { children?: ReactNode }) => <h3 className="mb-2 mt-3 text-sm font-semibold first:mt-0">{children}</h3>,
  ul: ({ children }: { children?: ReactNode }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }: { children?: ReactNode }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }: { children?: ReactNode }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="mb-3 border-l-2 border-zinc-300 pl-4 italic text-zinc-600 dark:border-zinc-500 dark:text-zinc-400">
      {children}
    </blockquote>
  ),
  code: ({ className, children, ...props }: { className?: string; children?: ReactNode }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code
          className="rounded bg-zinc-200/80 px-1.5 py-0.5 font-mono text-sm dark:bg-white/10"
          {...props}
        >
          {children}
        </code>
      );
    }
    const match = /language-(\w+)/.exec(className ?? '');
    const language = match?.[1] ?? 'text';
    const codeString = String(children).replace(/\n$/, '');
    return (
      <div className="mb-3 overflow-x-auto rounded-lg [&>pre]:m-0! [&>pre]:rounded-lg! [&>pre]:p-3!">
        <SyntaxHighlighter
          style={syntaxStyle}
          language={language}
          PreTag="pre"
          customStyle={{ margin: 0 }}
          codeTagProps={{ style: { fontSize: '0.875rem', lineHeight: 1.6 } }}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    );
  },
  pre: ({ children }: { children?: ReactNode }) => (
    <pre className="contents">
      {children}
    </pre>
  ),
  a: ({ href, children }: { href?: string; children?: ReactNode }) => (
    <a
      href={href ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-emerald-600 underline underline-offset-2 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
    >
      {children}
    </a>
  ),
  strong: ({ children }: { children?: ReactNode }) => <strong className="font-semibold">{children}</strong>,
  hr: () => <hr className="my-3 border-zinc-200 dark:border-white/10" />,
  table: ({ children }: { children?: ReactNode }) => (
    <div className="mb-3 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: ReactNode }) => <thead className="border-b border-zinc-300 dark:border-white/20">{children}</thead>,
  tbody: ({ children }: { children?: ReactNode }) => <tbody>{children}</tbody>,
  tr: ({ children }: { children?: ReactNode }) => <tr className="border-b border-zinc-200 dark:border-white/10">{children}</tr>,
  th: ({ children }: { children?: ReactNode }) => (
    <th className="px-3 py-2 text-left font-semibold">{children}</th>
  ),
  td: ({ children }: { children?: ReactNode }) => <td className="px-3 py-2">{children}</td>,
  };
}

export function MarkdownContent({ content }: { content: string }) {
  const syntaxStyle = useSyntaxTheme();
  const markdownComponents = createMarkdownComponents(syntaxStyle);
  return (
    <div className="markdown-content text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
