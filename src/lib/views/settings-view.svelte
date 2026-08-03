<script lang="ts">
	import { toast } from 'svelte-sonner';
	import type { BridgeClient } from '$lib/bridge/client';
	import type { SettingsStore } from '$lib/stores/settings.svelte';
	import {
		AppSettingsSchema,
		LOCAL_ASSISTANT_SOURCE,
		type AppInfo,
		type AppTheme,
		type AssistantSources,
		type Language
	} from '$lib/bridge/contract';
	import { THEME_PRESETS } from '$lib/theme/preset';
	import { LANGUAGES, t } from '$lib/i18n/index.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Switch } from '$lib/components/ui/switch';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import SettingRow from '$lib/components/setting-row.svelte';
	import ApiKeysDialog from '$lib/components/api-keys-dialog.svelte';
	import { cn } from '$lib/utils';
	import PaletteIcon from '@lucide/svelte/icons/palette';
	import ShieldIcon from '@lucide/svelte/icons/shield';
	import PanelLeftIcon from '@lucide/svelte/icons/panel-left';
	import TimerIcon from '@lucide/svelte/icons/timer';
	import InfoIcon from '@lucide/svelte/icons/info';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import LaptopIcon from '@lucide/svelte/icons/laptop';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import BugIcon from '@lucide/svelte/icons/bug';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';

	interface Props {
		bridge: BridgeClient;
		settingsStore: SettingsStore;
	}

	let { bridge, settingsStore }: Props = $props();

	let appInfo = $state<AppInfo | undefined>(undefined);
	let checkingUpdates = $state(false);
	let sources = $state<AssistantSources | undefined>(undefined);
	let keysOpen = $state(false);

	$effect(() => {
		void bridge.call('app.getInfo', undefined).then((info) => (appInfo = info));
	});

	async function loadSources(): Promise<void> {
		sources = await bridge.call('assistant.getSources', undefined);
	}

	$effect(() => {
		void loadSources();
	});

	const usingLocal = $derived(settingsStore.settings.assistantSource === LOCAL_ASSISTANT_SOURCE);
	const activeProvider = $derived(
		sources?.providers.find((entry) => entry.id === settingsStore.settings.assistantSource)
	);

	/** Re-read after every write: `hasKey` is the only thing the store will say about a key. */
	async function setKey(provider: string, key: string): Promise<void> {
		await bridge.call('assistant.setKey', { provider, key });
		await loadSources();
	}

	const themes = [
		{ value: 'Light' as AppTheme, label: 'settings.mode.light' as const, icon: SunIcon },
		{ value: 'Dark' as AppTheme, label: 'settings.mode.dark' as const, icon: MoonIcon },
		{ value: 'Default' as AppTheme, label: 'settings.mode.system' as const, icon: LaptopIcon }
	];

	/** `System` is the only entry with a translated label; every language names itself. */
	function languageLabel(id: Language, label: string): string {
		return id === 'System' ? t('settings.language.system') : label;
	}

	const timeoutFields = [
		{
			key: 'waitAfterDocumentLoad',
			id: 'wait-after-document-load',
			label: 'settings.timing.afterLoad',
			description: 'settings.timing.afterLoad.description'
		},
		{
			key: 'waitAfterDelete',
			id: 'wait-after-delete',
			label: 'settings.timing.betweenDeletes',
			description: 'settings.timing.betweenDeletes.description'
		},
		{
			key: 'waitBetweenRetryDeleteAttempts',
			id: 'wait-between-retries',
			label: 'settings.timing.betweenRetries',
			description: 'settings.timing.betweenRetries.description'
		}
	] as const;

	async function commit(next: Partial<typeof settingsStore.settings>): Promise<void> {
		const merged = { ...settingsStore.settings, ...next };
		const parsed = AppSettingsSchema.safeParse(merged);
		if (!parsed.success) {
			toast.error(t('settings.invalid'));
			return;
		}
		await settingsStore.update(parsed.data);
	}

	async function checkForUpdates(): Promise<void> {
		checkingUpdates = true;
		try {
			const result = await bridge.call('updater.checkForUpdates', undefined);
			if (!result.updateAvailable) {
				toast.info(result.message ?? t('settings.noUpdates'));
			}
		} finally {
			checkingUpdates = false;
		}
	}
