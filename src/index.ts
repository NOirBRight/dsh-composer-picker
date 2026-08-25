/**
 * Host face: client-only plugin. The cordis patch still registers a Host id.
 */

import type { Context } from '@deepseek-ai/cordis'

export { parsePickerId, groupFamilies } from './public.ts'

export const name = 'dsh-composer-picker'
export const inject: string[] = []

export function apply(_ctx: Context): void {}
