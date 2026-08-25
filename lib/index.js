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
//#region lib/types/index.js
const name = "dsh-composer-picker";
const inject = [];
function apply(_ctx) {}
//#endregion
export { apply, groupFamilies, inject, name, parsePickerId };
