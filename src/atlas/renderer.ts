import { visualBridgeProposals, visualWeakTransitions } from "./discovery";
import { AtlasModel, AtlasMode, AtlasSelection, Vec3 } from "./types";

export interface AtlasRendererOptions {
	onSelect: (nodeId: string | null) => void;
	onInsight: (kind: "bridge" | "gap", id: string) => void;
	onHover: (nodeId: string | null, point: { x: number; y: number } | null) => void;
	onOpen: (nodeId: string) => void;
}

export interface AtlasCameraState {
	position: { x: number; y: number; z: number };
	target: { x: number; y: number; z: number };
}

interface NodeVisual {
	nodeId: string;
	position: Vec3;
	title: string;
	topic: string;
	baseColor: string;
	baseScale: number;
	visible: boolean;
	opacity: number;
	color: string;
	scale: number;
}

interface EdgeVisual {
	edgeId: string;
	source: string;
	target: string;
	kind: "declared" | "working" | "bridge" | "gap" | "pattern" | "path";
	visible: boolean;
	opacity: number;
	color: string;
	dashed: boolean;
}

interface ProjectedNode {
	nodeId: string;
	sx: number;
	sy: number;
	depth: number;
	radius: number;
	visual: NodeVisual;
}

type PickResult = { kind: "node"; id: string } | { kind: "bridge" | "gap"; id: string };

export class AtlasRenderer {
	private readonly canvas: HTMLCanvasElement | null = null;
	private readonly ctx: CanvasRenderingContext2D | null = null;
	private readonly nodeVisuals = new Map<string, NodeVisual>();
	private readonly edgeVisuals: EdgeVisual[] = [];
	private readonly resizeObserver: ResizeObserver | null = null;
	private animationFrame = 0;
	private model: AtlasModel | null = null;
	private selection: AtlasSelection | null = null;
	private activeTopics = new Set<string>();
	private mode: AtlasMode = "atlas";
	private focusedProposalId: string | null = null;
	private focusedGapId: string | null = null;
	private activePatternId: string | null = null;
	private pathNodeIds: string[] = [];
	private pathEdgeIds = new Set<string>();
	private pointerDown = { x: 0, y: 0, time: 0, dragging: false };
	private lastDrag = { x: 0, y: 0 };
	private lastClick = { nodeId: "", time: 0 };
	private cameraPosition: Vec3 = { x: 0, y: 26, z: 74 };
	private targetPosition: Vec3 = { x: 0, y: 0, z: 0 };
	private yaw = 0.25;
	private pitch = 0.28;
	private distance = 74;
	private autoRotate = true;
	private projectedNodes: ProjectedNode[] = [];
	private readonly reduceMotion =
		typeof window !== "undefined" && window.matchMedia
			? window.matchMedia("(prefers-reduced-motion: reduce)").matches
			: false;

	constructor(private readonly container: HTMLElement, private readonly options: AtlasRendererOptions) {
		this.autoRotate = !this.reduceMotion;
		if (typeof document !== "undefined" && container && typeof container.appendChild === "function") {
			try {
				const canvas = document.createElement("canvas");
				canvas.className = "elf-atlas-canvas";
				canvas.tabIndex = 0;
				canvas.setAttribute("role", "application");
				canvas.setAttribute(
					"aria-label",
					"Interactive three-dimensional personal concept atlas. Use drag to orbit and scroll to zoom."
				);
				container.appendChild(canvas);
				this.canvas = canvas;
				this.ctx = canvas.getContext("2d");

				canvas.addEventListener("pointerdown", this.onPointerDown);
				canvas.addEventListener("pointermove", this.onPointerMove);
				canvas.addEventListener("pointerup", this.onPointerUp);
				canvas.addEventListener("pointerleave", this.onPointerLeave);
				canvas.addEventListener("wheel", this.onWheel, { passive: false });

				if (typeof ResizeObserver !== "undefined") {
					this.resizeObserver = new ResizeObserver(() => this.resize());
					this.resizeObserver.observe(container);
				}
				this.resize();
				this.animate();
			} catch {
				// Non-DOM or SSR test fallback
			}
		}
	}

