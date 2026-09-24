import { ButtonLink } from '@/shared/ui'

export function NotFoundPage() {
  return (
    <div className="py-16 text-center">
      <div className="text-brand-gradient text-8xl font-medium tracking-tight">404</div>
      <h1 className="mt-4 text-2xl font-medium">Такой страницы нет</h1>
      <p className="mt-2 text-content-secondary">Возможно, ссылка устарела или в адресе опечатка.</p>
      <ButtonLink to="/" className="mt-6">
        На главную
      </ButtonLink>
    </div>
  )
}
