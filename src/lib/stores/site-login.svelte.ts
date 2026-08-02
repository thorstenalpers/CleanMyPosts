import type { BridgeClient } from '$lib/bridge/client';
import type { Platform } from '$lib/bridge/contract';

export class SiteLoginStore {
	loggedIn = $state<Partial<Record<Platform, boolean>>>({});

	constructor(bridge: BridgeClient) {
		bridge.onPushEvent((event) => {
			if (event.event === 'siteLogin') {
				this.loggedIn = { ...this.loggedIn, [event.payload.platform]: event.payload.loggedIn };
			}
		});
	}
}