	private syncCameraFromSpherical(): void {
		const cosP = Math.cos(this.pitch);
		this.cameraPosition = {
			x: this.targetPosition.x + this.distance * Math.sin(this.yaw) * cosP,
			y: this.targetPosition.y + this.distance * Math.sin(this.pitch),
			z: this.targetPosition.z + this.distance * Math.cos(this.yaw) * cosP,
		};
	}

	getCameraState(): AtlasCameraState {
		return {
			position: {
				x: Number(this.cameraPosition.x.toFixed(4)),
				y: Number(this.cameraPosition.y.toFixed(4)),
				z: Number(this.cameraPosition.z.toFixed(4)),
			},
			target: {
				x: Number(this.targetPosition.x.toFixed(4)),
				y: Number(this.targetPosition.y.toFixed(4)),
				z: Number(this.targetPosition.z.toFixed(4)),
			},
		};
	}

	setCameraState(state: AtlasCameraState): void {
		this.cameraPosition = { ...state.position };
		this.targetPosition = { ...state.target };
		const dx = this.cameraPosition.x - this.targetPosition.x;
		const dy = this.cameraPosition.y - this.targetPosition.y;
		const dz = this.cameraPosition.z - this.targetPosition.z;
		this.distance = Math.max(12, Math.hypot(dx, dy, dz));
		this.yaw = Math.atan2(dx, dz);
		this.pitch = Math.asin(Math.max(-0.95, Math.min(0.95, dy / this.distance)));
		this.autoRotate = false;
	}

	setModel(model: AtlasModel): void {
		this.model = model;
		this.activeTopics = new Set(model.topics.map((topic) => topic.id));
		this.selection = null;
		this.rebuildScene();
		this.frameAll();
	}

	setMode(mode: AtlasMode): void {
		this.mode = mode;
		this.focusedProposalId = null;
		this.focusedGapId = null;
		if (mode !== "patterns") this.activePatternId = null;
		this.rebuildEdges();
		this.applyVisualState();
	}

	setFocusedProposal(proposalId: string | null): void {
		this.focusedProposalId = proposalId;
		this.focusedGapId = null;
		this.applyVisualState();
		const proposal = this.model?.proposals.find((candidate) => candidate.id === proposalId);
		if (proposal) this.focusPair(proposal.source, proposal.target);
	}

	setFocusedGap(edgeId: string | null): void {
		this.focusedGapId = edgeId;
		this.focusedProposalId = null;
		this.applyVisualState();
		const transition = this.model?.weakTransitions.find((candidate) => candidate.edgeId === edgeId);
		if (transition) this.focusPair(transition.source, transition.target);
	}

	setPattern(patternId: string | null): void {
		this.activePatternId = patternId;
		this.rebuildEdges();
		this.applyVisualState();
		const pattern = this.model?.patterns.find((candidate) => candidate.id === patternId);
		const first = pattern?.instances[0];
		if (first?.length) this.frameNodes(first);
	}

	setPath(nodeIds: string[] | null): void {
		this.pathNodeIds = nodeIds ? [...nodeIds] : [];
		this.pathEdgeIds.clear();
		if (this.model && nodeIds) {
			for (let index = 0; index < nodeIds.length - 1; index += 1) {
				const pair = new Set([nodeIds[index], nodeIds[index + 1]]);
				const edge = this.model.edges.find((candidate) => pair.has(candidate.source) && pair.has(candidate.target));
				if (edge) this.pathEdgeIds.add(edge.id);
			}
		}
		this.rebuildEdges();
		this.applyVisualState();
		if (nodeIds?.length) this.frameNodes(nodeIds);
	}

	setActiveTopics(topics: Set<string>): void {
		this.activeTopics = new Set(topics);
		this.applyVisualState();
	}

	setSelection(selection: AtlasSelection | null, focusCamera = true): void {
		this.selection = selection;
		this.autoRotate = !selection && !this.reduceMotion;
		if (this.mode === "bridges" || this.mode === "gaps") this.rebuildEdges();
		this.applyVisualState();
		if (selection && focusCamera) this.focusNode(selection.selectedId);
	}

