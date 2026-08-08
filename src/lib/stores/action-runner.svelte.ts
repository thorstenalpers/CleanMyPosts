import type { BridgeClient } from '$lib/bridge/client';
import type {
	ActionPlan,
	ActionResult,
	Platform,
	SiteAction,
	TimeoutSettings
} from '$lib/bridge/contract';
import type { MessageKey } from '$lib/i18n/index.svelte';

export interface RunActionInput {
	platform: Platform;
	action: SiteAction;
	timeouts: TimeoutSettings;
	/** A message key: the running action is named in the sidebar and in the overview. */
	label: MessageKey;
}

export interface RunPlanInput {
	platform: Platform;
	plan: ActionPlan;
	timeouts: TimeoutSettings;
}

/** Drives a single `site.runAction` call and tracks its live progress events. */
export class ActionRunner {
	running = $state(false);
	deletedSoFar = $state(0);
	currentLabel = $state<MessageKey | undefined>(undefined);
	/** Whether the last run was stopped by the user. A sequence of runs has to honour that. */
	cancelled = $state(false);
	/**
	 * What to say when nothing is running, per platform. X and YouTube have their own status
	 * bar each, and the last thing that happened on one says nothing about the other.
	 */
	lastResult = $state<
		Partial<Record<Platform, { kind: 'success' | 'info' | 'error'; message: string }>>
	>({});

	private currentRequestId: string | undefined;

	constructor(private readonly bridge: BridgeClient) {}

	async run(input: RunActionInput): Promise<ActionResult> {
		const requestId = crypto.randomUUID();
		this.currentRequestId = requestId;
		this.running = true;
		this.deletedSoFar = 0;
		this.currentLabel = input.label;
		this.cancelled = false;

		const unsubscribe = this.bridge.onPushEvent((event) => {
			if (event.event === 'progress' && event.payload.requestId === requestId) {
				this.deletedSoFar = event.payload.deletedCount;
			}
		});

		try {
			return await this.bridge.call('site.runAction', {
				requestId,
				platform: input.platform,
				action: input.action,
				timeouts: input.timeouts
			});
		} finally {
			unsubscribe();
			this.running = false;
			this.currentRequestId = undefined;
		}
	}

	/**
	 * The same run, driven by an assistant's plan instead of a built-in action.
	 *
	 * Deliberately shares every field above — `running`, the counter, the request id the stop
	 * button reaches for. A plan that ran beside all that would be a run the status bar could
	 * not report and `cancel` could not stop.
	 */
	async runPlan(input: RunPlanInput): Promise<ActionResult> {
		const requestId = crypto.randomUUID();
		this.currentRequestId = requestId;
		this.running = true;
		this.deletedSoFar = 0;
		this.currentLabel = 'assistant.plan.label';
		this.cancelled = false;

		const unsubscribe = this.bridge.onPushEvent((event) => {
			if (event.event === 'progress' && event.payload.requestId === requestId) {
				this.deletedSoFar = event.payload.deletedCount;
			}
		});

		try {
			return await this.bridge.call('site.runPlan', {
				requestId,
				platform: input.platform,
				plan: input.plan,
				timeouts: input.timeouts
			});
		} finally {
			unsubscribe();
			this.running = false;
			this.currentRequestId = undefined;
		}
	}

	/** Stops the active run; its `run()` promise then resolves with the count deleted so far. */
	async cancel(): Promise<void> {
		const requestId = this.currentRequestId;
		if (requestId) {
			this.cancelled = true;
			await this.bridge.call('site.cancelAction', { requestId });
		}
	}
}
