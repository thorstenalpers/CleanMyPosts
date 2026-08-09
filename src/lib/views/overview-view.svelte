<script lang="ts">
	import type { Platform } from '$lib/bridge/contract';
	import type { SettingsStore } from '$lib/stores/settings.svelte';
	import type { AppContext } from '$lib/app-context';
	import type { SiteLoginStore } from '$lib/stores/site-login.svelte';
	import type { LogStore } from '$lib/stores/log.svelte';
	import type { ActionRunner } from '$lib/stores/action-runner.svelte';
	import type { UpdaterStore } from '$lib/stores/updater.svelte';
	import { X_GROUPS, YOUTUBE_GROUPS, type ActionGroupDef } from '$lib/actions';
	import { t } from '$lib/i18n/index.svelte';
	import { renderNotes } from '$lib/markdown';
	import { notify } from '$lib/notify';
	import { cn } from '$lib/utils';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import XIcon from '$lib/components/icons/x-icon.svelte';
	import YouTubeIcon from '$lib/components/icons/youtube-icon.svelte';
	import WandIcon from '@lucide/svelte/icons/wand-sparkles';
	import PlayIcon from '@lucide/svelte/icons/play';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import MousePointerClickIcon from '@lucide/svelte/icons/mouse-pointer-click';
	import CircleDollarSignIcon from '@lucide/svelte/icons/circle-dollar-sign';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';

	interface Props {
		settingsStore: SettingsStore;
		loginStore: SiteLoginStore;
		logStore: LogStore;
		runner: ActionRunner;
		updater: UpdaterStore;
		/** `deleteAll` carries the shortcut's intent to the platform's own panel, which owns
		 *  the confirmation and the run. */
		onOpen: (platform: Platform, options?: { deleteAll?: boolean }) => void;
		/** Ticking the box writes it away for good; Settings is the way back. */
		onDismissIntro: () => void;
		/** Brings a platform on screen and runs a plan on it; the layout owns both halves. */
		runPlanOn: AppContext['runPlanOn'];
	}

	let {
		settingsStore,
		loginStore,
		logStore,
		runner,
		updater,
		onOpen,
		onDismissIntro,
		runPlanOn
	}: Props = $props();

	/** In the order the user put them in, which is the order the settings let them change. */
	const saved = $derived(settingsStore.settings.customActions);

	let running = $state<string | undefined>(undefined);

	async function run(action: (typeof saved)[number]): Promise<void> {
		if (runner.running || running) return;
		running = action.id;
		try {
			await runPlanOn({ platform: action.platform, plan: action.plan, label: action.label });
		} catch {
			// The log has it, and the status bar reports the run. A card is not the place to
			// repeat either.
		} finally {
			running = undefined;
		}
	}

	const downloadLabel = $derived(
		updater.percent === undefined
			? t('update.downloading', { version: updater.version })
			: t('update.downloadingPercent', { version: updater.version, percent: updater.percent })
	);

	async function installUpdate(): Promise<void> {
		try {
			await updater.install();
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			notify(settingsStore, 'error', t('update.failed', { message }));
		}
	}

	const ALL_PLATFORMS: {
		key: Platform;
		label: string;
		icon: typeof XIcon;
		/** The platform's own mark keeps its own colour, the same as in the sidebar. */
		tint: string;
		groups: ActionGroupDef[];
	}[] = [
		{ key: 'x', label: 'X', icon: XIcon, tint: 'text-foreground', groups: X_GROUPS },
		{
			key: 'youtube',
			label: 'YouTube',
			icon: YouTubeIcon,
			tint: 'cmp-brand-youtube',
			groups: YOUTUBE_GROUPS
		}
	];

	// A card for a platform the sidebar does not offer would open a route the layout bounces
	// straight back, so the summary follows the same two switches.
	const platforms = $derived(
		ALL_PLATFORMS.filter((platform) =>
			platform.key === 'x' ? settingsStore.settings.showX : settingsStore.settings.showYouTube
		)
	);

	const traits = [
		{
			icon: MousePointerClickIcon,
			title: 'overview.how.automation.title' as const,
			body: 'overview.how.automation.body' as const
		},
		{
			icon: CircleDollarSignIcon,
			title: 'overview.how.free.title' as const,
			body: 'overview.how.free.body' as const
		},
		{
			icon: ShieldCheckIcon,
			title: 'overview.how.private.title' as const,
			body: 'overview.how.private.body' as const
		}
	];

	const warnings = $derived(logStore.entries.filter((entry) => entry.level === 'warning').length);
	const errors = $derived(logStore.entries.filter((entry) => entry.level === 'error').length);