	focusNode(nodeId: string): void {
		const visual = this.nodeVisuals.get(nodeId);
		if (!visual) return;
		this.targetPosition = { ...visual.position };
		this.distance = 28;
		this.syncCameraFromSpherical();
	}

	focusNodes(nodeIds: string[]): void {
		this.frameNodes(nodeIds);
	}

	private focusPair(sourceId: string, targetId: string): void {
		this.frameNodes([sourceId, targetId], 30);
	}

	private frameNodes(nodeIds: string[], minimumDistance = 28): void {
		const points = nodeIds
			.map((id) => this.nodeVisuals.get(id)?.position)
			.filter((point): point is Vec3 => Boolean(point));
		if (!points.length) return;
		let minX = Infinity,
			minY = Infinity,
			minZ = Infinity;
		let maxX = -Infinity,
			maxY = -Infinity,
			maxZ = -Infinity;
		for (const p of points) {
			if (p.x < minX) minX = p.x;
			if (p.y < minY) minY = p.y;
			if (p.z < minZ) minZ = p.z;
			if (p.x > maxX) maxX = p.x;
			if (p.y > maxY) maxY = p.y;
			if (p.z > maxZ) maxZ = p.z;
		}
		this.targetPosition = {
			x: (minX + maxX) / 2,
			y: (minY + maxY) / 2,
			z: (minZ + maxZ) / 2,
		};
		const diag = Math.hypot(maxX - minX, maxY - minY, maxZ - minZ);
		this.distance = Math.max(minimumDistance, diag * 1.15);
		this.syncCameraFromSpherical();
	}

	frameAll(): void {
		if (!this.model?.nodes.length) return;
		this.frameNodes(
			this.model.nodes.map((n) => n.id),
			48
		);
	}

	dispose(): void {
		if (this.animationFrame && typeof cancelAnimationFrame !== "undefined") {
			cancelAnimationFrame(this.animationFrame);
		}
		this.resizeObserver?.disconnect();
		if (this.canvas) {
			this.canvas.removeEventListener("pointerdown", this.onPointerDown);
			this.canvas.removeEventListener("pointermove", this.onPointerMove);
			this.canvas.removeEventListener("pointerup", this.onPointerUp);
			this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
			this.canvas.removeEventListener("wheel", this.onWheel);
			this.canvas.remove();
		}
		this.nodeVisuals.clear();
		this.edgeVisuals.length = 0;
	}

	private rebuildScene(): void {
		this.nodeVisuals.clear();
		this.edgeVisuals.length = 0;
		if (!this.model) return;
		const topicColors = new Map(this.model.topics.map((topic) => [topic.id, topic.color]));
		for (const node of this.model.nodes) {
			const baseScale = 0.55 + Math.min(0.65, node.centrality * 0.8);
			const baseColor = topicColors.get(node.topic) ?? "#9fb4cc";
			this.nodeVisuals.set(node.id, {
				nodeId: node.id,
				position: { ...node.position },
				title: node.title,
				topic: node.topic,
				baseColor,
				baseScale,
				visible: true,
				opacity: 0.9,
				color: baseColor,
				scale: 1,
			});
		}
		this.rebuildEdges();
		this.applyVisualState();
	}

	private rebuildEdges(): void {
		this.edgeVisuals.length = 0;
		if (!this.model) return;
		const selectedId = this.selection?.selectedId ?? null;
		const weakIds = new Set(
			this.mode === "gaps" ? visualWeakTransitions(this.model, selectedId).map((transition) => transition.edgeId) : []
		);
		const pattern =
			this.mode === "patterns" ? this.model.patterns.find((candidate) => candidate.id === this.activePatternId) : null;
		const patternIds = new Set<string>();
		if (pattern) {
			for (const instance of pattern.instances) {
				for (let index = 0; index < instance.length - 1; index += 1) {
					const pair = new Set([instance[index], instance[index + 1]]);
					const edge = this.model.edges.find((candidate) => pair.has(candidate.source) && pair.has(candidate.target));
					if (edge) patternIds.add(edge.id);
				}
			}
		}
		for (const edge of this.model.edges) {
			const kind = this.pathEdgeIds.has(edge.id)
				? "path"
				: patternIds.has(edge.id)
					? "pattern"
					: weakIds.has(edge.id)
						? "gap"
						: "declared";
			this.addEdge(edge.id, edge.source, edge.target, kind);
		}
		if (this.mode === "bridges") {
			for (const proposal of visualBridgeProposals(this.model, selectedId)) {
				this.addEdge(proposal.id, proposal.source, proposal.target, "bridge");
			}
		}
		if (this.mode === "atlas") {
			for (const proposal of this.model.proposals.filter((candidate) => candidate.reviewStatus === "named")) {
				this.addEdge(proposal.id, proposal.source, proposal.target, "working");
			}
		}
	}

