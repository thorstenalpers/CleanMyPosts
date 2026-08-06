import { z } from 'zod';

/**
 * Single source of truth for the UI <-> host bridge. The Svelte app runs in the
 * chrome webview and talks to the host over this channel; the platform sites load
 * in a separate site webview. `dispatch` in `src-tauri/src/bridge.rs` has one arm
 * per method; nothing checks that the two lists agree, so both sides move together
 * by hand.
 *
 * This is a distinct protocol from `$lib/engine/protocol.ts`, which governs
 * the finer-grained delete-engine calls (`window.__cmp`) within a page.
 */

export const AppThemeSchema = z.enum(['Default', 'Light', 'Dark']);
export type AppTheme = z.infer<typeof AppThemeSchema>;

export const TimeoutSettingsSchema = z.object({
	waitAfterDelete: z.number().int().min(0),
	waitBetweenRetryDeleteAttempts: z.number().int().min(0),
	waitAfterDocumentLoad: z.number().int().min(0)
});
export type TimeoutSettings = z.infer<typeof TimeoutSettingsSchema>;

/** `System` follows the language Windows runs in; the rest are fixed. */
export const LanguageSchema = z.enum([
	'System',
	'en',
	'ar',
	'de',
	'es',
	'fr',
	'hi',
	'it',
	'ja',
	'pt',
	'ru',
	'zh'
]);
export type Language = z.infer<typeof LanguageSchema>;

/**
 * The colour identity. `default` is the neutral base in app.css; every other id is literally
 * the class put on <html> (see src/themes.css), which is why they are slugs and not labels.
 */
export const ThemePresetSchema = z.enum([
	'default',
	'caffeine',
	'modern-minimal',
	'mono',
	'northern-lights',
	'twitter',
	'vercel'
]);
export type ThemePreset = z.infer<typeof ThemePresetSchema>;

export const AppSettingsSchema = z.object({
	theme: AppThemeSchema,
	language: LanguageSchema,
	showIntro: z.boolean(),
	showLogs: z.boolean(),
	showX: z.boolean(),
	showYouTube: z.boolean(),
	confirmDeletion: z.boolean(),
	/** Toasts when a run ends. Off means the log is the only place a result is reported. */
	notifications: z.boolean(),
	/** There is no telemetry; this governs the local log buffer, which is all there is. */
	telemetry: z.boolean(),
	/**
	 * Keeps the engine's `debug` lines instead of dropping them. Off by default: they are
	 * verbose and quote what a platform page actually showed, which is more than a normal log
	 * should carry around.
	 */
	debugLogging: z.boolean(),
	/** Whether the content script clicks consent banners away by itself. */
	autoConsent: z.boolean(),
	/**
	 * Whether the WebView2 profile survives a restart. Off wipes cache and cookies at the
	 * next start, so both platforms open signed out. Takes effect on the next launch.
	 */
	persistSession: z.boolean(),
	themePreset: ThemePresetSchema,
	showAssistant: z.boolean(),
	/** `claude-code` for the local binary, otherwise a provider id from `assistant.getSources`. */
	assistantSource: z.string(),
	/** Empty means: look in the places Claude Code installs itself. */
	assistantCliPath: z.string(),
	/**
	 * The user's own patch for the delete engine, run in the site page before each action.
	 * Empty means the built-in behaviour — see `$lib/engine/config.ts`.
	 */
	engineScript: z.string(),
	timeouts: TimeoutSettingsSchema
});
export type AppSettings = z.infer<typeof AppSettingsSchema>;

/** The id the local Claude Code binary answers to, alongside the hosted providers. */
export const LOCAL_ASSISTANT_SOURCE = 'claude-code';

export const AssistantProviderSchema = z.object({
	id: z.string(),
	label: z.string(),
	model: z.string(),
	freeKeyUrl: z.string().nullable(),
	/** Whether a key is in the credential store — never the key, which cannot be read back. */
	hasKey: z.boolean()
});
export type AssistantProvider = z.infer<typeof AssistantProviderSchema>;

