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
function displayNameOf(name, parsed) {
	let next = name;
	if (parsed.fast) next = next.replace(/\s+Fast$/iu, "");
	if (parsed.contextTier !== null) next = next.replace(/\s+(?:Max|1M)$/iu, "");
	return next.replace(/\s+/gu, " ").trim() || name;
}
//#endregion
//#region lib/types/plan-review.js
/**
* Plan-review takeover selector and approve sequencing. Copied shape of the
* official plan-review narrow — not a runtime import of ui-user-questions.
*/
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
//#endregion
//#region lib/types/index.js
const name = "dsh-composer-picker";
const inject = [];
function apply(_ctx) {}
//#endregion
export { apply, approvePlanReview, groupFamilies, inject, name, parsePickerId, planReviewOf, selectPlanReview };