	private addEdge(id: string, sourceId: string, targetId: string, kind: EdgeVisual["kind"]): void {
		if (!this.nodeVisuals.has(sourceId) || !this.nodeVisuals.has(targetId)) return;
		const color =
			kind === "bridge" || kind === "working"
				? "#c5a5ff"
				: kind === "gap"
					? "#e0ad76"
					: kind === "pattern"
						? "#79ccb2"
						: kind === "path"
							? "#a9d4ff"
							: "#8797b1";
		this.edgeVisuals.push({
			edgeId: id,
			source: sourceId,
			target: targetId,
			kind,
			visible: true,
			opacity: kind === "declared" ? 0.14 : 0.65,
			color,
			dashed: kind === "bridge" || kind === "gap",
		});
	}

	private applyVisualState(): void {
		if (!this.model) return;
		const selectedId = this.selection?.selectedId ?? null;
		const focusIds = new Set<string>(
			selectedId ? [selectedId, ...this.selection!.ancestorIds, ...this.selection!.directNextIds] : []
		);
		for (const id of this.pathNodeIds) focusIds.add(id);
		const focusedProposal = this.model.proposals.find((proposal) => proposal.id === this.focusedProposalId);
		if (focusedProposal) {
			focusIds.add(focusedProposal.source);
			focusIds.add(focusedProposal.target);
		}
		const focusedGap = this.model.weakTransitions.find((transition) => transition.edgeId === this.focusedGapId);
		if (focusedGap) {
			focusIds.add(focusedGap.source);
			focusIds.add(focusedGap.target);
		}
		if (this.mode === "bridges" && !focusedProposal) {
			for (const proposal of visualBridgeProposals(this.model, selectedId)) {
				focusIds.add(proposal.source);
				focusIds.add(proposal.target);
			}
		}
		if (this.mode === "gaps" && !focusedGap) {
			for (const transition of visualWeakTransitions(this.model, selectedId)) {
				focusIds.add(transition.source);
				focusIds.add(transition.target);
			}
		}
		if (this.mode === "patterns") {
			const pattern = this.model.patterns.find((candidate) => candidate.id === this.activePatternId);
			for (const instance of pattern?.instances ?? []) for (const id of instance) focusIds.add(id);
		}
		const hasFocus = focusIds.size > 0;
		for (const node of this.model.nodes) {
			const visual = this.nodeVisuals.get(node.id);
			if (!visual) continue;
			const topicVisible = this.activeTopics.has(node.topic);
			visual.visible = topicVisible;
			if (!topicVisible) continue;
			const isSelected = node.id === selectedId;
			const inFocus = focusIds.has(node.id);
			visual.opacity = !hasFocus ? 0.9 : isSelected ? 1 : inFocus ? 0.92 : 0.16;
			visual.color = isSelected ? "#ffffff" : visual.baseColor;
			visual.scale = isSelected ? 1.52 : inFocus ? 1.18 : 1;
		}
		for (const visual of this.edgeVisuals) {
			const sourceNode = this.nodeVisuals.get(visual.source);
			const targetNode = this.nodeVisuals.get(visual.target);
			const topicVisible = Boolean(sourceNode?.visible && targetNode?.visible);
			visual.visible = topicVisible;
			if (!topicVisible) continue;
			if (visual.kind === "bridge") {
				const chosen = visual.edgeId === this.focusedProposalId;
				const touches = !selectedId || visual.source === selectedId || visual.target === selectedId;
				visual.opacity = this.focusedProposalId ? (chosen ? 0.95 : 0.05) : touches ? 0.48 : 0.08;
				continue;
			}
			if (visual.kind === "working") {
				const touches = !selectedId || visual.source === selectedId || visual.target === selectedId;
				visual.opacity = touches ? 0.52 : 0.08;
				continue;
			}
			if (visual.kind === "gap") {
				const chosen = visual.edgeId === this.focusedGapId;
				visual.opacity = this.focusedGapId ? (chosen ? 0.95 : 0.05) : 0.6;
				continue;
			}
			if (visual.kind === "pattern") {
				visual.opacity = 0.78;
				continue;
			}
			if (visual.kind === "path") {
				visual.opacity = 0.96;
				continue;
			}
			const lineage = this.selection?.lineageEdgeIds.has(visual.edgeId) ?? false;
			visual.opacity = this.mode === "atlas" ? (!selectedId ? 0.14 : lineage ? 0.88 : 0.03) : lineage ? 0.25 : 0.02;
			visual.color = lineage ? "#9fc9ff" : "#738198";
		}
	}

