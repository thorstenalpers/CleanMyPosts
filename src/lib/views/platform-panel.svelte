<script lang="ts">
	import { toast } from 'svelte-sonner';
	import type { BridgeClient } from '$lib/bridge/client';
	import type { Platform } from '$lib/bridge/contract';
	import type { ActionGroupDef } from '$lib/actions';
	import type { SettingsStore } from '$lib/stores/settings.svelte';
	import type { ActionRunner } from '$lib/stores/action-runner.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import ActionRow from '$lib/components/action-row.svelte';
	import { ConfirmDialog } from '$lib/components/ui/alert-dialog';
	import XIcon from '@lucide/svelte/icons/x';

	interface Props {
		bridge: BridgeClient;
		settingsStore: SettingsStore;
		runner: ActionRunner;
		platform: Platform;
		platformLabel: string;
		groups: ActionGroupDef[];
		loggedIn: boolean;
		open: boolean;
		onClose: () => void;
	}

	let {
		bridge,
		settingsStore,
		runner,
		platform,
		platformLabel,
		groups,
		loggedIn,
		open,
		onClose
	}: Props = $props();

	let confirmTarget = $state<ActionGroupDef | undefined>(undefined);
	let confirmOpen = $state(false);

	const enabled = $derived(loggedIn && !runner.running);

	// The panel lives in the narrow chrome WebView; a confirm dialog there can only center
	// within it. Expand the chrome over the whole window while the dialog is open (site
	// hidden), then restore the site so the user can watch the deletion run.
	// An effect, not an explicit call: ConfirmDialog also closes itself on Esc, and the
	// site view has to come back in that case too.
	$effect(() => {
		void bridge.call('site.hide', { hide: confirmOpen });
	});

	async function show(group: ActionGroupDef): Promise<void> {
		onClose();
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
				toast.info(t('run.none', { plural: t(group.plural) }));
			} else {
				toast.success(t('run.done', { count: result.deletedCount, plural: t(group.plural) }));
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : t('run.failed'));
		}
	}

	function onDeleteClick(group: ActionGroupDef): void {
		onClose();
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

{#snippet body()}
	<div class="flex h-12 shrink-0 items-center gap-2 px-3">
		<div class="min-w-0 flex-1">
			<p class="truncate text-[13px] leading-tight font-semibold tracking-tight">{platformLabel}</p>
			<p class="text-xs leading-tight text-muted-foreground">
				{loggedIn ? t('site.signedIn') : t('site.signedOut')}
			</p>
		</div>
		<button
			type="button"
			aria-label={t('action.close', { platform: platformLabel })}
			onclick={onClose}
			class="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
		>
			<XIcon class="size-3.5" />
		</button>
	</div>

	<div class="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1.5 pb-2">
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
			<p class="px-2 pt-2 text-xs leading-relaxed text-muted-foreground">
				{t('site.signInHint', { platform: platformLabel })}
			</p>
		{/if}
	</div>
{/snippet}

{#if open}
	<!-- A column of its own beside the sidebar, so opening a platform never moves the nav
	     items the user just aimed at. -->
	<aside
		aria-label="{platformLabel} actions"
		class="flex h-full w-56 shrink-0 [animation:cmp-panel-in_150ms_ease-out] flex-col overflow-hidden border-r
		       bg-card/40"
	>
		{@render body()}
	</aside>
{/if}

{#if confirmTarget}
	<ConfirmDialog
		bind:open={confirmOpen}
		title={t('confirm.title', { plural: t(confirmTarget.plural) })}
		description={t('confirm.description', {
			plural: t(confirmTarget.plural),
			platform: platformLabel
		})}
		confirmLabel={t('confirm.confirm')}
		cancelLabel={t('confirm.cancel')}
		{onConfirm}
		onCancel={() => (confirmOpen = false)}
	/>
{/if}
