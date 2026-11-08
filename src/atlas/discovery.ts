import {
	AtlasEdge,
	AtlasModel,
	AtlasNode,
	AtlasPattern,
	DiscoverySignal,
	IntelligibilityPath,
	NoteContext,
	ProposalFamily,
	RelationProposal,
	WeakTransition,
} from "./types";
import { adjacency, normalizeLabel } from "./logic";

export const DISCOVERY_GENERATOR = { id: "atlas-personal-connections", version: "3.0.0" } as const;

const STOPWORDS = new Set([
	"a", "an", "and", "are", "as", "at", "be", "been", "but", "by", "can", "did",
	"do", "does", "for", "from", "has", "have", "if", "in", "into", "is", "it", "its",
	"may", "more", "most", "no", "not", "of", "on", "only", "or", "our", "over", "per",
	"same", "so", "such", "than", "that", "the", "their", "there", "these", "they", "this",
	"those", "through", "to", "under", "using", "very", "via", "was", "were", "what", "when",
	"where", "which", "while", "will", "with", "within", "would", "your", "about", "after",
	"again", "against", "also", "among", "because", "before", "being", "between", "both", "could",
	"each", "other", "source", "concept", "graph", "connections", "note", "phase", "dossier",
	"model", "models", "system", "systems", "effect", "effects", "mechanism", "mechanisms",
	"direct", "role", "roles", "provides", "provide", "generic", "example", "examples", "several", "uses",
]);

const CUE_RULES: Array<{ phrase: string; family: ProposalFamily; direction: "forward" | "reverse" | "ambiguous" }> = [
	{ phrase: "depends on", family: "dependency", direction: "forward" },
	{ phrase: "depends upon", family: "dependency", direction: "forward" },
	{ phrase: "requires", family: "dependency", direction: "forward" },
	{ phrase: "necessary for", family: "dependency", direction: "reverse" },
	{ phrase: "prerequisite for", family: "dependency", direction: "reverse" },
	{ phrase: "contingent on", family: "dependency", direction: "forward" },
	{ phrase: "gated by", family: "dependency", direction: "forward" },
	{ phrase: "conditional on", family: "dependency", direction: "forward" },
	{ phrase: "contradicts", family: "contradiction", direction: "ambiguous" },
	{ phrase: "conflicts with", family: "contradiction", direction: "ambiguous" },
	{ phrase: "inconsistent with", family: "contradiction", direction: "ambiguous" },
	{ phrase: "refutes", family: "contradiction", direction: "forward" },
	{ phrase: "whereas", family: "contradiction", direction: "ambiguous" },
];

interface DiscoveryOutput {
	proposals: RelationProposal[];
	weakTransitions: WeakTransition[];
	patterns: AtlasPattern[];
}

function stableHash(value: string): string {
	let result = 2166136261;
	for (let index = 0; index < value.length; index += 1) {
		result ^= value.charCodeAt(index);
		result = Math.imul(result, 16777619);
	}
	return (result >>> 0).toString(36);
}

function proposalId(family: ProposalFamily, source: string, target: string): string {
	const directional = family === "dependency" || family === "worded-relation";
	const endpoints = directional ? [source, target] : [source, target].sort();
	return `proposal:${family}:${stableHash(`${endpoints[0]}::${endpoints[1]}`)}`;
}

function aliases(node: AtlasNode): string[] {
	const result = new Set([normalizeLabel(node.title)]);
	const acronym = node.title
		.split(/[^A-Za-z0-9]+/)
		.filter((part) => /^[A-Z0-9][A-Za-z0-9+]*$/.test(part))
		.map((part) => part[0])
		.join("")
		.toLowerCase();
	if (acronym.length >= 3) result.add(acronym);
	return [...result].filter((value) => value.length >= 4);
}

function sentenceList(text: string): string[] {
	return text
		.replace(/\s+/g, " ")
		.split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
		.map((sentence) => sentence.trim())
		.filter((sentence) => sentence.length >= 40);
}

function clippedText(value: string, max = 330): string {
	if (value.length <= max) return value;
	const clipped = value.slice(0, max + 1);
	return `${clipped.slice(0, clipped.lastIndexOf(" ")).trim()}…`;
}