	private resize(): void {
		if (!this.canvas) return;
		const width = Math.max(1, this.container.clientWidth || 800);
		const height = Math.max(1, this.container.clientHeight || 520);
		const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
		this.canvas.width = width * dpr;
		this.canvas.height = height * dpr;
		this.canvas.style.width = `${width}px`;
		this.canvas.style.height = `${height}px`;
	}

	private projectPoint(point: Vec3, width: number, height: number): { sx: number; sy: number; depth: number } | null {
		const dx = point.x - this.targetPosition.x;
		const dy = point.y - this.targetPosition.y;
		const dz = point.z - this.targetPosition.z;

		const cosY = Math.cos(-this.yaw);
		const sinY = Math.sin(-this.yaw);
		const x1 = dx * cosY - dz * sinY;
		const z1 = dx * sinY + dz * cosY;

		const cosP = Math.cos(-this.pitch);
		const sinP = Math.sin(-this.pitch);
		const y2 = dy * cosP - z1 * sinP;
		const z2 = dy * sinP + z1 * cosP + this.distance;

		if (z2 <= 1.0) return null;
		const fovScale = Math.min(width, height) * 0.95;
		return {
			sx: width / 2 + (x1 / z2) * fovScale,
			sy: height / 2 - (y2 / z2) * fovScale,
			depth: z2,
		};
	}

	private renderFrame(): void {
		if (!this.canvas || !this.ctx) return;
		const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
		const width = this.canvas.width / dpr;
		const height = this.canvas.height / dpr;

		this.ctx.save();
		this.ctx.scale(dpr, dpr);
		this.ctx.fillStyle = "#080b12";
		this.ctx.fillRect(0, 0, width, height);

		const projMap = new Map<string, ProjectedNode>();
		const list: ProjectedNode[] = [];

		for (const visual of this.nodeVisuals.values()) {
			if (!visual.visible) continue;
			const proj = this.projectPoint(visual.position, width, height);
			if (!proj) continue;
			const radius = Math.max(3.5, ((visual.baseScale * visual.scale * 340) / proj.depth));
			const item: ProjectedNode = {
				nodeId: visual.nodeId,
				sx: proj.sx,
				sy: proj.sy,
				depth: proj.depth,
				radius,
				visual,
			};
			projMap.set(visual.nodeId, item);
			list.push(item);
		}

		// Draw edges back-to-front
		for (const edge of this.edgeVisuals) {
			if (!edge.visible || edge.opacity <= 0.015) continue;
			const s = projMap.get(edge.source);
			const t = projMap.get(edge.target);
			if (!s || !t) continue;
			this.ctx.save();
			this.ctx.strokeStyle = edge.color;
			this.ctx.globalAlpha = edge.opacity;
			this.ctx.lineWidth = edge.kind === "path" ? 2.2 : edge.kind === "declared" ? 1.0 : 1.6;
			if (edge.dashed) this.ctx.setLineDash([5, 4]);
			this.ctx.beginPath();
			this.ctx.moveTo(s.sx, s.sy);
			this.ctx.lineTo(t.sx, t.sy);
			this.ctx.stroke();
			this.ctx.restore();
		}

		// Draw nodes sorted back-to-front
		list.sort((a, b) => b.depth - a.depth);
		for (const item of list) {
			this.ctx.save();
			this.ctx.globalAlpha = item.visual.opacity;
			this.ctx.fillStyle = item.visual.color;
			this.ctx.beginPath();
			this.ctx.arc(item.sx, item.sy, item.radius, 0, Math.PI * 2);
			this.ctx.fill();
			if (item.visual.scale > 1.1) {
				this.ctx.fillStyle = "#e5eefc";
				this.ctx.font = "500 11px Inter, system-ui, sans-serif";
				this.ctx.fillText(item.visual.title, item.sx + item.radius + 5, item.sy + 3.5);
			}
			this.ctx.restore();
		}

		this.projectedNodes = list;
		this.ctx.restore();
	}