</script>

<div class="h-full overflow-y-auto">
	<div class="mx-auto flex max-w-3xl flex-col gap-4 p-5">
		<p class="text-xs text-muted-foreground">{t('overview.subtitle')}</p>

		{#if updater.available}
			<Card class="border-primary/40">
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<DownloadIcon class="size-4 shrink-0 text-primary" />
						{t('update.available.title')}
					</CardTitle>
					<CardDescription>
						{t('update.available.body', { version: updater.version })}
					</CardDescription>
				</CardHeader>
				<CardContent class="flex flex-col gap-3">
					{#if updater.notes}
						<!-- `renderNotes` escapes the whole string before it rebuilds a fixed set of
						     tags, so nothing the release feed carries can reach the document as markup.
						     That escaping is the mitigation this rule asks for. -->
						<div class="cmp-notes max-h-56 overflow-y-auto pr-1 text-xs">
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html renderNotes(updater.notes)}
						</div>
					{/if}

					{#if updater.installing}
						<div class="flex flex-col gap-1.5">
							<span class="h-4 text-xs text-muted-foreground tabular-nums">
								{updater.percent === undefined ? '' : `${updater.percent}%`}
							</span>
							<Progress value={updater.percent} label={downloadLabel} />
						</div>
					{:else}
						<Button size="sm" class="h-8 self-start" onclick={installUpdate}>
							<DownloadIcon />
							{t('update.install')}
						</Button>
					{/if}
				</CardContent>
			</Card>
		{/if}

		<!-- Not before the real settings arrive: the fallback has the intro on, and a user who
		     switched it off should not watch it flash past on every start. -->
		{#if !settingsStore.loading && settingsStore.settings.showIntro}
			<Card class="border-0 bg-muted">
				<CardHeader>
					<CardTitle class="text-base">{t('overview.how.title')}</CardTitle>
					<CardDescription class="text-current/75">{t('overview.how.lead')}</CardDescription>
				</CardHeader>
				<CardContent class="flex flex-col gap-2.5">
					{#each traits as trait (trait.title)}
						<div class="flex gap-2.5">
							<trait.icon class="mt-0.5 size-4 shrink-0 text-current/60" />
							<p class="text-xs leading-relaxed text-current/75">
								<span class="font-medium text-current">{t(trait.title)}</span>
								{t(trait.body)}
							</p>
						</div>
					{/each}

					<label class="mt-1 flex w-fit cursor-pointer items-center gap-2 text-xs text-current/75">
						<input
							type="checkbox"
							class="size-3.5 cursor-pointer accent-current"
							onchange={onDismissIntro}
						/>
						{t('overview.how.dismiss')}
					</label>
				</CardContent>
			</Card>
		{/if}

		<div class="grid gap-4 sm:grid-cols-2">
			{#each platforms as platform (platform.key)}
				{@const connected = !!loginStore.loggedIn[platform.key]}
				<Card class="flex flex-col">
					<CardHeader>
						<div class="flex items-center gap-2">
							<platform.icon class={cn('size-4 shrink-0', platform.tint)} />
							<CardTitle class="flex-1">{platform.label}</CardTitle>
							<Badge variant={connected ? 'accent' : 'neutral'}>
								{connected ? t('site.signedIn') : t('site.signedOut')}
							</Badge>
						</div>
						<CardDescription>
							{t('overview.kinds', { count: platform.groups.length })}
						</CardDescription>
					</CardHeader>
					<CardContent class="flex flex-1 flex-col justify-between gap-3">
						<ul class="flex flex-wrap gap-1">
							{#each platform.groups as group (group.key)}
								<li
									class="flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
								>
									<group.icon class="size-3" />
									{t(group.label)}
								</li>
							{/each}
						</ul>
						<div class="flex flex-wrap items-center gap-2">
							<Button variant="outline" size="sm" class="h-8" onclick={() => onOpen(platform.key)}>
								{t('overview.open', { platform: platform.label })}
								<ArrowRightIcon />
							</Button>

							<!-- Only with an account behind it: the shortcut opens the platform and hands
							     the run to its panel, which is where the confirmation lives. -->
							{#if connected}
								<Button
									variant="destructive"
									size="sm"
									class="h-8"
									disabled={runner.running}
									onclick={() => onOpen(platform.key, { deleteAll: true })}
								>
									<Trash2Icon />
									{t('action.deleteAll')}
								</Button>
							{/if}
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>

		<!-- Above "right now", because this is a list somebody acts on and that one only
		     reports. Every kept plan, whichever platform it belongs to: the overview is the one
		     page that does not already have a platform in mind. -->
		{#if saved.length > 0}
			<Card>
				<CardHeader>
					<CardTitle>{t('overview.saved')}</CardTitle>
					<CardDescription>{t('overview.saved.description')}</CardDescription>
				</CardHeader>
				<CardContent class="flex flex-col gap-1.5">
					{#each saved as action (action.id)}
						<button
							type="button"
							disabled={runner.running || running !== undefined}
							onclick={() => run(action)}
							class="group/saved flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border/60 px-2.5 text-start transition-colors duration-150 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
						>
							<WandIcon class="size-3.5 shrink-0 text-muted-foreground" />
							<span class="min-w-0 flex-1 truncate text-[13px]">{action.label}</span>
							<span class="shrink-0 text-xs text-muted-foreground">
								{action.platform === 'x' ? 'X' : 'YouTube'}
							</span>
							<PlayIcon
								class="size-3.5 shrink-0 text-muted-foreground/60 group-hover/saved:text-foreground"
							/>
						</button>
					{/each}
				</CardContent>
			</Card>
		{/if}

		<Card>
			<CardHeader>
				<CardTitle>{t('overview.now.title')}</CardTitle>
				<CardDescription>
					{runner.running && runner.currentLabel
						? t('overview.now.running', {
								label: t(runner.currentLabel),
								count: runner.deletedSoFar
							})
						: t('overview.now.idle')}
				</CardDescription>
			</CardHeader>
			<CardContent
				class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground"
			>
				<span>
					{settingsStore.settings.confirmDeletion
						? t('overview.now.confirmOn')
						: t('overview.now.confirmOff')}
				</span>
				<span class="tabular-nums">
					{t('overview.now.pause', { count: settingsStore.settings.timeouts.waitAfterDelete })}
				</span>
				{#if warnings > 0}
					<Badge>{t('log.warnings', { count: warnings })}</Badge>
				{/if}
				{#if errors > 0}
					<Badge variant="destructive">{t('log.errors', { count: errors })}</Badge>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>

<!-- The notes arrive as markup from `renderNotes`, so the tags inside cannot carry classes of
     their own and are styled from here instead. -->
<style>
	.cmp-notes :global(h4) {
		margin-top: 0.75em;
		font-weight: 600;
	}

	.cmp-notes :global(h4:first-child) {
		margin-top: 0;
	}

	.cmp-notes :global(p) {
		margin-top: 0.5em;
		line-height: 1.6;
		color: var(--muted-foreground);
	}

	.cmp-notes :global(ul) {
		margin-top: 0.35em;
		padding-left: 1.1em;
		list-style: disc;
	}

	.cmp-notes :global(li) {
		margin-top: 0.25em;
		line-height: 1.6;
		color: var(--muted-foreground);
	}

	.cmp-notes :global(code) {
		border-radius: 0.25rem;
		background: var(--muted);
		padding: 0.05em 0.3em;
		font-size: 0.95em;
	}
</style>
