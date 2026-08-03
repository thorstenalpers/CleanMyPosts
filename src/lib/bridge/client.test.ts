import { describe, expect, it, vi } from 'vitest';
import { createMockHost } from './mock';
import { createBridgeClient } from './client';
import type { WebView2Host, WebView2MessageEvent } from './webview2.d.ts';

describe('BridgeClient', () => {
	it('resolves with a validated result on a successful call', async () => {
		const { client } = createMockHost({
			'settings.get': () => ({
				theme: 'Light',
				language: 'System',
				showIntro: true,
				showLogs: true,
				showX: true,
				showYouTube: true,
				confirmDeletion: false,
				themePreset: 'Default' as const,
				showAssistant: true,
				assistantSource: 'claude-code',
				assistantCliPath: '',
				timeouts: {
					waitAfterDelete: 100,
					waitBetweenRetryDeleteAttempts: 200,
					waitAfterDocumentLoad: 300
				}
			})
		});

		const settings = await client.call('settings.get', undefined);
		expect(settings.theme).toBe('Light');
		expect(settings.timeouts.waitAfterDelete).toBe(100);
	});

	it('rejects the call when the host reports an error', async () => {
		const { client } = createMockHost({
			'site.hide': () => {
				throw new Error('site webview not ready');
			}
		});

		await expect(client.call('site.hide', { hide: true })).rejects.toThrow(
			'site webview not ready'
		);
	});

	it('rejects when no handler exists for the method', async () => {
		const { client } = createMockHost({});
		await expect(client.call('log.getBuffer', undefined)).rejects.toThrow(/No mock handler/);
	});

	it('throws synchronously when params fail Zod validation before the call is sent', () => {
		const { client } = createMockHost({});
		expect(() =>
			// @ts-expect-error intentionally invalid params to prove client-side validation runs
			client.call('settings.set', { theme: 'NotATheme' })
		).toThrow();
	});

	it('delivers push events to subscribed listeners', () => {
		const { client, emit } = createMockHost({});
		const listener = vi.fn();
		client.onPushEvent(listener);

		emit({ event: 'progress', payload: { requestId: 'abc', deletedCount: 5 } });

		expect(listener).toHaveBeenCalledWith({
			event: 'progress',
			payload: { requestId: 'abc', deletedCount: 5 }
		});
	});

	it('stops delivering events after unsubscribing', () => {
		const { client, emit } = createMockHost({});
		const listener = vi.fn();
		const unsubscribe = client.onPushEvent(listener);
		unsubscribe();

		emit({ event: 'settingsChanged', payload: null as never });

		expect(listener).not.toHaveBeenCalled();
	});

	it('drops a malformed host message instead of throwing', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		let deliver: ((event: WebView2MessageEvent) => void) | undefined;

		const fakeHost: WebView2Host = {
			postMessage: () => undefined,
			addEventListener: (_type, listener) => {
				deliver = listener;
			},
			removeEventListener: () => undefined
		};

		createBridgeClient(fakeHost);
		expect(() =>
			deliver?.({ data: { totally: 'unrelated shape' } } as WebView2MessageEvent)
		).not.toThrow();
		expect(warnSpy).toHaveBeenCalledOnce();

		warnSpy.mockRestore();
	});
});