</script>

{#snippet cardTitle(title: string, icon: typeof PaletteIcon)}
	{@const Icon = icon}
	<CardTitle class="flex items-center gap-2">
		<Icon class="size-3.5 text-muted-foreground" />
		{title}
	</CardTitle>
{/snippet}

<div class="h-full overflow-y-auto">
	<div class="mx-auto flex max-w-2xl flex-col gap-4 p-5">
		<header>
			<h1 class="text-xl font-semibold tracking-tight">{t('settings.title')}</h1>
			<p class="mt-0.5 text-xs text-muted-foreground">{t('settings.subtitle')}</p>
		</header>

		<Card>
			<CardHeader>
				{@render cardTitle(t('settings.appearance'), PaletteIcon)}
				<CardDescription>{t('settings.appearance.description')}</CardDescription>
			</CardHeader>
			<CardContent class="divide-y divide-border/60">
				<SettingRow label={t('settings.mode')} description={t('settings.mode.description')}>
					{#snippet control()}
						<div class="flex gap-1" role="group" aria-label={t('settings.mode')}>
							{#each themes as theme (theme.value)}
								{@const active = settingsStore.settings.theme === theme.value}
								<button
									type="button"
									aria-pressed={active}
									onclick={() => commit({ theme: theme.value })}
									class={cn(
										'flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
										active
											? 'border-primary/40 bg-primary/10 text-foreground'
											: 'border-border text-muted-foreground hover:bg-muted'
									)}
								>
									<theme.icon class="size-3.5" />
									{t(theme.label)}
								</button>
							{/each}
						</div>
					{/snippet}
				</SettingRow>

				<SettingRow label={t('settings.colour')} description={t('settings.colour.description')}>
					{#snippet control()}
						<div
							class="flex flex-wrap justify-end gap-1"
							role="group"
							aria-label={t('settings.colour')}
						>
							{#each THEME_PRESETS as preset (preset.id)}
								{@const active = settingsStore.settings.themePreset === preset.id}
								<button
									type="button"
									aria-pressed={active}
									onclick={() => commit({ themePreset: preset.id })}
									class={cn(
										'flex h-8 cursor-pointer items-center rounded-md border px-2.5 text-xs font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
										active
											? 'border-primary/40 bg-primary/10 text-foreground'
											: 'border-border text-muted-foreground hover:bg-muted'
									)}
								>
									{preset.label}
								</button>
							{/each}
						</div>
					{/snippet}
				</SettingRow>

				<SettingRow label={t('settings.language')} description={t('settings.language.description')}>
					{#snippet control()}
						<div
							class="flex flex-wrap justify-end gap-1"
							role="group"
							aria-label={t('settings.language')}
						>
							{#each LANGUAGES as language (language.id)}
								{@const active = settingsStore.settings.language === language.id}
								<button
									type="button"
									aria-pressed={active}
									onclick={() => commit({ language: language.id })}
									class={cn(
										'flex h-8 cursor-pointer items-center rounded-md border px-2.5 text-xs font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
										active
											? 'border-primary/40 bg-primary/10 text-foreground'
											: 'border-border text-muted-foreground hover:bg-muted'
									)}
								>
									{languageLabel(language.id, language.label)}
								</button>
							{/each}
						</div>
					{/snippet}
				</SettingRow>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				{@render cardTitle(t('settings.navigation'), PanelLeftIcon)}
				<CardDescription>{t('settings.navigation.description')}</CardDescription>
			</CardHeader>
			<CardContent class="divide-y divide-border/60">
				<SettingRow
					label={t('settings.showX')}
					description={t('settings.showX.description')}
					for="show-x"
				>
					{#snippet control()}
						<Switch
							id="show-x"
							checked={settingsStore.settings.showX}
							onCheckedChange={(checked: boolean) => commit({ showX: checked })}
						/>
					{/snippet}
				</SettingRow>

				<SettingRow
					label={t('settings.showYouTube')}
					description={t('settings.showYouTube.description')}
					for="show-youtube"
				>
					{#snippet control()}
						<Switch
							id="show-youtube"
							checked={settingsStore.settings.showYouTube}
							onCheckedChange={(checked: boolean) => commit({ showYouTube: checked })}
						/>
					{/snippet}
				</SettingRow>

				<SettingRow
					label={t('settings.showIntro')}
					description={t('settings.showIntro.description')}
					for="show-intro"
				>
					{#snippet control()}
						<Switch
							id="show-intro"
							checked={settingsStore.settings.showIntro}
							onCheckedChange={(checked: boolean) => commit({ showIntro: checked })}
						/>
					{/snippet}
				</SettingRow>

				<SettingRow
					label={t('settings.showLog')}
					description={t('settings.showLog.description')}
					for="show-logs"
				>
					{#snippet control()}
						<Switch
							id="show-logs"
							checked={settingsStore.settings.showLogs}
							onCheckedChange={(checked: boolean) => commit({ showLogs: checked })}
						/>
					{/snippet}
				</SettingRow>

				<SettingRow
					label={t('settings.showAssistant')}
					description={t('settings.showAssistant.description')}
					for="show-assistant"
				>
					{#snippet control()}
						<Switch
							id="show-assistant"
							checked={settingsStore.settings.showAssistant}
							onCheckedChange={(checked: boolean) => commit({ showAssistant: checked })}
						/>
					{/snippet}
				</SettingRow>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				{@render cardTitle(t('settings.assistant'), SparklesIcon)}
				<CardDescription>{t('settings.assistant.description')}</CardDescription>
			</CardHeader>
			<CardContent class="divide-y divide-border/60">
				<SettingRow
					label={t('settings.assistant.source')}
					description={usingLocal
						? sources?.local.found
							? t('settings.assistant.cliFound', {
									version: sources.local.version ?? sources.local.path ?? ''
								})
							: t('settings.assistant.cliMissing')
						: t('settings.assistant.provider.description')}
				>
					{#snippet control()}
						<div class="flex gap-1" role="group" aria-label={t('settings.assistant.source')}>
							{#each [{ value: LOCAL_ASSISTANT_SOURCE, label: t('settings.assistant.local') }, { value: 'hosted', label: t('settings.assistant.hosted') }] as choice (choice.value)}
								{@const active = choice.value === LOCAL_ASSISTANT_SOURCE ? usingLocal : !usingLocal}
								<button
									type="button"
									aria-pressed={active}
									onclick={() =>
										commit({
											assistantSource:
												choice.value === LOCAL_ASSISTANT_SOURCE
													? LOCAL_ASSISTANT_SOURCE
													: (activeProvider?.id ??
														sources?.providers[0]?.id ??
														LOCAL_ASSISTANT_SOURCE)
										})}
									class={cn(
										'flex h-8 cursor-pointer items-center rounded-md border px-2.5 text-xs font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
										active
											? 'border-primary/40 bg-primary/10 text-foreground'
											: 'border-border text-muted-foreground hover:bg-muted'
									)}
								>
									{choice.label}
								</button>
							{/each}
						</div>
					{/snippet}
				</SettingRow>

				{#if usingLocal}
					<SettingRow
						label={t('settings.assistant.cliPath')}
						description={t('settings.assistant.cliPath.description')}
						for="assistant-cli-path"
					>
						{#snippet control()}
							<Input
								id="assistant-cli-path"
								class="h-8 w-64 font-mono text-xs"
								placeholder={t('settings.assistant.cliPath.placeholder')}
								value={settingsStore.settings.assistantCliPath}
								onchange={async (e: Event & { currentTarget: HTMLInputElement }) => {
									await commit({ assistantCliPath: e.currentTarget.value });
									await loadSources();
								}}
							/>
						{/snippet}
					</SettingRow>
				{:else}
					<SettingRow
						label={t('settings.assistant.provider')}
						description={activeProvider
							? `${activeProvider.label} · ${activeProvider.model}`
							: t('settings.assistant.provider.description')}
					>
						{#snippet control()}
							<Button variant="outline" size="sm" class="h-8" onclick={() => (keysOpen = true)}>
								<KeyRoundIcon />
								{t('settings.assistant.keys')}
							</Button>
						{/snippet}
					</SettingRow>
				{/if}
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				{@render cardTitle(t('settings.safety'), ShieldIcon)}
				<CardDescription>{t('settings.safety.description')}</CardDescription>
			</CardHeader>
			<CardContent class="divide-y divide-border/60">
				<SettingRow
					label={t('settings.confirm')}
					description={t('settings.confirm.description')}
					for="confirm-deletion"
				>
					{#snippet control()}
						<Switch
							id="confirm-deletion"
							checked={settingsStore.settings.confirmDeletion}
							onCheckedChange={(checked: boolean) => commit({ confirmDeletion: checked })}
						/>
					{/snippet}
				</SettingRow>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				{@render cardTitle(t('settings.timing'), TimerIcon)}
				<CardDescription>{t('settings.timing.description')}</CardDescription>
			</CardHeader>
			<CardContent class="divide-y divide-border/60">
				{#each timeoutFields as field (field.key)}
					<SettingRow label={t(field.label)} description={t(field.description)} for={field.id}>
						{#snippet control()}
							<Input
								id={field.id}
								type="number"
								min="0"
								step="100"
								class="h-8 w-24 text-right tabular-nums"
								value={settingsStore.settings.timeouts[field.key]}
								onchange={(e: Event & { currentTarget: HTMLInputElement }) =>
									commit({
										timeouts: {
											...settingsStore.settings.timeouts,
											[field.key]: Number(e.currentTarget.value)
										}
									})}
							/>
							<span class="w-5 text-xs text-muted-foreground">ms</span>
						{/snippet}
					</SettingRow>
				{/each}
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				{@render cardTitle(t('settings.about'), InfoIcon)}
				<CardDescription>{t('settings.about.description')}</CardDescription>
			</CardHeader>
			<CardContent class="divide-y divide-border/60">
				<SettingRow
					label="CleanMyPosts"
					description={appInfo
						? t('settings.version', { version: appInfo.version })
						: t('settings.versionLoading')}
				>
					{#snippet control()}
						<Button
							variant="outline"
							size="sm"
							class="h-8"
							disabled={checkingUpdates}
							onclick={checkForUpdates}
						>
							<RefreshCwIcon class={cn(checkingUpdates && 'animate-spin')} />
							{t('settings.checkUpdates')}
						</Button>
					{/snippet}
				</SettingRow>

				<div class="flex flex-wrap gap-2 py-2.5">
					{#if appInfo}
						<Button
							variant="ghost"
							size="sm"
							class="h-8"
							onclick={() => bridge.call('system.openUrl', { url: appInfo!.homepageUrl })}
						>
							<ExternalLinkIcon />
							{t('settings.github')}
						</Button>
						<Button
							variant="ghost"
							size="sm"
							class="h-8"
							onclick={() => bridge.call('system.openUrl', { url: appInfo!.reportBugUrl })}
						>
							<BugIcon />
							{t('settings.reportBug')}
						</Button>
					{/if}
					<Button
						variant="ghost"
						size="sm"
						class="h-8"
						onclick={() => bridge.call('system.openLicense', undefined)}
					>
						<FileTextIcon />
						{t('settings.licenses')}
					</Button>
				</div>
			</CardContent>
		</Card>
	</div>
</div>

{#if sources}
	<ApiKeysDialog
		bind:open={keysOpen}
		providers={sources.providers}
		selected={settingsStore.settings.assistantSource}
		onSelect={(provider: string) => commit({ assistantSource: provider })}
		onSetKey={setKey}
		onOpenFreeKeyUrl={(provider: string) => bridge.call('assistant.openFreeKeyUrl', { provider })}
	/>
{/if}
