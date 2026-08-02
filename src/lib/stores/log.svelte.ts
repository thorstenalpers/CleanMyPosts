import type { BridgeClient } from '$lib/bridge/client';
import type { LogEntry, LogLevel } from '$lib/bridge/contract';

const MAX_ENTRIES = 2000;

export class LogStore {
  entries = $state<LogEntry[]>([]);

  // The filters live here rather than in the view because routing unmounts the view: a
  // trip to Settings and back would otherwise silently reset what the user is looking at.
  messageFilter = $state('');
  levelFilter = $state<LogLevel | 'all'>('all');

  constructor(private readonly bridge: BridgeClient) {
    this.bridge.onPushEvent((event) => {
      if (event.event === 'log') {
        this.push(event.payload);
      }
    });
  }

  async load(): Promise<void> {
    this.entries = await this.bridge.call('log.getBuffer', undefined);
  }

  clear(): void {
    this.entries = [];
  }

  private push(entry: LogEntry): void {
    const next = [...this.entries, entry];
    this.entries = next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next;
  }
}
