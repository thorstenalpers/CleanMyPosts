export interface WebView2MessageEvent extends Event {
  readonly data: unknown;
}

export interface WebView2Host {
  postMessage(message: unknown): void;
  addEventListener(type: 'message', listener: (event: WebView2MessageEvent) => void): void;
  removeEventListener(type: 'message', listener: (event: WebView2MessageEvent) => void): void;
}

declare global {
  interface Window {
    chrome?: {
      webview?: WebView2Host;
    };
  }
}
