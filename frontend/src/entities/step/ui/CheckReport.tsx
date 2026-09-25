import type { CheckResult, Verdict } from '@/shared/api'
import { cx, plural } from '@/shared/lib'
import { Icon } from '@/shared/ui'

const verdictText: Record<Verdict, string> = {
  OK: 'пройден',
  WA: 'неверный ответ',
  TLE: 'превышено время',
  RE: 'ошибка при выполнении',
  ML: 'превышена память',
}


export function CheckReport({ result, compact }: { result: CheckResult; compact?: boolean }) {
  const all = result.total > 0 && result.passed === result.total
  const firstFail = result.tests.find((t) => t.verdict !== 'OK')
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 font-semibold">
        <Icon name={all ? 'check' : 'x'} size={20} strokeWidth={2.2} className={all ? 'text-st-done' : 'text-st-failed'} />
        <span className="num">
          Прошло {result.passed} {plural(result.passed, 'тест', 'теста', 'тестов')} из {result.total}
        </span>
      </div>
      <ol className="flex flex-wrap gap-1.5" aria-label="Результаты по тестам">
        {result.tests.map((t) => (
          <li
            key={t.n}
            className={cx('num inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold', t.verdict === 'OK' ? 'bg-st-done text-white' : 'bg-white text-st-failed ring-1 ring-st-failed')}
            title={`Тест ${t.n}: ${verdictText[t.verdict]}${t.sample ? ' (пример из условия)' : ''} · ${t.time_ms} мс`}
          >
            <Icon name={t.verdict === 'OK' ? 'check' : 'x'} size={12} strokeWidth={2.6} />
            {t.n}
            {t.verdict !== 'OK' && <span className="font-sans">{t.verdict}</span>}
          </li>
        ))}
      </ol>
      {!compact && firstFail && (
        <div className="rounded-field bg-white p-4 text-sm">
          <div className="font-semibold">
            Тест {firstFail.n}: {verdictText[firstFail.verdict]}
            {!firstFail.sample && <span className="font-normal text-brand-ink-2"> — это скрытый тест, его данные не показываем. Подумай о крайних случаях: ноль, отрицательные числа, самые большие значения из ограничений.</span>}
          </div>
          {firstFail.sample && (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <div className="text-xs font-semibold text-brand-ink-2">Ввод</div>
                <pre className="mt-1 font-mono text-xs whitespace-pre-wrap">{firstFail.input || '(пусто)'}</pre>
              </div>
              <div>
                <div className="text-xs font-semibold text-brand-ink-2">Ожидалось</div>
                <pre className="mt-1 font-mono text-xs whitespace-pre-wrap">{firstFail.expected}</pre>
              </div>
              <div>
                <div className="text-xs font-semibold text-brand-ink-2">Получилось у тебя</div>
                <pre className="mt-1 font-mono text-xs whitespace-pre-wrap text-st-failed">{firstFail.actual || '(пусто)'}</pre>
              </div>
            </div>
          )}
          {firstFail.error && <pre className="mt-3 font-mono text-xs whitespace-pre-wrap text-st-failed">{firstFail.error}</pre>}
          {firstFail.verdict === 'TLE' && <p className="mt-2 text-brand-ink-2">Программа не уложилась в ограничение по времени. Посмотри на ограничения: может, есть решение без длинного цикла?</p>}
        </div>
      )}
    </div>
  )
}
