import { ButtonLink } from '@/shared/ui'

export function NotFoundPage() {
  return (
    <div className="py-16 text-center">
      <div className="num text-8xl font-extrabold tracking-tight text-brand-blue">404</div>
      <h1 className="mt-4 text-2xl font-bold">Такой страницы нет</h1>
      <p className="mt-2 text-brand-ink-2">Возможно, ссылка устарела или в адресе опечатка.</p>
      <ButtonLink to="/" className="mt-6">
        На главную
      </ButtonLink>
    </div>
  )
}
