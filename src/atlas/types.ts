export type AtlasMode = "atlas" | "bridges" | "gaps" | "patterns";

export type ProposalFamily =
	| "worded-relation"
	| "dependency"
	| "cross-topic-bridge"
	| "structural-gap"
	| "analogy"
	| "contradiction"
	| "missing-intermediate";

export type ConnectionBasis = "explicit-wording" | "shared-context" | "shared-meaning" | "structural-gap";
export type ProposalReviewStatus = "suggested" | "kept" | "named" | "dismissed";
export type ReviewAction = "keep" | "name" | "revise" | "dismiss" | "restore";
export type RelationTypeStatus = "trial" | "active" | "deprecated" | "superseded" | "rejected";
export type RelationTypeAction =
	| "type-propose"
	| "type-rename"
	| "type-narrow"
	| "type-widen"
	| "type-activate"
	| "type-merge"
	| "type-split"
	| "type-deprecate"
	| "type-supersede"
	| "type-reject"
	| "type-add-example"
	| "type-add-counterexample";

export interface AtlasPosition {
	x: number;
	y: number;
	z: number;
}

export interface AtlasNode {
	id: string;
	path: string;
	title: string;
	topic: string;
	category: string;
	/** Optional note-local pointer used to obtain a fuller description. */
	meaningRef: string | null;
	meaningPath: string | null;
	meaningHeading: string | null;
	excerpt: string;
	/** Full local note context used only for derived analysis. */
	analysisText: string;
	depth: number;
	degree: number;
	centrality: number;
	position: AtlasPosition;
}

export interface AtlasEdge {
	id: string;
	source: string;
	target: string;
	topic: string;
	type: "declared";
	/** Note paths that contain the wikilink; preserves one-way authorship. */
	declaredBy?: string[];
}

export interface AtlasBridge {
	id: string;
	source: string;
	target: string;
	label: string;
}

export interface NoteContext {
	conceptId: string;
	text: string;
	matchKind: "both-named" | "one-named" | "declared-link";
}

export interface DiscoverySignal {
	id: string;
	kind:
		| "worded-connection"
		| "rare-language"
		| "shared-phrase"
		| "parallel-role"
		| "distant-clusters"
		| "shared-neighborhood"
		| "missing-explanation"
		| "independent-notes"
		| "counter-pattern";
	explanation: string;
	details: string[];
}

export interface RelationProposal {
	id: string;
	family: ProposalFamily;
	source: string;
	target: string;
	surfacePredicates: string[];
	direction: "forward" | "reverse" | "symmetric" | "ambiguous" | "absent";
	basis: ConnectionBasis;
	contexts: NoteContext[];
	signals: DiscoverySignal[];
	question: string;
	generator: { id: string; version: string };
	reviewStatus: ProposalReviewStatus;
	workingPredicate: string | null;
	workingTypeId: string | null;
	reviewerNote: string | null;
}

export interface RelationTypeDefinition {
	id: string;
	label: string;
	description: string | null;
	status: RelationTypeStatus;
	requiredQualifiers: string[];
	exampleProposalIds: string[];
	counterexampleProposalIds: string[];
	mergedFrom: string[];
	supersededBy: string | null;
	version: number;
	updatedAt: string;
}

export interface WeakTransition {
	edgeId: string;
	source: string;
	target: string;
	reasons: Array<{
		kind: "missing-explanation" | "same-layer" | "one-way-link";
		explanation: string;
	}>;
	contexts: NoteContext[];
}

export interface AtlasPattern {
	id: string;
	signature: string[];
	label: string;
	instances: string[][];
	topics: string[];
	state: "suggested" | "kept";
}

export interface IntelligibilityPath {
	id: string;
	objective: "foundations" | "application" | "bridge";
	label: string;
	nodeIds: string[];
	proposalIds: string[];
	bottleneckEdgeId: string | null;
	bottleneckReasons: string[];
}

export interface AtlasLedgerEvent {
	schemaVersion: 1;
	eventId: string;
	timestamp: string;
	actor: "user";
	entity: "proposal" | "relation-type";
	entityId: string;
	action: ReviewAction | RelationTypeAction;
	payload: Record<string, unknown>;
}

export interface ProposalReviewState {
	status: ProposalReviewStatus;
	workingPredicate: string | null;
	workingTypeId: string | null;
	note: string | null;
	updatedAt: string | null;
}

export interface AtlasVoid {
	id: string;
	source: string;
	target: string;
	sharedNeighbors: string[];
}

export interface AtlasTopic {
	id: string;
	label: string;
	color: string;
	count: number;
	rootIds: string[];
}

export interface AtlasModel {
	nodes: AtlasNode[];
	edges: AtlasEdge[];
	bridges: AtlasBridge[];
	voids: AtlasVoid[];
	proposals: RelationProposal[];
	weakTransitions: WeakTransition[];
	patterns: AtlasPattern[];
	topics: AtlasTopic[];
	builtAt: number;
}

export interface AtlasSelection {
	selectedId: string;
	ancestorIds: Set<string>;
	directFoundationIds: Set<string>;
	directNextIds: Set<string>;
	lineageEdgeIds: Set<string>;
}
