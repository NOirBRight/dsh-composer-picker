import { describe, expect, it, vi } from 'vitest'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => {
  const Stub = () => null
  return {
    Button: Stub, Input: Stub, Toast: Stub, MarkdownText: Stub,
    IconCheckOutline16: Stub, IconChevronDownOutline14: Stub, IconChevronLeftOutline14: Stub,
    IconChevronRightOutline14: Stub, IconCloseOutline16: Stub, IconEditOutline16: Stub,
    IconSearchOutline16: Stub, IconWarningOutline16: Stub,
  }
})

import { CONTINUE_IN_DSH_SLOT } from '../src/client/ContinueInDshAdapter.tsx'
import { apply } from '../src/client/index.tsx'

function registrationBench() {
  const entries: Array<{ spec: Record<string, unknown>; component: unknown }> = []
  const slots = {
    inject: (_name: string, register: () => unknown) => register(),
    register: (spec: Record<string, unknown>, component: unknown) => {
      entries.push({ spec, component })
      return () => undefined
    },
  }
  const ctx = {
    locale: { register: vi.fn(() => () => undefined) },
    slots,
    modelDirectories: {},
    sessions: {},
    effect: (register: () => unknown) => register(),
    inject: (_services: readonly string[], register: (scope: unknown) => unknown) => register(ctx),
  }
  apply(ctx as never)
  return entries
}

describe('client plugin composition', () => {
  it('owns standalone Plan Review through the public composer chain at priority -5', () => {
    const entries = registrationBench()
    const planReview = entries.find(({ spec }) => spec.name === 'conversation.composer')

    expect(planReview?.spec.priority).toBe(-5)
    expect(typeof planReview?.spec.select).toBe('function')
  })

  it('contributes only its external-agents adapter beside the standalone owner', () => {
    const names = registrationBench().map(({ spec }) => spec.name)

    expect(names).toEqual([
      'conversation.input.model',
      CONTINUE_IN_DSH_SLOT,
      'conversation.composer',
    ])
  })
})
