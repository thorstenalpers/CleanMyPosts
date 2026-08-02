<script lang="ts">
	import { toast } from 'svelte-sonner';
	import type { BridgeClient } from '$lib/bridge/client';
	import type { SettingsStore } from '$lib/stores/settings.svelte';
	import { AppSettingsSchema, type AppInfo, type AppTheme } from '$lib/bridge/contract';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Switch } from '$lib/components/ui/switch';
	import SettingSection from '$lib/components/setting-section.svelte';
	import SettingRow from '$lib/components/setting-row.svelte';
	import AccentPicker from '$lib/components/accent-picker.svelte';
	import { cn } from '$lib/utils';
	import PaletteIcon from '@lucide/svelte/icons/palette';
	import ShieldIcon from '@lucide/svelte/icons/shield';
	import TimerIcon from '@lucide/svelte/icons/timer';
	import InfoIcon from '@lucide/svelte/icons/info';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import LaptopIcon from '@lucide/svelte/icons/laptop';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import BugIcon from '@lucide/svelte/icons/bug';
	import FileTextIcon from '@lucide/svelte/icons/file-text';

	interface Props {
		bridge: BridgeClient;
		settingsStore: SettingsStore;
	}

	let { bridge, settingsStore }: Props = $props();

	let appInfo = $state<AppInfo | undefined>(undefined);
	let checkingUpdates = $state(false);

	$effect(() => {
		void bridge.call('app.getInfo', undefined).then((info) => (appInfo = info));
	});

	const themes: { value: AppTheme; label: string; icon: typeof SunIcon }[] = [
		{ value: 'Light', label: 'Light', icon: SunIcon },
		{ value: 'Dark', label: 'Dark', icon: MoonIcon },
		{ value: 'Default', label: 'System', icon: LaptopIcon }
	];

	const timeoutFields = [
		{
			key: 'waitAfterDocumentLoad',
			id: 'wait-after-document-load',
			label: 'After a page loads',
			description: 'How long to let the page settle before the first deletion.'
		},
		{
			key: 'waitAfterDelete',
			id: 'wait-after-delete',
			label: 'Between deletions',
			description: 'Pause after each removed item. The main brake against automation detection.'
		},
		{
			key: 'waitBetweenRetryDeleteAttempts',
			id: 'wait-between-retries',
			label: 'Between retries',
			description: 'Pause before retrying an item that did not disappear.'
		}
	] as const;

	async function commit(next: Partial<typeof settingsStore.settings>): Promise<void> {
		const merged = { ...settingsStore.settings, ...next };
		const parsed = AppSettingsSchema.safeParse(merged);
		if (!parsed.success) {
			toast.error('Invalid settings value.');
			return;
		}
		await settingsStore.update(parsed.data);
	}

	async function checkForUpdates(): Promise<void> {
		checkingUpdates = true;
		try {
			const result = await bridge.call('updater.checkForUpdates', undefined);
			if (!result.updateAvailable) {
				toast.info(result.message ?? 'No updates available.');
			}
		} finally {
			checkingUpdates = false;
		}
	}
</script>

<div class="h-full overflow-y-auto">
	<div class="mx-auto flex max-w-2xl flex-col gap-4 p-5">
		<header>
			<h1 class="text-xl font-semibold tracking-tight">Settings</h1>
			<p class="mt-0.5 text-xs text-muted-foreground">Changes are saved as you make them.</p>
		</header>

		<SettingSection title="Appearance" icon={PaletteIcon}>
			<SettingRow label="Theme" description="Follow Windows or pick a fixed mode.">
				{#snippet control()}
					<div class="flex gap-1" role="group" aria-label="Theme">
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
								{theme.label}
							</button>
						{/each}
					</div>
				{/snippet}
			</SettingRow>

			<div class="py-3">
				<AccentPicker
					value={settingsStore.settings.accentColor}
					useSystemAccent={settingsStore.settings.useSystemAccent}
					onChange={(accentColor: string) => commit({ accentColor })}
					onUseSystemAccentChange={(useSystemAccent: boolean) => commit({ useSystemAccent })}
				/>
			</div>
		</SettingSection>

		<SettingSection title="Safety" icon={ShieldIcon}>
			<SettingRow
				label="Confirm before deleting"
				description="Ask once per run. Deletions cannot be undone."
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
				label="Show log tab"
				description="Adds a live log of every action to the sidebar."
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
		</SettingSection>

		<SettingSection title="Timing" icon={TimerIcon}>
			{#each timeoutFields as field (field.key)}
				<SettingRow label={field.label} description={field.description} for={field.id}>
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
			<p class="py-2.5 text-xs leading-relaxed text-muted-foreground">
				Raising these is always safe. Lowering them makes deletion faster but more likely to be
				flagged as automation.
			</p>
		</SettingSection>

		<SettingSection title="About" icon={InfoIcon}>
			<SettingRow
				label="CleanMyPosts"
				description={appInfo ? `Version ${appInfo.version}` : 'Loading version…'}
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
						Check for updates
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
						Project on GitHub
					</Button>
					<Button
						variant="ghost"
						size="sm"
						class="h-8"
						onclick={() => bridge.call('system.openUrl', { url: appInfo!.reportBugUrl })}
					>
						<BugIcon />
						Report a bug
					</Button>
				{/if}
				<Button
					variant="ghost"
					size="sm"
					class="h-8"
					onclick={() => bridge.call('system.openLicense', undefined)}
				>
					<FileTextIcon />
					Third-party licenses
				</Button>
			</div>
		</SettingSection>
	</div>
</div>
