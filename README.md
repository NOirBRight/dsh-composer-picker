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

Panel rows: **Model** (family + local search) / **Effort** (current row `reasoning.efforts`) / **Context** (sibling tiers; the base shows its token window when known, otherwise Standard) / **Fast** (only when a `-fast` sibling exists) / **Thinking** (only when a real on/off sibling exists). Submit `{ provider, model, reasoningEffort }` through the official `session.selectModel` directory.

Narrow screens open a bottom sheet. Wide screens pin the menu to the trigger. The portaled menu closes on capture-phase outside pointer input and registers as a popup with DSH Mobile Interaction Operations when that optional service is present.

## Plan review

When installed alone, this plugin owns a complete Plan Review card through the official `conversation.composer` chain at priority `-5`. The card shows the Plan and an editable execution-model picker; it does not depend on a model-specific official Question child slot.

**Approve** commits `select(execution model)` first. Only a successful selection answers the pending review; a failed selection displays the error and leaves the review pending for retry.

When `dsh-external-agents` is installed, its higher-priority routing card wins the composer chain. This plugin contributes only its unified picker Adapter through the plugin-owned `external-agents.plan-review.continue-in-dsh` slot; DSH models and Codex/Claude/Cursor/Antigravity Workers appear in the same model list.

## Install (lab)

~~~sh
pnpm install
pnpm run build
# then link into the lab web profile, not production ~/.dsh
~~~
