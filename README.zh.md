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

面板行：**模型**（家族 + 本地搜索）/ **推理等级** / **上下文**（兄弟档；base 能确定窗口时直接显示 272K 等容量，否则显示「标准」）/ **Fast**（有 `-fast` 兄弟才出现）/ **思考**（仅真有开关兄弟）。提交 `{ provider, model, reasoningEffort }`，走官方 `session.selectModel` 目录。

窄屏底部弹层，宽屏贴触发器。portal 菜单通过 capture 阶段的外部 `pointerdown` 关闭；可选的 DSH Mobile Interaction Operations 服务存在时，同时注册为 popup surface。

## 计划审查

单独安装时，本插件通过官方 `conversation.composer` chain 以优先级 `-5` 提供完整的 Plan Review 卡片。卡片展示 Plan 和可编辑的执行模型 Picker，不依赖官方 Question 包中的模型专用 child slot。

点击**批准**会先提交 `select(执行模型)`。只有模型选择成功后才 answer 待处理审查；select 失败时显示错误并保持待处理，允许重试。

与 `dsh-external-agents` 双装时，其更高优先级的路由卡片会赢得 composer chain。本插件只通过插件自有的 `external-agents.plan-review.continue-in-dsh` slot 提供统一 Picker Adapter；DSH 模型和 Codex/Claude/Cursor/Antigravity Worker 出现在同一模型列表里。

## 安装（lab）

~~~sh
pnpm install
pnpm run build
# link 进 lab web profile，不要写进 production ~/.dsh
~~~
