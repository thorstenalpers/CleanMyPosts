import type { BridgeClient } from '$lib/bridge/client';
import type { ActionResult, Platform, SiteAction, TimeoutSettings } from '$lib/bridge/contract';

export interface RunActionInput {
	platform: Platform;
	action: SiteAction;
	timeouts: TimeoutSettings;
	label: string;
}

/** Drives a single `site.runAction` call and tracks its live progress events. */
export class ActionRunner {
	running = $state(false);
	deletedSoFar = $state(0);
	currentLabel = $state('');

	private currentRequestId: string | undefined;

	constructor(private readonly bridge: BridgeClient) {}

	async run(input: RunActionInput): Promise<ActionResult> {
		const requestId = crypto.randomUUID();
		this.currentRequestId = requestId;
		this.running = true;
		this.deletedSoFar = 0;
		this.currentLabel = input.label;

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

	/** Stops the active run; its `run()` promise then resolves with the count deleted so far. */
	async cancel(): Promise<void> {
		const requestId = this.currentRequestId;
		if (requestId) {
			await this.bridge.call('site.cancelAction', { requestId });
		}
	}
}
