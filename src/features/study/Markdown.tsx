import ReactMarkdown from "react-markdown";

/**
 * `react-markdown` não interpreta HTML cru (sem rehype-raw) e filtra URLs perigosas por padrão.
 * Links abrem em nova aba com rel seguro.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="flex flex-col gap-3 text-base leading-relaxed text-ink">
      <ReactMarkdown
        components={{
          h1: ({ children: c }) => <h3 className="font-display text-lg font-bold">{c}</h3>,
          h2: ({ children: c }) => <h3 className="font-display text-lg font-bold">{c}</h3>,
          h3: ({ children: c }) => <h4 className="font-display text-base font-bold">{c}</h4>,
          ul: ({ children: c }) => <ul className="list-disc pl-6">{c}</ul>,
          ol: ({ children: c }) => <ol className="list-decimal pl-6">{c}</ol>,
          blockquote: ({ children: c }) => (
            <blockquote className="border-l-4 border-purple pl-4 text-muted">{c}</blockquote>
          ),
          a: ({ href, children: c }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-purple-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-dark"
            >
              {c}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
