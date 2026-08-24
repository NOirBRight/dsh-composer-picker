import { describe, expect, it, vi } from 'vitest'
import { approvePlanReview, planReviewOf, selectPlanReview } from '../src/plan-review.ts'

const reviewQuestion = {
  id: 'plan-review',
  question: 'Approve?',
  detail: '# Plan',
  options: [{ label: 'Approve' }, { label: 'Keep planning' }],
  intent: { kind: 'plan-review' as const, approve: 'Approve' },
}

describe('planReviewOf', () => {
  it('narrows a binary plan-review question', () => {
    expect(planReviewOf([reviewQuestion])).toEqual({
      id: 'plan-review',
      question: 'Approve?',
      plan: '# Plan',
      approve: { label: 'Approve' },
      decline: { label: 'Keep planning' },
    })
  })

  it('leaves generic questions and malformed reviews to the official composer', () => {
    expect(planReviewOf([{ id: 'q', question: 'Hi?' }])).toBeUndefined()
    expect(planReviewOf([{ ...reviewQuestion, intent: { kind: 'poll' } }])).toBeUndefined()
    expect(planReviewOf([reviewQuestion, reviewQuestion])).toBeUndefined()
    expect(planReviewOf([{ ...reviewQuestion, multiSelect: true }])).toBeUndefined()
    expect(planReviewOf([])).toBeUndefined()
  })
})

describe('selectPlanReview', () => {
  it('claims only a pending plan-review question wait', () => {
    const wait = { kind: 'question', payload: { questions: [reviewQuestion] } }
    expect(selectPlanReview({ interactions: [wait] })).toBe(wait)
  })

  it('does not claim generic questions, approvals, or subagent waits', () => {
    expect(selectPlanReview({
      interactions: [{ kind: 'question', payload: { questions: [{ id: 'q', question: 'Hi?' }] } }],
    })).toBeNull()
    expect(selectPlanReview({ interactions: [{ kind: 'approval', payload: {} }] })).toBeNull()
    expect(selectPlanReview({ interactions: [] })).toBeNull()
  })
})

describe('approvePlanReview', () => {
  it('answers only after a successful select', async () => {
    const select = vi.fn(async () => true)
    const answer = vi.fn(async () => undefined)
    await expect(approvePlanReview({
      select,
      selection: { provider: 'codex', model: 'gpt-5.6-sol' },
      answer,
    })).resolves.toBe(true)
    expect(select).toHaveBeenCalledOnce()
    expect(answer).toHaveBeenCalledOnce()
  })

  it('does not answer when select fails', async () => {
    const select = vi.fn(async () => false)
    const answer = vi.fn(async () => undefined)
    await expect(approvePlanReview({
      select,
      selection: { provider: 'codex', model: 'gpt-5.6-sol' },
      answer,
    })).resolves.toBe(false)
    expect(answer).not.toHaveBeenCalled()
  })
})
