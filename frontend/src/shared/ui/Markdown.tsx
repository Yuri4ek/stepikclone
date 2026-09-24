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
        'prose prose-slate max-w-none prose-headings:tracking-tight prose-a:text-brand-hover prose-code:rounded-md prose-code:bg-brand/8 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-code:text-brand-deep prose-code:before:content-none prose-code:after:content-none prose-pre:rounded-2xl prose-pre:bg-[#1B1E3F] prose-table:overflow-hidden prose-th:bg-brand/6 prose-td:border-0 prose-th:border-0 prose-headings:font-medium',
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={urlTransform}>{children}</ReactMarkdown>
    </div>
  )
}
