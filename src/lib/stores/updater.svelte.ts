import type { BridgeClient } from '$lib/bridge/client';

/**
 * What the app knows about a newer version.
 *
 * One instance for the whole app rather than state inside a view: the offer is found at
 * start-up and shown on the overview, while the manual check and the download it starts
 * live on the Info page. Both have to see the same download.
 */
export class UpdaterStore {
	available = $state(false);
	version = $state('');
	/** Markdown, straight out of `latest.json`. Empty when the feed carried none. */
	notes = $state('');
	checking = $state(false);
	installing = $state(false);
	downloaded = $state(0);
	contentLength = $state<number | undefined>(undefined);

	/** Undefined while the size is unknown, which is what the bar reads as indeterminate. */
	get percent(): number | undefined {
		if (!this.contentLength) return undefined;
		return Math.min(100, Math.round((this.downloaded / this.contentLength) * 100));
	}

	constructor(private readonly bridge: BridgeClient) {
		this.bridge.onPushEvent((event) => {
			if (event.event !== 'updateProgress') return;
			this.downloaded = event.payload.downloaded;
			this.contentLength = event.payload.contentLength ?? undefined;
		});
	}

	/**
	 * Throws when the feed cannot be reached. The start-up caller swallows that — being
	 * offline is an ordinary state and not worth a message — but a check the user asked for
	 * has to be able to say it failed rather than answer "you are up to date".
	 */
	async check(): Promise<boolean> {
		this.checking = true;
		try {
			const result = await this.bridge.call('updater.checkForUpdates', undefined);
			this.available = result.updateAvailable;
			this.version = result.version ?? '';
			this.notes = result.notes ?? '';
			return this.available;
		} finally {
			this.checking = false;
		}
	}

	/**
	 * Returns only if it fails. A successful install replaces the process, so `installing`
	 * is never cleared on the way out — the window is gone by then.
	 */
	async install(): Promise<void> {
		this.installing = true;
		this.downloaded = 0;
		this.contentLength = undefined;
		try {
			await this.bridge.call('updater.installUpdate', undefined);
		} catch (error) {
			this.installing = false;
			throw error;
		}
	}
}
