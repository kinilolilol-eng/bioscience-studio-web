import { AtlasEdge, AtlasNode, AtlasTopic } from "./types";
import { assignDepths, chooseRoots } from "./logic";

const PALETTE = ["#7fb8ff", "#ff826c", "#a98cff", "#51d4b4", "#f0bd62", "#e683c4", "#91d263", "#63c5da"];

function hash(value: string): number {
	let result = 2166136261;
	for (let i = 0; i < value.length; i += 1) {
		result ^= value.charCodeAt(i);
		result = Math.imul(result, 16777619);
	}
	return result >>> 0;
}

export function layOutAtlas(nodes: AtlasNode[], edges: AtlasEdge[]): { nodes: AtlasNode[]; topics: AtlasTopic[] } {
	const roots = chooseRoots(nodes, edges);
	const depths = assignDepths(nodes, edges, roots);
	const topicLabels = [...new Set(nodes.map((node) => node.topic))].sort();
	const topicCount = topicLabels.length;
	const positioned = nodes.map((node) => ({ ...node, depth: depths.get(node.id) ?? 0 }));
	const topics: AtlasTopic[] = [];
	for (let topicIndex = 0; topicIndex < topicLabels.length; topicIndex += 1) {
		const topic = topicLabels[topicIndex];
		const members = positioned.filter((node) => node.topic === topic);
		const angle = topicCount === 1 ? 0 : (topicIndex / topicCount) * Math.PI * 2 - Math.PI / 2;
		const orbit = topicCount === 1 ? 0 : Math.max(18, 8 + topicCount * 4.5);
		const cx = Math.cos(angle) * orbit;
		const cz = Math.sin(angle) * orbit;
		const categories = [...new Set(members.map((node) => node.category))].sort();
		for (const category of categories) {
			const categoryNodes = members.filter((node) => node.category === category).sort((a, b) => a.title.localeCompare(b.title));
			const categoryIndex = categories.indexOf(category);
			const categoryAngle = (categoryIndex / Math.max(1, categories.length)) * Math.PI * 2 + angle * 0.25;
			const categoryRadius = categories.length <= 1 ? 0 : 4.8 + Math.min(4, categories.length * 0.45);
			const ccx = cx + Math.cos(categoryAngle) * categoryRadius;
			const ccz = cz + Math.sin(categoryAngle) * categoryRadius;
			categoryNodes.forEach((node, index) => {
				const isRoot = roots.get(topic)?.includes(node.id) ?? false;
				const jitter = (hash(node.id) % 1000) / 1000;
				const localAngle = index * 2.399963229728653 + jitter * 0.55;
				const localRadius = isRoot ? 0 : 1.7 + Math.sqrt(index + 1) * 1.25 + node.depth * 0.34;
				node.position = {
					x: ccx + Math.cos(localAngle) * localRadius,
					y: 9 - node.depth * 5.2 + (jitter - 0.5) * 0.9,
					z: ccz + Math.sin(localAngle) * localRadius,
				};
			});
		}
		topics.push({ id: topic, label: topic, color: PALETTE[topicIndex % PALETTE.length], count: members.length, rootIds: roots.get(topic) ?? [] });
	}
	return { nodes: positioned, topics };
}

