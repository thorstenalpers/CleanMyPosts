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
export const LanguageSchema = z.enum(['System', 'en', 'de']);
export type Language = z.infer<typeof LanguageSchema>;

/** The colour identity. `Default` is the neutral base; the rest are classes on <html> (see src/themes.css). */
export const ThemePresetSchema = z.enum(['Default', 'Claude', 'Cosmic', 'Supabase', 'Graphite']);
export type ThemePreset = z.infer<typeof ThemePresetSchema>;

export const AppSettingsSchema = z.object({
	theme: AppThemeSchema,
	language: LanguageSchema,
	showIntro: z.boolean(),
	showLogs: z.boolean(),
	showX: z.boolean(),
	showYouTube: z.boolean(),
	confirmDeletion: z.boolean(),
	themePreset: ThemePresetSchema,
	timeouts: TimeoutSettingsSchema
});
export type AppSettings = z.infer<typeof AppSettingsSchema>;

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

export const LogLevelSchema = z.enum(['info', 'warning', 'error']);
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
	reportBugUrl: z.string()
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
	/** Brings a platform's webview forward without navigating it — each platform keeps its own page for the whole session. */
	'site.show': { params: z.object({ platform: PlatformSchema }), result: voidSchema },
	'site.reload': { params: voidSchema, result: voidSchema },
	/** Resizes the host's chrome column to the width the UI occupies — the site column starts where it ends. */
	'layout.setChromeWidth': {
		params: z.object({ width: z.number().positive() }),
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
	'log.getBuffer': { params: voidSchema, result: z.array(LogEntrySchema) }
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
	loggedIn: z.boolean()
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
