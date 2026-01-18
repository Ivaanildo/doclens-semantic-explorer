import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="markdown-body text-sm leading-relaxed break-words text-slate-800">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <div className="relative group my-4 rounded-lg overflow-hidden border border-slate-700">
                <div className="bg-slate-700 text-xs text-slate-300 px-3 py-1 flex justify-between">
                    <span className="font-mono">{match[1]}</span>
                </div>
                <code className={`${className} block bg-[#1e1e1e] text-gray-100 p-4 overflow-x-auto`} {...props}>
                  {children}
                </code>
              </div>
            ) : (
              <code className="bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded text-xs font-mono border border-slate-200" {...props}>
                {children}
              </code>
            );
          },
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 border-b pb-2 text-slate-900">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5 text-slate-800">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-4 text-slate-800">{children}</h3>,
          blockquote: ({children}) => <blockquote className="border-l-4 border-blue-400 pl-4 italic text-slate-600 my-4 bg-slate-50 py-2 rounded-r">{children}</blockquote>,
          a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">{children}</a>,
          table: ({children}) => <div className="overflow-x-auto my-4 rounded-lg border border-slate-200"><table className="min-w-full divide-y divide-slate-200">{children}</table></div>,
          thead: ({children}) => <thead className="bg-slate-50">{children}</thead>,
          th: ({children}) => <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{children}</th>,
          td: ({children}) => <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 border-t border-slate-100">{children}</td>,
          hr: () => <hr className="my-6 border-slate-200" />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;