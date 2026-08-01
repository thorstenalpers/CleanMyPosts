import type { BridgeClient } from '$lib/bridge/client';
import type { AppSettings } from '$lib/bridge/contract';

const FALLBACK_SETTINGS: AppSettings = {
  theme: 'Default',
  showLogs: false,
  confirmDeletion: true,
  accentColor: '#3B82F6',
  useSystemAccent: true,
  timeouts: { waitAfterDelete: 500, waitBetweenRetryDeleteAttempts: 500, waitAfterDocumentLoad: 3000 }
};

export class SettingsStore {
  settings = $state<AppSettings>(FALLBACK_SETTINGS);
  loading = $state(true);

  constructor(private readonly bridge: BridgeClient) {
    this.bridge.onPushEvent((event) => {
      if (event.event === 'settingsChanged') {
        this.settings = event.payload;
      }
    });
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      this.settings = await this.bridge.call('settings.get', undefined);
    } finally {
      this.loading = false;
    }
  }

  async update(next: AppSettings): Promise<void> {
    this.settings = next;
    await this.bridge.call('settings.set', next);
  }
}
