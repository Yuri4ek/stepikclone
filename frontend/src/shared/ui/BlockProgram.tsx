import type { ReactNode } from 'react'


interface Line {
  depth: number
  text: string
  palette?: string
  note?: string
  end: boolean
}

function parse(src: string): Line[] {
  return src
    .replace(/\t/g, '    ')
    .split('\n')
    .filter((l) => l.trim())
    .map((raw) => {
      const depth = Math.floor((raw.length - raw.trimStart().length) / 4)
      let text = raw.trim()
      let note: string | undefined
      const arrow = text.indexOf('←')
      if (arrow > 0) {
        note = text.slice(arrow + 1).trim()
        text = text.slice(0, arrow).trim()
      }
      const m = text.match(/^\[([^\]]+)\]\s*(.*)$/)
      return { depth, text: m ? m[2] : text, palette: m?.[1], note, end: text === 'конец' }
    })
}


function renderText(text: string): ReactNode[] {
  return text.split(/(\([^()]*\)|<[^<>]*>)/g).map((part, i) => {
    if (/^\(.*\)$/.test(part)) {
      return (
        <span key={i} className="mx-0.5 inline-block rounded-full bg-white px-2 font-mono text-[0.9em] text-brand-ink ring-1 ring-brand-line">
          {part.slice(1, -1)}
        </span>
      )
    }
    if (/^<.*>$/.test(part)) {
      return (
        <span key={i} className="mx-0.5 inline-block rounded-md bg-white px-2 text-[0.9em] text-brand-ink ring-1 ring-brand-line [clip-path:polygon(6px_0,calc(100%-6px)_0,100%_50%,calc(100%-6px)_100%,6px_100%,0_50%)]">
          {part.slice(1, -1)}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export function BlockProgram({ source }: { source: string }) {
  const lines = parse(source)
  return (
    <figure className="not-prose my-5 overflow-x-auto rounded-card border border-brand-line bg-brand-mist p-4" aria-label="Блочная программа">
      <ol className="min-w-max space-y-1">
        {lines.map((l, i) => (
          <li key={i} className="flex items-center gap-3" style={{ paddingLeft: `${l.depth * 28}px` }}>
            {l.end ? (
              <span className="h-2.5 w-24 rounded-b-lg border-x-4 border-b-4 border-brand-blue-200" aria-label="конец" title="конец" />
            ) : (
              <span className="inline-flex items-center gap-2 rounded-btn border border-brand-blue-200 bg-brand-blue-50 px-3 py-1.5 text-[0.95em] leading-snug text-brand-ink shadow-[inset_4px_0_0_var(--brand-blue)]">
                {l.palette && <span className="rounded-md bg-white px-1.5 py-0.5 text-[0.75em] font-semibold tracking-wide text-brand-blue uppercase">{l.palette}</span>}
                <span>{renderText(l.text)}</span>
              </span>
            )}
            {l.note && <span className="text-sm whitespace-nowrap text-brand-ink-3">← {l.note}</span>}
          </li>
        ))}
      </ol>
    </figure>
  )
}
