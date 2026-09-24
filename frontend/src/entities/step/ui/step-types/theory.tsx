import { useRef, useState } from 'react'
import { mediaUrl, upload } from '@/shared/api'
import { Button, ErrorBox, Field, Input, Markdown } from '@/shared/ui'
import { list, str } from '../../lib/content'
import { MarkdownField } from '../common'
import type { StepTypeDef } from '../../model/types'

function toEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/)
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`
  const rt = url.match(/rutube\.ru\/video\/([\w]+)/)
  if (rt) return `https://rutube.ru/play/embed/${rt[1]}`
  const vk = url.match(/vk(?:video)?\.(?:com|ru)\/video(-?\d+)_(\d+)/)
  if (vk) return `https://vk.com/video_ext.php?oid=${vk[1]}&id=${vk[2]}`
  return null
}

interface StepImage {
  url: string
  alt?: string
}

/** Загрузка картинки на сервер и вставка её в Markdown */
function ImageUpload({ onUploaded }: { onUploaded: (url: string, name: string) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<Error>()
  return (
    <div className="space-y-2">
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file) return
          setBusy(true)
          setError(undefined)
          try {
            const res = await upload<{ url: string }>('/admin/uploads/images', file)
            onUploaded(res.url, file.name.replace(/\.[^.]+$/, ''))
          } catch (err) {
            setError(err as Error)
          } finally {
            setBusy(false)
          }
        }}
      />
      <Button type="button" size="sm" variant="secondary" loading={busy} onClick={() => input.current?.click()}>
        🖼 Вставить картинку
      </Button>
      <span className="ml-2 text-xs text-content-secondary">PNG, JPG, WEBP или GIF до 5 МБ</span>
      {error && <ErrorBox error={error} />}
    </div>
  )
}

export const theoryStep: StepTypeDef = {
  id: 'theory',
  kind: 'theory',
  label: 'Теория',
  description: 'Текст с картинками, примерами кода и видео. Засчитывается после прочтения.',
  icon: '📖',
  color: '#8B5CF6',
  check: 'none',
  defaultMaxScore: 0,
  defaultContent: () => ({ type: 'theory', markdown: '', video_url: '' }),

  Editor: ({ content, onChange }) => (
    <div className="space-y-4">
      <MarkdownField label="Материал" rows={14} value={str(content, 'markdown')} onChange={(markdown) => onChange({ ...content, markdown })} />
      <ImageUpload onUploaded={(url, alt) => onChange({ ...content, markdown: `${str(content, 'markdown').trimEnd()}\n\n![${alt}](${url})\n` })} />
      <Field label="Видео (необязательно)" hint="Ссылка на RuTube, VK Видео или YouTube">
        <Input value={str(content, 'video_url')} onChange={(e) => onChange({ ...content, video_url: e.target.value })} placeholder="https://rutube.ru/video/…" />
      </Field>
    </div>
  ),

  Player: ({ step, content, busy, complete }) => {
    const embed = toEmbed(str(content, 'video_url'))
    const passed = step.progress.status === 'passed'
    return (
      <div className="space-y-6">
        {embed && (
          <div className="aspect-video overflow-hidden rounded-3xl bg-black shadow-lg">
            <iframe src={embed} title={step.title} className="size-full" allow="encrypted-media; fullscreen" allowFullScreen />
          </div>
        )}
        <Markdown>{str(content, 'markdown') || str(content, 'text')}</Markdown>
        {list<StepImage>(content, 'images')
          .filter((img) => img?.url)
          .map((img, i) => (
            <figure key={i} className="overflow-hidden rounded-3xl bg-white/60 shadow-sm">
              <img src={mediaUrl(img.url) ?? img.url} alt={img.alt ?? ''} className="max-h-[420px] w-full object-cover" loading="lazy" />
              {img.alt && <figcaption className="px-5 py-3 text-sm text-content-secondary">{img.alt}</figcaption>}
            </figure>
          ))}
        <div className="pt-2">
          {passed ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/12 px-4 py-2 font-medium text-emerald-700">✓ Материал изучен</span>
          ) : (
            <Button onClick={complete} loading={busy}>
              Я изучил(а) материал
            </Button>
          )}
        </div>
      </div>
    )
  },
}
