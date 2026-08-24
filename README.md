# dsh-composer-picker

[English](README.md) | [中文](README.zh.md)

Client-only DeepSeek Harness plugin that replaces the composer model seat with a suffix-grouped picker, and intercepts `/plan` review so you can pick the execution model before Approve.

It does **not** fork official Core. Catalog grouping is a pure function of picker ids (`id` / `name` / `description` / `reasoning`). There is no runtime dependency on any provider plugin.

## Suffix convention

Same model, multiple catalog rows. The picker peels:

- `<base>-fast` — Fast sibling
- `<base>-1m` — 1M context sibling
- `<base>-<n>k` / `<base>-<n>m` — generic context sibling (272K, 64K, …)

Product names such as `kimi-k3-max` are not peeled. Provider plugins (codex / cursor / ollama) peel the suffix on the wire and set `contextWindow` so DSH compactes earlier. Grok catalogs can use the same ids; this picker still groups them.

Panel rows: **Model** (family + local search) / **Effort** (current row `reasoning.efforts`) / **Context** (sibling tiers; base is 标准) / **Fast** (only when a `-fast` sibling exists) / **Thinking** (only when a real on/off sibling exists). Submit `{ provider, model, reasoningEffort }` through the official `session.selectModel` directory.

Narrow screens open a bottom sheet. Wide screens pin the menu to the trigger. The menu is portaled above the rc.2 Plan chip.

## Plan review

A second `conversation.composer` chain entry at priority `-5` (between subagent `-10` and QuestionComposer `0`) claims only `intent.kind === 'plan-review'`. Generic questions, approvals, and subagent composers stay official.

The card shows the plan markdown, a read-only planning model, and an editable execution picker. **Approve** calls `select(execution model)` first; only a successful select then answers the question. A failed select does not answer.

When `dsh-external-agents` is also installed, its priority `-6` Plan router owns the top-level card; this plugin contributes one unified execution picker through the optional `external-agents.plan-review.continue-in-dsh` child slot; DSH models and Codex/Claude/Cursor/Antigravity Workers appear in the same model list. Removing external-agents automatically restores this plugin's priority `-5` fallback card.

## Install (lab)

~~~sh
pnpm install
pnpm run build
# then link into the lab web profile, not production ~/.dsh
~~~
