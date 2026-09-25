import { isValidElement, type ReactElement, type ReactNode } from 'react'
import ReactMarkdown, { defaultUrlTransform, type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { mediaUrl } from '../api/client'
import { cx } from '../lib/cx'
import { BlockProgram } from './BlockProgram'

// Картинки, загруженные на бэкенд, хранятся как /uploads/... — подставляем адрес API
const urlTransform = (url: string) => defaultUrlTransform(url.startsWith('/uploads/') ? (mediaUrl(url) ?? url) : url)

// ```blocks — блочная программа Scratch / MakeCode, записанная текстом
const components: Components = {
  pre({ children, node: _node, ...rest }) {
    void _node
    const code = (Array.isArray(children) ? children[0] : children) as ReactNode
    if (isValidElement(code)) {
      const el = code as ReactElement<{ className?: string; children?: ReactNode }>
      if (el.props.className?.includes('language-blocks')) return <BlockProgram source={String(el.props.children ?? '')} />
    }
    return <pre {...rest}>{children}</pre>
  },
}

export function Markdown({ children, className }: { children: string; className?: string }) {
  if (!children.trim()) return null
  return (
    <div
      className={cx(
        'prose max-w-none text-[length:inherit] leading-[inherit] text-brand-ink prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-brand-ink prose-p:text-brand-ink prose-li:text-brand-ink prose-strong:text-brand-ink prose-a:text-brand-blue prose-code:rounded-md prose-code:bg-brand-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-code:text-brand-blue-hover prose-code:before:content-none prose-code:after:content-none prose-pre:rounded-card prose-pre:bg-brand-night prose-pre:font-mono prose-pre:text-white [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-white prose-img:rounded-card prose-th:bg-brand-mist prose-th:px-3 prose-td:px-3',
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={urlTransform} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
