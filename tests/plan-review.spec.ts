import { describe, expect, it, vi } from 'vitest'
import { approvePlanReview, planReviewOf, selectPlanReview } from '../src/index.ts'

const reviewQuestion = {
  id: 'plan-review',
  question: 'Approve?',
  detail: '# Plan',
  options: [{ label: 'Approve' }, { label: 'Keep planning' }],
  intent: { kind: 'plan-review' as const, approve: 'Approve' },
}

describe('plugin-owned Plan Review', () => {
  it('claims only a binary plan-review question from the composer chain', () => {
    const wait = { kind: 'question', payload: { questions: [reviewQuestion] } }
    expect(selectPlanReview({ interactions: [{ kind: 'approval' }, wait] })).toBe(wait)
    expect(planReviewOf([reviewQuestion])?.plan).toBe('# Plan')
    expect(selectPlanReview({ interactions: [{ kind: 'question', payload: { questions: [{ id: 'q', question: 'Hi?' }] } }] })).toBeNull()
  })

  it('commits the selected execution model before answering Approve', async () => {
    const select = vi.fn(async () => true)
    const answer = vi.fn(async () => undefined)

    await expect(approvePlanReview({
      select,
      selection: { provider: 'codex', model: 'gpt-5.6-sol' },
      answer,
    })).resolves.toBe(true)

    expect(select.mock.invocationCallOrder[0]).toBeLessThan(answer.mock.invocationCallOrder[0]!)
  })

  it('keeps the pending review unanswered when execution-model commit fails', async () => {
    const answer = vi.fn(async () => undefined)

    await expect(approvePlanReview({
      select: async () => false,
      selection: { provider: 'codex', model: 'gpt-5.6-sol' },
      answer,
    })).resolves.toBe(false)
    expect(answer).not.toHaveBeenCalled()
  })
})
