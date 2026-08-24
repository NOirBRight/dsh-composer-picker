import type { ModelSelection } from '@deepseek-ai/dsh-api-remotes/client'
import type { PickerDirectoryStore } from './client/ComposerPicker.tsx'

/** Commit a chosen execution draft, falling back to the live current model. */
export async function commitDshSelection(
  draft: ModelSelection | undefined,
  directory: PickerDirectoryStore,
  select: (selection: ModelSelection) => Promise<boolean>,
): Promise<boolean> {
  const selection = draft ?? directory.getSnapshot().current ?? undefined
  return selection === undefined ? false : select(selection)
}
