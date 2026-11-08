import { BrowserVaultApp } from "./browserVault";
import { discoverCognitiveLayer } from "./discovery";
import { layOutAtlas } from "./layout";
import { AtlasEdge, AtlasModel, AtlasNode } from "./types";

const GRAPH_SEGMENT = "/Concept Graph/";

function cleanMarkdown(value: string): string {
	return value
		.replace(/!\[\[[^\]]+\]\]/g, "")
		.replace(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g, (_all, path: string, alias?: string) => alias ?? path.split("/").pop() ?? path)
		.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
		.replace(/[`*_>#~]/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

function boundedExcerpt(value: string, maxLength = 440): string {
	if (value.length <= maxLength) return value;
	const clipped = value.slice(0, maxLength + 1);
	const sentenceEnd = Math.max(clipped.lastIndexOf(". "), clipped.lastIndexOf("? "), clipped.lastIndexOf("! "));
	if (sentenceEnd >= Math.floor(maxLength * 0.58)) return clipped.slice(0, sentenceEnd + 1);
	const wordEnd = clipped.lastIndexOf(" ");
	return `${clipped.slice(0, Math.max(0, wordEnd)).trim()}…`;
}

function conceptParts(path: string): { topic: string; category: string } | null {
	const index = path.indexOf(GRAPH_SEGMENT);
	if (index >= 0) {
		const topic = path.slice(0, index).split("/").pop()?.trim();
		const rest = path.slice(index + GRAPH_SEGMENT.length);
		const category = rest.includes("/") ? rest.split("/")[0] : "Concepts";
		return topic ? { topic, category } : null;
	}
	// Browser fallback for direct note paths without a /Concept Graph/ segment
	const parts = path.split("/").filter(Boolean);
	if (parts.length >= 3) {
		return { topic: parts[0], category: parts[1] };
	}
	if (parts.length === 2) {
		return { topic: parts[0], category: "Concepts" };
	}
	if (parts.length === 1 && parts[0].endsWith(".md")) {
		return { topic: "Protocol Pharmacology", category: "Concepts" };
	}
	return null;
}

function headingTitle(content: string, fallback: string): string {
	return content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? fallback;
}

function noteMeaning(content: string): { excerpt: string; analysisText: string } {
	const withoutFrontmatter = content.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*(?:\r?\n|$)/, "");
	const withoutTitle = withoutFrontmatter.replace(/^#\s+.+(?:\r?\n|$)/m, "");
	const paragraphs = withoutTitle
		.split(/\r?\n\s*\r?\n/)
		.map(cleanMarkdown)
		.filter(Boolean);
	const analysisText = cleanMarkdown(withoutTitle).slice(0, 20_000);
	const excerpt = paragraphs.find((part) => part.length >= 40) ?? paragraphs[0] ?? "Open the note to read the idea in full and follow its connections.";
	return { excerpt: boundedExcerpt(excerpt), analysisText };
}

export async function buildAtlasModel(app: BrowserVaultApp): Promise<AtlasModel> {
	const files = app.vault.getMarkdownFiles().filter((file) => conceptParts(file.path));
	const nodes: AtlasNode[] = [];
	for (const file of files) {
		const parts = conceptParts(file.path)!;
		const content = await app.vault.cachedRead(file);
		const meaning = noteMeaning(content);
		nodes.push({
			id: file.path,
			path: file.path,
			title: headingTitle(content, file.basename),
			topic: parts.topic,
			category: parts.category,
			meaningRef: content,
			meaningPath: file.path,
			meaningHeading: null,
			excerpt: meaning.excerpt,
			analysisText: meaning.analysisText,
			depth: 0,
			degree: 0,
			centrality: 0,
			position: { x: 0, y: 0, z: 0 },
		});
	}

	const nodePaths = new Set(nodes.map((node) => node.path));
	const edgeMap = new Map<string, AtlasEdge>();
	for (const node of nodes) {
		const links = app.metadataCache.resolvedLinks[node.path] ?? {};
		for (const target of Object.keys(links)) {
			if (!nodePaths.has(target) || target === node.path) continue;
			const [source, destination] = [node.path, target].sort();
			const key = `${source}::${destination}`;
			const existing = edgeMap.get(key);
			if (existing) {
				if (!existing.declaredBy?.includes(node.path)) existing.declaredBy?.push(node.path);
			} else {
				edgeMap.set(key, { id: key, source, target: destination, topic: node.topic, type: "declared", declaredBy: [node.path] });
			}
		}
	}

	const edges = [...edgeMap.values()];
	const degree = new Map<string, number>();
	for (const edge of edges) {
		degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
		degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
	}
	const maxDegree = Math.max(1, ...degree.values());
	for (const node of nodes) {
		node.degree = degree.get(node.id) ?? 0;
		node.centrality = node.degree / maxDegree;
	}

	const laidOut = layOutAtlas(nodes, edges);
	const cognitive = discoverCognitiveLayer(laidOut.nodes, edges);
	const bridgeProposals = cognitive.proposals.filter((proposal) => proposal.family === "cross-topic-bridge" || proposal.family === "analogy");
	return {
		nodes: laidOut.nodes,
		edges,
		topics: laidOut.topics,
		bridges: bridgeProposals.slice(0, 18).map((proposal) => ({
			id: proposal.id,
			source: proposal.source,
			target: proposal.target,
			label: proposal.surfacePredicates[0] ?? proposal.signals.find((signal) => signal.details.length)?.details[0] ?? "possible bridge",
		})),
		voids: cognitive.proposals.filter((proposal) => proposal.family === "structural-gap").slice(0, 18).map((proposal) => ({
			id: proposal.id,
			source: proposal.source,
			target: proposal.target,
			sharedNeighbors: [],
		})),
		proposals: cognitive.proposals,
		weakTransitions: cognitive.weakTransitions,
		patterns: cognitive.patterns,
		builtAt: Date.now(),
	};
}
