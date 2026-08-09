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

// Above the settings rather than beside the actions below: a saved action names the platform
// it belongs to, and the settings carry those.
export const PlatformSchema = z.enum(['x', 'youtube']);
export type Platform = z.infer<typeof PlatformSchema>;

/**
 * How hard the assistant is asked to think. Providers word this differently — a token budget
 * on one, a reasoning parameter on another — so the app names the intent and the host maps it.
 */
export const AssistantEffortSchema = z.enum(['low', 'medium', 'high']);
export type AssistantEffort = z.infer<typeof AssistantEffortSchema>;

/**
 * How one element is named.
 *
 * A selector, optionally narrowed to the one carrying a given word — which is how both
 * platforms are actually navigated, since a menu entry has no mark of its own beyond what it
 * says. Never an index into the page: that is what makes a recorded plan worthless the moment
 * the page renders again.
 */
export const TargetSchema = z.object({
	selector: z.string().min(1).max(300),
	/** Matched case-insensitively against the element's text. Absent means: the first match. */
	text: z.string().max(120).optional()
});
export type Target = z.infer<typeof TargetSchema>;

/** The longest any single step may block, so a bad plan cannot hang a run for ever. */
const MAX_STEP_WAIT = 30_000;

/**
 * One step of a plan.
 *
 * Deliberately small, and every entry maps onto a primitive `$lib/engine/dom.ts` already has.
 * The vocabulary is the guarantee: a plan can only do what the engine could already do, so
 * nothing arrives that has to be trusted the way a script would.
 */
export const PlanStepSchema = z.discriminatedUnion('step', [
	z.object({
		step: z.literal('click'),
		target: TargetSchema,
		pointerSequence: z.boolean().optional()
	}),
	z.object({
		step: z.literal('waitFor'),
		target: TargetSchema,
		maxWaitMs: z.number().int().min(0).max(MAX_STEP_WAIT).optional()
	}),
	z.object({
		step: z.literal('waitGone'),
		target: TargetSchema,
		maxWaitMs: z.number().int().min(0).max(MAX_STEP_WAIT).optional()
	}),
	z.object({
		step: z.literal('scrollUntil'),
		target: TargetSchema,
		maxWaitMs: z.number().int().min(0).max(MAX_STEP_WAIT).optional()
	}),
	z.object({ step: z.literal('wait'), ms: z.number().int().min(0).max(MAX_STEP_WAIT) }),
	/**
	 * Opens a page in the platform's own webview.
	 *
	 * Which addresses are allowed is decided in the engine, against the same origins the
	 * injected script guards — a step that could send a signed-in session anywhere is not a
	 * step, it is a way out of the app.
	 */
	z.object({ step: z.literal('navigate'), url: z.string().url().max(500) })
]);
export type PlanStep = z.infer<typeof PlanStepSchema>;

/**
 * What removes one item, and how to tell there is one left to remove.
 *
 * The loop is not in here on purpose. The app owns repeating, counting, the waits between
 * deletions, the stop button and the shield — everything that makes a run safe — and the plan
 * only says what one round of it does.
 */
export const ActionPlanSchema = z
	.object({
		/**
		 * `loop` repeats the steps until the target finds nothing — a deletion, and what every
		 * plan used to be. `once` runs them a single time, which is what opening a page or
		 * dismissing a banner is: those have nothing to count and nothing to empty.
		 *
		 * Defaulted, so a plan saved before this existed still reads as what it was.
		 */
		kind: z.enum(['loop', 'once']).default('loop'),
		/** What one still-present item looks like. Required for `loop`, meaningless for `once`. */
		target: TargetSchema.optional(),
		steps: z.array(PlanStepSchema).min(1).max(10)
	})
	.refine((plan) => plan.kind === 'once' || plan.target !== undefined, {
		message: 'a looping plan needs a target, or it would never know when to stop',
		path: ['target']
	});
export type ActionPlan = z.infer<typeof ActionPlanSchema>;

/**
 * A plan the assistant wrote and the user kept.
 *
 * It becomes a row in that platform's action panel, beside the built-in lists. `createdAt` is
 * carried so the settings can say how old one is: these accumulate, and a platform that has
 * since changed its markup makes yesterday's plan worse than nothing.
 */
