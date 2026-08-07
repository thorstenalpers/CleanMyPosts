import type { BridgeClient } from '$lib/bridge/client';
import type { Platform } from '$lib/bridge/contract';

export class SiteLoginStore {
	loggedIn = $state<Partial<Record<Platform, boolean>>>({});
	/** The address each platform's webview is on. The window has no address bar of its own. */
	url = $state<Partial<Record<Platform, string>>>({});

	constructor(bridge: BridgeClient) {
		bridge.onPushEvent((event) => {
			if (event.event === 'siteLogin') {
				this.loggedIn = { ...this.loggedIn, [event.payload.platform]: event.payload.loggedIn };
				if (event.payload.url) {
					this.url = { ...this.url, [event.payload.platform]: event.payload.url };
				}
			}
		});
	}
}
