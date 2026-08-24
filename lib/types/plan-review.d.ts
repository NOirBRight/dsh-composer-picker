/**
 * Plan-review takeover selector and approve sequencing. Copied shape of the
 * official plan-review narrow — not a runtime import of ui-user-questions.
 */
import type { ModelSelectionView } from './family.ts';
/** One option the asker offered on the reviewed question. */
export interface PlanReviewOption {
    label: string;
    description?: string;
}
/** Narrowed plan-review request the card can answer. */
export interface PlanReview {
    id: string;
    question: string;
    plan: string;
    approve: PlanReviewOption;
    decline?: PlanReviewOption;
}
interface QuestionItem {
    id: string;
    question: string;
    detail?: string;
    multiSelect?: boolean;
    options?: readonly PlanReviewOption[];
    intent?: {
        kind: string;
        approve?: string;
    };
}
interface QuestionWaitLike {
    kind: string;
    payload: {
        questions: readonly QuestionItem[];
    };
}
interface ComposerOwner {
    interactions: readonly {
        kind: string;
        payload?: unknown;
    }[];
}
/** Narrow a question batch to a renderable plan review. */
export declare function planReviewOf(questions: readonly QuestionItem[]): PlanReview | undefined;
/** Chain selector: claim only a pending plan-review question wait. */
export declare function selectPlanReview(owner: ComposerOwner): QuestionWaitLike | null;
/**
 * Approve order: select the execution model first; only then answer.
 * A failed select must not answer.
 */
export declare function approvePlanReview(args: {
    select: (selection: ModelSelectionView) => Promise<boolean>;
    selection: ModelSelectionView;
    answer: () => Promise<void>;
}): Promise<boolean>;
export {};
//# sourceMappingURL=plan-review.d.ts.map