/**
 * Plan-review composer takeover: markdown body, planning → execution handoff,
 * Discuss / Keep planning / Approve. Approve selects first, then answers.
 */

import { useEffect, useMemo, useState } from 'react'
import type { ModelSelection } from '@deepseek-ai/dsh-api-remotes/client'
import type { PendingWait } from '@deepseek-ai/dsh-client-runtime/client'
import { Button, IconEditOutline16, MarkdownText } from '@deepseek-ai/dsh-client-ui-primitives'
import { approvePlanReview, planReviewOf } from '../plan-review.ts'
import { findFamily, findMember, groupFamilies } from '../family.ts'
import { ComposerPicker, type PickerDirectoryStore } from './ComposerPicker.tsx'
import type { PickerInteractionOperations } from './popup-dismissal.ts'
import type { PickerKey } from './locales.ts'
import css from './PlanReviewCard.module.css'

type QuestionWait = PendingWait<'question'>

export interface PlanReviewCardProps {
  matched: QuestionWait
  directory: PickerDirectoryStore
  load: () => void
  select: (selection: ModelSelection) => Promise<boolean>
  t: (key: PickerKey, params?: Record<string, string>) => string
  useProjection: (key: string) => unknown
  locked?: boolean
  resolveInteractionOperations?: () => PickerInteractionOperations | undefined
}

async function respondApprove(wait: QuestionWait, id: string, label: string): Promise<void> {
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
  matched, directory, load, select, t, useProjection, locked = false, resolveInteractionOperations,
}: PlanReviewCardProps) {
  const review = useMemo(
    () => planReviewOf(matched.payload.questions as Parameters<typeof planReviewOf>[0]),
    [matched],
  )
  const [planning, setPlanning] = useState<ModelSelection | null>(directory.getSnapshot().current)
  const [execution, setExecution] = useState<ModelSelection | null>(directory.getSnapshot().current)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rev, setRev] = useState(0)

  useEffect(() => { load() }, [load])
  useEffect(() => directory.subscribe(() => {
    const current = directory.getSnapshot().current
    setRev(value => value + 1)
    if (current === null) return
    setPlanning(prev => prev ?? current)
    setExecution(prev => prev ?? current)
  }), [directory])

  if (review === undefined) return null

  const snapshot = directory.getSnapshot()
  void rev

  const families = groupFamilies(snapshot.groups)
  const planningFamily = planning === null ? undefined : findFamily(families, planning.provider, planning.model)
  const planningMember = planningFamily === undefined || planning === null
    ? undefined
    : findMember(planningFamily, planning.model)
  const planningLabel = planningFamily?.name ?? planningMember?.model.name ?? planning?.model ?? t('trigger.fallback')
  const planningEffort = planning?.reasoningEffort
    ?? planningMember?.model.reasoning?.defaultEffort
  const planningEffortLabel = planningEffort === undefined
    ? undefined
    : planningMember?.model.reasoning?.efforts.find(level => level.id === planningEffort)?.name ?? planningEffort

  const settle = (send: () => Promise<void>): void => {
    setBusy(true)
    setError(null)
    void send().catch((cause: unknown) => {
      setBusy(false)
      setError(cause instanceof Error ? cause.message : String(cause))
    })
  }

  const onApprove = (): void => {
    if (execution === null) return
    settle(async () => {
      const ok = await approvePlanReview({
        select,
        selection: execution,
        answer: () => respondApprove(matched, review.id, review.approve.label),
      })
      if (!ok) {
        const message = directory.getSnapshot().error ?? t('error.action', { message: 'select failed' })
        throw new Error(message)
      }
    })
  }

  const decline = review.decline

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
        <div className={css.handoff} aria-label={t('plan.handoff')}>
          <div className={css.seat}>
            <span className={css.seatLabel}>{t('plan.planning')}</span>
            <div className={css.frozen}>
              <span className={css.frozenName}>{planningLabel}</span>
              {planningEffortLabel !== undefined && (
                <span className={css.frozenEffort}>{planningEffortLabel}</span>
              )}
            </div>
          </div>
          <span className={css.arrow} aria-hidden="true">→</span>
          <div className={css.seat}>
            <span className={css.seatLabel}>{t('plan.execution')}</span>
            {execution !== null && (
              <ComposerPicker
                locked={locked || busy}
                available
                directory={directory}
                load={load}
                select={select}
                t={t}
                useProjection={useProjection}
                {...resolveInteractionOperations === undefined ? {} : { resolveInteractionOperations }}
                draft={execution}
                onDraftChange={setExecution}
                embedded
              />
            )}
          </div>
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
            {decline !== undefined && (
              <Button
                variant="ghost"
                disabled={busy}
                {...decline.description === undefined ? {} : { title: decline.description }}
                onClick={() => {
                  settle(() => respondApprove(matched, review.id, decline.label))
                }}
              >
                {t('plan.keep')}
              </Button>
            )}
            <Button disabled={busy || execution === null} onClick={onApprove}>
              {t('plan.approve')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
