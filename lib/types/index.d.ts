/**
 * Host face: client-only plugin. The cordis patch still registers a Host id.
 */
import type { Context } from '@deepseek-ai/cordis';
export { parsePickerId, groupFamilies, selectPlanReview, planReviewOf, approvePlanReview } from './public.ts';
export declare const name = "dsh-composer-picker";
export declare const inject: string[];
export declare function apply(_ctx: Context): void;
//# sourceMappingURL=index.d.ts.map