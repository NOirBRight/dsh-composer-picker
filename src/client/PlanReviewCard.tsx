import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import type { ModelSelection } from '@deepseek-ai/dsh-api-remotes/client'
import type { PendingWait } from '@deepseek-ai/dsh-client-runtime/client'
import { Button, IconEditOutline16, MarkdownText } from '@deepseek-ai/dsh-client-ui-primitives'
import { approvePlanReview, planReviewOf } from '../plan-review.ts'
import { ComposerPicker, type PickerDirectoryStore } from './ComposerPicker.tsx'
import type { PickerInteractionOperations } from './popup-dismissal.ts'
import type { PickerKey } from './locales.ts'
import css from './PlanReviewCard.module.css'

type QuestionWait = PendingWait<'question'>

export interface PlanReviewCardProps {
  matched: QuestionWait
  available: boolean
  directory: PickerDirectoryStore
  load: () => void
  select: (selection: ModelSelection) => Promise<boolean>
  t: (key: PickerKey, params?: Record<string, string>) => string
  useProjection: (key: string) => unknown
  locked?: boolean
  resolveInteractionOperations?: () => PickerInteractionOperations | undefined
}

async function respondAnswer(wait: QuestionWait, id: string, label: string): Promise<void> {
  const receipt = await wait.respond({
    ok: true,
    value: { sessionId: wait.sessionId, answer: { answers: [{ id, selected: [label] }] } },
  })
  if (!receipt.accepted) throw new Error(`question response rejected: ${receipt.reason}`)
}

async function respondCancel(wait: QuestionWait): Promise<void> {
  const receipt = await wait.respond({
    ok: false,
    error: { code: 'cancelled', message: 'the user closed this question request', details: {} },
  })
  if (!receipt.accepted) throw new Error(`question cancellation rejected: ${receipt.reason}`)
}

export function PlanReviewCard({
  matched, available, directory, load, select, t, useProjection, locked = false, resolveInteractionOperations,
}: PlanReviewCardProps) {
  const review = useMemo(
    () => planReviewOf(matched.payload.questions as Parameters<typeof planReviewOf>[0]),
    [matched],
  )
  const snapshot = useSyncExternalStore(directory.subscribe, directory.getSnapshot)
  const [execution, setExecution] = useState<ModelSelection | undefined>(snapshot.current ?? undefined)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (execution === undefined && snapshot.current !== null) setExecution(snapshot.current)
  }, [execution, snapshot.current])

  if (review === undefined) return null

  const settle = (send: () => Promise<void>): void => {
    setBusy(true)
    setError(null)
    void send().catch((cause: unknown) => {
      setBusy(false)
      setError(cause instanceof Error ? cause.message : String(cause))
    })
  }

  const onApprove = (): void => {
    if (execution === undefined || !available) return
    settle(async () => {
      const committed = await approvePlanReview({
        select,
        selection: execution,
        answer: () => respondAnswer(matched, review.id, review.approve.label),
      })
      if (!committed) {
        throw new Error(directory.getSnapshot().error ?? t('error.action', { message: 'select failed' }))
      }
    })
  }

  return (
    <div className={css.frame} data-plan-review-key={matched.key}>
      <section className={css.card} aria-label={review.question}>
        <header className={css.masthead}>
          <span className={css.kicker}>{t('plan.kicker')}</span>
          <h2 className={css.title}>{t('plan.header')}</h2>
        </header>
        <div className={css.body} data-plan-review-scroll>
          <MarkdownText text={review.plan} />
        </div>
        <div className={css.execution} aria-label={t('plan.execution')}>
          <span className={css.executionLabel}>{t('plan.execution')}</span>
          <ComposerPicker
            locked={locked || busy}
            available={available}
            directory={directory}
            load={load}
            select={select}
            t={t}
            useProjection={useProjection}
            {...resolveInteractionOperations === undefined ? {} : { resolveInteractionOperations }}
            {...execution === undefined ? {} : { draft: execution }}
            onDraftChange={setExecution}
            embedded
          />
        </div>
        <div className={css.footer}>
          <div className={css.feedback} role="status">{error}</div>
          <div className={css.actions}>
            <Button
              variant="ghost"
              className={css.discuss}
              icon={<IconEditOutline16 size={14} />}
              disabled={busy}
              onClick={() => { settle(() => respondCancel(matched)) }}
            >
              {t('plan.discuss')}
            </Button>
            {review.decline !== undefined && (
              <Button
                variant="ghost"
                disabled={busy}
                {...review.decline.description === undefined ? {} : { title: review.decline.description }}
                onClick={() => { settle(() => respondAnswer(matched, review.id, review.decline!.label)) }}
              >
                {t('plan.keep')}
              </Button>
            )}
            <Button disabled={busy || !available || execution === undefined} onClick={onApprove}>
              {t('plan.approve')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
