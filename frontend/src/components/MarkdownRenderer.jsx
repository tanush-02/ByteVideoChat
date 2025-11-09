import React from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'
import './MarkdownRenderer.css'

export default function MarkdownRenderer({ content, className = '' }) {
    if (!content) return null

    return (
        <div className={`markdown-content ${className}`}>
            <ReactMarkdown
                rehypePlugins={[rehypeHighlight]}
                components={{
                    // Custom styling for code blocks
                    code: ({ node, inline, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                            <pre className="code-block">
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            </pre>
                        ) : (
                            <code className="inline-code" {...props}>
                                {children}
                            </code>
                        )
                    },
                    // Custom styling for headings
                    h1: ({ node, ...props }) => <h1 className="markdown-h1" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="markdown-h2" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="markdown-h3" {...props} />,
                    // Custom styling for lists
                    ul: ({ node, ...props }) => <ul className="markdown-ul" {...props} />,
                    ol: ({ node, ...props }) => <ol className="markdown-ol" {...props} />,
                    li: ({ node, ...props }) => <li className="markdown-li" {...props} />,
                    // Custom styling for paragraphs
                    p: ({ node, ...props }) => <p className="markdown-p" {...props} />,
                    // Custom styling for links
                    a: ({ node, ...props }) => <a className="markdown-link" target="_blank" rel="noopener noreferrer" {...props} />,
                    // Custom styling for blockquotes
                    blockquote: ({ node, ...props }) => <blockquote className="markdown-blockquote" {...props} />,
                    // Custom styling for tables
                    table: ({ node, ...props }) => <table className="markdown-table" {...props} />,
                    th: ({ node, ...props }) => <th className="markdown-th" {...props} />,
                    td: ({ node, ...props }) => <td className="markdown-td" {...props} />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}


