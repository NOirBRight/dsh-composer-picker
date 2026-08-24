window.__ModuleLoader__.load({
	id: "dsh-composer-picker",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_dom = require("react-dom");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/plan-review.ts
		/** Narrow a question batch to a renderable plan review. */
		function planReviewOf(questions) {
			if (questions.length !== 1) return void 0;
			const question = questions[0];
			if (question === void 0) return void 0;
			const intent = question.intent;
			if (intent?.kind !== "plan-review" || question.detail === void 0) return void 0;
			if (question.multiSelect === true) return void 0;
			const options = question.options ?? [];
			if (options.length > 2) return void 0;
			const approve = options.find((option) => option.label === intent.approve);
			if (approve === void 0) return void 0;
			const decline = options.find((option) => option.label !== intent.approve);
			return {
				id: question.id,
				question: question.question,
				plan: question.detail,
				approve,
				...decline === void 0 ? {} : { decline }
			};
		}
		function isQuestionWait(value) {
			if (value.kind !== "question" || value.payload === void 0 || typeof value.payload !== "object" || value.payload === null) return false;
			return Array.isArray(value.payload.questions);
		}
		/** Chain selector: claim only a pending plan-review question wait. */
		function selectPlanReview(owner) {
			const wait = owner.interactions.find(isQuestionWait);
			if (wait === void 0) return null;
			return planReviewOf(wait.payload.questions) === void 0 ? null : wait;
		}
		/**
		* Approve order: select the execution model first; only then answer.
		* A failed select must not answer.
		*/
		async function approvePlanReview(args) {
			if (!await args.select(args.selection)) return false;
			await args.answer();
			return true;
		}
		const CONTEXT_SUFFIX = /-(\d+)(k|m)$/iu;
		/** Peel Fast and `-<n>k` / `-<n>m` in either order. Product names like `-max` stay. */
		function parsePickerId(id) {
			let rest = id;
			let fast = false;
			let contextTier = null;
			let contextTokens;
			for (;;) {
				if (rest.endsWith("-fast") && rest.length > 5) {
					rest = rest.slice(0, -5);
					fast = true;
					continue;
				}
				const match = CONTEXT_SUFFIX.exec(rest);
				if (match !== null && match.index > 0) {
					const n = Number(match[1]);
					const unit = match[2].toLowerCase();
					rest = rest.slice(0, match.index);
					contextTier = `${n}${unit}`;
					contextTokens = unit === "m" ? n * 1e6 : n * 1e3;
					continue;
				}
				break;
			}
			return {
				base: rest,
				fast,
				contextTier,
				...contextTokens === void 0 ? {} : { contextTokens }
			};
		}
		/** Human label for a context tier: 1M, 272K, or 标准 · 272K. */
		function contextTierLabel(tier, tokens) {
			if (tier === null) return tokens === void 0 ? "标准" : `标准 · ${formatWindow(tokens)}`;
			const match = /^(\d+)(k|m)$/iu.exec(tier);
			if (match !== null) return `${match[1]}${match[2].toUpperCase()}`;
			return tokens === void 0 ? tier : formatWindow(tokens);
		}
		/** Compact token window for trigger / context-cell copy. */
		function formatWindow(tokens) {
			if (tokens >= 1e6 && tokens % 1e6 === 0) return `${tokens / 1e6}M`;
			if (tokens >= 1e3 && tokens % 1e3 === 0) return `${tokens / 1e3}K`;
			if (tokens >= 1e3) return `${Math.round(tokens / 1e3)}K`;
			return String(tokens);
		}
		/** Standard-row window when the Host directory omits contextWindow. */
		function impliedStandardTokens(base) {
			if (/^gpt-5\.6(?:-|$)/u.test(base)) return 272e3;
		}
		function memberOf(model) {
			const parsed = parsePickerId(model.id);
			return {
				model,
				fast: parsed.fast,
				contextTier: parsed.contextTier,
				...parsed.contextTokens === void 0 ? {} : { contextTokens: parsed.contextTokens },
				thinking: model.reasoning !== void 0
			};
		}
		/** Group directory rows by provider + peeled base. */
		function groupFamilies(groups) {
			const families = [];
			const index = /* @__PURE__ */ new Map();
			for (const group of groups) for (const model of group.models) {
				const parsed = parsePickerId(model.id);
				const key = `${group.id}\0${parsed.base}`;
				let family = index.get(key);
				if (family === void 0) {
					family = {
						provider: group.id,
						providerName: group.name,
						base: parsed.base,
						name: displayNameOf(model.name, parsed),
						members: []
					};
					index.set(key, family);
					families.push(family);
				}
				family.members.push(memberOf(model));
				if (!parsed.fast && parsed.contextTier === null) family.name = displayNameOf(model.name, parsed);
			}
			return families;
		}
		/** Locate the family that owns a provider/model pair. */
		function findFamily(families, provider, modelId) {
			return families.find((family) => family.provider === provider && family.members.some((member) => member.model.id === modelId));
		}
		/** Locate one family member by catalog id. */
		function findMember(family, modelId) {
			return family.members.find((member) => member.model.id === modelId);
		}
		/** Pick a sibling after toggling Fast / context / thinking, keeping the other axes. */
		function pickVariant(family, current, patch) {
			const fast = patch.fast ?? current.fast;
			const contextTier = patch.contextTier !== void 0 ? patch.contextTier : current.contextTier;
			const thinking = patch.thinking ?? current.thinking;
			const exact = family.members.find((member) => member.fast === fast && member.contextTier === contextTier && member.thinking === thinking);
			if (exact !== void 0) return exact;
			const sameTier = family.members.find((member) => member.fast === fast && member.contextTier === contextTier);
			if (sameTier !== void 0) return sameTier;
			return family.members.find((member) => member.fast === fast) ?? family.members[0] ?? current;
		}
		/** Fast row appears only when both a Fast and a non-Fast sibling exist. */
		function familyHasFast(family) {
			return family.members.some((member) => member.fast) && family.members.some((member) => !member.fast);
		}
		function displayNameOf(name, parsed) {
			let next = name;
			if (parsed.fast) next = next.replace(/\s+Fast$/iu, "");
			if (parsed.contextTier !== null) next = next.replace(/\s+(?:Max|1M)$/iu, "");
			return next.replace(/\s+/gu, " ").trim() || name;
		}
		/** Provider sections in catalog order, for the model pane. */
		function sectionFamilies(families) {
			const sections = [];
			const index = /* @__PURE__ */ new Map();
			for (const family of families) {
				let section = index.get(family.provider);
				if (section === void 0) {
					section = {
						provider: family.provider,
						providerName: family.providerName,
						families: []
					};
					index.set(family.provider, section);
					sections.push(section);
				}
				section.families.push(family);
			}
			return sections;
		}
		/** Unique context tiers in catalog order. */
		function contextTiers(family, standardTokens) {
			const seen = /* @__PURE__ */ new Set();
			const rows = [];
			for (const member of family.members) {
				const key = member.contextTier ?? "";
				if (seen.has(key)) continue;
				seen.add(key);
				const tokens = member.contextTier === null ? member.contextTokens ?? standardTokens ?? impliedStandardTokens(family.base) : member.contextTokens;
				rows.push({
					tier: member.contextTier,
					label: contextTierLabel(member.contextTier, tokens),
					...tokens === void 0 ? {} : { tokens }
				});
			}
			return rows;
		}
		/** Context row appears only when the family has more than one tier. */
		function familyHasContextChoices(family) {
			return contextTiers(family).length > 1;
		}
		/** Thinking on/off siblings at the current Fast + context axes, or null. */
		function thinkingSiblings(family, current) {
			const on = family.members.find((member) => member.fast === current.fast && member.contextTier === current.contextTier && member.thinking);
			const off = family.members.find((member) => member.fast === current.fast && member.contextTier === current.contextTier && !member.thinking);
			if (on === void 0 || off === void 0) return null;
			return {
				on,
				off
			};
		}
		/** Case-insensitive local search over family name, base, and provider. */
		function filterFamilies(families, query) {
			const needle = query.trim().toLowerCase();
			if (needle.length === 0) return [...families];
			return families.filter((family) => family.name.toLowerCase().includes(needle) || family.base.toLowerCase().includes(needle) || family.providerName.toLowerCase().includes(needle) || family.members.some((member) => member.model.id.toLowerCase().includes(needle)));
		}
		/** Build a Host selection from a member, preserving or defaulting effort. */
		function selectionOf(family, member, reasoningEffort) {
			const effort = reasoningEffort ?? member.model.reasoning?.defaultEffort;
			return {
				provider: family.provider,
				model: member.model.id,
				...effort === void 0 ? {} : { reasoningEffort: effort }
			};
		}
		//#endregion
		//#region \0dsh-css:/home/noirbright/Workstation/dsh-composer-picker/src/client/ComposerPicker.module.css.mjs
		const css$1 = ".vzYOtq_root{min-width:0;position:relative}.vzYOtq_trigger{min-width:0;max-width:min(360px,45cqw);height:28px;color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xs-strong-13);cursor:pointer;background:0 0;border:none;border-radius:24px;outline:none;align-items:center;gap:4px;padding:0 4px 0 8px;display:flex}.vzYOtq_trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.vzYOtq_trigger:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-border-l3)}.vzYOtq_trigger:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}.vzYOtq_triggerLabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}.vzYOtq_triggerEffort{color:var(--dsw-alias-label-caption);flex:none}.vzYOtq_chevron{color:var(--dsw-alias-label-caption);transition:transform .12s var(--ds-ease-in-out);flex:none}.vzYOtq_chevronOpen{transform:rotate(180deg)}.vzYOtq_embedded{width:100%}.vzYOtq_embedded .vzYOtq_trigger{background:var(--dsw-alias-interactive-bg-hover);width:100%;max-width:none;height:36px;color:var(--dsw-alias-label-primary);border-radius:10px;justify-content:space-between;padding:0 10px}.vzYOtq_embedded .vzYOtq_trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.vzYOtq_menu{border:1px solid var(--dsw-alias-border-inverted);background:var(--dsw-specific-menu);width:max-content;min-width:min(240px,100vw - 32px);max-width:min(420px,100vw - 32px);max-height:min(360px,100vh - 96px);box-shadow:var(--dsw-shadow-lv3);color:var(--dsw-alias-label-primary);--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);border-radius:12px;flex-direction:column;padding:4px;display:flex;overflow:hidden}.vzYOtq_paneHeader{z-index:1;background:var(--dsw-specific-menu);flex:none;grid-template-columns:28px minmax(0,1fr) 28px;align-items:center;min-height:40px;padding:2px 4px;display:grid;position:sticky;top:0}.vzYOtq_paneHeader .vzYOtq_headerButton{width:28px;min-width:28px;color:var(--dsw-alias-label-secondary);padding:0}.vzYOtq_paneTitle{min-width:0;color:var(--dsw-alias-label-primary);font:var(--dsw-font-s-strong-14);text-align:center;text-overflow:ellipsis;white-space:nowrap;padding:0 8px;overflow:hidden}.vzYOtq_headerSearch{width:100%;min-width:0}.vzYOtq_status,.vzYOtq_empty{color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xs-13);padding:10px}.vzYOtq_error,.vzYOtq_warning{background:var(--dsw-alias-interactive-bg-hover-danger);color:var(--dsw-alias-state-error-primary);font:var(--dsw-font-xxs-12);border-radius:8px;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:4px;padding:7px 8px;display:flex}.vzYOtq_warning{background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-state-warn-label)}.vzYOtq_retry{color:inherit;font:var(--dsw-font-xxs-strong-12);cursor:pointer;background:0 0;border:none;flex:none;padding:0}.vzYOtq_groups{min-height:0;overflow-y:auto}.vzYOtq_group+.vzYOtq_group{margin-top:4px}.vzYOtq_groupTitle{z-index:1;background:var(--dsw-specific-menu);color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xxs-strong-12);padding:5px 8px 3px;position:sticky;top:0}.vzYOtq_option{box-sizing:border-box;width:auto;min-width:100%;min-height:38px;color:inherit;text-align:left;cursor:pointer;background:0 0;border:none;border-radius:10px;outline:none;align-items:center;gap:8px;padding:6px 8px;display:flex}.vzYOtq_option:hover:not(:disabled),.vzYOtq_option:focus-visible{background:var(--dsw-alias-interactive-bg-hover)}.vzYOtq_selected{background:0 0}.vzYOtq_option:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}.vzYOtq_optionCopy{flex-direction:column;flex:1;min-width:0;display:flex}.vzYOtq_modelName{color:inherit;font:var(--dsw-font-s-strong-14);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.vzYOtq_description{color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xxs-12);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.vzYOtq_check{color:var(--dsw-alias-label-primary);flex:0 0 18px;place-items:center;display:grid}.vzYOtq_cell{box-sizing:border-box;width:auto;min-width:100%;height:40px;color:var(--dsw-alias-label-primary);font:var(--dsw-font-s-14);cursor:pointer;text-align:left;background:0 0;border:none;border-radius:10px;align-items:center;gap:8px;padding:0 10px;display:flex}.vzYOtq_cell:hover{background:var(--dsw-alias-interactive-bg-hover)}.vzYOtq_cellLabel{white-space:nowrap;flex:none}.vzYOtq_cellValue{text-overflow:ellipsis;white-space:nowrap;text-align:right;min-width:0;color:var(--dsw-alias-label-tertiary);flex:auto;overflow:hidden}.vzYOtq_cellChevron{color:var(--dsw-alias-label-tertiary);flex:none}";
		const tagId$1 = "dsh-composer-picker/ComposerPicker.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-composer-picker";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var ComposerPicker_module_css_default = {
			"headerSearch": "vzYOtq_headerSearch",
			"optionCopy": "vzYOtq_optionCopy",
			"triggerLabel": "vzYOtq_triggerLabel",
			"embedded": "vzYOtq_embedded",
			"cellLabel": "vzYOtq_cellLabel",
			"description": "vzYOtq_description",
			"paneTitle": "vzYOtq_paneTitle",
			"groupTitle": "vzYOtq_groupTitle",
			"selected": "vzYOtq_selected",
			"check": "vzYOtq_check",
			"headerButton": "vzYOtq_headerButton",
			"empty": "vzYOtq_empty",
			"cellChevron": "vzYOtq_cellChevron",
			"menu": "vzYOtq_menu",
			"groups": "vzYOtq_groups",
			"chevron": "vzYOtq_chevron",
			"trigger": "vzYOtq_trigger",
			"retry": "vzYOtq_retry",
			"group": "vzYOtq_group",
			"option": "vzYOtq_option",
			"cellValue": "vzYOtq_cellValue",
			"warning": "vzYOtq_warning",
			"triggerEffort": "vzYOtq_triggerEffort",
			"modelName": "vzYOtq_modelName",
			"error": "vzYOtq_error",
			"status": "vzYOtq_status",
			"root": "vzYOtq_root",
			"paneHeader": "vzYOtq_paneHeader",
			"cell": "vzYOtq_cell",
			"chevronOpen": "vzYOtq_chevronOpen"
		};
		//#endregion
		//#region src/client/ComposerPicker.tsx
		/**
		* Composer model seat: suffix-grouped Model / Effort / Context / Fast / Thinking.
		*/
		function asContextWindow(value) {
			if (typeof value !== "object" || value === null) return void 0;
			const windowSize = value.contextWindow;
			return typeof windowSize === "number" && Number.isFinite(windowSize) ? windowSize : void 0;
		}
		function classNames(...parts) {
			return parts.filter((part) => typeof part === "string" && part.length > 0).join(" ");
		}
		function ModelPaneHeader({ title, backLabel, searchLabel, closeSearchLabel, searchable, searching, query, onBack, onStartSearch, onCloseSearch, onQueryChange }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: ComposerPicker_module_css_default.paneHeader,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "ghost",
						size: "sm",
						className: ComposerPicker_module_css_default.headerButton,
						icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronLeftOutline14, {}),
						"aria-label": backLabel,
						onClick: onBack
					}),
					searching ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
						className: ComposerPicker_module_css_default.headerSearch ?? "",
						type: "search",
						autoFocus: true,
						value: query,
						placeholder: searchLabel,
						"aria-label": searchLabel,
						onChange: (event) => {
							onQueryChange(event.currentTarget.value);
						}
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: ComposerPicker_module_css_default.paneTitle,
						children: title
					}),
					searchable ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "ghost",
						size: "sm",
						className: ComposerPicker_module_css_default.headerButton,
						icon: searching ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, {}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutline16, {}),
						"aria-label": searching ? closeSearchLabel : searchLabel,
						onClick: searching ? onCloseSearch : onStartSearch
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { "aria-hidden": true })
				]
			});
		}
		function ComposerPicker({ locked, available, directory, load, select, t, useProjection, draft, onDraftChange, embedded, externalTargets = [], externalTargetsLabel = "External Agents", externalSelection, onExternalTargetChange }) {
			const state = (0, react.useSyncExternalStore)((fn) => directory.subscribe(fn), () => directory.getSnapshot());
			const pressureWindow = asContextWindow(useProjection?.("contextPressure"));
			const [open, setOpen] = (0, react.useState)(false);
			const [pane, setPane] = (0, react.useState)("root");
			const [searching, setSearching] = (0, react.useState)(false);
			const [query, setQuery] = (0, react.useState)("");
			const [menuStyle, setMenuStyle] = (0, react.useState)({});
			const [toast, setToast] = (0, react.useState)(null);
			const toastSeq = (0, react.useRef)(0);
			const lastActionRef = (0, react.useRef)("load");
			const triggerRef = (0, react.useRef)(null);
			const menuRef = (0, react.useRef)(null);
			const id = (0, react.useId)();
			const families = (0, react.useMemo)(() => groupFamilies(state.groups), [state.groups]);
			const currentSelection = draft ?? state.current;
			const family = currentSelection === null ? void 0 : findFamily(families, currentSelection.provider, currentSelection.model);
			const member = family === void 0 || currentSelection === null ? void 0 : findMember(family, currentSelection.model);
			const reasoning = member?.model.reasoning;
			const effectiveEffort = currentSelection?.reasoningEffort ?? reasoning?.defaultEffort;
			const effortLabel = reasoning === void 0 ? void 0 : effectiveEffort === void 0 ? t("effort.providerDefault") : reasoning.efforts.find((level) => level.id === effectiveEffort)?.name ?? effectiveEffort;
			const standardTokens = member?.contextTier === null ? pressureWindow ?? (family === void 0 ? void 0 : impliedStandardTokens(family.base)) : family === void 0 ? void 0 : impliedStandardTokens(family.base);
			const contextLabel = member === void 0 ? void 0 : contextTierLabel(member.contextTier, member.contextTokens ?? standardTokens);
			const thinkingPair = family !== void 0 && member !== void 0 ? thinkingSiblings(family, member) : null;
			const visibleFamilies = (0, react.useMemo)(() => filterFamilies(families, query), [families, query]);
			const visibleExternalTargets = (0, react.useMemo)(() => {
				const needle = query.trim().toLowerCase();
				return needle.length === 0 ? externalTargets : externalTargets.filter((target) => target.label.toLowerCase().includes(needle) || target.description?.toLowerCase().includes(needle));
			}, [externalTargets, query]);
			const sections = (0, react.useMemo)(() => sectionFamilies(visibleFamilies), [visibleFamilies]);
			const busy = state.status === "selecting";
			const reload = () => {
				lastActionRef.current = "load";
				load();
			};
			(0, react.useEffect)(() => {
				if (available) {
					lastActionRef.current = "load";
					load();
				}
			}, [available, load]);
			(0, react.useLayoutEffect)(() => {
				if (!open) {
					setMenuStyle({ zIndex: 4e3 });
					return;
				}
				const trigger = triggerRef.current;
				if (trigger === null) return;
				const rect = trigger.getBoundingClientRect();
				const gutter = 8;
				const maxWidth = Math.min(420, window.innerWidth - 16);
				const right = Math.min(Math.max(gutter, window.innerWidth - rect.right), window.innerWidth - gutter - Math.min(240, maxWidth));
				setMenuStyle({
					position: "fixed",
					right: `${right}px`,
					bottom: `${Math.max(gutter, window.innerHeight - rect.top + gutter)}px`,
					zIndex: 4e3
				});
			}, [
				open,
				pane,
				embedded
			]);
			(0, react.useEffect)(() => {
				if (!open) return;
				const onPointer = (event) => {
					const target = event.target;
					if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
					setOpen(false);
				};
				document.addEventListener("mousedown", onPointer);
				return () => {
					document.removeEventListener("mousedown", onPointer);
				};
			}, [open]);
			if (!available && externalTargets.length === 0) return null;
			const close = (restoreFocus = false) => {
				setOpen(false);
				setPane("root");
				setSearching(false);
				setQuery("");
				if (restoreFocus) queueMicrotask(() => {
					triggerRef.current?.focus();
				});
			};
			const show = () => {
				setPane(embedded ? "model" : "root");
				setSearching(false);
				setQuery("");
				setOpen(true);
				reload();
			};
			const returnToRoot = () => {
				setPane("root");
				setSearching(false);
				setQuery("");
			};
			const settleSelection = (accepted) => {
				if (accepted) {
					returnToRoot();
					return;
				}
				const message = directory.getSnapshot().error;
				if (message !== null) {
					toastSeq.current += 1;
					setToast({
						seq: toastSeq.current,
						text: t("error.action", { message })
					});
				}
			};
			const applySelection = (next) => {
				onExternalTargetChange?.(void 0);
				if (onDraftChange !== void 0) {
					onDraftChange(next);
					returnToRoot();
					return;
				}
				if (state.current?.provider === next.provider && state.current.model === next.model && state.current.reasoningEffort === next.reasoningEffort) {
					returnToRoot();
					return;
				}
				lastActionRef.current = "select";
				select(next).then(settleSelection);
			};
			const chooseMember = (nextFamily, next, effort) => {
				applySelection(selectionOf(nextFamily, next, effort));
			};
			const chooseEffort = (effort) => {
				if (family === void 0 || member === void 0) return;
				applySelection(selectionOf(family, member, effort));
			};
			const selectedExternal = externalTargets.find((target) => target.id === externalSelection);
			const modelLabel = member?.model.name ?? family?.name ?? t("trigger.fallback");
			const effectiveLabel = selectedExternal?.label ?? modelLabel;
			const triggerLabel = selectedExternal !== void 0 || effortLabel === void 0 ? effectiveLabel : `${effectiveLabel} · ${effortLabel}`;
			const triggerAria = selectedExternal !== void 0 ? selectedExternal.label : member === void 0 ? t("trigger.selectAria") : effortLabel === void 0 ? t("trigger.aria", { model: modelLabel }) : t("trigger.ariaEffort", {
				model: modelLabel,
				effort: effortLabel
			});
			const onRootKeyDown = (event) => {
				if (event.key === "Escape" && open) {
					event.preventDefault();
					if (pane === "model" && searching) {
						setSearching(false);
						setQuery("");
					} else if (pane !== "root") returnToRoot();
					else close(true);
				}
			};
			const paneHeader = pane === "root" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ModelPaneHeader, {
				title: t({
					model: "menu.model",
					effort: "menu.effort",
					context: "menu.context",
					fast: "menu.fast",
					thinking: "menu.thinking"
				}[pane]),
				backLabel: t("menu.back"),
				searchLabel: t("menu.search"),
				closeSearchLabel: t("menu.closeSearch"),
				searchable: pane === "model",
				searching: pane === "model" && searching,
				query,
				onBack: returnToRoot,
				onStartSearch: () => {
					setSearching(true);
				},
				onCloseSearch: () => {
					setSearching(false);
					setQuery("");
				},
				onQueryChange: setQuery
			});
			const menu = open ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: menuRef,
				id: `${id}-menu`,
				className: ComposerPicker_module_css_default.menu,
				style: menuStyle,
				role: "menu",
				"aria-label": t("menu.aria"),
				"aria-busy": state.status === "loading" || busy,
				children: [
					paneHeader,
					pane === "root" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "menuitem",
							className: ComposerPicker_module_css_default.cell,
							onClick: () => {
								setPane("model");
								setSearching(false);
								setQuery("");
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ComposerPicker_module_css_default.cellLabel,
									children: t("menu.model")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ComposerPicker_module_css_default.cellValue,
									children: selectedExternal?.label ?? family?.name ?? modelLabel
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, { className: ComposerPicker_module_css_default.cellChevron })
							]
						}),
						selectedExternal === void 0 && reasoning !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "menuitem",
							className: ComposerPicker_module_css_default.cell,
							onClick: () => {
								setPane("effort");
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ComposerPicker_module_css_default.cellLabel,
									children: t("menu.effort")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ComposerPicker_module_css_default.cellValue,
									children: effortLabel
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, { className: ComposerPicker_module_css_default.cellChevron })
							]
						}),
						selectedExternal === void 0 && family !== void 0 && familyHasContextChoices(family) && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "menuitem",
							className: ComposerPicker_module_css_default.cell,
							onClick: () => {
								setPane("context");
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ComposerPicker_module_css_default.cellLabel,
									children: t("menu.context")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ComposerPicker_module_css_default.cellValue,
									children: contextLabel
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, { className: ComposerPicker_module_css_default.cellChevron })
							]
						}),
						selectedExternal === void 0 && family !== void 0 && familyHasFast(family) && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "menuitem",
							className: ComposerPicker_module_css_default.cell,
							onClick: () => {
								setPane("fast");
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ComposerPicker_module_css_default.cellLabel,
									children: t("menu.fast")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ComposerPicker_module_css_default.cellValue,
									children: member?.fast === true ? t("fast.on") : t("fast.off")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, { className: ComposerPicker_module_css_default.cellChevron })
							]
						}),
						selectedExternal === void 0 && thinkingPair !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "menuitem",
							className: ComposerPicker_module_css_default.cell,
							onClick: () => {
								setPane("thinking");
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ComposerPicker_module_css_default.cellLabel,
									children: t("menu.thinking")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ComposerPicker_module_css_default.cellValue,
									children: member?.thinking === true ? t("thinking.on") : t("thinking.off")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, { className: ComposerPicker_module_css_default.cellChevron })
							]
						})
					] }),
					pane === "model" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						state.status === "loading" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: ComposerPicker_module_css_default.status,
							children: t("status.loading")
						}),
						state.error !== null && lastActionRef.current === "load" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: ComposerPicker_module_css_default.error,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("error.action", { message: state.error }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: ComposerPicker_module_css_default.retry,
								onClick: reload,
								children: t("retry")
							})]
						}),
						state.failures.map((failure) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: ComposerPicker_module_css_default.warning,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("warning.groupLoad", {
								name: failure.name,
								message: failure.message
							}) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: ComposerPicker_module_css_default.retry,
								onClick: reload,
								children: t("retry")
							})]
						}, failure.id)),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: classNames(ComposerPicker_module_css_default.groups, "scrollable"),
							children: [visibleExternalTargets.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
								role: "group",
								"aria-label": externalTargetsLabel,
								className: ComposerPicker_module_css_default.group,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: ComposerPicker_module_css_default.groupTitle,
									children: externalTargetsLabel
								}), visibleExternalTargets.map((target) => {
									const selected = externalSelection === target.id;
									return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										role: "menuitemradio",
										"aria-checked": selected,
										className: classNames(ComposerPicker_module_css_default.option, selected && ComposerPicker_module_css_default.selected),
										disabled: busy || target.disabled === true,
										onClick: () => {
											onExternalTargetChange?.(target.id);
											if (embedded) close();
											else returnToRoot();
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: ComposerPicker_module_css_default.optionCopy,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: ComposerPicker_module_css_default.modelName,
												children: target.label
											}), target.description !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: ComposerPicker_module_css_default.description,
												children: target.description
											})]
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: ComposerPicker_module_css_default.check,
											children: selected ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCheckOutline16, {}) : null
										})]
									}, `external:${target.id}`);
								})]
							}), sections.map((section) => {
								const headingId = `${id}-${section.provider}`;
								return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
									role: "group",
									"aria-labelledby": headingId,
									className: ComposerPicker_module_css_default.group,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: ComposerPicker_module_css_default.groupTitle,
										id: headingId,
										children: section.providerName
									}), section.families.map((item) => {
										const selected = currentSelection?.provider === item.provider && item.members.some((entry) => entry.model.id === currentSelection.model);
										return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											role: "menuitemradio",
											"aria-checked": selected,
											className: classNames(ComposerPicker_module_css_default.option, selected && ComposerPicker_module_css_default.selected),
											disabled: busy,
											onClick: () => {
												const current = member !== void 0 && family?.provider === item.provider && family.base === item.base ? member : item.members.find((entry) => !entry.fast && entry.contextTier === null) ?? item.members[0];
												if (current === void 0) return;
												chooseMember(item, current);
											},
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: ComposerPicker_module_css_default.optionCopy,
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: ComposerPicker_module_css_default.modelName,
													children: item.name
												})
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: ComposerPicker_module_css_default.check,
												children: selected ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCheckOutline16, {}) : null
											})]
										}, `${item.provider}:${item.base}`);
									})]
								}, section.provider);
							})]
						}),
						state.status === "ready" && visibleFamilies.length === 0 && visibleExternalTargets.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: ComposerPicker_module_css_default.empty,
							children: t("empty.models")
						})
					] }),
					pane === "effort" && (reasoning === void 0 || reasoning.efforts.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: ComposerPicker_module_css_default.empty,
						children: t("empty.efforts")
					}) : reasoning.efforts.map((level) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						role: "menuitemradio",
						"aria-checked": effectiveEffort === level.id,
						className: classNames(ComposerPicker_module_css_default.option, effectiveEffort === level.id && ComposerPicker_module_css_default.selected),
						disabled: busy,
						onClick: () => {
							chooseEffort(level.id);
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: ComposerPicker_module_css_default.optionCopy,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: ComposerPicker_module_css_default.modelName,
								children: level.name
							}), level.description !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: ComposerPicker_module_css_default.description,
								children: level.description
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: ComposerPicker_module_css_default.check,
							children: effectiveEffort === level.id ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCheckOutline16, {}) : null
						})]
					}, level.id))),
					pane === "context" && family !== void 0 && member !== void 0 && contextTiers(family, standardTokens).map((row) => {
						const selected = member.contextTier === row.tier;
						return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "menuitemradio",
							"aria-checked": selected,
							className: classNames(ComposerPicker_module_css_default.option, selected && ComposerPicker_module_css_default.selected),
							disabled: busy,
							onClick: () => {
								chooseMember(family, pickVariant(family, member, { contextTier: row.tier }), effectiveEffort);
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: ComposerPicker_module_css_default.optionCopy,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ComposerPicker_module_css_default.modelName,
									children: row.label
								})
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: ComposerPicker_module_css_default.check,
								children: selected ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCheckOutline16, {}) : null
							})]
						}, row.tier ?? "standard");
					}),
					pane === "fast" && family !== void 0 && member !== void 0 && [false, true].map((fast) => {
						const selected = member.fast === fast;
						return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "menuitemradio",
							"aria-checked": selected,
							className: classNames(ComposerPicker_module_css_default.option, selected && ComposerPicker_module_css_default.selected),
							disabled: busy,
							onClick: () => {
								chooseMember(family, pickVariant(family, member, { fast }), effectiveEffort);
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: ComposerPicker_module_css_default.optionCopy,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ComposerPicker_module_css_default.modelName,
									children: fast ? t("fast.on") : t("fast.off")
								})
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: ComposerPicker_module_css_default.check,
								children: selected ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCheckOutline16, {}) : null
							})]
						}, fast ? "on" : "off");
					}),
					pane === "thinking" && family !== void 0 && member !== void 0 && thinkingPair !== null && [{
						on: true,
						row: thinkingPair.on
					}, {
						on: false,
						row: thinkingPair.off
					}].map((choice) => {
						const selected = member.thinking === choice.on;
						return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "menuitemradio",
							"aria-checked": selected,
							className: classNames(ComposerPicker_module_css_default.option, selected && ComposerPicker_module_css_default.selected),
							disabled: busy,
							onClick: () => {
								chooseMember(family, choice.row, effectiveEffort);
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: ComposerPicker_module_css_default.optionCopy,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ComposerPicker_module_css_default.modelName,
									children: choice.on ? t("thinking.on") : t("thinking.off")
								})
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: ComposerPicker_module_css_default.check,
								children: selected ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCheckOutline16, {}) : null
							})]
						}, choice.on ? "on" : "off");
					})
				]
			}) : null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: classNames(ComposerPicker_module_css_default.root, embedded && ComposerPicker_module_css_default.embedded),
				onKeyDown: onRootKeyDown,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						ref: triggerRef,
						type: "button",
						className: ComposerPicker_module_css_default.trigger,
						"aria-label": triggerAria,
						"aria-haspopup": "menu",
						"aria-expanded": open,
						"aria-controls": open ? `${id}-menu` : void 0,
						title: triggerLabel,
						disabled: locked,
						onClick: () => {
							if (open) close();
							else show();
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: ComposerPicker_module_css_default.triggerLabel,
								children: selectedExternal?.label ?? family?.name ?? modelLabel
							}),
							selectedExternal === void 0 && effortLabel !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: ComposerPicker_module_css_default.triggerEffort,
								children: effortLabel
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { className: classNames(ComposerPicker_module_css_default.chevron, open && ComposerPicker_module_css_default.chevronOpen) })
						]
					}),
					menu !== null && (0, react_dom.createPortal)(menu, document.body),
					toast !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Toast, {
						text: toast.text,
						icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconWarningOutline16, {}),
						anchor: triggerRef.current?.closest("[data-composer-card]") ?? null,
						onDone: () => {
							setToast(null);
						}
					}, toast.seq)
				]
			});
		}
		//#endregion
		//#region src/continue-in-dsh.ts
		/** Commit a chosen execution draft, falling back to the live current model. */
		async function commitDshSelection(draft, directory, select) {
			const selection = draft ?? directory.getSnapshot().current ?? void 0;
			return selection === void 0 ? false : select(selection);
		}
		//#endregion
		//#region src/client/ContinueInDshAdapter.tsx
		/** Continue-in-DSH adapter contributed into external-agents' plan router slot. */
		const CONTINUE_IN_DSH_SLOT = "external-agents.plan-review.continue-in-dsh";
		function ContinueInDshAdapter(props) {
			const [draft, setDraft] = (0, react.useState)();
			(0, react.useEffect)(() => props.registerCommit(() => commitDshSelection(draft, props.directory, props.select)), [
				draft,
				props.directory,
				props.registerCommit,
				props.select
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ComposerPicker, {
				locked: props.locked,
				available: props.available,
				directory: props.directory,
				load: props.load,
				select: props.select,
				t: props.t,
				useProjection: props.useProjection,
				...draft === void 0 ? {} : { draft },
				onDraftChange: (selection) => {
					setDraft(selection);
					props.selectTarget("dsh");
				},
				externalTargets: props.workers,
				externalTargetsLabel: props.workersLabel,
				...props.selectedTarget === "dsh" ? {} : { externalSelection: props.selectedTarget },
				onExternalTargetChange: (target) => {
					props.selectTarget(target ?? "dsh");
				},
				embedded: true
			});
		}
		//#endregion
		//#region \0dsh-css:/home/noirbright/Workstation/dsh-composer-picker/src/client/PlanReviewCard.module.css.mjs
		const css = ".IJCTBG_frame{padding:6px calc(var(--dsh-composer-side-clearance) + 16px) 10px;justify-content:center;display:flex}.IJCTBG_card{width:100%;max-width:var(--dsh-chat-content-width);border:1px solid var(--dsw-alias-border-inverted);background:var(--dsw-specific-input-major);max-height:min(70vh,640px);box-shadow:var(--dsw-shadow-lv2);color:var(--dsw-alias-label-primary);--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);border-radius:16px;flex-direction:column;display:flex;overflow:hidden}.IJCTBG_card,.IJCTBG_card *{box-sizing:border-box}.IJCTBG_masthead{border-bottom:1px solid var(--dsw-alias-border-inverted);flex-direction:column;flex-shrink:0;gap:2px;padding:14px 16px 8px;display:flex}.IJCTBG_kicker{color:var(--dsw-alias-label-caption);letter-spacing:.08em;text-transform:uppercase;font-size:11px;font-weight:600;line-height:16px}.IJCTBG_title{color:var(--dsw-alias-label-primary);margin:0;font-size:15px;font-weight:600;line-height:22px}.IJCTBG_body{overscroll-behavior:contain;flex:auto;min-height:0;padding:12px 16px 8px;font-size:14px;line-height:22px;overflow-y:auto}.IJCTBG_handoff{border-top:1px solid var(--dsw-alias-border-inverted);background:var(--dsw-alias-bg-module-platform);flex-shrink:0;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:stretch;gap:8px;padding:10px 16px 8px;display:grid}.IJCTBG_seat{flex-direction:column;gap:6px;min-width:0;display:flex}.IJCTBG_seatLabel{color:var(--dsw-alias-label-caption);letter-spacing:.04em;font-size:11px;font-weight:600;line-height:16px}.IJCTBG_frozen{border:1px dashed var(--dsw-alias-border-l2);min-height:36px;color:var(--dsw-alias-label-secondary);border-radius:10px;align-items:center;gap:6px;padding:0 10px;display:flex}.IJCTBG_frozenName{text-overflow:ellipsis;white-space:nowrap;min-width:0;font-size:13px;font-weight:500;line-height:20px;overflow:hidden}.IJCTBG_frozenEffort{color:var(--dsw-alias-label-caption);flex:none;font-size:12px;line-height:18px}.IJCTBG_arrow{color:var(--dsw-alias-label-caption);align-self:end;padding-bottom:8px;font-size:16px;line-height:20px}.IJCTBG_footer{flex-shrink:0;justify-content:space-between;align-items:center;gap:12px;padding:8px 16px 12px;display:flex}.IJCTBG_feedback{min-height:16px;color:var(--dsw-alias-state-error-primary);font-size:11px;line-height:16px}.IJCTBG_actions{flex-shrink:0;align-items:center;gap:8px;display:flex}.IJCTBG_discuss{color:var(--dsw-alias-label-secondary);gap:6px}.IJCTBG_discuss:hover:not(:disabled){color:var(--dsw-alias-label-primary)}@media (width<=720px){.IJCTBG_card{border-radius:14px}.IJCTBG_masthead,.IJCTBG_body,.IJCTBG_handoff,.IJCTBG_footer{padding-left:12px;padding-right:12px}.IJCTBG_handoff{grid-template-columns:minmax(0,1fr);gap:10px}.IJCTBG_arrow{display:none}.IJCTBG_footer{align-items:flex-end}}";
		const tagId = "dsh-composer-picker/PlanReviewCard.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-composer-picker";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var PlanReviewCard_module_css_default = {
			"discuss": "IJCTBG_discuss",
			"frozen": "IJCTBG_frozen",
			"handoff": "IJCTBG_handoff",
			"arrow": "IJCTBG_arrow",
			"masthead": "IJCTBG_masthead",
			"frozenEffort": "IJCTBG_frozenEffort",
			"actions": "IJCTBG_actions",
			"frozenName": "IJCTBG_frozenName",
			"seat": "IJCTBG_seat",
			"title": "IJCTBG_title",
			"frame": "IJCTBG_frame",
			"card": "IJCTBG_card",
			"footer": "IJCTBG_footer",
			"kicker": "IJCTBG_kicker",
			"body": "IJCTBG_body",
			"seatLabel": "IJCTBG_seatLabel",
			"feedback": "IJCTBG_feedback"
		};
		//#endregion
		//#region src/client/PlanReviewCard.tsx
		/**
		* Plan-review composer takeover: markdown body, planning → execution handoff,
		* Discuss / Keep planning / Approve. Approve selects first, then answers.
		*/
		async function respondApprove(wait, id, label) {
			const receipt = await wait.respond({
				ok: true,
				value: {
					sessionId: wait.sessionId,
					answer: { answers: [{
						id,
						selected: [label]
					}] }
				}
			});
			if (!receipt.accepted) throw new Error(`question response rejected: ${receipt.reason}`);
		}
		async function respondCancel(wait) {
			const receipt = await wait.respond({
				ok: false,
				error: {
					code: "cancelled",
					message: "the user closed this question request",
					details: {}
				}
			});
			if (!receipt.accepted) throw new Error(`question cancellation rejected: ${receipt.reason}`);
		}
		function PlanReviewCard({ matched, directory, load, select, t, useProjection, locked = false }) {
			const review = (0, react.useMemo)(() => planReviewOf(matched.payload.questions), [matched]);
			const [planning, setPlanning] = (0, react.useState)(directory.getSnapshot().current);
			const [execution, setExecution] = (0, react.useState)(directory.getSnapshot().current);
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const [rev, setRev] = (0, react.useState)(0);
			(0, react.useEffect)(() => {
				load();
			}, [load]);
			(0, react.useEffect)(() => directory.subscribe(() => {
				const current = directory.getSnapshot().current;
				setRev((value) => value + 1);
				if (current === null) return;
				setPlanning((prev) => prev ?? current);
				setExecution((prev) => prev ?? current);
			}), [directory]);
			if (review === void 0) return null;
			const families = groupFamilies(directory.getSnapshot().groups);
			const planningFamily = planning === null ? void 0 : findFamily(families, planning.provider, planning.model);
			const planningMember = planningFamily === void 0 || planning === null ? void 0 : findMember(planningFamily, planning.model);
			const planningLabel = planningFamily?.name ?? planningMember?.model.name ?? planning?.model ?? t("trigger.fallback");
			const planningEffort = planning?.reasoningEffort ?? planningMember?.model.reasoning?.defaultEffort;
			const planningEffortLabel = planningEffort === void 0 ? void 0 : planningMember?.model.reasoning?.efforts.find((level) => level.id === planningEffort)?.name ?? planningEffort;
			const settle = (send) => {
				setBusy(true);
				setError(null);
				send().catch((cause) => {
					setBusy(false);
					setError(cause instanceof Error ? cause.message : String(cause));
				});
			};
			const onApprove = () => {
				if (execution === null) return;
				settle(async () => {
					if (!await approvePlanReview({
						select,
						selection: execution,
						answer: () => respondApprove(matched, review.id, review.approve.label)
					})) {
						const message = directory.getSnapshot().error ?? t("error.action", { message: "select failed" });
						throw new Error(message);
					}
				});
			};
			const decline = review.decline;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: PlanReviewCard_module_css_default.frame,
				"data-plan-review-key": matched.key,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
					className: PlanReviewCard_module_css_default.card,
					"aria-label": review.question,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
							className: PlanReviewCard_module_css_default.masthead,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: PlanReviewCard_module_css_default.kicker,
								children: t("plan.kicker")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
								className: PlanReviewCard_module_css_default.title,
								children: t("plan.header")
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: PlanReviewCard_module_css_default.body,
							"data-plan-review-scroll": true,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MarkdownText, { text: review.plan })
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: PlanReviewCard_module_css_default.handoff,
							"aria-label": t("plan.handoff"),
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: PlanReviewCard_module_css_default.seat,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: PlanReviewCard_module_css_default.seatLabel,
										children: t("plan.planning")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: PlanReviewCard_module_css_default.frozen,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: PlanReviewCard_module_css_default.frozenName,
											children: planningLabel
										}), planningEffortLabel !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: PlanReviewCard_module_css_default.frozenEffort,
											children: planningEffortLabel
										})]
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: PlanReviewCard_module_css_default.arrow,
									"aria-hidden": "true",
									children: "→"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: PlanReviewCard_module_css_default.seat,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: PlanReviewCard_module_css_default.seatLabel,
										children: t("plan.execution")
									}), execution !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ComposerPicker, {
										locked: locked || busy,
										available: true,
										directory,
										load,
										select,
										t,
										useProjection,
										draft: execution,
										onDraftChange: setExecution,
										embedded: true
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: PlanReviewCard_module_css_default.footer,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: PlanReviewCard_module_css_default.feedback,
								role: "status",
								children: error
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: PlanReviewCard_module_css_default.actions,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "ghost",
										className: PlanReviewCard_module_css_default.discuss,
										icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEditOutline16, { size: 14 }),
										disabled: busy,
										onClick: () => {
											settle(() => respondCancel(matched));
										},
										children: t("plan.discuss")
									}),
									decline !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "ghost",
										disabled: busy,
										...decline.description === void 0 ? {} : { title: decline.description },
										onClick: () => {
											settle(() => respondApprove(matched, review.id, decline.label));
										},
										children: t("plan.keep")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										disabled: busy || execution === null,
										onClick: onApprove,
										children: t("plan.approve")
									})
								]
							})]
						})
					]
				})
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/** `composer-picker` namespace dictionaries. */
		const zh = {
			"trigger.fallback": "选择模型",
			"trigger.selectAria": "选择模型",
			"trigger.aria": "选择模型，当前 {model}",
			"trigger.ariaEffort": "选择模型，当前 {model}，推理等级 {effort}",
			"menu.aria": "模型档位",
			"menu.back": "返回模型设置",
			"menu.closeSearch": "关闭搜索",
			"menu.model": "模型",
			"menu.effort": "推理等级",
			"menu.context": "上下文",
			"menu.fast": "Fast",
			"menu.thinking": "思考",
			"menu.search": "搜索模型",
			"fast.on": "开",
			"fast.off": "关",
			"thinking.on": "开",
			"thinking.off": "关",
			"effort.providerDefault": "Default",
			"status.loading": "正在刷新模型列表…",
			"error.action": "模型操作失败：{message}",
			"action.reload": "重新加载",
			"retry": "重试",
			"warning.groupLoad": "{name} 加载失败：{message}",
			"empty.models": "没有可用的模型。",
			"empty.efforts": "当前模型未提供推理等级。",
			"plan.kicker": "Plan",
			"plan.header": "计划待审",
			"plan.handoff": "规划模型到执行模型",
			"plan.planning": "规划",
			"plan.execution": "执行",
			"plan.approve": "批准",
			"plan.keep": "继续规划",
			"plan.discuss": "讨论"
		};
		const en = {
			"trigger.fallback": "Select model",
			"trigger.selectAria": "Select model",
			"trigger.aria": "Select model, current {model}",
			"trigger.ariaEffort": "Select model, current {model}, reasoning effort {effort}",
			"menu.aria": "Model options",
			"menu.back": "Back to model settings",
			"menu.closeSearch": "Close search",
			"menu.model": "Model",
			"menu.effort": "Effort",
			"menu.context": "Context",
			"menu.fast": "Fast",
			"menu.thinking": "Thinking",
			"menu.search": "Search models",
			"fast.on": "On",
			"fast.off": "Off",
			"thinking.on": "On",
			"thinking.off": "Off",
			"effort.providerDefault": "Default",
			"status.loading": "Refreshing model list…",
			"error.action": "Model operation failed: {message}",
			"action.reload": "Reload",
			"retry": "Retry",
			"warning.groupLoad": "{name} failed to load: {message}",
			"empty.models": "No models available.",
			"empty.efforts": "This model provides no reasoning effort levels.",
			"plan.kicker": "Plan",
			"plan.header": "Plan review",
			"plan.handoff": "Planning model to execution model",
			"plan.planning": "Planning",
			"plan.execution": "Execution",
			"plan.approve": "Approve",
			"plan.keep": "Keep planning",
			"plan.discuss": "Discuss"
		};
		//#endregion
		//#region src/client/index.tsx
		const NS = "composer-picker";
		const MODEL_PRIORITY = -1;
		const PLAN_REVIEW_PRIORITY = -5;
		const name = "dsh-composer-picker-client";
		const inject = [
			"slots",
			"locale",
			"sessions"
		];
		function ModelSeat(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ComposerPicker, {
				locked: props.locked,
				available: props.available,
				directory: props.directory,
				load: props.load,
				select: props.select,
				t: props.t,
				...props.useProjection === void 0 ? {} : { useProjection: props.useProjection }
			});
		}
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-composer-picker: dictionaries");
			ctx.inject([
				"slots",
				"modelDirectories",
				"sessions"
			], (scope) => {
				const models = scope.modelDirectories;
				const sessions = scope.sessions;
				scope.slots.inject("conversation.input.model", () => scope.slots.register({
					name: "conversation.input.model",
					locale: NS,
					priority: MODEL_PRIORITY,
					inject: (sessionId) => {
						const directory = models.directoryFor(sessionId);
						const available = sessions.subagentAddress(sessionId) === void 0;
						return {
							available,
							directory: directory.store,
							load: () => {
								if (available) directory.load().catch(() => {});
							},
							select: (selection) => available ? directory.select(selection).then(() => true, () => false) : Promise.resolve(false)
						};
					}
				}, ModelSeat));
				function PlanSeat(props) {
					if (props.matched === null) return null;
					const directory = models.directoryFor(props.sessionId);
					const available = sessions.subagentAddress(props.sessionId) === void 0;
					return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PlanReviewCard, {
						matched: props.matched,
						directory: directory.store,
						load: () => {
							if (available) directory.load().catch(() => {});
						},
						select: (selection) => available ? directory.select(selection).then(() => true, () => false) : Promise.resolve(false),
						t: props.t,
						useProjection: props.useProjection
					}, props.matched.key);
				}
				scope.slots.inject(CONTINUE_IN_DSH_SLOT, () => scope.slots.register({
					name: CONTINUE_IN_DSH_SLOT,
					locale: NS,
					inject: (sessionId) => {
						const directory = models.directoryFor(sessionId);
						const available = sessions.subagentAddress(sessionId) === void 0;
						return {
							available,
							directory: directory.store,
							load: () => {
								if (available) directory.load().catch(() => {});
							},
							select: (selection) => available ? directory.select(selection).then(() => true, () => false) : Promise.resolve(false)
						};
					}
				}, ContinueInDshAdapter));
				scope.slots.inject("conversation.composer", () => scope.slots.register({
					name: "conversation.composer",
					locale: NS,
					priority: PLAN_REVIEW_PRIORITY,
					select: (owner) => selectPlanReview(owner)
				}, PlanSeat));
			});
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});
