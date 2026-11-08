import { BrowserVaultApp, normalizePath } from "./browserVault";
import {
	AtlasLedgerEvent,
	ProposalReviewState,
	ReviewAction,
} from "./types";
import { replayProposalReviews } from "./review";

function isEvent(value: unknown): value is AtlasLedgerEvent {
	if (!value || typeof value !== "object") return false;
	const event = value as Partial<AtlasLedgerEvent>;
	return event.schemaVersion === 1 && typeof event.eventId === "string" && typeof event.timestamp === "string" &&
		event.actor === "user" && (event.entity === "proposal" || event.entity === "relation-type") &&
		typeof event.entityId === "string" && typeof event.action === "string" && Boolean(event.payload && typeof event.payload === "object");
}

export class AtlasReviewLedger {
	private events: AtlasLedgerEvent[] = [];
	private malformedLines: number[] = [];
	private appendChain: Promise<void> = Promise.resolve();
	readonly path: string;

	constructor(private readonly app: BrowserVaultApp, pluginId = "personal-knowledge-atlas") {
		this.path = normalizePath(`${app.vault.configDir}/plugins/${pluginId}/atlas-ledger.jsonl`);
	}

	async load(): Promise<void> {
		this.events = [];
		this.malformedLines = [];
		if (!(await this.app.vault.adapter.exists(this.path))) return;
		const content = await this.app.vault.adapter.read(this.path);
		for (const [index, line] of content.split(/\r?\n/).entries()) {
			if (!line.trim()) continue;
			try {
				const parsed: unknown = JSON.parse(line);
				if (isEvent(parsed)) this.events.push(parsed);
				else this.malformedLines.push(index + 1);
			} catch {
				this.malformedLines.push(index + 1);
			}
		}
	}

	allEvents(): readonly AtlasLedgerEvent[] { return this.events; }
	invalidLineNumbers(): readonly number[] { return this.malformedLines; }
	reviewStates(): Map<string, ProposalReviewState> { return replayProposalReviews(this.events); }

	async reviewProposal(entityId: string, action: ReviewAction, payload: Record<string, unknown> = {}): Promise<AtlasLedgerEvent> {
		const event: AtlasLedgerEvent = {
			schemaVersion: 1,
			eventId: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
			timestamp: new Date().toISOString(),
			actor: "user",
			entity: "proposal",
			entityId,
			action,
			payload,
		};
		await this.append(event);
		return event;
	}

	async appendTypeEvent(entityId: string, action: Extract<AtlasLedgerEvent["action"], `type-${string}`>, payload: Record<string, unknown> = {}): Promise<AtlasLedgerEvent> {
		const event: AtlasLedgerEvent = {
			schemaVersion: 1,
			eventId: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
			timestamp: new Date().toISOString(),
			actor: "user",
			entity: "relation-type",
			entityId,
			action,
			payload,
		};
		await this.append(event);
		return event;
	}

	private async append(event: AtlasLedgerEvent): Promise<void> {
		this.appendChain = this.appendChain.then(async () => {
			await this.app.vault.adapter.append(this.path, `${JSON.stringify(event)}\n`);
			this.events.push(event);
		});
		await this.appendChain;
	}
}
