/**
 * Plan-review takeover selector and approve sequencing. Copied shape of the
 * official plan-review narrow — not a runtime import of ui-user-questions.
 */

import type { ModelSelectionView } from './family.ts'

/** One option the asker offered on the reviewed question. */
export interface PlanReviewOption {
  label: string
  description?: string
}

/** Narrowed plan-review request the card can answer. */
export interface PlanReview {
  id: string
  question: string
  plan: string
  approve: PlanReviewOption
  decline?: PlanReviewOption
}

interface QuestionItem {
  id: string
  question: string
  detail?: string
  multiSelect?: boolean
  options?: readonly PlanReviewOption[]
  intent?: { kind: string, approve?: string }
}

interface QuestionWaitLike {
  kind: string
  payload: { questions: readonly QuestionItem[] }
}

interface ComposerOwner {
  interactions: readonly { kind: string, payload?: unknown }[]
}

/** Narrow a question batch to a renderable plan review. */
export function planReviewOf(questions: readonly QuestionItem[]): PlanReview | undefined {
  if (questions.length !== 1) return undefined
  const question = questions[0]
  if (question === undefined) return undefined
  const intent = question.intent
  if (intent?.kind !== 'plan-review' || question.detail === undefined) return undefined
  if (question.multiSelect === true) return undefined
  const options = question.options ?? []
  if (options.length > 2) return undefined
  const approve = options.find(option => option.label === intent.approve)
  if (approve === undefined) return undefined
  const decline = options.find(option => option.label !== intent.approve)
  return {
    id: question.id,
    question: question.question,
    plan: question.detail,
    approve,
    ...(decline === undefined ? {} : { decline }),
  }
}

function isQuestionWait(value: { kind: string, payload?: unknown }): value is QuestionWaitLike {
  if (value.kind !== 'question' || value.payload === undefined || typeof value.payload !== 'object' || value.payload === null) {
    return false
  }
  return Array.isArray((value.payload as { questions?: unknown }).questions)
}

/** Chain selector: claim only a pending plan-review question wait. */
export function selectPlanReview(owner: ComposerOwner): QuestionWaitLike | null {
  const wait = owner.interactions.find(isQuestionWait)
  if (wait === undefined) return null
  return planReviewOf(wait.payload.questions) === undefined ? null : wait
}

/**
 * Approve order: select the execution model first; only then answer.
 * A failed select must not answer.
 */
export async function approvePlanReview(args: {
  select: (selection: ModelSelectionView) => Promise<boolean>
  selection: ModelSelectionView
  answer: () => Promise<void>
}): Promise<boolean> {
  const ok = await args.select(args.selection)
  if (!ok) return false
  await args.answer()
  return true
}
