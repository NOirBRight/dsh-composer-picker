/**
 * Composer model seat: suffix-grouped Model / Effort / Context / Fast / Thinking.
 */
import type { ModelSelection } from '@deepseek-ai/dsh-api-remotes/client';
import type { CatalogGroupView } from '../family.ts';
import type { PickerKey } from './locales.ts';
export interface PickerDirectorySnapshot {
    current: ModelSelection | null;
    groups: readonly CatalogGroupView[];
    failures: readonly {
        id: string;
        name: string;
        message: string;
    }[];
    status: string;
    error: string | null;
}
export interface PickerDirectoryStore {
    subscribe: (listener: () => void) => () => void;
    getSnapshot: () => PickerDirectorySnapshot;
}
export interface ComposerPickerExternalTarget {
    id: string;
    label: string;
    description?: string;
    disabled?: boolean;
}
export interface ComposerPickerProps {
    locked: boolean;
    available: boolean;
    directory: PickerDirectoryStore;
    load: () => void;
    select: (selection: ModelSelection) => Promise<boolean>;
    t: (key: PickerKey, params?: Record<string, string>) => string;
    useProjection?: (key: string) => unknown;
    draft?: ModelSelection;
    onDraftChange?: (selection: ModelSelection) => void;
    embedded?: boolean;
    externalTargets?: readonly ComposerPickerExternalTarget[];
    externalTargetsLabel?: string;
    externalSelection?: string;
    onExternalTargetChange?: (id: string | undefined) => void;
}
export interface ModelPaneHeaderProps {
    title: string;
    backLabel: string;
    searchLabel: string;
    closeSearchLabel: string;
    searchable: boolean;
    searching: boolean;
    query: string;
    onBack: () => void;
    onStartSearch: () => void;
    onCloseSearch: () => void;
    onQueryChange: (query: string) => void;
}
export declare function ModelPaneHeader({ title, backLabel, searchLabel, closeSearchLabel, searchable, searching, query, onBack, onStartSearch, onCloseSearch, onQueryChange, }: ModelPaneHeaderProps): import("react").JSX.Element;
export declare function ComposerPicker({ locked, available, directory, load, select, t, useProjection, draft, onDraftChange, embedded, externalTargets, externalTargetsLabel, externalSelection, onExternalTargetChange, }: ComposerPickerProps): import("react").JSX.Element | null;
//# sourceMappingURL=ComposerPicker.d.ts.map