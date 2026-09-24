# DSH 两套平面

3080 / `~/.dsh` 是工作空间：只安装 Release 的 GitHub 插件（`github:…#vX.Y.Z`）；只读，不为预览改/刷新/重启。
3082 / `~/.dsh-lab` 是测试空间：只安装 `link:` 到 Workstation checkout 的插件；验收、预览、重启只走这里。
完整约定：`/home/noirbright/Workstation/AGENTS.md`

## Freeze / Archive — 已冻结归档（不可发布 / 不可自动挂载）

本仓库已按 **freeze/archive**（非 tombstone）冻结归档，已被 [`dsh-model-switch`](https://github.com/NOirBRight/dsh-model-switch) 取代：

- 禁止任何新的产品实现、兼容适配、重构或文档之外的工作；禁止发版、打 tag、推 tag、改版本号或 `npm publish`（`package.json` 已设 `private: true`，`dsh.bundle` 已移除，`cordis.patch.yml` 已失活且不再包含于 `files`）。
- 本地安装不再自动注册旧的 Plan Review client；`v0.1.3` 只是最后发布并打 tag 的历史基线，当前保留的 worktree 还包含之后的历史源码/测试、可查阅的 `lib/` 构建产物及声明/原型残留，并非完整的 `v0.1.3` 快照。历史 patch 见 `git show v0.1.3:cordis.patch.yml`。
- 不要在此 checkout 执行包安装或构建命令：安装可能改变依赖状态，构建会覆写保留的 `lib/`（包括 `lib/types` 声明）。唯一例外：只有在直接人类（direct human）明确要求重新激活项目时，方可恢复开发与发布流程；在此之前所有改动仅限只读审计与封存说明。
- 已有 prototype 残留（`prototypes/`）与重建后的 `lib/types` 局部改动属于封存前现场，按指令保留，不在此次冻结中覆写或清理。

## Core 边界（只读）

本项目只维护插件：官方 [`deepseek-ai/deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness) 及其本地 checkout 是只读依赖。实现、兼容 Adapter、测试和构建配置留在本项目；禁止修改、携带或要求 DSH core patch。缺少公开 Interface、slot 或 RPC 时，记录缺失 seam 与上游提案，并让插件在干净的官方 tag 上降级或关闭该能力。

## 重新激活后的 DSH 版本兼容

- 官方 DSH Host 包（`@deepseek-ai/dsh` 及其工作区 `@deepseek-ai/dsh-*` 包）在 `package.json` 的 `dependencies`、`optionalDependencies`、`devDependencies`、`peerDependencies` 中使用无上界的下限范围 `>=<最早已验证兼容版本>`；锁文件可固定实际验证的版本。独立发布的插件依赖按其发布渠道声明。
- 声明兼容新 DSH release 前，审查其公开 API 变化与插件实际调用，运行相关测试和 `pnpm run build`，并在 3082（`DSH_HOME=~/.dsh-lab`）验证；全部通过后再宣称兼容。
