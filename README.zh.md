# dsh-composer-picker

[English](README.md) | 中文

DeepSeek Harness 的纯客户端插件：用按档位后缀分组的 Picker 替换 composer 模型座位，并截获 `/plan` 审查卡，批准前可改执行模型。

**不** fork 官方 Core。分组只读目录行的 `id / name / description / reasoning`，运行时不依赖任何 provider 插件。

## 档位后缀

同一模型可以有多行。Picker 剥：

- `<base>-fast` — Fast 兄弟
- `<base>-1m` — 1M 上下文兄弟
- `<base>-<n>k` / `<base>-<n>m` — 通用上下文兄弟（272K、64K…）

`kimi-k3-max` 这类产品名不剥。codex / cursor / ollama 会在发 wire 前剥后缀并覆盖 `contextWindow`，让 DSH 更早压缩。Grok 目录也可以用同一套 id，本 Picker 仍按 base 分组。

面板行：**模型**（家族 + 本地搜索）/ **推理等级** / **上下文**（兄弟档；base 标「标准」）/ **Fast**（有 `-fast` 兄弟才出现）/ **思考**（仅真有开关兄弟）。提交 `{ provider, model, reasoningEffort }`，走官方 `session.selectModel` 目录。

窄屏底部弹层，宽屏贴触发器。菜单 portal 抬高 z-index，躲开 rc.2 Plan chip。

## 计划审查

第二条 `conversation.composer` 链，priority `-5`（子代理 `-10` 与 QuestionComposer `0` 之间），只匹配 `intent.kind === 'plan-review'`。普通提问、approval、子代理 composer 仍走官方。

卡片展示计划 markdown、只读规划模型、可改执行模型。**批准**先 `select(执行模型)`，成功后再 answer；select 失败不 answer。

与 `dsh-external-agents` 双装时，它的 priority `-6` Plan 路由卡先接管；本插件通过可选 `external-agents.plan-review.continue-in-dsh` child slot 贡献一个统一执行 Picker；DSH 模型和 Codex/Claude/Cursor/Antigravity Worker 出现在同一个模型列表里。external-agents 卸载或未安装时，本插件的 priority `-5` 卡自动恢复。

## 安装（lab）

~~~sh
pnpm install
pnpm run build
# link 进 lab web profile，不要写进 production ~/.dsh
~~~
