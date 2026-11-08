import {
	AtlasLedgerEvent,
	ProposalReviewState,
	ProposalReviewStatus,
	RelationProposal,
	RelationTypeDefinition,
} from "./types";

const EMPTY_REVIEW: ProposalReviewState = {
	status: "suggested",
	workingPredicate: null,
	workingTypeId: null,
	note: null,
	updatedAt: null,
};

/** Deterministically folds an append-only event history into the current review projection. */
export function replayProposalReviews(events: AtlasLedgerEvent[]): Map<string, ProposalReviewState> {
	const states = new Map<string, ProposalReviewState>();
	const lastNonDismissed = new Map<string, ProposalReviewStatus>();
	for (const event of events) {
		if (event.entity !== "proposal") continue;
		const current = states.get(event.entityId) ?? { ...EMPTY_REVIEW };
		const next = { ...current, updatedAt: event.timestamp };
		if (event.action === "restore") next.status = lastNonDismissed.get(event.entityId) ?? "suggested";
		if (event.action === "keep") next.status = "kept";
		if (event.action === "name") next.status = "named";
		if (event.action === "dismiss") next.status = "dismissed";
		if (next.status !== "dismissed") lastNonDismissed.set(event.entityId, next.status);
		if (typeof event.payload.predicate === "string") next.workingPredicate = event.payload.predicate.trim() || null;
		if (typeof event.payload.typeId === "string") next.workingTypeId = event.payload.typeId.trim() || null;
		if (typeof event.payload.note === "string") next.note = event.payload.note.trim() || null;
		states.set(event.entityId, next);
	}
	return states;
}

export function applyProposalReviews(proposals: RelationProposal[], events: AtlasLedgerEvent[]): RelationProposal[] {
	const states = replayProposalReviews(events);
	return proposals.map((proposal) => {
		const state = states.get(proposal.id);
		return state ? {
			...proposal,
			reviewStatus: state.status,
			workingPredicate: state.workingPredicate,
			workingTypeId: state.workingTypeId,
			reviewerNote: state.note,
		} : proposal;
	});
}

function strings(value: unknown): string[] {
	return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean) : [];
}

function blankType(id: string, timestamp: string): RelationTypeDefinition {
	return {
		id,
		label: "Untitled relation type",
		description: null,
		status: "trial",
		requiredQualifiers: [],
		exampleProposalIds: [],
		counterexampleProposalIds: [],
		mergedFrom: [],
		supersededBy: null,
		version: 0,
		updatedAt: timestamp,
	};
}

/** Replays relation-type evolution while retaining superseded definitions and their histories. */
export function replayRelationTypes(events: AtlasLedgerEvent[]): Map<string, RelationTypeDefinition> {
	const types = new Map<string, RelationTypeDefinition>();
	for (const event of events) {
		if (event.entity !== "relation-type") continue;
		const current = types.get(event.entityId) ?? blankType(event.entityId, event.timestamp);
		const next: RelationTypeDefinition = {
			...current,
			requiredQualifiers: [...current.requiredQualifiers],
			exampleProposalIds: [...current.exampleProposalIds],
			counterexampleProposalIds: [...current.counterexampleProposalIds],
			mergedFrom: [...current.mergedFrom],
			version: current.version + 1,
			updatedAt: event.timestamp,
		};
		if (event.action === "type-propose") {
			if (typeof event.payload.label === "string" && event.payload.label.trim()) next.label = event.payload.label.trim();
			if (typeof event.payload.description === "string") next.description = event.payload.description.trim() || null;
			next.requiredQualifiers = [...new Set(strings(event.payload.requiredQualifiers))];
			next.exampleProposalIds = [...new Set(strings(event.payload.exampleProposalIds))];
			next.status = "trial";
		}
		if (event.action === "type-rename" && typeof event.payload.label === "string" && event.payload.label.trim()) next.label = event.payload.label.trim();
		if (event.action === "type-narrow" && typeof event.payload.qualifier === "string" && event.payload.qualifier.trim()) next.requiredQualifiers = [...new Set([...next.requiredQualifiers, event.payload.qualifier.trim()])];
		if (event.action === "type-widen" && typeof event.payload.qualifier === "string") next.requiredQualifiers = next.requiredQualifiers.filter((value) => value !== event.payload.qualifier);
		if (event.action === "type-add-example") next.exampleProposalIds = [...new Set([...next.exampleProposalIds, ...strings(event.payload.proposalIds)])];
		if (event.action === "type-add-counterexample") next.counterexampleProposalIds = [...new Set([...next.counterexampleProposalIds, ...strings(event.payload.proposalIds)])];
		if (event.action === "type-activate") next.status = "active";
		if (event.action === "type-deprecate") next.status = "deprecated";
		if (event.action === "type-reject") next.status = "rejected";
		if (event.action === "type-supersede") {
			next.status = "superseded";
			next.supersededBy = typeof event.payload.typeId === "string" ? event.payload.typeId : null;
		}
		if (event.action === "type-merge") {
			if (typeof event.payload.label === "string" && event.payload.label.trim()) next.label = event.payload.label.trim();
			if (typeof event.payload.description === "string") next.description = event.payload.description.trim() || null;
			next.mergedFrom = [...new Set(strings(event.payload.sourceTypeIds))];
			next.status = "trial";
			for (const sourceId of next.mergedFrom) {
				const source = types.get(sourceId);
				if (source) types.set(sourceId, { ...source, status: "superseded", supersededBy: next.id, version: source.version + 1, updatedAt: event.timestamp });
			}
		}
		if (event.action === "type-split") {
			next.status = "superseded";
			next.supersededBy = null;
			const children = Array.isArray(event.payload.newTypes) ? event.payload.newTypes : [];
			for (const value of children) {
				if (!value || typeof value !== "object") continue;
				const child = value as Record<string, unknown>;
				if (typeof child.id !== "string" || typeof child.label !== "string") continue;
				types.set(child.id, { ...blankType(child.id, event.timestamp), label: child.label.trim() || "Untitled relation type", description: typeof child.description === "string" ? child.description.trim() || null : null, version: 1 });
			}
		}
		types.set(event.entityId, next);
	}
	return types;
}
