/** Continue-in-DSH adapter contributed into external-agents' plan router slot. */
import type { ModelSelection } from '@deepseek-ai/dsh-api-remotes/client';
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { type PickerDirectoryStore } from './ComposerPicker.tsx';
export declare const CONTINUE_IN_DSH_SLOT: "external-agents.plan-review.continue-in-dsh";
export interface PlanWorkerTarget {
    id: string;
    label: string;
    description?: string;
    disabled?: boolean;
}
export interface ContinueInDshOwner {
    locked: boolean;
    workers: readonly PlanWorkerTarget[];
    workersLabel: string;
    selectedTarget: string;
    selectTarget: (target: string) => void;
    registerCommit: (commit: (() => Promise<boolean>) | null) => () => void;
}
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface SlotMap {
        'external-agents.plan-review.continue-in-dsh': {
            kind: 'single';
            scope: 'session';
            owner: ContinueInDshOwner;
        };
    }
}
export interface ContinueInDshFace {
    available: boolean;
    directory: PickerDirectoryStore;
    load: () => void;
    select: (selection: ModelSelection) => Promise<boolean>;
}
type Props = PropsRuntime<typeof CONTINUE_IN_DSH_SLOT> & PropsLocale<'composer-picker'> & ContinueInDshOwner & ContinueInDshFace;
export declare function ContinueInDshAdapter(props: Props): import("react").JSX.Element;
export {};
//# sourceMappingURL=ContinueInDshAdapter.d.ts.map