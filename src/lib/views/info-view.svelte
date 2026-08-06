<script lang="ts">
	import { notify } from '$lib/notify';
	import type { BridgeClient } from '$lib/bridge/client';
	import type { SettingsStore } from '$lib/stores/settings.svelte';
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
	}

	let { bridge, settingsStore }: Props = $props();

	let appInfo = $state<AppInfo | undefined>(undefined);
	let checkingUpdates = $state(false);

	$effect(() => {
		void bridge.call('app.getInfo', undefined).then((info) => (appInfo = info));
	});

	async function checkForUpdates(): Promise<void> {
		checkingUpdates = true;
		try {
			const result = await bridge.call('updater.checkForUpdates', undefined);
			if (!result.updateAvailable) {
				notify(settingsStore, 'info', result.message ?? t('settings.noUpdates'));
			}
		} finally {
			checkingUpdates = false;
		}
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