export const AssistantSourcesSchema = z.object({
	local: z.object({
		found: z.boolean(),
		path: z.string().nullable(),
		version: z.string().nullable()
	}),
	providers: z.array(AssistantProviderSchema)
});
export type AssistantSources = z.infer<typeof AssistantSourcesSchema>;

export const PlatformSchema = z.enum(['x', 'youtube']);
export type Platform = z.infer<typeof PlatformSchema>;

export const XActionSchema = z.enum([
	'showPosts',
	'deletePosts',
	'showReplies',
	'deleteReplies',
	'showReposts',
	'deleteReposts',
	'showLikes',
	'deleteLikes',
	'showFollowing',
	'deleteFollowing'
]);
export type XAction = z.infer<typeof XActionSchema>;

export const YouTubeActionSchema = z.enum([
	'showComments',
	'deleteComments',
	'showLikes',
	'deleteLikes'
]);
export type YouTubeAction = z.infer<typeof YouTubeActionSchema>;

export const SiteActionSchema = z.union([XActionSchema, YouTubeActionSchema]);
export type SiteAction = z.infer<typeof SiteActionSchema>;

export const ActionResultSchema = z.object({
	deletedCount: z.number().int().nonnegative()
});
export type ActionResult = z.infer<typeof ActionResultSchema>;

export const LogLevelSchema = z.enum(['debug', 'info', 'warning', 'error']);
export type LogLevel = z.infer<typeof LogLevelSchema>;

export const LogEntrySchema = z.object({
	timestamp: z.iso.datetime({ offset: true }),
	level: LogLevelSchema,
	message: z.string()
});
export type LogEntry = z.infer<typeof LogEntrySchema>;

export const UpdateCheckResultSchema = z.object({
	updateAvailable: z.boolean(),
	message: z.string().optional()
});
export type UpdateCheckResult = z.infer<typeof UpdateCheckResultSchema>;

const voidSchema = z.void();

export const AppInfoSchema = z.object({
	version: z.string(),
	homepageUrl: z.string(),
	reportBugUrl: z.string(),
	/** The README's troubleshooting section — the app points at it rather than restating it. */
	troubleshootingUrl: z.string()
});
export type AppInfo = z.infer<typeof AppInfoSchema>;