function cueFor(sentence: string): typeof CUE_RULES[number] | null {
	const normalized = normalizeLabel(sentence);
	return CUE_RULES.find((rule) => normalized.includes(rule.phrase)) ?? null;
}

function context(origin: AtlasNode, sentence: string, matchKind: NoteContext["matchKind"]): NoteContext {
	return { conceptId: origin.id, text: clippedText(sentence), matchKind };
}

function baseProposal(
	family: ProposalFamily,
	source: AtlasNode,
	target: AtlasNode,
	basis: RelationProposal["basis"],
	signals: DiscoverySignal[],
	contexts: NoteContext[],
): RelationProposal {
	return {
		id: proposalId(family, source.id, target.id),
		family,
		source: source.id,
		target: target.id,
		surfacePredicates: [],
		direction: "absent",
		basis,
		contexts,
		signals,
		question: `What, if anything, makes “${source.title}” and “${target.title}” part of the same line of thought?`,
		generator: { ...DISCOVERY_GENERATOR },
		reviewStatus: "suggested",
		workingPredicate: null,
		workingTypeId: null,
		reviewerNote: null,
	};
}

function discoverWordedRelations(nodes: AtlasNode[], edges: AtlasEdge[]): RelationProposal[] {
	const byPair = new Map<string, RelationProposal>();
	const graph = adjacency(nodes, edges);
	const aliasesById = new Map(nodes.map((node) => [node.id, aliases(node)]));
	for (const origin of nodes) {
		for (const sentence of sentenceList(origin.analysisText)) {
			const normalized = ` ${normalizeLabel(sentence)} `;
			const originNamed = (aliasesById.get(origin.id) ?? []).some((value) => normalized.includes(` ${value} `));
			for (const target of nodes) {
				if (origin.id === target.id) continue;
				const targetAlias = (aliasesById.get(target.id) ?? []).find((value) => normalized.includes(` ${value} `));
				if (!targetAlias) continue;
				const cue = cueFor(sentence);
				const family = cue?.family ?? "worded-relation";
				const basis = cue ? "explicit-wording" : "shared-context";
				const signals: DiscoverySignal[] = [{
					id: `context:${stableHash(`${origin.id}:${sentence}`)}`,
					kind: cue ? "worded-connection" : "rare-language",
					explanation: cue
						? `The wording “${cue.phrase}” directly joins the two ideas in one passage.`
						: originNamed
							? "The two ideas are named together in the same passage."
							: `This idea’s surrounding text explicitly names “${target.title}”.`,
					details: cue ? [cue.phrase] : [targetAlias],
				}];
				if (graph.get(origin.id)?.has(target.id)) signals.push({
					id: "declared-link",
					kind: "shared-neighborhood",
					explanation: "Your notes already connect these ideas.",
					details: [],
				});
				const key = `${family}:${origin.id}:${target.id}`;
				let proposal = byPair.get(key);
				if (!proposal) {
					proposal = baseProposal(family, origin, target, basis, signals, [context(origin, sentence, originNamed ? "both-named" : "one-named")]);
					proposal.direction = cue?.direction ?? "ambiguous";
					proposal.surfacePredicates = cue ? [cue.phrase] : [];
					proposal.question = cue
						? `Does “${cue.phrase}” express the connection you mean between these exact ideas?`
						: "Are these ideas genuinely connected, or are they simply discussed near each other?";
					byPair.set(key, proposal);
				} else {
					if (proposal.contexts.length < 3) proposal.contexts.push(context(origin, sentence, originNamed ? "both-named" : "one-named"));
					if (cue && !proposal.surfacePredicates.includes(cue.phrase)) proposal.surfacePredicates.push(cue.phrase);
				}
			}
		}
	}
	return [...byPair.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function terms(value: string): Set<string> {
	return new Set(normalizeLabel(value).split(/\s+/).filter((term) => term.length > 3 && !STOPWORDS.has(term) && !/^\d+$/.test(term)));
}

function phrases(value: string): Set<string> {
	const result = new Set<string>();
	for (const segment of value.split(/[.!?;:\n]+/)) {
		const tokens = normalizeLabel(segment).split(/\s+/).filter(Boolean);
		for (const size of [2, 3]) {
			for (let index = 0; index <= tokens.length - size; index += 1) {
				const window = tokens.slice(index, index + size);
				if (window.every((term) => term.length > 2 && !STOPWORDS.has(term) && !/^\d+$/.test(term))) result.add(window.join(" "));
			}
		}
	}
	return result;
}

function categoricalBridgeOrder(proposal: RelationProposal): string {
	const kinds = new Set(proposal.signals.map((signal) => signal.kind));
	const bucket = kinds.has("shared-phrase") && kinds.has("parallel-role") ? "0"
		: kinds.has("shared-phrase") ? "1"
			: kinds.has("parallel-role") ? "2" : "3";
	return `${bucket}:${proposal.id}`;
}

function selectDiverseBridges(proposals: RelationProposal[], nodes: AtlasNode[], limit: number): RelationProposal[] {
	const byId = new Map(nodes.map((node) => [node.id, node]));
	const groups = new Map<string, RelationProposal[]>();
	for (const proposal of proposals) {
		const topics = [byId.get(proposal.source)?.topic ?? "", byId.get(proposal.target)?.topic ?? ""].sort();
		const key = topics.join("::");
		const group = groups.get(key) ?? [];
		group.push(proposal);
		groups.set(key, group);
	}
	for (const group of groups.values()) group.sort((a, b) => categoricalBridgeOrder(a).localeCompare(categoricalBridgeOrder(b)));
	const result: RelationProposal[] = [];
	const orderedGroups = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
	for (let round = 0; result.length < limit; round += 1) {
		let added = false;
		for (const [, group] of orderedGroups) {
			if (group[round]) { result.push(group[round]); added = true; }
			if (result.length >= limit) break;
		}
		if (!added) break;
	}
	return result;
}

function discoverCrossTopic(nodes: AtlasNode[], limit = 36): RelationProposal[] {
	const termSets = new Map(nodes.map((node) => [node.id, terms(`${node.title} ${node.analysisText}`)]));
	const phraseSets = new Map(nodes.map((node) => [node.id, phrases(`${node.title}. ${node.analysisText}`)]));
	const titleTermSets = new Map(nodes.map((node) => [node.id, terms(node.title)]));
	const termDf = new Map<string, number>();
	const phraseDf = new Map<string, number>();
	for (const set of termSets.values()) for (const term of set) termDf.set(term, (termDf.get(term) ?? 0) + 1);
	for (const set of phraseSets.values()) for (const phrase of set) phraseDf.set(phrase, (phraseDf.get(phrase) ?? 0) + 1);
	const proposals: RelationProposal[] = [];
	for (let left = 0; left < nodes.length; left += 1) {
		for (let right = left + 1; right < nodes.length; right += 1) {
			const a = nodes[left];
			const b = nodes[right];
			if (a.topic === b.topic) continue;
			const aTerms = termSets.get(a.id) ?? new Set<string>();
			const bTerms = termSets.get(b.id) ?? new Set<string>();
			const sharedTerms = [...aTerms]
				.filter((term) => bTerms.has(term) && (termDf.get(term) ?? nodes.length) <= Math.max(8, nodes.length * 0.18))
				.sort((x, y) => (termDf.get(x) ?? 0) - (termDf.get(y) ?? 0) || x.localeCompare(y));
			const sharedPhrases = [...(phraseSets.get(a.id) ?? [])]
				.filter((phrase) => (phraseSets.get(b.id)?.has(phrase) ?? false) && (phraseDf.get(phrase) ?? nodes.length) <= 6)
				.sort((x, y) => (phraseDf.get(x) ?? 0) - (phraseDf.get(y) ?? 0) || y.length - x.length);
			const sharedTitleTerms = [...(titleTermSets.get(a.id) ?? [])].filter((term) => titleTermSets.get(b.id)?.has(term));
			const parallelRole = normalizeLabel(a.category) === normalizeLabel(b.category);
			if (sharedPhrases.length === 0 && sharedTitleTerms.length === 0 && sharedTerms.length < 3) continue;
			const family: ProposalFamily = parallelRole && (sharedPhrases.length > 0 || sharedTitleTerms.length > 0) ? "analogy" : "cross-topic-bridge";
			const signals: DiscoverySignal[] = [{
				id: "distant-clusters",
				kind: "distant-clusters",
				explanation: "These ideas currently sit in different parts of the atlas.",
				details: [a.topic, b.topic],
			}];
			if (sharedTerms.length) signals.push({
				id: `language:${stableHash(sharedTerms.slice(0, 8).join("|"))}`,
				kind: "rare-language",
				explanation: "The notes reuse some unusually specific language.",
				details: sharedTerms.slice(0, 8),
			});
			if (sharedPhrases.length) signals.push({
				id: `phrases:${stableHash(sharedPhrases.slice(0, 5).join("|"))}`,
				kind: "shared-phrase",
				explanation: "The notes independently use the same distinctive phrase or formulation.",
				details: sharedPhrases.slice(0, 5),
			});
			if (parallelRole) signals.push({
				id: `parallel:${normalizeLabel(a.category)}`,
				kind: "parallel-role",
				explanation: "The two ideas occupy a similar place inside different clusters.",
				details: [],
			});
			if (a.meaningPath && b.meaningPath && a.meaningPath !== b.meaningPath) signals.push({
				id: "independent-notes",
				kind: "independent-notes",
				explanation: "The resemblance appears in separate notes, not through one copied link.",
				details: [],
			});
			const proposal = baseProposal(family, a, b, "shared-meaning", signals, []);
			const sharedIdea = sharedPhrases[0] ?? sharedTitleTerms[0] ?? sharedTerms.slice(0, 2).join(" / ");
			proposal.question = family === "analogy"
				? `Do these ideas play the same role in different parts of your thinking?`
				: `Does “${sharedIdea}” name a real bridge between the ideas, or only similar language?`;
			proposals.push(proposal);
		}
	}
	return selectDiverseBridges(proposals, nodes, limit);
}

function discoverStructuralGaps(nodes: AtlasNode[], edges: AtlasEdge[], limit = 24): RelationProposal[] {
	const graph = adjacency(nodes, edges);
	const byId = new Map(nodes.map((node) => [node.id, node]));
	const proposals: RelationProposal[] = [];
	for (let left = 0; left < nodes.length; left += 1) {
		for (let right = left + 1; right < nodes.length; right += 1) {
			const a = nodes[left];
			const b = nodes[right];
			if (a.topic !== b.topic || graph.get(a.id)?.has(b.id)) continue;
			const shared = [...(graph.get(a.id) ?? [])].filter((id) => graph.get(b.id)?.has(id));
			if (shared.length < 2) continue;
			const names = shared.slice(0, 5).map((id) => byId.get(id)?.title ?? id);
			const signals: DiscoverySignal[] = [{
				id: `neighbors:${stableHash(shared.join("|"))}`,
				kind: "shared-neighborhood",
				explanation: "The ideas connect to several of the same notes but not to each other.",
				details: names,
			}];
			const proposal = baseProposal("structural-gap", a, b, "structural-gap", signals, []);
			proposal.question = `Is there a missing connection—or a missing idea—between these two notes?`;
			proposals.push(proposal);
		}
	}
	return proposals.sort((a, b) => a.id.localeCompare(b.id)).slice(0, limit);
}

function transitionDiagnostics(nodes: AtlasNode[], edges: AtlasEdge[], worded: RelationProposal[]): WeakTransition[] {
	const byId = new Map(nodes.map((node) => [node.id, node]));
	return edges.map((edge) => {
		const contexts = worded
			.filter((proposal) => (proposal.source === edge.source && proposal.target === edge.target) || (proposal.source === edge.target && proposal.target === edge.source))
			.flatMap((proposal) => proposal.contexts);
		const source = byId.get(edge.source)!;
		const target = byId.get(edge.target)!;
		const reasons: WeakTransition["reasons"] = [];
		if (contexts.length === 0) reasons.push({ kind: "missing-explanation", explanation: "The notes are linked, but the idea that makes the transition intelligible is not explicit." });
		if (source.depth === target.depth) reasons.push({ kind: "same-layer", explanation: "The two ideas sit at the same level, so the link does not reveal which one frames or develops the other." });
		if ((edge.declaredBy?.length ?? 2) === 1) reasons.push({ kind: "one-way-link", explanation: "Only one note points to the other. That may be intentional, but the direction is worth noticing." });
		return { edgeId: edge.id, source: edge.source, target: edge.target, reasons, contexts };
	}).filter((transition) => transition.reasons.length > 0);
}

function discoverPatterns(nodes: AtlasNode[], edges: AtlasEdge[]): AtlasPattern[] {
	const graph = adjacency(nodes, edges);
	const byId = new Map(nodes.map((node) => [node.id, node]));
	const support = new Map<string, { signature: string[]; topics: Set<string>; instances: string[][] }>();
	for (const topic of new Set(nodes.map((node) => node.topic))) {
		const members = nodes.filter((node) => node.topic === topic);
		const root = members.filter((node) => node.depth === 0).sort((a, b) => b.degree - a.degree || a.title.localeCompare(b.title))[0];
		if (!root) continue;
		const queue = [root.id];
		const parent = new Map<string, string | null>([[root.id, null]]);
		for (let index = 0; index < queue.length; index += 1) {
			for (const next of graph.get(queue[index]) ?? []) {
				if (parent.has(next) || byId.get(next)?.topic !== topic) continue;
				parent.set(next, queue[index]);
				queue.push(next);
			}
		}
		for (const node of members) {
			const pathIds: string[] = [];
			let current: string | null | undefined = node.id;
			while (current) { pathIds.unshift(current); current = parent.get(current); }
			if (pathIds.length < 2) continue;
			const categories = pathIds.map((id) => byId.get(id)!.category);
			for (const length of [2, 3, 4]) {
				for (let start = 0; start <= categories.length - length; start += 1) {
					const signature = categories.slice(start, start + length);
					if (new Set(signature.map(normalizeLabel)).size < 2) continue;
					const key = signature.join(" -> ");
					const value = support.get(key) ?? { signature, topics: new Set<string>(), instances: [] };
					value.topics.add(topic);
					if (value.instances.length < 30) value.instances.push(pathIds.slice(start, start + length));
					support.set(key, value);
				}
			}
		}
	}
	return [...support.entries()]
		.filter(([, value]) => value.topics.size >= 2 && value.instances.length >= 3)
		.map(([key, value]) => ({
			id: `pattern:${stableHash(key)}`,
			signature: value.signature,
			label: value.signature.join(" → "),
			instances: value.instances,
			topics: [...value.topics].sort(),
			state: "suggested" as const,
		}))
		.sort((a, b) => b.topics.length - a.topics.length || b.instances.length - a.instances.length || a.label.localeCompare(b.label))
		.slice(0, 16);
}

export function discoverCognitiveLayer(nodes: AtlasNode[], edges: AtlasEdge[]): DiscoveryOutput {
	const worded = discoverWordedRelations(nodes, edges);
	return {
		proposals: [...worded, ...discoverCrossTopic(nodes), ...discoverStructuralGaps(nodes, edges)],
		weakTransitions: transitionDiagnostics(nodes, edges, worded),
		patterns: discoverPatterns(nodes, edges),
	};
}

export function visualBridgeProposals(model: AtlasModel, selectedId: string | null = null, limit = 12): RelationProposal[] {
	const candidates = model.proposals.filter((proposal) =>
		proposal.reviewStatus !== "dismissed" &&
		(proposal.family === "cross-topic-bridge" || proposal.family === "analogy") &&
		(!selectedId || proposal.source === selectedId || proposal.target === selectedId));
	if (selectedId) return candidates.slice(0, limit);
	return selectDiverseBridges(candidates, model.nodes, limit);
}

export function visualWeakTransitions(model: AtlasModel, selectedId: string | null = null, limit = 18): WeakTransition[] {
	const candidates = selectedId
		? model.weakTransitions.filter((transition) => transition.source === selectedId || transition.target === selectedId)
		: model.weakTransitions;
	if (selectedId) return candidates.slice(0, limit);
	const byId = new Map(model.nodes.map((node) => [node.id, node]));
	const groups = new Map<string, WeakTransition[]>();
	for (const transition of candidates) {
		const topic = byId.get(transition.source)?.topic ?? "";
		const kind = transition.reasons[0]?.kind ?? "other";
		const key = `${topic}::${kind}`;
		const group = groups.get(key) ?? [];
		group.push(transition);
		groups.set(key, group);
	}
	for (const group of groups.values()) group.sort((a, b) => a.edgeId.localeCompare(b.edgeId));
	const result: WeakTransition[] = [];
	const orderedGroups = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
	for (let round = 0; result.length < limit; round += 1) {
		let added = false;
		for (const [, group] of orderedGroups) {
			if (group[round]) { result.push(group[round]); added = true; }
			if (result.length >= limit) break;
		}
		if (!added) break;
	}
	return result;
}

function shortestPath(nodes: AtlasNode[], edges: AtlasEdge[], start: string, predicate: (node: AtlasNode) => boolean): string[] {
	const graph = adjacency(nodes, edges);
	const byId = new Map(nodes.map((node) => [node.id, node]));
	const queue = [start];
	const previous = new Map<string, string | null>([[start, null]]);
	let found: string | null = predicate(byId.get(start)!) ? start : null;
	for (let index = 0; index < queue.length && !found; index += 1) {
		for (const next of graph.get(queue[index]) ?? []) {
			if (previous.has(next)) continue;
			previous.set(next, queue[index]);
			queue.push(next);
			const node = byId.get(next);
			if (node && predicate(node)) { found = next; break; }
		}
	}
	if (!found) return [];
	const result: string[] = [];
	for (let current: string | null = found; current; current = previous.get(current) ?? null) result.unshift(current);
	return result;
}

export function intelligibilityPaths(model: AtlasModel, selectedId: string): IntelligibilityPath[] {
	const selected = model.nodes.find((node) => node.id === selectedId);
	if (!selected) return [];
	const byId = new Map(model.nodes.map((node) => [node.id, node]));
	const edgeByPair = new Map(model.edges.flatMap((edge) => [[`${edge.source}::${edge.target}`, edge], [`${edge.target}::${edge.source}`, edge]]));
	const weakByEdge = new Map(model.weakTransitions.map((transition) => [transition.edgeId, transition]));
	const result: IntelligibilityPath[] = [];
	const makePath = (objective: IntelligibilityPath["objective"], label: string, nodeIds: string[], proposalIds: string[] = []): IntelligibilityPath | null => {
		if (nodeIds.length < 2 && proposalIds.length === 0) return null;
		const weak = nodeIds.slice(0, -1)
			.map((id, index) => edgeByPair.get(`${id}::${nodeIds[index + 1]}`))
			.filter(Boolean)
			.map((edge) => weakByEdge.get(edge!.id))
			.filter((item): item is WeakTransition => Boolean(item))
			.sort((a, b) => b.reasons.length - a.reasons.length)[0];
		return {
			id: `path:${objective}:${stableHash(`${selectedId}:${nodeIds.join("|")}:${proposalIds.join("|")}`)}`,
			objective,
			label,
			nodeIds,
			proposalIds,
			bottleneckEdgeId: weak?.edgeId ?? null,
			bottleneckReasons: weak?.reasons.map((reason) => reason.explanation) ?? [],
		};
	};
	const foundation = shortestPath(model.nodes, model.edges, selectedId, (node) => node.topic === selected.topic && node.depth === 0).reverse();
	const foundationPath = makePath("foundations", "From foundations", foundation);
	if (foundationPath) result.push(foundationPath);
	const application = shortestPath(model.nodes, model.edges, selectedId, (node) => node.topic === selected.topic && /(use|application|practice)/i.test(node.category));
	const applicationPath = makePath("application", "Toward use", application);
	if (applicationPath && applicationPath.nodeIds.at(-1) !== selectedId) result.push(applicationPath);
	const bridge = visualBridgeProposals(model, selectedId, 1)[0];
	if (bridge) {
		const other = bridge.source === selectedId ? bridge.target : bridge.source;
		const otherNode = byId.get(other);
		const bridgePath = makePath("bridge", `Across to ${otherNode?.topic ?? "another cluster"}`, [selectedId, other], [bridge.id]);
		if (bridgePath) {
			bridgePath.bottleneckReasons = ["This is a suggested bridge, not one of your declared connections."];
			result.push(bridgePath);
		}
	}
	return result;
}
