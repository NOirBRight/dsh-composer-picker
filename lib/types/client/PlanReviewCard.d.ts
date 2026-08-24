/**
 * Plan-review composer takeover: markdown body, planning → execution handoff,
 * Discuss / Keep planning / Approve. Approve selects first, then answers.
 */
import type { ModelSelection } from '@deepseek-ai/dsh-api-remotes/client';
import type { PendingWait } from '@deepseek-ai/dsh-client-runtime/client';
import { type PickerDirectoryStore } from './ComposerPicker.tsx';
import type { PickerInteractionOperations } from './popup-dismissal.ts';
import type { PickerKey } from './locales.ts';
type QuestionWait = PendingWait<'question'>;
export interface PlanReviewCardProps {
    matched: QuestionWait;
    directory: PickerDirectoryStore;
    load: () => void;
    select: (selection: ModelSelection) => Promise<boolean>;
    t: (key: PickerKey, params?: Record<string, string>) => string;
    useProjection: (key: string) => unknown;
    locked?: boolean;
    resolveInteractionOperations?: () => PickerInteractionOperations | undefined;
}
export declare function PlanReviewCard({ matched, directory, load, select, t, useProjection, locked, resolveInteractionOperations, }: PlanReviewCardProps): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=PlanReviewCard.d.ts.map