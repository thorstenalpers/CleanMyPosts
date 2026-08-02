<script lang="ts" module>
	import type { Component } from 'svelte';
	import type { Platform, SiteAction } from '$lib/bridge/contract';

	export interface ActionGroupDef {
		key: string;
		label: string;
		icon: Component;
		showAction: SiteAction;
		deleteAction: SiteAction;
		/** Used verbatim in the confirm dialog and the result toast. */
		plural: string;
	}
</script>

<script lang="ts">
	import { toast } from 'svelte-sonner';
	import type { BridgeClient } from '$lib/bridge/client';
	import type { SettingsStore } from '$lib/stores/settings.svelte';
	import type { ActionRunner } from '$lib/stores/action-runner.svelte';
	import ActionRow from '$lib/components/action-row.svelte';
	import { ConfirmDialog } from '$lib/components/ui/alert-dialog';

	interface Props {
		bridge: BridgeClient;
		settingsStore: SettingsStore;
		runner: ActionRunner;
		platform: Platform;
		platformLabel: string;
		groups: ActionGroupDef[];
		loggedIn: boolean;
	}

	let { bridge, settingsStore, runner, platform, platformLabel, groups, loggedIn }: Props =
		$props();

	let confirmTarget = $state<ActionGroupDef | undefined>(undefined);
	let confirmOpen = $state(false);

	const enabled = $derived(loggedIn && !runner.running);

	// The sidebar lives in the narrow chrome WebView; a confirm dialog there can only
	// center within it. Expand the chrome over the whole window while the dialog is open
	// (site hidden), then restore the site so the user can watch the deletion run.
	// An effect, not an explicit call: ConfirmDialog also closes itself on Esc, and the
	// site view has to come back in that case too.
	$effect(() => {
		void bridge.call('site.hide', { hide: confirmOpen });
	});

	async function show(group: ActionGroupDef): Promise<void> {
		await bridge.call('site.navigate', { platform, action: group.showAction });
	}

	async function runDelete(group: ActionGroupDef): Promise<void> {
		try {
			const result = await runner.run({
				platform,
				action: group.deleteAction,
				timeouts: settingsStore.settings.timeouts,
				label: group.label
			});
			if (result.deletedCount === 0) {
				toast.info(`No ${group.plural} removed — nothing was found to delete.`);
			} else {
				toast.success(`${result.deletedCount} ${group.plural} cleaned.`);
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Deletion failed.');
		}
	}

	function onDeleteClick(group: ActionGroupDef): void {
		if (settingsStore.settings.confirmDeletion) {
			confirmTarget = group;
			confirmOpen = true;
		} else {
			void runDelete(group);
		}
	}

	async function onConfirm(): Promise<void> {
		confirmOpen = false;
		if (confirmTarget) await runDelete(confirmTarget);
	}
</script>

<div class="flex flex-col gap-0.5 py-1">
	{#each groups as group (group.key)}
		<ActionRow
			label={group.label}
			icon={group.icon}
			disabled={!enabled}
			active={runner.running && runner.currentLabel === group.label}
			onShow={() => show(group)}
			onDelete={() => onDeleteClick(group)}
		/>
	{/each}

	{#if !loggedIn}
		<p class="px-2 pt-1.5 text-xs text-muted-foreground">
			Sign in to {platformLabel} to enable cleaning.
		</p>
	{/if}
</div>

{#if confirmTarget}
	<ConfirmDialog
		bind:open={confirmOpen}
		title="Delete all {confirmTarget.plural}?"
		description="This removes every one of your {confirmTarget.plural} on {platformLabel}. It cannot be undone."
		{onConfirm}
		onCancel={() => (confirmOpen = false)}
	/>
{/if}