/** Every UI -> Host RPC method, keyed by name, with its params/result schemas. */
export const BridgeMethods = {
	'app.getInfo': { params: voidSchema, result: AppInfoSchema },
	'settings.get': { params: voidSchema, result: AppSettingsSchema },
	'settings.set': { params: AppSettingsSchema, result: voidSchema },
	'site.navigate': {
		params: z.object({ platform: PlatformSchema, action: SiteActionSchema }),
		result: z.object({ ok: z.boolean() })
	},
	'site.runAction': {
		params: z.object({
			/** Minted by the caller so `progress` push events (which outlive the RPC round-trip) can be correlated back to this run. */
			requestId: z.string(),
			platform: PlatformSchema,
			action: SiteActionSchema,
			timeouts: TimeoutSettingsSchema
		}),
		result: ActionResultSchema
	},
	/** Stops an in-flight `site.runAction`; that call then resolves with the count deleted so far. */
	'site.cancelAction': { params: z.object({ requestId: z.string() }), result: voidSchema },
	'site.hide': { params: z.object({ hide: z.boolean() }), result: voidSchema },
	/** A result drawn on the platform page, the one surface visible while it is showing. */
	'site.toast': {
		params: z.object({
			platform: PlatformSchema,
			message: z.string(),
			kind: z.enum(['success', 'info', 'error'])
		}),
		result: voidSchema
	},
	/** Fetches the platform page again, so a finished run is visible where it happened. */
	'site.reload': { params: z.object({ platform: PlatformSchema }), result: voidSchema },
	/** Brings a platform's webview forward without navigating it — each platform keeps its own page for the whole session. */
	'site.show': { params: z.object({ platform: PlatformSchema }), result: voidSchema },
	/** Where the site webview sits: right of the app's own columns, below its header bar. */
	'layout.setSiteInset': {
		params: z.object({
			left: z.number().positive(),
			top: z.number().nonnegative(),
			/** Room kept below the platform for the status bar. The site is shortened, not covered. */
			bottom: z.number().nonnegative()
		}),
		result: voidSchema
	},
	/** The colour the host paints where nothing has been drawn yet, so a resize does not flash. */
	'layout.setBackground': {
		params: z.object({ color: z.string().regex(/^#[0-9a-fA-F]{6}$/) }),
		result: voidSchema
	},
	'updater.checkForUpdates': { params: voidSchema, result: UpdateCheckResultSchema },
	'system.openUrl': { params: z.object({ url: z.string() }), result: voidSchema },
	'system.openLicense': { params: voidSchema, result: voidSchema },
	'log.getBuffer': { params: voidSchema, result: z.array(LogEntrySchema) },
	'assistant.getSources': { params: voidSchema, result: AssistantSourcesSchema },
	/** An empty key forgets the stored one; that is what the reset button sends. */
	'assistant.setKey': {
		params: z.object({ provider: z.string(), key: z.string() }),
		result: voidSchema
	},
	/** Takes a provider id, not a URL — the address comes from the host's own table. */
	'assistant.openFreeKeyUrl': { params: z.object({ provider: z.string() }), result: voidSchema },
	/** Hands the same prompt to Claude Code in a terminal, to carry on the conversation there. */
	'assistant.openInCli': { params: z.object({ prompt: z.string() }), result: voidSchema },
	'assistant.ask': {
		params: z.object({ prompt: z.string() }),
		result: z.object({ text: z.string() })
	}
} as const;

export type BridgeMethodName = keyof typeof BridgeMethods;
export type BridgeParams<M extends BridgeMethodName> = z.infer<(typeof BridgeMethods)[M]['params']>;
export type BridgeResult<M extends BridgeMethodName> = z.infer<(typeof BridgeMethods)[M]['result']>;

export const RpcRequestSchema = z.object({
	id: z.string(),
	method: z.string(),
	params: z.unknown()
});
export type RpcRequest = z.infer<typeof RpcRequestSchema>;

export const RpcErrorSchema = z.object({
	message: z.string(),
	code: z.string().optional()
});

export const RpcResponseSchema = z.discriminatedUnion('ok', [
	z.object({ id: z.string(), ok: z.literal(true), result: z.unknown() }),
	z.object({ id: z.string(), ok: z.literal(false), error: RpcErrorSchema })
]);
export type RpcResponse = z.infer<typeof RpcResponseSchema>;

export const ProgressPayloadSchema = z.object({
	requestId: z.string(),
	deletedCount: z.number().int().nonnegative(),
	message: z.string().optional()
});
export type ProgressPayload = z.infer<typeof ProgressPayloadSchema>;

export const SiteLoginPayloadSchema = z.object({
	platform: PlatformSchema,
	loggedIn: z.boolean(),
	/** Where the page actually is. The window has no address bar, so the UI shows this. */
	url: z.string().optional()
});
export type SiteLoginPayload = z.infer<typeof SiteLoginPayloadSchema>;

export const PushEventSchema = z.discriminatedUnion('event', [
	z.object({ event: z.literal('log'), payload: LogEntrySchema }),
	z.object({ event: z.literal('progress'), payload: ProgressPayloadSchema }),
	z.object({ event: z.literal('settingsChanged'), payload: AppSettingsSchema }),
	z.object({ event: z.literal('siteLogin'), payload: SiteLoginPayloadSchema })
]);
export type PushEvent = z.infer<typeof PushEventSchema>;

/** Anything the host can post back to the WebView2: an RPC reply or a push event. */
export const HostMessageSchema = z.union([RpcResponseSchema, PushEventSchema]);
export type HostMessage = z.infer<typeof HostMessageSchema>;

export function isPushEvent(message: HostMessage): message is PushEvent {
	return 'event' in message;
}
