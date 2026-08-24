import { describe, expect, it, vi } from 'vitest'
import { commitDshSelection } from '../src/continue-in-dsh.ts'

const current = { provider: 'codex', model: 'gpt-5.6-sol' }
const draft = { provider: 'ollama', model: 'qwen3' }
function directory(value = current) {
  return { subscribe: () => () => undefined, getSnapshot: () => ({ current: value, groups: [], failures: [], status: 'ready', error: null }) }
}

describe('ContinueInDshAdapter commit', () => {
  it('commits the picker draft instead of the planning model', async () => {
    const select = vi.fn(async () => true)
    await expect(commitDshSelection(draft, directory(), select)).resolves.toBe(true)
    expect(select).toHaveBeenCalledWith(draft)
  })

  it('falls back to the current model when no draft exists', async () => {
    const select = vi.fn(async () => true)
    await commitDshSelection(undefined, directory(), select)
    expect(select).toHaveBeenCalledWith(current)
  })

  it('fails closed when the directory has no model', async () => {
    const select = vi.fn(async () => true)
    await expect(commitDshSelection(undefined, directory(null as never), select)).resolves.toBe(false)
    expect(select).not.toHaveBeenCalled()
  })
})
