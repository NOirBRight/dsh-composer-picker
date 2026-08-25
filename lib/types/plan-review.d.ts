import type { ModelSelection } from '@deepseek-ai/dsh-api-remotes/client';
export interface PlanReviewOption {
    label: string;
    description?: string;
}
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
export declare function planReviewOf(questions: readonly QuestionItem[]): PlanReview | undefined;
export declare function selectPlanReview(owner: ComposerOwner): QuestionWaitLike | null;
export declare function approvePlanReview(args: {
    select: (selection: ModelSelection) => Promise<boolean>;
    selection: ModelSelection;
    answer: () => Promise<void>;
}): Promise<boolean>;
export {};
//# sourceMappingURL=plan-review.d.ts.map