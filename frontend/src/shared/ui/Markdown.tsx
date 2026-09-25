import ReactMarkdown, { defaultUrlTransform } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { mediaUrl } from '../api/client'
import { cx } from '../lib/cx'

// Картинки, загруженные на бэкенд, хранятся как /uploads/... — подставляем адрес API
const urlTransform = (url: string) => defaultUrlTransform(url.startsWith('/uploads/') ? (mediaUrl(url) ?? url) : url)

export function Markdown({ children, className }: { children: string; className?: string }) {
  if (!children.trim()) return null
  return (
    <div
      className={cx(
        'prose max-w-none text-[length:inherit] leading-[inherit] text-brand-ink prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-brand-ink prose-p:text-brand-ink prose-li:text-brand-ink prose-strong:text-brand-ink prose-a:text-brand-blue prose-code:rounded-md prose-code:bg-brand-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-code:text-brand-blue-hover prose-code:before:content-none prose-code:after:content-none prose-pre:rounded-card prose-pre:bg-brand-night prose-pre:font-mono prose-img:rounded-card prose-th:bg-brand-mist prose-th:px-3 prose-td:px-3',
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={urlTransform}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