export const CustomActionSchema = z.object({
	id: z.string().min(1),
	label: z.string().min(1).max(60),
	platform: PlatformSchema,
	/**
	 * Where it is offered. `panel` is beside that platform's own lists; `sidebar` puts it in
	 * the app's navigation, for something that is not a deletion and has no list to belong to.
	 */
	place: z.enum(['panel', 'sidebar']).default('panel'),
	plan: ActionPlanSchema,
	createdAt: z.iso.datetime({ offset: true })
});
export type CustomAction = z.infer<typeof CustomActionSchema>;

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
	/** Whether the app asks the release feed for a newer version when it starts. */
	checkUpdatesOnStart: z.boolean(),
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
	/** Empty means whatever `assistant.getSources` reports for the chosen provider. */
	assistantModel: z.string(),
	assistantEffort: AssistantEffortSchema,
	/** Scripts the assistant wrote that the user kept. Shown in each platform's action panel. */
	customActions: z.array(CustomActionSchema),
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
	/** The version on offer, so the UI can name it before asking whether to install it. */
	version: z.string().optional(),
	/** The release notes carried in `latest.json`, as markdown. */
	notes: z.string().nullish()
});
export type UpdateCheckResult = z.infer<typeof UpdateCheckResultSchema>;

const voidSchema = z.void();

export const AppInfoSchema = z.object({
	version: z.string(),
	/** `YYYY-MM-DD`, stamped into the binary by `build.rs` — the day this build was made. */
	buildDate: z.string(),
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
	'settings.reset': { params: voidSchema, result: AppSettingsSchema },
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
	/**
	 * Runs an assistant's plan on the page that is already open, once.
	 *
	 * Deliberately does not navigate the way `site.runAction` does: this is "try what you just
	 * got where you are standing", and a plan is judged against the page it was written for.
	 * Stopped by `site.cancelAction` like any other run.
	 */
	'site.runPlan': {
		params: z.object({
			requestId: z.string(),
			platform: PlatformSchema,
			plan: ActionPlanSchema,
			/** What the user called it, for the log. Absent for a plan that is only being tried. */
			label: z.string().max(60).optional(),
			timeouts: TimeoutSettingsSchema
		}),
		result: ActionResultSchema
	},
	/** The dry run: how many elements the plan's target finds, having touched none of them. */
	'site.countMatches': {
		params: z.object({ platform: PlatformSchema, target: TargetSchema }),
		result: z.object({ count: z.number().int().nonnegative() })
	},
	/**
	 * A text-free skeleton of the platform page, for the assistant to write a selector against.
	 *
	 * Redacted in the page itself, before it crosses this wire — see `$lib/engine/structure.ts`.
	 * The one thing the app sends that comes off the page, and the user reads it in the preview
	 * before it goes anywhere.
	 */
	'site.readStructure': {
		params: z.object({ platform: PlatformSchema }),
		result: z.object({ structure: z.string() })
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
	/** Where the site webview sits: beside the app's own columns, below its header bar. */
	'layout.setSiteInset': {
		params: z.object({
			/**
			 * How wide the app's own columns are — not which edge they are against. `rtl` decides
			 * that, and the host has no other way to know: it places the webview in physical
			 * pixels and cannot see the `dir` on `<html>`.
			 */
			left: z.number().positive(),
			top: z.number().nonnegative(),
			/** Room kept below the platform for the status bar. The site is shortened, not covered. */
			bottom: z.number().nonnegative(),
			/** True while the shell is mirrored, which puts those columns on the right. */
			rtl: z.boolean()
		}),
		result: voidSchema
	},
	/** The colour the host paints where nothing has been drawn yet, so a resize does not flash. */
	'layout.setBackground': {
		params: z.object({ color: z.string().regex(/^#[0-9a-fA-F]{6}$/) }),
		result: voidSchema
	},
	'updater.checkForUpdates': { params: voidSchema, result: UpdateCheckResultSchema },
	/** Resolves only if it fails: a successful install restarts the app out from under the call. */
	'updater.installUpdate': { params: voidSchema, result: voidSchema },
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

export const UpdateProgressPayloadSchema = z.object({
	downloaded: z.number().int().nonnegative(),
	/** Absent when the server sends no length; the bar runs indeterminate then. */
	contentLength: z.number().int().nonnegative().nullish()
});
export type UpdateProgressPayload = z.infer<typeof UpdateProgressPayloadSchema>;

export const PushEventSchema = z.discriminatedUnion('event', [
	z.object({ event: z.literal('log'), payload: LogEntrySchema }),
	z.object({ event: z.literal('progress'), payload: ProgressPayloadSchema }),
	z.object({ event: z.literal('updateProgress'), payload: UpdateProgressPayloadSchema }),
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
