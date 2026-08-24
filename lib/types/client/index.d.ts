/**
 * Browser half: composer model seat + plan-review takeover.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type PickerKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        'composer-picker': PickerKey;
    }
}
export declare const name = "dsh-composer-picker-client";
export declare const inject: string[];
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map