<script lang="ts">
	import type { BridgeClient } from '$lib/bridge/client';
	import type { Platform } from '$lib/bridge/contract';
	import type { ActionGroupDef } from '$lib/actions';
	import type { CustomAction } from '$lib/bridge/contract';
	import type { SettingsStore } from '$lib/stores/settings.svelte';
	import type { ActionRunner } from '$lib/stores/action-runner.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import ActionRow from '$lib/components/action-row.svelte';
	import { ConfirmDialog } from '$lib/components/ui/alert-dialog';
	import XIcon from '@lucide/svelte/icons/x';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import PlayIcon from '@lucide/svelte/icons/play';

	interface Props {
		bridge: BridgeClient;
		settingsStore: SettingsStore;
		runner: ActionRunner;
		platform: Platform;
		platformLabel: string;
		groups: ActionGroupDef[];
		loggedIn: boolean;
		open: boolean;
		/** Set by the overview's shortcut: start the delete-all flow as if the button here
		 *  had been pressed, confirmation included. */
		startDeleteAll: boolean;
		onDeleteAllStarted: () => void;
		/** The layout decides when the site webview is on screen; this is what tells it a
		 *  modal is up and it must stay off. */
		onDialogOpenChange: (open: boolean) => void;
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
		startDeleteAll,
		onDeleteAllStarted,
		onDialogOpenChange,
		onClose
	}: Props = $props();

	let confirmTarget = $state<ActionGroupDef | 'all' | CustomAction | undefined>(undefined);
	let confirmOpen = $state(false);

	const enabled = $derived(loggedIn && !runner.running);

	/** What the assistant wrote and the user kept, for this platform. */
	const saved = $derived(
		settingsStore.settings.customActions.filter(
			(action) => action.platform === platform && action.place === 'panel'
		)
	);

	/** Told apart by the one field only a saved action has. */
	function isCustom(target: ActionGroupDef | 'all' | CustomAction): target is CustomAction {
		return target !== 'all' && 'plan' in target;
	}

	/**
	 * Runs a saved plan on the page that is up.
	 *
	 * No navigation, unlike the built-in rows: a plan carries a selector and not an address,
	 * and the page it was written against is the one the user was looking at when they saved it.
	 */
	async function runCustom(action: CustomAction): Promise<void> {
		try {
			const result = await runner.runPlan({
				platform,
				plan: action.plan,
				timeouts: settingsStore.settings.timeouts
			});
			if (result.deletedCount === 0) {
				report('info', t('run.none', { plural: action.label }));
			} else {
				report('success', t('run.done', { count: result.deletedCount, plural: action.label }));
			}
		} catch (error) {
			report('error', error instanceof Error ? error.message : t('run.failed'));
		}
	}

	function onCustomClick(action: CustomAction): void {
		// The question is about deleting, so a plan that deletes nothing does not get asked it.
		// Opening a page or clicking a banner away is not something anybody needs talking out of.
		if (settingsStore.settings.confirmDeletion && action.plan.kind !== 'once') {
			confirmTarget = action;
			confirmOpen = true;
		} else {
			void runCustom(action);
		}
	}

	// The panel lives in the narrow chrome WebView; a confirm dialog there can only center
	// within it, so the chrome has to take the whole window while one is open.
	//
	// Reported upwards rather than hidden from here. The layout also shows the site on a
	// timer after a route change, and a `site.hide` from this component was simply overwritten
	// by that timer when a dialog opened in the same tick as the navigation — the overview's
	// delete-all shortcut does exactly that, and the platform came up over its own
	// confirmation with no way to answer it.
	//
	// An effect, not an explicit call: ConfirmDialog also closes itself on Esc, and the site
	// has to come back in that case too.
	$effect(() => {
		onDialogOpenChange(confirmOpen);
	});

	/** Which page the site webview is on, so the list can say where the user is. */
	let shown = $state<string | undefined>(undefined);

	// The panel stays open on a show: the site webview sits beside it, not under it (the
	// layout counts this column into the inset), and closing it would send someone back to
	// the sidebar for every list they want to look at.
	async function show(group: ActionGroupDef): Promise<void> {
		shown = group.key;
		await bridge.call('site.navigate', { platform, action: group.showAction });
	}

	/**
	 * On the platform page, and only there.
	 *
	 * A run started from this panel always ends with the platform on screen, and its webview
	 * covers everything the app could draw on — the app's own toast would be a second copy of
	 * the same sentence, in a corner the user is not looking at. The log keeps the line either
	 * way, which is why the failure below is swallowed: a page that cannot take one more
	 * element is not a reason to fail a deletion that already happened.
	 */
	function report(kind: 'success' | 'info' | 'error', message: string): void {
		runner.lastResult = { ...runner.lastResult, [platform]: { kind, message } };
		// The page still shows what was just deleted — these platforms do not re-render a list
		// they were not asked to. Reloading is what makes the result visible where it happened.
		void bridge.call('site.reload', { platform }).catch(() => {});
		if (!settingsStore.settings.notifications) return;
		void bridge.call('site.toast', { platform, message, kind }).catch(() => {});
	}

	async function runDelete(group: ActionGroupDef): Promise<void> {
		// A run opens its own page before it starts, so the marked row has to move with it.
		// Marking only on a show left the highlight on whatever was looked at last while the
		// site had already jumped somewhere else.
		shown = group.key;
		try {
			const result = await runner.run({
				platform,
				action: group.deleteAction,
				timeouts: settingsStore.settings.timeouts,
				label: group.label
			});
			if (result.deletedCount === 0) {
				report('info', t('run.none', { plural: t(group.plural) }));
			} else {
				report('success', t('run.done', { count: result.deletedCount, plural: t(group.plural) }));
			}
		} catch (error) {
			report('error', error instanceof Error ? error.message : t('run.failed'));
		}
	}

	// The panel stays. It is where the running deletion, its stop button and its result live,
	// and closing it on the very click that starts the run took all three away. The confirm
	// dialog does not need the room: `site.hide` above gives the chrome the whole window, and
	// the dialog centres over it with the panel still in place.
	/**
	 * Every list on this platform, one after the other.
	 *
	 * Sequential rather than parallel: each action drives the same single webview, and the
	 * waits between deletions are the only brake against the platform flagging the session.
	 * A failure does not abort the rest — the next list has nothing to do with the one that
	 * broke — but a cancel does, because that is what the user just asked for.
	 */
	async function runAll(): Promise<void> {
		let total = 0;
		let failed = 0;

		for (const group of groups) {
			shown = group.key;
			try {
				const result = await runner.run({
					platform,
					action: group.deleteAction,
					timeouts: settingsStore.settings.timeouts,
					label: group.label
				});
				total += result.deletedCount;
			} catch {
				failed++;
			}
			if (runner.cancelled) break;
		}

		report(
			failed > 0 ? 'error' : 'success',
			failed > 0 ? t('run.allPartly', { count: total, failed }) : t('run.allDone', { count: total })
		);
	}

	function onDeleteClick(group: ActionGroupDef): void {
		if (settingsStore.settings.confirmDeletion) {
			confirmTarget = group;
			confirmOpen = true;
		} else {
			void runDelete(group);
		}
	}

	function onDeleteAllClick(): void {
		if (settingsStore.settings.confirmDeletion) {
			confirmTarget = 'all';
			confirmOpen = true;
		} else {
			void runAll();
		}
	}

	// Cleared before the flow starts, so a re-render cannot start a second one. A shortcut
	// that arrives while something is already running is dropped rather than queued.
	$effect(() => {
		if (!startDeleteAll) return;
		onDeleteAllStarted();
		if (enabled) onDeleteAllClick();
	});

	async function onConfirm(): Promise<void> {
		confirmOpen = false;
		if (confirmTarget === 'all') await runAll();
		else if (confirmTarget && isCustom(confirmTarget)) await runCustom(confirmTarget);
		else if (confirmTarget) await runDelete(confirmTarget);
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
				current={shown === group.key}
				onShow={() => show(group)}
				onDelete={() => onDeleteClick(group)}
			/>
		{/each}

		<!-- Below the built-in lists and separated from them: these are the user's own, they can
		     go stale on their own schedule, and "everything" below deliberately does not include
		     them — a saved plan is not something to sweep up in a run that empties the account. -->
		{#if saved.length > 0}
			<p class="px-2 pt-3 pb-1 text-[11px] font-medium tracking-tight text-muted-foreground">
				{t('panel.saved')}
			</p>
			{#each saved as action (action.id)}
				<button
					type="button"
					disabled={!enabled}
					onclick={() => onCustomClick(action)}
					class="group/saved flex h-8 cursor-pointer items-center gap-2 rounded-md ps-2 pe-2 text-start
					       transition-colors duration-150 hover:bg-muted focus-visible:ring-2
					       focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none
					       disabled:opacity-40"
				>
					<SparklesIcon class="size-3.5 shrink-0 text-muted-foreground" />
					<span class="flex-1 truncate text-[13px]">{action.label}</span>
					<PlayIcon
						class="size-3.5 shrink-0 text-muted-foreground/60 group-hover/saved:text-foreground"
					/>
				</button>
			{/each}
		{/if}

		<!-- No show button: "everything" is not a page anyone can be sent to. -->
		<button
			type="button"
			disabled={!enabled}
			onclick={onDeleteAllClick}
			class="group/all mt-1 flex h-8 cursor-pointer items-center gap-2 rounded-md ps-2 pe-2 text-start
			       transition-colors duration-150 hover:bg-destructive/10 focus-visible:ring-2
			       focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none
			       disabled:opacity-40"
		>
			<Trash2Icon
				class="size-3.5 shrink-0 text-muted-foreground group-hover/all:text-destructive"
			/>
			<span class="flex-1 truncate text-[13px] group-hover/all:text-destructive">
				{t('action.deleteAll')}
			</span>
		</button>

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
		class="flex h-full w-56 shrink-0 [animation:cmp-panel-in_150ms_ease-out] flex-col overflow-hidden border-e
		       bg-card/40"
	>
		{@render body()}
	</aside>
{/if}

{#if confirmTarget}
	<ConfirmDialog
		bind:open={confirmOpen}
		title={confirmTarget === 'all'
			? t('confirm.all.title', { platform: platformLabel })
			: isCustom(confirmTarget)
				? t('confirm.title', { plural: confirmTarget.label })
				: t('confirm.title', { plural: t(confirmTarget.plural) })}
		description={confirmTarget === 'all'
			? t('confirm.all.description', {
					platform: platformLabel,
					lists: groups.map((group) => t(group.plural)).join(', ')
				})
			: isCustom(confirmTarget)
				? // Named apart from the built-in wording on purpose: this one was written by a
					// model against a page as it looked then, and it is worth saying so every time.
					t('confirm.saved.description', {
						label: confirmTarget.label,
						platform: platformLabel
					})
				: t('confirm.description', {
						plural: t(confirmTarget.plural),
						platform: platformLabel
					})}
		confirmLabel={t('confirm.confirm')}
		cancelLabel={t('confirm.cancel')}
		{onConfirm}
		onCancel={() => (confirmOpen = false)}
	/>
{/if}
