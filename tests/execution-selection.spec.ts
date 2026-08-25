import { describe, expect, it, vi } from 'vitest'
import { commitExecutionSelection } from '../src/execution-selection.ts'

const current = { provider: 'codex', model: 'gpt-5.6-sol' }
const draft = { provider: 'ollama', model: 'qwen3' }
function directory(value = current, error: string | null = null) {
  return {
    subscribe: () => () => undefined,
    getSnapshot: () => ({ current: value, groups: [], failures: [], status: 'ready', error }),
  }
}

describe('Plan Review execution selection', () => {
  it('commits the execution draft without exposing a planning model', async () => {
    const select = vi.fn(async () => true)
    await commitExecutionSelection(draft, directory(), select, 'selection failed')
    expect(select).toHaveBeenCalledWith(draft)
  })

  it('keeps approval pending when model selection fails', async () => {
    const select = vi.fn(async () => false)
    await expect(commitExecutionSelection(draft, directory(current, 'provider rejected model'), select, 'selection failed'))
      .rejects.toThrow('provider rejected model')
  })

  it('fails closed when neither a draft nor a current model exists', async () => {
    const select = vi.fn(async () => true)
    await expect(commitExecutionSelection(undefined, directory(null as never), select, 'selection failed'))
      .rejects.toThrow('selection failed')
    expect(select).not.toHaveBeenCalled()
  })
})
