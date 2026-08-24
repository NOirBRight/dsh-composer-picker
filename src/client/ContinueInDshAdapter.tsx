/** Continue-in-DSH adapter contributed into external-agents' plan router slot. */

import { useEffect, useState } from 'react'
import type { ModelSelection } from '@deepseek-ai/dsh-api-remotes/client'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { commitDshSelection } from '../continue-in-dsh.ts'
import { ComposerPicker, type PickerDirectoryStore } from './ComposerPicker.tsx'

export const CONTINUE_IN_DSH_SLOT = 'external-agents.plan-review.continue-in-dsh' as const

export interface PlanWorkerTarget {
  id: string
  label: string
  description?: string
  disabled?: boolean
}

export interface ContinueInDshOwner {
  locked: boolean
  workers: readonly PlanWorkerTarget[]
  workersLabel: string
  selectedTarget: string
  selectTarget: (target: string) => void
  registerCommit: (commit: (() => Promise<boolean>) | null) => () => void
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    'external-agents.plan-review.continue-in-dsh': {
      kind: 'single'
      scope: 'session'
      owner: ContinueInDshOwner
    }
  }
}

export interface ContinueInDshFace {
  available: boolean
  directory: PickerDirectoryStore
  load: () => void
  select: (selection: ModelSelection) => Promise<boolean>
}

type Props = PropsRuntime<typeof CONTINUE_IN_DSH_SLOT>
  & PropsLocale<'composer-picker'>
  & ContinueInDshOwner
  & ContinueInDshFace

export function ContinueInDshAdapter(props: Props) {
  const [draft, setDraft] = useState<ModelSelection | undefined>()
  useEffect(() => props.registerCommit(
    () => commitDshSelection(draft, props.directory, props.select),
  ), [draft, props.directory, props.registerCommit, props.select])

  return <ComposerPicker
    locked={props.locked}
    available={props.available}
    directory={props.directory}
    load={props.load}
    select={props.select}
    t={props.t}
    useProjection={props.useProjection}
    {...draft === undefined ? {} : { draft }}
    onDraftChange={selection => { setDraft(selection); props.selectTarget('dsh') }}
    externalTargets={props.workers}
    externalTargetsLabel={props.workersLabel}
    {...props.selectedTarget === 'dsh' ? {} : { externalSelection: props.selectedTarget }}
    onExternalTargetChange={target => { props.selectTarget(target ?? 'dsh') }}
    embedded
  />
}
