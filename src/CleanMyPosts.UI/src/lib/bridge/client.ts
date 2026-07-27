import {
  BridgeMethods,
  HostMessageSchema,
  isPushEvent,
  type BridgeMethodName,
  type BridgeParams,
  type BridgeResult,
  type PushEvent
} from './contract';
import type { WebView2Host } from './webview2.d.ts';

type PushEventListener = (event: PushEvent) => void;

interface PendingCall {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}

/**
 * Typed, id-correlated RPC client over `chrome.webview.postMessage`.
 * Every call and every host response is validated against the Zod contract
 * in `./contract.ts` — a malformed payload on either side fails loudly
 * instead of propagating as `any`.
 */
export class BridgeClient {
  private readonly pending = new Map<string, PendingCall>();
  private readonly listeners = new Set<PushEventListener>();

  constructor(private readonly host: WebView2Host) {
    this.host.addEventListener('message', (event) => this.handleMessage(event.data));
  }

  call<M extends BridgeMethodName>(method: M, params: BridgeParams<M>): Promise<BridgeResult<M>> {
    const spec = BridgeMethods[method];
    const validatedParams = spec.params.parse(params);
    const id = crypto.randomUUID();

    return new Promise<BridgeResult<M>>((resolve, reject) => {
      this.pending.set(id, {
        resolve: (value) => resolve(spec.result.parse(value) as BridgeResult<M>),
        reject
      });
      this.host.postMessage({ id, method, params: validatedParams });
    });
  }

  onPushEvent(listener: PushEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private handleMessage(data: unknown): void {
    const parsed = HostMessageSchema.safeParse(data);
    if (!parsed.success) {
      console.warn('Bridge: dropped malformed host message', data, parsed.error);
      return;
    }

    const message = parsed.data;
    if (isPushEvent(message)) {
      for (const listener of this.listeners) listener(message);
      return;
    }

    const pending = this.pending.get(message.id);
    if (!pending) {
      return;
    }
    this.pending.delete(message.id);

    if (message.ok) {
      pending.resolve(message.result);
    } else {
      pending.reject(new Error(message.error.message));
    }
  }
}

let singleton: BridgeClient | undefined;

/** Lazily creates the real WebView2-backed bridge on first use. */
export function getBridge(): BridgeClient {
  if (!singleton) {
    const host = window.chrome?.webview;
    if (!host) {
      throw new Error('window.chrome.webview is not available — this page must run inside a WebView2 host.');
    }
    singleton = new BridgeClient(host);
  }
  return singleton;
}

/** Allows tests / `vite dev` to inject a mock transport instead of a real WebView2 host. */
export function createBridgeClient(host: WebView2Host): BridgeClient {
  return new BridgeClient(host);
}
