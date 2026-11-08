import { AtlasBridge, AtlasEdge, AtlasNode, AtlasSelection, AtlasVoid } from "./types";

const STOPWORDS = new Set([
	"about", "after", "again", "against", "also", "among", "because", "before", "being",
	"between", "both", "could", "does", "each", "from", "have", "into", "more", "most",
	"other", "over", "same", "such", "than", "that", "their", "there", "these", "they",
	"this", "those", "through", "under", "using", "very", "what", "when", "where", "which",
	"while", "with", "would", "your", "source", "concept", "graph", "connections", "note",
]);

export function normalizeLabel(value: string): string {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function adjacency(nodes: AtlasNode[], edges: AtlasEdge[]): Map<string, Set<string>> {
	const map = new Map(nodes.map((node) => [node.id, new Set<string>()]));
	for (const edge of edges) {
		map.get(edge.source)?.add(edge.target);
		map.get(edge.target)?.add(edge.source);
	}
	return map;
}

export function chooseRoots(nodes: AtlasNode[], edges: AtlasEdge[]): Map<string, string[]> {
	const graph = adjacency(nodes, edges);
	const result = new Map<string, string[]>();
	for (const topic of new Set(nodes.map((node) => node.topic))) {
		const candidates = nodes.filter((node) => node.topic === topic);
		const exact = candidates.find((node) => normalizeLabel(node.title) === normalizeLabel(topic));
		const core = candidates.filter((node) => normalizeLabel(node.category) === "core");
		const ranked = (core.length ? core : candidates).slice().sort((a, b) => {
			const delta = (graph.get(b.id)?.size ?? 0) - (graph.get(a.id)?.size ?? 0);
			return delta || a.title.localeCompare(b.title);
		});
		result.set(topic, [exact?.id ?? ranked[0]?.id].filter((id): id is string => Boolean(id)));
	}
	return result;
}

export function assignDepths(nodes: AtlasNode[], edges: AtlasEdge[], roots: Map<string, string[]>): Map<string, number> {
	const graph = adjacency(nodes, edges);
	const depths = new Map<string, number>();
	for (const [topic, rootIds] of roots) {
		const queue = rootIds.map((id) => ({ id, depth: 0 }));
		for (const root of rootIds) depths.set(root, 0);
		for (let i = 0; i < queue.length; i += 1) {
			const current = queue[i];
			for (const neighbor of graph.get(current.id) ?? []) {
				const node = nodes.find((candidate) => candidate.id === neighbor);
				if (!node || node.topic !== topic || depths.has(neighbor)) continue;
				depths.set(neighbor, current.depth + 1);
				queue.push({ id: neighbor, depth: current.depth + 1 });
			}
		}
		const reached = nodes.filter((node) => node.topic === topic && depths.has(node.id));
		const fallback = Math.max(0, ...reached.map((node) => depths.get(node.id) ?? 0)) + 1;
		for (const node of nodes.filter((candidate) => candidate.topic === topic)) {
			if (!depths.has(node.id)) depths.set(node.id, fallback);
		}
	}
	return depths;
}

export function selectionFor(model: { nodes: AtlasNode[]; edges: AtlasEdge[] }, selectedId: string): AtlasSelection {
	const byId = new Map(model.nodes.map((node) => [node.id, node]));
	const graph = adjacency(model.nodes, model.edges);
	const ancestorIds = new Set<string>();
	const directFoundationIds = new Set<string>();
	const directNextIds = new Set<string>();
	const queue = [selectedId];
	while (queue.length) {
		const currentId = queue.shift()!;
		const current = byId.get(currentId);
		if (!current) continue;
		for (const neighborId of graph.get(currentId) ?? []) {
			const neighbor = byId.get(neighborId);
			if (!neighbor || neighbor.topic !== current.topic) continue;
			if (neighbor.depth < current.depth) {
				if (currentId === selectedId) directFoundationIds.add(neighborId);
				if (!ancestorIds.has(neighborId)) {
					ancestorIds.add(neighborId);
					queue.push(neighborId);
				}
			} else if (currentId === selectedId && neighbor.depth > current.depth) {
				directNextIds.add(neighborId);
			}
		}
	}
	const lineageEdgeIds = new Set<string>();
	for (const edge of model.edges) {
		const a = edge.source;
		const b = edge.target;
		if ((a === selectedId && ancestorIds.has(b)) || (b === selectedId && ancestorIds.has(a)) ||
			(ancestorIds.has(a) && ancestorIds.has(b)) || (a === selectedId && directNextIds.has(b)) ||
			(b === selectedId && directNextIds.has(a))) lineageEdgeIds.add(edge.id);
	}
	return { selectedId, ancestorIds, directFoundationIds, directNextIds, lineageEdgeIds };
}

function tokenize(value: string): Set<string> {
	return new Set(normalizeLabel(value).split(/\s+/).filter((token) => token.length > 3 && !STOPWORDS.has(token)));
}

export function discoverBridges(nodes: AtlasNode[], limit = 18): AtlasBridge[] {
	const terms = new Map(nodes.map((node) => [node.id, tokenize(`${node.title} ${node.excerpt}`)]));
	const candidates: AtlasBridge[] = [];
	for (let i = 0; i < nodes.length; i += 1) {
		for (let j = i + 1; j < nodes.length; j += 1) {
			const a = nodes[i];
			const b = nodes[j];
			if (a.topic === b.topic) continue;
			const aTerms = terms.get(a.id) ?? new Set<string>();
			const bTerms = terms.get(b.id) ?? new Set<string>();
			const shared = [...aTerms].filter((term) => bTerms.has(term)).sort();
			if (shared.length < 2) continue;
			candidates.push({ id: `bridge:${a.id}:${b.id}`, source: a.id, target: b.id, label: shared.slice(0, 2).join(" · ") });
		}
	}
	return candidates.sort((a, b) => a.id.localeCompare(b.id)).slice(0, limit);
}

export function discoverVoids(nodes: AtlasNode[], edges: AtlasEdge[], limit = 18): AtlasVoid[] {
	const graph = adjacency(nodes, edges);
	const candidates: AtlasVoid[] = [];
	for (let i = 0; i < nodes.length; i += 1) {
		for (let j = i + 1; j < nodes.length; j += 1) {
			const a = nodes[i];
			const b = nodes[j];
			if (a.topic !== b.topic || graph.get(a.id)?.has(b.id)) continue;
			const shared = [...(graph.get(a.id) ?? [])].filter((id) => graph.get(b.id)?.has(id));
			if (shared.length < 2) continue;
			candidates.push({ id: `void:${a.id}:${b.id}`, source: a.id, target: b.id, sharedNeighbors: shared });
		}
	}
	return candidates.sort((a, b) => b.sharedNeighbors.length - a.sharedNeighbors.length || a.id.localeCompare(b.id)).slice(0, limit);
}
