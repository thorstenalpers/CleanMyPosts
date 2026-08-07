<script lang="ts">
	import { notify } from '$lib/notify';
	import type { BridgeClient } from '$lib/bridge/client';
	import type { SettingsStore } from '$lib/stores/settings.svelte';
	import type { UpdaterStore } from '$lib/stores/updater.svelte';
	import type { AppInfo } from '$lib/bridge/contract';
	import { t } from '$lib/i18n/index.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import SettingRow from '$lib/components/setting-row.svelte';
	import { ConfirmDialog } from '$lib/components/ui/alert-dialog';
	import { Progress } from '$lib/components/ui/progress';
	import { cn } from '$lib/utils';
	import InfoIcon from '@lucide/svelte/icons/info';
	import LinkIcon from '@lucide/svelte/icons/link';
	import ScaleIcon from '@lucide/svelte/icons/scale';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import BugIcon from '@lucide/svelte/icons/bug';
	import LifeBuoyIcon from '@lucide/svelte/icons/life-buoy';
	import FileTextIcon from '@lucide/svelte/icons/file-text';

	interface Props {
		bridge: BridgeClient;
		settingsStore: SettingsStore;
		updater: UpdaterStore;
	}

	let { bridge, settingsStore, updater }: Props = $props();

	let appInfo = $state<AppInfo | undefined>(undefined);
	let confirmOpen = $state(false);

	const downloadLabel = $derived(
		updater.percent === undefined
			? t('update.downloading', { version: updater.version })
			: t('update.downloadingPercent', { version: updater.version, percent: updater.percent })
	);

	$effect(() => {
		void bridge.call('app.getInfo', undefined).then((info) => (appInfo = info));
	});

	async function checkForUpdates(): Promise<void> {
		try {
			if (await updater.check()) confirmOpen = true;
			else notify(settingsStore, 'info', t('settings.noUpdates'));
		} catch (error) {
			notify(settingsStore, 'error', t('update.checkFailed', { message: reason(error) }));
		}
	}

	async function installUpdate(): Promise<void> {
		confirmOpen = false;
		try {
			await updater.install();
		} catch (error) {
			notify(settingsStore, 'error', t('update.failed', { message: reason(error) }));
		}
	}

	function reason(error: unknown): string {
		return error instanceof Error ? error.message : String(error);
	}
</script>

{#snippet cardTitle(title: string, icon: typeof InfoIcon)}
	{@const Icon = icon}
	<CardTitle class="flex items-center gap-2">
		<Icon class="size-3.5 text-muted-foreground" />
		{title}
	</CardTitle>
{/snippet}

<div class="h-full overflow-y-auto">
	<div class="flex flex-col gap-4 p-5">
		<p class="text-xs text-muted-foreground">{t('info.subtitle')}</p>

		<Card class="border-0 bg-muted">
			<CardHeader>
				<CardTitle class="text-base">{t('info.app.title')}</CardTitle>
				<CardDescription class="text-current/75">{t('info.app.body')}</CardDescription>
			</CardHeader>
		</Card>

		<Card>
			<CardHeader>
				{@render cardTitle(t('info.version.title'), InfoIcon)}
				<CardDescription>{t('info.version.description')}</CardDescription>
			</CardHeader>
			<CardContent>
				<SettingRow
					label="CleanMyPosts"
					description={appInfo
						? t('settings.versionBuilt', {
								version: appInfo.version,
								date: appInfo.buildDate
							})
						: t('settings.versionLoading')}
				>
					{#snippet control()}
						{#if updater.installing}
							<div class="flex w-36 flex-col items-end gap-1.5">
								<span class="h-4 text-xs text-muted-foreground tabular-nums">
									{updater.percent === undefined ? '' : `${updater.percent}%`}
								</span>
								<Progress value={updater.percent} label={downloadLabel} />
							</div>
						{:else}
							<Button
								variant="outline"
								size="sm"
								class="h-8"
								disabled={updater.checking}
								onclick={checkForUpdates}
							>
								<RefreshCwIcon class={cn(updater.checking && 'animate-spin')} />
								{updater.checking ? t('update.checking') : t('settings.checkUpdates')}
							</Button>
						{/if}
					{/snippet}
				</SettingRow>

				<!-- A name, not a link: the repository is one card down, and this row answers the
				     other question — who wrote it. -->
				<SettingRow label={t('info.developer')} description="Thorsten Alpers" />
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				{@render cardTitle(t('info.links.title'), LinkIcon)}
				<CardDescription>{t('info.links.description')}</CardDescription>
			</CardHeader>
			<CardContent class="divide-y divide-border/60">
				<SettingRow label={t('settings.github')} description={t('info.github.description')}>
					{#snippet control()}
						<Button
							variant="outline"
							size="sm"
							class="h-8"
							disabled={!appInfo}
							onclick={() => bridge.call('system.openUrl', { url: appInfo!.homepageUrl })}
						>
							<ExternalLinkIcon />
							GitHub
						</Button>
					{/snippet}
				</SettingRow>

				<SettingRow
					label={t('assistant.troubleshooting')}
					description={t('info.troubleshooting.description')}
				>
					{#snippet control()}
						<Button
							variant="outline"
							size="sm"
							class="h-8"
							disabled={!appInfo}
							onclick={() => bridge.call('system.openUrl', { url: appInfo!.troubleshootingUrl })}
						>
							<LifeBuoyIcon />
							{t('assistant.troubleshooting')}
						</Button>
					{/snippet}
				</SettingRow>

				<SettingRow label={t('settings.reportBug')} description={t('info.reportBug.description')}>
					{#snippet control()}
						<Button
							variant="outline"
							size="sm"
							class="h-8"
							disabled={!appInfo}
							onclick={() => bridge.call('system.openUrl', { url: appInfo!.reportBugUrl })}
						>
							<BugIcon />
							{t('settings.reportBug')}
						</Button>
					{/snippet}
				</SettingRow>

				<SettingRow label={t('settings.licenses')} description={t('info.licenses.description')}>
					{#snippet control()}
						<Button
							variant="outline"
							size="sm"
							class="h-8"
							onclick={() => bridge.call('system.openLicense', undefined)}
						>
							<FileTextIcon />
							{t('settings.licenses')}
						</Button>
					{/snippet}
				</SettingRow>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				{@render cardTitle(t('info.legal.title'), ScaleIcon)}
			</CardHeader>
			<CardContent>
				<p class="text-xs leading-relaxed text-muted-foreground">
					{t('settings.about.description')}
				</p>
			</CardContent>
		</Card>
	</div>
</div>

<ConfirmDialog
	bind:open={confirmOpen}
	title={t('update.available.title')}
	description={t('update.available.body', { version: updater.version })}
	confirmLabel={t('update.install')}
	cancelLabel={t('update.later')}
	confirmVariant="default"
	onConfirm={installUpdate}
/>
