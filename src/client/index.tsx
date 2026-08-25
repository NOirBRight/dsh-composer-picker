/**
 * Browser half: composer model seat + optional execution-model adapters.
 */

import type { ModelSelection } from '@deepseek-ai/dsh-api-remotes/client'
import type { ClientContext, PendingWait } from '@deepseek-ai/dsh-client-runtime/client'
import type { ComposerChainProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-model-selection/client'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { selectPlanReview } from '../plan-review.ts'
import { ComposerPicker, type ComposerPickerProps } from './ComposerPicker.tsx'
import type { PickerInteractionOperations } from './popup-dismissal.ts'
import { CONTINUE_IN_DSH_SLOT, ContinueInDshAdapter, type ContinueInDshFace } from './ContinueInDshAdapter.tsx'
import { PlanReviewCard } from './PlanReviewCard.tsx'
import { en, zh, type PickerKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'composer-picker': PickerKey
  }
}

const NS = 'composer-picker'
const MODEL_PRIORITY = -1
const PLAN_REVIEW_PRIORITY = -5

function interactionOperationsFrom(ctx: ClientContext): PickerInteractionOperations | undefined {
  const holder = ctx as ClientContext & { get?(name: string, strict?: boolean): unknown; interactionOperations?: unknown }
  let value: unknown
  try { value = holder.get?.('interactionOperations', false) ?? holder.interactionOperations } catch { return undefined }
  if (value === null || typeof value !== 'object') return undefined
  const candidate = value as Partial<PickerInteractionOperations>
  return typeof candidate.registerSurface === 'function' ? candidate as PickerInteractionOperations : undefined
}

export const name = 'dsh-composer-picker-client'
export const inject = ['slots', 'locale', 'sessions']

function ModelSeat(
  props: ComposerPickerProps & PropsLocale<'composer-picker'> & Partial<PropsRuntime<'conversation.input.model'>>,
) {
  return (
    <ComposerPicker
      locked={props.locked}
      available={props.available}
      directory={props.directory}
      load={props.load}
      select={props.select}
      t={props.t}
      {...props.resolveInteractionOperations === undefined
        ? {}
        : { resolveInteractionOperations: props.resolveInteractionOperations }}
      {...props.useProjection === undefined ? {} : { useProjection: props.useProjection }}
    />
  )
}

export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-composer-picker: dictionaries')

  ctx.inject(['slots', 'modelDirectories', 'sessions'], (scope: ClientContext) => {
    const models = scope.modelDirectories
    const sessions = scope.sessions
    const resolveInteractionOperations = (): PickerInteractionOperations | undefined => interactionOperationsFrom(scope)

    scope.slots.inject('conversation.input.model', () => scope.slots.register({
      name: 'conversation.input.model',
      locale: NS,
      priority: MODEL_PRIORITY,
      inject: (sessionId): Pick<ComposerPickerProps, 'available' | 'directory' | 'load' | 'select' | 'resolveInteractionOperations'> => {
        const directory = models.directoryFor(sessionId)
        const available = sessions.subagentAddress(sessionId) === undefined
        return {
          available,
          directory: directory.store,
          resolveInteractionOperations,
          load: () => {
            if (available) directory.load().catch(() => { /* surfaced on the store */ })
          },
          select: (selection: ModelSelection) => available
            ? directory.select(selection).then(() => true, () => false)
            : Promise.resolve(false),
        }
      },
    }, ModelSeat))

    scope.slots.inject(CONTINUE_IN_DSH_SLOT, () => scope.slots.register({
      name: CONTINUE_IN_DSH_SLOT,
      locale: NS,
      inject: (sessionId): ContinueInDshFace => {
        const directory = models.directoryFor(sessionId)
        const available = sessions.subagentAddress(sessionId) === undefined
        return {
          available,
          directory: directory.store,
          resolveInteractionOperations,
          load: () => {
            if (available) directory.load().catch(() => { /* surfaced on the store */ })
          },
          select: (selection: ModelSelection) => available
            ? directory.select(selection).then(() => true, () => false)
            : Promise.resolve(false),
        }
      },
    }, ContinueInDshAdapter))

    function PlanSeat(
      props: PropsRuntime<'conversation.composer'>
        & { matched: ReturnType<typeof selectPlanReview> }
        & PropsLocale<'composer-picker'>,
    ) {
      if (props.matched === null) return null
      const directory = models.directoryFor(props.sessionId)
      const available = sessions.subagentAddress(props.sessionId) === undefined
      return (
        <PlanReviewCard
          key={(props.matched as PendingWait<'question'>).key}
          matched={props.matched as PendingWait<'question'>}
          available={available}
          directory={directory.store}
          load={() => {
            if (available) directory.load().catch(() => { /* surfaced on the store */ })
          }}
          select={(selection: ModelSelection) => available
            ? directory.select(selection).then(() => true, () => false)
            : Promise.resolve(false)}
          t={props.t}
          useProjection={props.useProjection}
          resolveInteractionOperations={resolveInteractionOperations}
        />
      )
    }

    scope.slots.inject('conversation.composer', () => scope.slots.register({
      name: 'conversation.composer',
      locale: NS,
      priority: PLAN_REVIEW_PRIORITY,
      select: (owner: ComposerChainProps) => selectPlanReview(owner),
    }, PlanSeat))
  })
}