	private animate = (): void => {
		if (!this.canvas) return;
		if (typeof requestAnimationFrame !== "undefined") {
			this.animationFrame = requestAnimationFrame(this.animate);
		}
		if (this.autoRotate && !this.pointerDown.dragging) {
			this.yaw += 0.0022;
			this.syncCameraFromSpherical();
		}
		this.renderFrame();
	};

	private pick(event: PointerEvent): PickResult | null {
		if (!this.canvas) return null;
		const rect = this.canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		// Check front-to-back
		for (let i = this.projectedNodes.length - 1; i >= 0; i -= 1) {
			const item = this.projectedNodes[i];
			if (Math.hypot(x - item.sx, y - item.sy) <= item.radius + 4) {
				return { kind: "node", id: item.nodeId };
			}
		}
		return null;
	}

	private onPointerDown = (event: PointerEvent): void => {
		this.pointerDown = { x: event.clientX, y: event.clientY, time: performance.now(), dragging: true };
		this.lastDrag = { x: event.clientX, y: event.clientY };
		this.autoRotate = false;
	};

	private onPointerMove = (event: PointerEvent): void => {
		if (!this.canvas) return;
		if (this.pointerDown.dragging) {
			const dx = event.clientX - this.lastDrag.x;
			const dy = event.clientY - this.lastDrag.y;
			this.lastDrag = { x: event.clientX, y: event.clientY };
			this.yaw -= dx * 0.0065;
			this.pitch = Math.max(-1.25, Math.min(1.25, this.pitch + dy * 0.0065));
			this.syncCameraFromSpherical();
			return;
		}
		const picked = this.pick(event);
		this.canvas.style.cursor = picked ? "pointer" : "grab";
		const nodeId = picked?.kind === "node" ? picked.id : null;
		this.options.onHover(nodeId, nodeId ? { x: event.clientX, y: event.clientY } : null);
	};

	private onPointerUp = (event: PointerEvent): void => {
		this.pointerDown.dragging = false;
		const moved = Math.hypot(event.clientX - this.pointerDown.x, event.clientY - this.pointerDown.y);
		if (moved > 5 || performance.now() - this.pointerDown.time > 600) return;
		const picked = this.pick(event);
		if (!picked) {
			this.options.onSelect(null);
			return;
		}
		if (picked.kind === "bridge" || picked.kind === "gap") {
			this.options.onInsight(picked.kind, picked.id);
			return;
		}
		const nodeId = picked.id;
		const now = performance.now();
		if (this.lastClick.nodeId === nodeId && now - this.lastClick.time < 360) this.options.onOpen(nodeId);
		else this.options.onSelect(nodeId);
		this.lastClick = { nodeId, time: now };
	};

	private onPointerLeave = (): void => {
		this.pointerDown.dragging = false;
		this.options.onHover(null, null);
	};

	private onWheel = (event: WheelEvent): void => {
		event.preventDefault();
		this.distance = Math.max(12, Math.min(190, this.distance + event.deltaY * 0.05));
		this.syncCameraFromSpherical();
	};
}
