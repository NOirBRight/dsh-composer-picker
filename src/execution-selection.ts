import type { ModelSelection } from '@deepseek-ai/dsh-api-remotes/client'
import type { PickerDirectoryStore } from './client/ComposerPicker.tsx'

/** Commit the execution-model draft before official Plan Review approval. */
export async function commitExecutionSelection(
  draft: ModelSelection | undefined,
  directory: PickerDirectoryStore,
  select: (selection: ModelSelection) => Promise<boolean>,
  fallbackError: string,
): Promise<void> {
  const selection = draft ?? directory.getSnapshot().current ?? undefined
  if (selection === undefined) throw new Error(directory.getSnapshot().error ?? fallbackError)
  const accepted = await select(selection)
  if (!accepted) throw new Error(directory.getSnapshot().error ?? fallbackError)
}
