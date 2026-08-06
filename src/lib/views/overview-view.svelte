<script lang="ts">
	import type { Platform } from '$lib/bridge/contract';
	import type { SettingsStore } from '$lib/stores/settings.svelte';
	import type { SiteLoginStore } from '$lib/stores/site-login.svelte';
	import type { LogStore } from '$lib/stores/log.svelte';
	import type { ActionRunner } from '$lib/stores/action-runner.svelte';
	import { X_GROUPS, YOUTUBE_GROUPS, type ActionGroupDef } from '$lib/actions';
	import { t } from '$lib/i18n/index.svelte';
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
	import XIcon from '$lib/components/icons/x-icon.svelte';
	import YouTubeIcon from '$lib/components/icons/youtube-icon.svelte';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import MousePointerClickIcon from '@lucide/svelte/icons/mouse-pointer-click';
	import CircleDollarSignIcon from '@lucide/svelte/icons/circle-dollar-sign';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';

	interface Props {
		settingsStore: SettingsStore;
		loginStore: SiteLoginStore;
		logStore: LogStore;
		runner: ActionRunner;
		onOpen: (platform: Platform) => void;
		/** Ticking the box writes it away for good; Settings is the way back. */
		onDismissIntro: () => void;
	}

	let { settingsStore, loginStore, logStore, runner, onOpen, onDismissIntro }: Props = $props();

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
						<Button
							variant="outline"
							size="sm"
							class="h-8 self-start"
							onclick={() => onOpen(platform.key)}
						>
							{t('overview.open', { platform: platform.label })}
							<ArrowRightIcon />
						</Button>
					</CardContent>
				</Card>
			{/each}
		</div>

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
