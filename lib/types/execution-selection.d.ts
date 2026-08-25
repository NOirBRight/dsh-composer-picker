import type { ModelSelection } from '@deepseek-ai/dsh-api-remotes/client';
import type { PickerDirectoryStore } from './client/ComposerPicker.tsx';
/** Commit the execution-model draft before official Plan Review approval. */
export declare function commitExecutionSelection(draft: ModelSelection | undefined, directory: PickerDirectoryStore, select: (selection: ModelSelection) => Promise<boolean>, fallbackError: string): Promise<void>;
//# sourceMappingURL=execution-selection.d.ts.map