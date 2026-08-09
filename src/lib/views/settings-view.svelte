<script lang="ts">
	import { notify } from '$lib/notify';
	import type { BridgeClient } from '$lib/bridge/client';
	import type { SettingsStore } from '$lib/stores/settings.svelte';
	import {
		AppSettingsSchema,
		LOCAL_ASSISTANT_SOURCE,
		type AppTheme,
		type AssistantSources,
		type Language
	} from '$lib/bridge/contract';
	import { THEME_PRESETS } from '$lib/theme/preset';
	import { LANGUAGES, i18n, t } from '$lib/i18n/index.svelte';
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
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import SettingRow from '$lib/components/setting-row.svelte';
	import { ConfirmDialog } from '$lib/components/ui/alert-dialog';
	import ApiKeysDialog from '$lib/components/api-keys-dialog.svelte';
	import EngineScriptDialog from '$lib/components/engine-script-dialog.svelte';
	import { cn } from '$lib/utils';
	import PaletteIcon from '@lucide/svelte/icons/palette';
	import SlidersIcon from '@lucide/svelte/icons/sliders-horizontal';
	import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
	import CodeIcon from '@lucide/svelte/icons/code';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import LaptopIcon from '@lucide/svelte/icons/laptop';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import CheckIcon from '@lucide/svelte/icons/check';

	interface Props {
		bridge: BridgeClient;
		settingsStore: SettingsStore;
	}

	let { bridge, settingsStore }: Props = $props();

	/** Off is a source like the others: where the answers come from, or that none do. */
	const SOURCE_CHOICES = [
		{ value: 'off' as const, label: 'settings.assistant.off' as const },
		{ value: LOCAL_ASSISTANT_SOURCE, label: 'settings.assistant.local' as const },
		{ value: 'hosted' as const, label: 'settings.assistant.hosted' as const }
	];

	let sources = $state<AssistantSources | undefined>(undefined);
	let keysOpen = $state(false);
	let engineOpen = $state(false);

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

	/** Whether anything can answer. Below the assistant is hidden app-wide until it can. */
	const assistantReady = $derived(
		sources ? sources.local.found || sources.providers.some((entry) => entry.hasKey) : true
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

	const activeLanguageLabel = $derived.by(() => {
		const active = LANGUAGES.find((entry) => entry.id === settingsStore.settings.language);
		return active ? languageLabel(active.id, active.label) : t('settings.language.system');
	});

	/** Preset names are product names, so they are not translated — see `THEME_PRESETS`. */
	const activePresetLabel = $derived(
		THEME_PRESETS.find((entry) => entry.id === settingsStore.settings.themePreset)?.label ??
			settingsStore.settings.themePreset
	);

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
			notify(settingsStore, 'error', t('settings.invalid'));
			return;
		}
		await settingsStore.update(parsed.data);
	}

	let resetOpen = $state(false);
	let forgetAllOpen = $state(false);

	/**
	 * In the order they are stored, because that order is now the user's.
	 *
	 * It used to be sorted newest-first here, which quietly made the arrows below a lie: the
	 * list is what every other surface renders from, so moving a row has to move it there too.
	 */
	const savedActions = $derived(settingsStore.settings.customActions);

	/** Which row is open for reading, and which is being renamed. `undefined` for neither. */
	let openAction = $state<string | undefined>(undefined);
	let renaming = $state<string | undefined>(undefined);
	let draftName = $state('');

	/** Moves one row past its neighbour. The ends simply do not move. */
	function move(id: string, by: -1 | 1): void {
		const actions = [...settingsStore.settings.customActions];
		const from = actions.findIndex((action) => action.id === id);
		const to = from + by;
		if (from === -1 || to < 0 || to >= actions.length) return;
		const [moved] = actions.splice(from, 1);
		if (moved) actions.splice(to, 0, moved);
		void commit({ customActions: actions });
	}

	function startRename(id: string, current: string): void {
		renaming = id;
		draftName = current;
	}

	function applyRename(): void {
		const id = renaming;
		const label = draftName.trim().slice(0, 60);
		renaming = undefined;
		if (!id || label === '') return;
		void commit({
			customActions: settingsStore.settings.customActions.map((action) =>
				action.id === id ? { ...action, label } : action
			)
		});
	}

	/** The day only. A plan is stale or it is not; the minute it was kept decides nothing. */
	function madeOn(iso: string): string {
		const date = new Date(iso);
		return Number.isNaN(date.getTime())
			? iso
			: date.toLocaleDateString(i18n.locale, { year: 'numeric', month: 'short', day: 'numeric' });
	}

	function forget(id: string): void {
		void commit({
			customActions: settingsStore.settings.customActions.filter((action) => action.id !== id)
		});
	}

	function forgetAll(): void {
		void commit({ customActions: [] });
		forgetAllOpen = false;
	}

	/**
	 * Hands the whole file back to its defaults.
	 *
	 * The host answers with what it wrote rather than the view rebuilding the defaults from
	 * its own idea of them — those live in Rust, and two copies would drift.
	 */
	async function resetAll(): Promise<void> {
		try {
			const defaults = await bridge.call('settings.reset', undefined);
			await settingsStore.update(defaults);
			resetOpen = false;
			notify(settingsStore, 'success', t('settings.reset.done'));
		} catch (error) {
			// Left open on purpose: the settings are untouched, and a dialog that closes on a
			// failure claims the work was done.
			notify(settingsStore, 'error', error instanceof Error ? error.message : String(error));
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
	<div class="flex flex-col gap-4 p-5">
		<p class="text-xs text-muted-foreground">{t('settings.subtitle')}</p>
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
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<button
										{...props}
										type="button"
										aria-label={t('settings.colour')}
										class="flex h-8 cursor-pointer items-center gap-2 rounded-md border border-border px-2.5 text-xs font-medium transition-colors duration-150 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
									>
										{activePresetLabel}
										<ChevronDownIcon class="size-3.5 text-muted-foreground" />
									</button>
								{/snippet}
							</DropdownMenu.Trigger>

							<DropdownMenu.Content align="end" class="w-44">
								{#each THEME_PRESETS as preset (preset.id)}
									<DropdownMenu.Item onSelect={() => commit({ themePreset: preset.id })}>
										<span class="flex-1">{preset.label}</span>
										{#if settingsStore.settings.themePreset === preset.id}
											<CheckIcon class="size-4" />
										{/if}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					{/snippet}
				</SettingRow>

				<SettingRow label={t('settings.language')} description={t('settings.language.description')}>
					{#snippet control()}
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<button
										{...props}
										type="button"
										aria-label={t('settings.language')}
										class="flex h-8 cursor-pointer items-center gap-2 rounded-md border border-border px-2.5 text-xs font-medium transition-colors duration-150 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
									>
										{activeLanguageLabel}
										<ChevronDownIcon class="size-3.5 text-muted-foreground" />
									</button>
								{/snippet}
							</DropdownMenu.Trigger>

							<DropdownMenu.Content align="end" class="w-44">
								{#each LANGUAGES as language (language.id)}
									<DropdownMenu.Item onSelect={() => commit({ language: language.id })}>
										<span class="flex-1">{languageLabel(language.id, language.label)}</span>
										{#if settingsStore.settings.language === language.id}
											<CheckIcon class="size-4" />
										{/if}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					{/snippet}
				</SettingRow>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				{@render cardTitle(t('settings.general'), LayoutGridIcon)}
				<CardDescription>{t('settings.general.description')}</CardDescription>
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
					label={t('settings.notifications')}
					description={t('settings.notifications.description')}
					for="notifications"
				>
					{#snippet control()}
						<Switch
							id="notifications"
							checked={settingsStore.settings.notifications}
							onCheckedChange={(checked: boolean) => commit({ notifications: checked })}
						/>
					{/snippet}
				</SettingRow>

				<SettingRow
					label={t('settings.debugLogging')}
					description={t('settings.debugLogging.description')}
					for="debug-logging"
				>
					{#snippet control()}
						<Switch
							id="debug-logging"
							checked={settingsStore.settings.debugLogging}
							onCheckedChange={(checked: boolean) => commit({ debugLogging: checked })}
						/>
					{/snippet}
				</SettingRow>

				<SettingRow
					label={t('settings.persistSession')}
					description={t('settings.persistSession.description')}
					for="persist-session"
				>
					{#snippet control()}
						<Switch
							id="persist-session"
							checked={settingsStore.settings.persistSession}
							onCheckedChange={(checked: boolean) => commit({ persistSession: checked })}
						/>
					{/snippet}
				</SettingRow>

				<SettingRow
					label={t('settings.checkUpdatesOnStart')}
					description={t('settings.checkUpdatesOnStart.description')}
					for="check-updates-on-start"
				>
					{#snippet control()}
						<Switch
							id="check-updates-on-start"
							checked={settingsStore.settings.checkUpdatesOnStart}
							onCheckedChange={(checked: boolean) => commit({ checkUpdatesOnStart: checked })}
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
				<!-- The one place a missing source is mentioned. Everywhere else the assistant is
				     simply not there: the app deletes without it, and an entry leading to a page
				     that can only say "this does not work" is worse than no entry. -->
				{#if settingsStore.settings.showAssistant && sources && !assistantReady}
					<div
						class="mb-3 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 px-2.5 py-2"
					>
						<TriangleAlertIcon class="mt-0.5 size-3.5 shrink-0 text-amber-600" />
						<p class="min-w-0 flex-1 text-xs text-muted-foreground">
							{t('settings.assistant.missing')}
						</p>
					</div>
				{/if}
				<SettingRow
					label={t('settings.assistant.source')}
					description={!settingsStore.settings.showAssistant
						? t('settings.assistant.off.description')
						: usingLocal
							? sources?.local.found
								? t('settings.assistant.cliFound', {
										version: sources.local.version ?? sources.local.path ?? ''
									})
								: t('settings.assistant.cliMissing')
							: t('settings.assistant.provider.description')}
				>
					{#snippet control()}
						<div class="flex gap-1" role="group" aria-label={t('settings.assistant.source')}>
							{#each SOURCE_CHOICES as choice (choice.value)}
								{@const active =
									choice.value === 'off'
										? !settingsStore.settings.showAssistant
										: settingsStore.settings.showAssistant &&
											(choice.value === LOCAL_ASSISTANT_SOURCE ? usingLocal : !usingLocal)}
								<button
									type="button"
									aria-pressed={active}
									onclick={() =>
										commit(
											choice.value === 'off'
												? { showAssistant: false }
												: {
														showAssistant: true,
														assistantSource:
															choice.value === LOCAL_ASSISTANT_SOURCE
																? LOCAL_ASSISTANT_SOURCE
																: (activeProvider?.id ??
																	sources?.providers[0]?.id ??
																	LOCAL_ASSISTANT_SOURCE)
													}
										)}
									class={cn(
										'flex h-8 cursor-pointer items-center rounded-md border px-2.5 text-xs font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
										active
											? 'border-primary/40 bg-primary/10 text-foreground'
											: 'border-border text-muted-foreground hover:bg-muted'
									)}
								>
									{t(choice.label)}
								</button>
							{/each}
						</div>
					{/snippet}
				</SettingRow>

				<!-- Off leaves nothing to configure: no source, no key, no path. -->
				{#if settingsStore.settings.showAssistant}
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
				{/if}
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				{@render cardTitle(t('settings.automation'), SlidersIcon)}
				<CardDescription>{t('settings.automation.description')}</CardDescription>
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

				<SettingRow
					label={t('settings.autoConsent')}
					description={t('settings.autoConsent.description')}
					for="auto-consent"
				>
					{#snippet control()}
						<Switch
							id="auto-consent"
							checked={settingsStore.settings.autoConsent}
							onCheckedChange={(checked: boolean) => commit({ autoConsent: checked })}
						/>
					{/snippet}
				</SettingRow>

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

				<SettingRow
					label={t('settings.engine')}
					description={settingsStore.settings.engineScript.trim() === ''
						? t('settings.engine.none')
						: t('settings.engine.active', {
								count: settingsStore.settings.engineScript.trim().split('\n').length
							})}
				>
					{#snippet control()}
						<div class="flex gap-1">
							<Button variant="outline" size="sm" class="h-8" onclick={() => (engineOpen = true)}>
								<CodeIcon />
								{t('settings.engine.edit')}
							</Button>
							<Button
								variant="ghost"
								size="sm"
								class="h-8"
								disabled={settingsStore.settings.engineScript === ''}
								onclick={() => commit({ engineScript: '' })}
							>
								<RotateCcwIcon />
								{t('settings.engine.reset')}
							</Button>
						</div>
					{/snippet}
				</SettingRow>
			</CardContent>
		</Card>

		<!-- Its own card rather than a row under Automation: these accumulate, and the thing a
		     person comes here to do is get rid of one, which needs room for a list. -->
		<Card>
			<CardHeader>
				{@render cardTitle(t('settings.actions'), SparklesIcon)}
				<CardDescription>{t('settings.actions.description')}</CardDescription>
			</CardHeader>
			<CardContent class="flex flex-col gap-2">
				{#if savedActions.length === 0}
					<p class="text-xs text-muted-foreground">{t('settings.actions.empty')}</p>
				{:else}
					{#each savedActions as action, index (action.id)}
						<div class="flex flex-col gap-1.5 rounded-md border border-border/60 px-2.5 py-1.5">
							<div class="flex items-center gap-1">
								<!-- Order is the user's, and it is the order every other surface renders
								     from: the sidebar, the panel and the overview all read this list. -->
								<div class="flex shrink-0 flex-col">
									<button
										type="button"
										aria-label={t('settings.actions.moveUp')}
										disabled={index === 0}
										onclick={() => move(action.id, -1)}
										class="flex h-3.5 w-5 cursor-pointer items-center justify-center rounded text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-30"
									>
										<ChevronUpIcon class="size-3" />
									</button>
									<button
										type="button"
										aria-label={t('settings.actions.moveDown')}
										disabled={index === savedActions.length - 1}
										onclick={() => move(action.id, 1)}
										class="flex h-3.5 w-5 cursor-pointer items-center justify-center rounded text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-30"
									>
										<ChevronDownIcon class="size-3" />
									</button>
								</div>

								<div class="min-w-0 flex-1">
									{#if renaming === action.id}
										<form
											onsubmit={(event: SubmitEvent) => {
												event.preventDefault();
												applyRename();
											}}
										>
											<Input
												class="h-7 text-[13px]"
												aria-label={t('settings.actions.rename')}
												bind:value={draftName}
												autofocus
												onblur={applyRename}
											/>
										</form>
									{:else}
										<p class="truncate text-[13px]">{action.label}</p>
										<!-- The day it was made, because that is what decides whether it still
										     works: a plan is a selector, and the platform has moved since. -->
										<p class="text-xs text-muted-foreground">
											{t('settings.actions.made', {
												platform: action.platform === 'x' ? 'X' : 'YouTube',
												date: madeOn(action.createdAt)
											})}
										</p>
									{/if}
								</div>

								<Button
									variant="ghost"
									size="sm"
									class="h-7 shrink-0 px-2 text-xs"
									aria-expanded={openAction === action.id}
									onclick={() => (openAction = openAction === action.id ? undefined : action.id)}
								>
									<EyeIcon />
									{t('settings.actions.plan')}
								</Button>
								<Button
									variant="ghost"
									size="sm"
									class="h-7 shrink-0 px-2 text-xs"
									onclick={() => startRename(action.id, action.label)}
								>
									<PencilIcon />
									{t('settings.actions.rename')}
								</Button>
								<Button
									variant="ghost"
									size="sm"
									class="h-7 shrink-0 px-2 text-xs"
									onclick={() => forget(action.id)}
								>
									<Trash2Icon />
									{t('settings.actions.forget')}
								</Button>
							</div>

							<!-- Readable before it is trusted. It is a handful of steps, and the whole
							     case for a plan over a script is that a person can check it. -->
							{#if openAction === action.id}
								<pre
									class="max-h-56 overflow-auto rounded-md bg-muted p-2.5 text-[11px] leading-relaxed whitespace-pre-wrap">{JSON.stringify(
										action.plan,
										null,
										2
									)}</pre>
							{/if}
						</div>
					{/each}

					<div>
						<Button variant="outline" size="sm" class="h-8" onclick={() => (forgetAllOpen = true)}>
							<Trash2Icon />
							{t('settings.actions.forgetAll')}
						</Button>
					</div>
				{/if}
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				{@render cardTitle(t('settings.reset.title'), RotateCcwIcon)}
				<CardDescription>{t('settings.reset.description')}</CardDescription>
			</CardHeader>
			<CardContent>
				<Button variant="outline" size="sm" class="h-8" onclick={() => (resetOpen = true)}>
					<RotateCcwIcon />
					{t('settings.reset.action')}
				</Button>
			</CardContent>
		</Card>
	</div>
</div>

<ConfirmDialog
	bind:open={resetOpen}
	title={t('settings.reset.title')}
	description={t('settings.reset.confirmBody')}
	confirmLabel={t('settings.reset.action')}
	cancelLabel={t('confirm.cancel')}
	onConfirm={resetAll}
/>

<!-- Asked for, because there is no getting a plan back: the answer it came from is long gone
     and the page it was written against has moved on. Forgetting one is not worth a dialog;
     forgetting the lot is. -->
<ConfirmDialog
	bind:open={forgetAllOpen}
	title={t('settings.actions.forgetAll')}
	description={t('settings.actions.forgetAll.confirmBody', { count: savedActions.length })}
	confirmLabel={t('settings.actions.forgetAll')}
	cancelLabel={t('confirm.cancel')}
	onConfirm={forgetAll}
/>

<EngineScriptDialog
	bind:open={engineOpen}
	script={settingsStore.settings.engineScript}
	onSave={(next: string) => commit({ engineScript: next })}
/>

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
